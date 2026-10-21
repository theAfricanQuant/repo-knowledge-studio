import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {analyze,checkFreshness,searchKnowledge,validateKnowledge} from '../src/engine.mjs';
import {parsePiJson} from '../src/pi.mjs';
test('scan excludes secrets, symlinks, dependencies and binary data; freshness detects edits',async()=>{
 const base=await fs.mkdtemp(path.join(os.tmpdir(),'rks-test-'));const source=path.join(base,'repo');await fs.mkdir(source);try{
 await fs.writeFile(path.join(source,'app.js'),'export const answer = 42;\n');await fs.writeFile(path.join(source,'.env'),'TOKEN=secret');await fs.writeFile(path.join(source,'credentials.json'),'sensitive');await fs.mkdir(path.join(source,'node_modules'));await fs.writeFile(path.join(source,'node_modules','bad.js'),'bad');await fs.symlink('/etc/passwd',path.join(source,'link.js'));await fs.writeFile(path.join(source,'binary.js'),Buffer.from([0,1,2]));await fs.writeFile(path.join(source,'config.js'),'const password = "verylongpassword123"');
 const k=await analyze({source,outputDir:path.join(base,'out')});assert.deepEqual(k.files.map(f=>f.path),['app.js']);assert.equal(k.mode,'inventory');assert.equal(k.chapters.length,0);assert.equal((await checkFreshness(k)).fresh,true);await fs.writeFile(path.join(source,'app.js'),'export const answer = 43;');const fresh=await checkFreshness(k);assert.equal(fresh.fresh,false);assert.deepEqual(fresh.changed,['app.js']);
 }finally{await fs.rm(base,{recursive:true,force:true});}
});
test('grounding rejects invented evidence and graph references',()=>{
 const k={evidence:[{id:'ev-1'}],concepts:[{id:'a',confidence:'verified',evidenceIds:['made-up']}],relationships:[],handbook:[],chapters:[],videoPlans:[]};assert.throws(()=>validateKnowledge(k),/invalid evidence/);k.concepts[0].evidenceIds=['ev-1'];k.relationships.push({from:'a',to:'missing',evidenceIds:['ev-1']});assert.throws(()=>validateKnowledge(k),/unknown concept/);
});
test('Pi JSON parsing fails explicitly and search ranks titles',()=>{assert.throws(()=>parsePiJson('not json'),/invalid JSON/);assert.deepEqual(parsePiJson('```json\n{"ok":true}\n```'),{ok:true});const k={handbook:[{id:'a',title:'Setup',body:'Install project',evidenceIds:[]}],chapters:[],concepts:[]};assert.equal(searchKnowledge(k,'setup')[0].id,'a');assert.deepEqual(searchKnowledge(k,''),[]);});
