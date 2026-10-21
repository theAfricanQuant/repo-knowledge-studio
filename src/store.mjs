import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
export const projectRoot=path.resolve(fileURLToPath(new URL('..',import.meta.url)));
export const dataRoot=path.resolve(process.env.RKS_DATA_DIR||path.join(projectRoot,'data'));
export const projectsRoot=path.join(dataRoot,'projects');
export const safeId=id=>/^[a-zA-Z0-9_-]{1,100}$/.test(id);
export function projectDir(id){if(!safeId(id))throw new Error('Invalid project identifier.');return path.join(projectsRoot,id);}
export async function writeJson(file,value){await fs.mkdir(path.dirname(file),{recursive:true});const tmp=file+'.'+crypto.randomBytes(4).toString('hex')+'.tmp';await fs.writeFile(tmp,JSON.stringify(value,null,2));await fs.rename(tmp,file);}
export async function readJson(file,fallback){try{return JSON.parse(await fs.readFile(file,'utf8'));}catch(e){if(e.code==='ENOENT'&&fallback!==undefined)return fallback;throw e;}}
export async function loadProject(id){return readJson(path.join(projectDir(id),'knowledge.json'));}
export async function listProjects(){await fs.mkdir(projectsRoot,{recursive:true});const result=[];for(const id of await fs.readdir(projectsRoot)){if(!safeId(id))continue;try{const k=await loadProject(id);result.push({id:k.id,name:k.name,summary:k.summary,source:k.source,generatedAt:k.generatedAt,mode:k.mode});}catch{}}return result.sort((a,b)=>b.generatedAt.localeCompare(a.generatedAt));}
export async function saveProject(id,k){k.id=id;await writeJson(path.join(projectDir(id),'knowledge.json'),k);return k;}
export async function resolveAsset(id,relative){const root=await fs.realpath(projectDir(id));const target=await fs.realpath(path.resolve(root,relative));if(!target.startsWith(root+path.sep))throw new Error('Asset path escapes the project.');return target;}
