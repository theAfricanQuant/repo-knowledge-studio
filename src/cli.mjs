import fs from 'node:fs/promises';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
import {analyze,checkFreshness} from './engine.mjs';
import {buildArtifacts} from './jobs.mjs';
import {projectDir,saveProject,loadProject,listProjects,projectRoot} from './store.mjs';
const [command,source,...args]=process.argv.slice(2);
function value(name){const i=args.indexOf(name);return i>=0?args[i+1]:undefined;}
if(command==='analyze'){
 if(!source)throw new Error('Usage: npm run analyze -- <local-folder-or-github-url> [--inventory] [--model provider/model]');
 const id=randomUUID(),dir=projectDir(id);await fs.mkdir(dir,{recursive:true});
 const k=await analyze({source,outputDir:path.join(dir,'runs',randomUUID()),mode:args.includes('--inventory')?'inventory':'pi',model:value('--model'),skillPath:path.join(projectRoot,'skills/codebase-study-guide/SKILL.md'),onProgress:e=>console.log(e.stage+': '+e.message)});k.id=id;await buildArtifacts(k,dir);await saveProject(id,k);console.log(JSON.stringify({id,name:k.name,documents:k.handbook.length,chapters:k.chapters.length,output:dir},null,2));
}else if(command==='list')console.log(JSON.stringify(await listProjects(),null,2));
else if(command==='status'||command==='precheck')console.log(JSON.stringify(await checkFreshness(await loadProject(source)),null,2));
else console.log('Commands: analyze <source>, list, status <project-id>, precheck <project-id>');
