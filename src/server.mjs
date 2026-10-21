import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {startJob,getJob,cancelJob,initializeJobs} from './jobs.mjs';
import {listProjects,loadProject,projectDir,projectRoot,resolveAsset,readJson,writeJson} from './store.mjs';
import {checkFreshness,searchKnowledge} from './engine.mjs';
import {exportGuide} from './export.mjs';
import {rustPortAssessment} from './rust-port.mjs';
import {diagramsFor} from './visuals.mjs';
import {pageMedia,videoUrls} from './learning-media.mjs';
const publicRoot=path.join(projectRoot,'public');
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.jpg':'image/jpeg','.png':'image/png','.svg':'image/svg+xml','.json':'application/json','.mp4':'video/mp4','.webm':'video/webm','.wav':'audio/wav','.mp3':'audio/mpeg','.vtt':'text/vtt'};
const json=(res,code,value)=>{res.writeHead(code,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(value));};
async function body(req){let text='';for await(const c of req){text+=c;if(text.length>10000)throw new Error('Request is too large.');}try{return JSON.parse(text||'{}');}catch{throw new Error('Invalid JSON request.');}}
function validateMutation(req){const origin=req.headers.origin;if(origin){const u=new URL(origin);if(!['127.0.0.1','localhost','[::1]'].includes(u.hostname)||u.host!==req.headers.host)throw new Error('Cross-origin requests are not accepted.');}if(!String(req.headers['content-type']||'').startsWith('application/json'))throw new Error('Use application/json.');}
async function sendFile(req,res,file){const stat=await fs.stat(file);if(!stat.isFile())throw new Error('Not a file.');res.setHeader('Content-Type',types[path.extname(file)]||'application/octet-stream');res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Cache-Control','no-cache');
 if(req.headers.range&&/\.(mp4|webm|wav|mp3)$/.test(file)){const m=/^bytes=(\d+)-(\d*)$/.exec(req.headers.range);if(!m){res.writeHead(416);return res.end();}const start=Number(m[1]),end=m[2]?Math.min(Number(m[2]),stat.size-1):stat.size-1;if(start>end||start>=stat.size){res.writeHead(416,{'Content-Range':`bytes */${stat.size}`});return res.end();}const {createReadStream}=await import('node:fs');res.writeHead(206,{'Content-Range':`bytes ${start}-${end}/${stat.size}`,'Accept-Ranges':'bytes','Content-Length':end-start+1});return createReadStream(file,{start,end}).pipe(res);}
 const data=await fs.readFile(file);res.writeHead(200,{'Content-Length':data.length});res.end(data);}
