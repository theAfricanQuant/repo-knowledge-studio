import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import {analyze,checkFreshness} from './engine.mjs';
import {prepareVideos,renderVideo} from './videos.mjs';
import {diagramsFor} from './visuals.mjs';
import {exportGuide} from './export.mjs';
import {dataRoot,projectRoot,projectDir,writeJson,readJson,saveProject,loadProject} from './store.mjs';
const jobsRoot=path.join(dataRoot,'jobs');const active=new Map();let queue=Promise.resolve();
export async function initializeJobs(){await fs.mkdir(jobsRoot,{recursive:true});for(const f of await fs.readdir(jobsRoot)){if(!f.endsWith('.json'))continue;const j=await readJson(path.join(jobsRoot,f));if(['queued','running'].includes(j.status)){j.status='interrupted';j.error='The application stopped before this job finished. Start a fresh analysis or refresh; completed projects are retained.';j.updatedAt=new Date().toISOString();await writeJson(path.join(jobsRoot,f),j);}}}
export async function getJob(id){if(!/^[a-f0-9-]{36}$/.test(id))throw new Error('Invalid job identifier.');return readJson(path.join(jobsRoot,id+'.json'));}
export async function cancelJob(id){const controller=active.get(id);if(controller){controller.abort();return true;}return false;}
export async function buildArtifacts(k,dir){k.edition=crypto.randomUUID();const editionDir=path.join(dir,'editions',k.edition);await fs.mkdir(editionDir,{recursive:true});await writeJson(path.join(editionDir,'diagrams.json'),diagramsFor(k));const videos=await prepareVideos(k,editionDir);await fs.writeFile(path.join(editionDir,'guide.html'),exportGuide(k));await writeJson(path.join(editionDir,'videos.json'),videos);await writeJson(path.join(editionDir,'knowledge.json'),k);return videos;}
export async function startJob(options){const id=crypto.randomUUID();const projectId=options.projectId||crypto.randomUUID();const controller=new AbortController();active.set(id,controller);const job={id,projectId,status:'queued',stage:'queued',logs:[],createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()};const file=path.join(jobsRoot,id+'.json');await writeJson(file,job);
 let writes=Promise.resolve();
 function report(event){job.stage=event.stage||job.stage;job.updatedAt=new Date().toISOString();job.logs.push({at:job.updatedAt,message:event.message||event.stage});job.logs=job.logs.slice(-80);const snapshot=structuredClone(job);writes=writes.then(()=>writeJson(file,snapshot));return writes;}
 const execute=async()=>{try{controller.signal.throwIfAborted();job.status='running';await report({stage:'starting',message:options.render?'Rendering the selected explainer.':'Starting repository analysis.'});const dir=projectDir(projectId);
 if(options.render){const current=await loadProject(projectId);const result=await renderVideo(current.edition?path.join(dir,'editions',current.edition):dir,options.render,{signal:controller.signal,onProgress:report});job.result=result;}else{
 const source=options.source||(await loadProject(projectId)).source.url||(await loadProject(projectId)).source.path;
 // Each refresh gets a new scan directory. Previous completed knowledge stays intact on failure.
 const runDir=path.join(dir,'runs',id);await fs.mkdir(runDir,{recursive:true});
 const k=await analyze({source,outputDir:runDir,mode:options.mode||'pi',model:options.model,signal:controller.signal,onProgress:e=>void report(e),skillPath:path.join(projectRoot,'skills','codebase-study-guide','SKILL.md')});
 controller.signal.throwIfAborted();k.id=projectId;await report({stage:'visuals',message:'Building diagrams, learning guide, and video compositions.'});await buildArtifacts(k,dir);controller.signal.throwIfAborted();await saveProject(projectId,k);
 }
 job.status='complete';await report({stage:'complete',message:options.render?'Video render complete.':'Knowledge hub ready.'});
 }catch(error){job.status=controller.signal.aborted?'cancelled':'failed';job.error=controller.signal.aborted?'Job cancelled.':error.message;await report({stage:job.status,message:job.error});}finally{active.delete(id);}};
 queue=queue.then(execute,execute);return {jobId:id,projectId};}
