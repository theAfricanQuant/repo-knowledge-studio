import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
export async function setupPi({importCredentials=false}={}){const dir=path.join(root,'.state','pi');await fs.mkdir(dir,{recursive:true,mode:0o700});const globalDir=path.join(os.homedir(),'.pi','agent');let defaults={};try{const s=JSON.parse(await fs.readFile(path.join(globalDir,'settings.json'),'utf8'));defaults={defaultProvider:s.defaultProvider,defaultModel:s.defaultModel};}catch{}
 const settings=path.join(dir,'settings.json');try{await fs.access(settings);}catch{await fs.writeFile(settings,JSON.stringify({...defaults,telemetry:false,packages:[]},null,2),{mode:0o600});}
 if(importCredentials){try{const auth=await fs.readFile(path.join(globalDir,'auth.json'));await fs.writeFile(path.join(dir,'auth.json'),auth,{mode:0o600});console.log('Existing provider access copied into ignored project-local runtime configuration. No credentials were printed.');}catch{console.log('No existing provider credential file found. Use npm run pi -- /login after setup.');}}
 console.log('Pi runtime directory: '+dir);return dir;}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))await setupPi({importCredentials:process.argv.includes('--import-existing-auth')});