export async function createServer(){await initializeJobs();return http.createServer(async(req,res)=>{res.setHeader('Referrer-Policy','no-referrer');try{if(!/^(?:localhost|127\.0\.0\.1|\[::1\])(?::\d{1,5})?$/.test(req.headers.host||''))return json(res,403,{error:'This application accepts localhost requests only.'});const url=new URL(req.url,'http://localhost');const route=url.pathname.split('/').filter(Boolean).map(decodeURIComponent);if(['POST','PUT','DELETE'].includes(req.method))validateMutation(req);
 if(route[0]==='api'){
 if(route[1]==='health')return json(res,200,{ok:true});
 if(route[1]==='settings'){const pkg=JSON.parse(await fs.readFile(path.join(projectRoot,'node_modules/@earendil-works/pi-coding-agent/package.json'),'utf8').catch(()=>'{}'));return json(res,200,{piInstalled:!!pkg.version,piVersion:pkg.version||null,localOnly:true});}
 if(route[1]==='jobs'){if(req.method==='POST'&&route[3]==='cancel')return json(res,200,{cancelled:await cancelJob(route[2])});return json(res,200,await getJob(route[2]));}
 if(route[1]==='projects'){
 if(route.length===2){if(req.method==='GET')return json(res,200,await listProjects());const input=await body(req);if(typeof input.source!=='string'||!input.source.trim())throw new Error('Provide a local folder or GitHub repository URL.');if(input.mode&&!['inventory','pi'].includes(input.mode))throw new Error('Choose inventory or pi mode.');return json(res,202,await startJob({source:input.source.trim(),mode:input.mode,model:input.model}));}
 const id=route[2],k=await loadProject(id);if(route.length===3)return json(res,200,k);
 if(route[3]==='refresh'&&req.method==='POST'){const input=await body(req);return json(res,202,await startJob({projectId:id,mode:input.mode||k.mode,model:input.model}));}
 if(route[3]==='freshness'){const f=await checkFreshness(k);return json(res,200,{...f,current:f.fresh,changedFiles:[...(f.changed||[]),...(f.removed||[])],affectedDocuments:f.affected||[]});}
 if(route[3]==='source'){const evidence=k.evidence.find(e=>e.id===url.searchParams.get('evidence'));if(!evidence)return json(res,404,{error:'Evidence not found.'});return json(res,200,evidence);}
 if(route[3]==='search')return json(res,200,searchKnowledge(k,url.searchParams.get('q')));
 if(route[3]==='rust-port')return json(res,200,rustPortAssessment(k));
 if(route[3]==='diagrams')return json(res,200,diagramsFor(k));
 if(route[3]==='page-media'){const prefix=k.edition?`editions/${k.edition}/`:'';const videos=await readJson(path.join(projectDir(id),prefix,'videos.json'),[]);return json(res,200,pageMedia(k,diagramsFor(k),videoUrls(id,k.edition,videos)));}
 if(route[3]==='videos'){
 if(req.method==='POST'&&route[5]==='render')return json(res,202,await startJob({projectId:id,render:route[4]}));
 const prefix=k.edition?`editions/${k.edition}/`:'';const videos=await readJson(path.join(projectDir(id),prefix,'videos.json'),[]);return json(res,200,videos.map(v=>({...v,previewUrl:`/artifacts/${id}/${prefix}${v.previewPath||`videos/${v.id}/preview.html`}`,videoUrl:(v.videoPath||v.outputPath)?`/artifacts/${id}/${prefix}${v.videoPath||v.outputPath}`:null,posterUrl:v.posterPath?`/artifacts/${id}/${prefix}${v.posterPath}`:null,captionsUrl:v.captionsPath?`/artifacts/${id}/${prefix}${v.captionsPath}`:null})));}
 if(route[3]==='links'){const file=path.join(projectDir(id),'links.json');if(req.method==='GET')return json(res,200,await readJson(file,[]));const input=await body(req);const parsed=new URL(input.url);if(!['http:','https:'].includes(parsed.protocol))throw new Error('Use an HTTP or HTTPS link.');parsed.username='';parsed.password='';for(const key of [...parsed.searchParams.keys()])if(/token|key|secret|pass|auth|signature/i.test(key))parsed.searchParams.set(key,'[REDACTED]');const links=await readJson(file,[]);links.push({url:parsed.href,title:String(input.title||'').slice(0,200),addedAt:new Date().toISOString()});await writeJson(file,links);return json(res,201,links);}
 if(route[3]==='export'){res.setHeader('Content-Disposition',`attachment; filename="${k.name.replace(/[^a-zA-Z0-9_-]/g,'-')}-guide.html"`);res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});return res.end(exportGuide(k));}
 if(route[3]==='knowledge'){res.setHeader('Content-Disposition','attachment; filename="knowledge.json"');return json(res,200,k);}
 }
 return json(res,404,{error:'Unknown API route.'});
 }
 if(route[0]==='artifacts'){const relative=route.slice(2).join('/');if(!/^editions\/[a-f0-9-]{36}\/videos\/[a-zA-Z0-9_-]+\/(?:preview\.html|index\.html|gsap\.min\.js|poster\.jpg|video\.(?:mp4|webm)|captions\.vtt|voice\.(?:wav|mp3))$/.test(relative))return json(res,403,{error:'Only generated media artifacts can be served.'});return await sendFile(req,res,await resolveAsset(route[1],relative));}
 const relative=route.length?route.join('/'):'index.html';const file=await fs.realpath(path.resolve(publicRoot,relative));if(!file.startsWith(await fs.realpath(publicRoot)+path.sep))throw new Error('Invalid asset path.');return await sendFile(req,res,file);
 }catch(error){if(res.headersSent){res.end();return;}json(res,error.code==='ENOENT'?404:400,{error:error.code==='ENOENT'?'Resource not found.':error.message});}});}
if(process.argv[1]&&fileURLToPath(import.meta.url)===path.resolve(process.argv[1])){const port=Number(process.env.PORT||4173);const server=await createServer();server.listen(port,'127.0.0.1',()=>console.log(`Repo Knowledge Studio: http://127.0.0.1:${port}`));}
