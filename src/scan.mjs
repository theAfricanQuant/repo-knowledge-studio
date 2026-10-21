import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
const exec = promisify(execFile);
const excluded = /^(?:\.git|\.pi|\.aws|\.ssh|node_modules|vendor|dist|build|coverage|bin|obj|\.next|\.venv|venv|packages)$/i;
const secret = /(?:^\.env(?:\.|$)|credentials|secrets?|\.pem$|\.key$|\.p12$|\.pfx$|auth\.json$|settings\.local\.json$|^appsettings\..+\.json$)/i;
const extensions = {'.cs':'C#','.js':'JavaScript','.mjs':'JavaScript','.ts':'TypeScript','.tsx':'TypeScript','.jsx':'JavaScript','.py':'Python','.md':'Markdown','.json':'JSON','.yml':'YAML','.yaml':'YAML','.csproj':'XML','.sln':'Solution','.html':'HTML','.css':'CSS','.go':'Go','.rs':'Rust','.java':'Java','.sh':'Shell','.xml':'XML','.toml':'TOML','.sql':'SQL'};
export const hash = value => crypto.createHash('sha256').update(value).digest('hex');
export async function gitInfo(root){
 const run = async args => (await exec('git',['-C',root,...args],{maxBuffer:2e6})).stdout.trim();
 try {return {revision:await run(['rev-parse','HEAD']),dirty:!!(await run(['status','--porcelain'])),status:await run(['status','--porcelain'])};} catch{return {revision:null,dirty:null,status:null};}
}
export async function scanRepository(root,{signal,maxFiles=6000,maxEvidence=120}={}){
 root=await fs.realpath(root); const files=[], evidence=[], candidates=[],warnings=[]; let visited=0;
 async function walk(dir){for(const entry of (await fs.readdir(dir,{withFileTypes:true})).sort((a,b)=>a.name.localeCompare(b.name))){
 signal?.throwIfAborted(); if(++visited>30000) {warnings.push('Traversal limit reached.');return;}
 if(excluded.test(entry.name)||secret.test(entry.name)||entry.isSymbolicLink())continue;
 const absolute=path.join(dir,entry.name), relative=path.relative(root,absolute).split(path.sep).join('/');
 if(entry.isDirectory()){await walk(absolute);continue;} if(!entry.isFile()||files.length>=maxFiles)continue;
 const language=extensions[path.extname(entry.name).toLowerCase()]; if(!language)continue;
 const stat=await fs.stat(absolute); if(stat.size>512000)continue;
 const bytes=await fs.readFile(absolute);if(bytes.includes(0))continue;
 const content=bytes.toString('utf8'); if(/(?:-----BEGIN (?:RSA |OPENSSH |EC )?PRIVATE KEY-----|(?:api[_-]?key|password|client_secret)\s*[:=]\s*["'][^"'\s]{12,}["'])/i.test(content)){warnings.push(`Excluded potentially sensitive file: ${relative}`);continue;}
 files.push({path:relative,bytes:stat.size,language,hash:hash(bytes)});
 {const lines=content.split('\n'),excerpt=lines.slice(0,90).join('\n').slice(0,8500);candidates.push({path:relative,startLine:1,endLine:Math.min(90,excerpt.split('\n').length),excerpt,hash:hash(bytes)});}
 }}
 await walk(root);
 const priority = e => /(^|\/)(README[^/]*|Program\.cs|Startup\.cs|package\.json|pyproject\.toml|Dockerfile)$/i.test(e.path) ? 0 : /\.(csproj|sln)$/.test(e.path) ? 1 : /(?:Services|Controllers|Models|Brokers|src)\//i.test(e.path)&&!/test/i.test(e.path)?2:3;
 candidates.sort((a,b)=>priority(a)-priority(b)||a.path.localeCompare(b.path));
 const important=candidates.filter(e=>priority(e)<2).slice(0,Math.min(25,maxEvidence));const remaining=candidates.filter(e=>!important.includes(e));const slots=maxEvidence-important.length;
 const selected=[...important];for(let i=0;i<Math.min(slots,remaining.length);i++)selected.push(remaining[Math.floor(i*remaining.length/Math.min(slots,remaining.length))]);
 selected.forEach((e,i)=>evidence.push({id:`ev-${i+1}`,...e}));
 if(candidates.length>maxEvidence)warnings.push(`Evidence excerpts cover ${evidence.length} of ${files.length} eligible files; unquoted files are inventory only.`);
 if(files.length>=maxFiles)warnings.push('File inventory limit reached.');
 return {root,files,evidence,warnings,...await gitInfo(root)};
}
