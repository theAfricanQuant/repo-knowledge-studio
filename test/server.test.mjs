import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
const scratch=await fs.mkdtemp(path.join(os.tmpdir(),'rks-api-'));
process.env.RKS_DATA_DIR=path.join(scratch,'data');
const {createServer}=await import('../src/server.mjs');
const {projectDir,writeJson}=await import('../src/store.mjs');
const {exportGuide}=await import('../src/export.mjs');
const {startJob,cancelJob,getJob}=await import('../src/jobs.mjs');
async function poll(id){for(let i=0;i<150;i++){const j=await getJob(id);if(['complete','failed','cancelled'].includes(j.status))return j;await new Promise(r=>setTimeout(r,20));}throw new Error('Job timed out');}
test('HTTP inventory, evidence boundary, freshness, failed refresh retention, cross-origin and export escaping',async()=>{
 const source=path.join(scratch,'fixture');await fs.mkdir(source);await fs.writeFile(path.join(source,'README.md'),'# Example\nA small fixture.');await fs.writeFile(path.join(source,'index.js'),'export const hello = 1;');await fs.writeFile(path.join(source,'.env'),'HIDDEN=never-return');
 const server=await createServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));const base=`http://127.0.0.1:${server.address().port}`;
 const request=(url,body,headers={})=>fetch(base+url,{method:'POST',headers:{'Content-Type':'application/json',...headers},body:JSON.stringify(body)});
 try{
 assert.equal((await fetch(base+'/api/health')).status,200);
 assert.equal((await request('/api/projects',{source,mode:'inventory'},{Origin:'https://evil.example'})).status,400);
 const created=await request('/api/projects',{source,mode:'inventory'});assert.equal(created.status,202);const job=await created.json();assert.equal((await poll(job.jobId)).status,'complete');
 const before=await (await fetch(base+`/api/projects/${job.projectId}`)).json();assert.equal(before.mode,'inventory');assert.equal(before.files.length,2);
 const evidence=await (await fetch(base+`/api/projects/${job.projectId}/source?evidence=${before.evidence[0].id}`)).json();assert.ok(evidence.excerpt);assert.equal((await fetch(base+`/api/projects/${job.projectId}/source?evidence=../../.env`)).status,404);
 await fs.mkdir(path.join(projectDir(job.projectId),'runs',job.jobId,'source'),{recursive:true});await fs.writeFile(path.join(projectDir(job.projectId),'runs',job.jobId,'source','.env'),'HIDDEN=never-return');
 const secret=await fetch(base+`/artifacts/${job.projectId}/runs/${job.jobId}/source/.env`);assert.notEqual(secret.status,200);
 const outside=path.join(scratch,'outside.txt');await fs.writeFile(outside,'DO NOT SERVE');await fs.symlink(outside,path.join(projectDir(job.projectId),'leak.txt'));assert.notEqual((await fetch(base+`/artifacts/${job.projectId}/leak.txt`)).status,200);
 assert.notEqual((await fetch(base+`/artifacts/${job.projectId}/%2e%2e%2f%2e%2e%2foutside.txt`)).status,200);
 await fs.writeFile(path.join(source,'index.js'),'export const hello = 2;');const freshness=await (await fetch(base+`/api/projects/${job.projectId}/freshness`)).json();assert.equal(freshness.fresh,false);assert.ok(freshness.changedFiles.includes('index.js'));
 await fs.rm(source,{recursive:true});const refresh=await request(`/api/projects/${job.projectId}/refresh`,{mode:'inventory'});const refreshJob=await refresh.json();assert.equal((await poll(refreshJob.jobId)).status,'failed');const after=await (await fetch(base+`/api/projects/${job.projectId}`)).json();assert.deepEqual(after,before);
 const hostile={...before,name:'<script>alert(1)</script>',summary:'<img src=x onerror=alert(1)>',concepts:[{id:'x',title:'<script>bad()</script>',summary:'test',evidenceIds:[]}],handbook:[{id:'x',title:'<script>bad()</script>',body:'<img src=x onerror=bad()>',evidenceIds:[]}]};const html=exportGuide(hostile);assert.ok(!html.includes('<script>'));assert.ok(!html.includes('<img src=x'));assert.ok(html.includes('&lt;script&gt;'));
 }finally{await new Promise(r=>server.close(r));}
});
test('a queued cancellation becomes terminal and preserves other work',async()=>{
 const source=path.join(scratch,'cancel-fixture');await fs.mkdir(source);for(let i=0;i<100;i++)await fs.writeFile(path.join(source,`file${i}.js`),'export const n = 1;');
 const first=await startJob({source,mode:'inventory'});const second=await startJob({source,mode:'inventory'});assert.equal(await cancelJob(second.jobId),true);assert.equal((await poll(second.jobId)).status,'cancelled');assert.equal((await poll(first.jobId)).status,'complete');
});
test.after(async()=>{await fs.rm(scratch,{recursive:true,force:true});});
