import {test} from 'node:test';
import assert from 'node:assert/strict';
import {rustPortAssessment} from '../src/rust-port.mjs';
const base={source:{revision:'abc',path:'/private/source'},files:[],evidence:[]};
test('C# web assessment grounds observations and proposes one isolated domain slice',()=>{
 const k={...base,files:[{path:'Student.cs',language:'C#'}],evidence:[{id:'model',path:'Student.cs',excerpt:'public class Student { public Guid Id; }'},{id:'http',path:'Controller.cs',excerpt:'using Microsoft.AspNetCore.Mvc; [ApiController]'},{id:'rules',path:'Service.cs',excerpt:'ValidateStudentOnRegister(student); RegisterStudentAsync(student);'},{id:'db',path:'Storage.cs',excerpt:'using Microsoft.EntityFrameworkCore; options.UseSqlServer(connectionString); Database.Migrate();'},{id:'tests',path:'Tests.cs',excerpt:'[Fact] VerifyNoOtherCalls();'}]};
 const a=rustPortAssessment(k);assert.equal(a.mode,'source-based-assessment');assert.equal(a.rea.status,'not-run');assert.match(a.firstSlice.title,/student-domain/);assert.ok(a.observed.some(o=>o.title.includes('SQL Server')));assert.ok(a.risks.some(r=>r.title.includes('schema')));const ids=new Set(k.evidence.map(e=>e.id));for(const item of [...a.observed,...a.mappings,...a.risks,a.firstSlice])assert.ok(item.evidenceIds.every(id=>ids.has(id)));assert.ok(!JSON.stringify(a).includes('/private/source'));assert.ok(!JSON.stringify(a).includes('connectionString);'));
});
test('unknown stack remains an open question without invented frameworks',()=>{
 const a=rustPortAssessment({...base,files:[{path:'notes.txt',language:'Text'}],evidence:[]});assert.match(a.summary,/insufficient/);assert.equal(a.observed.length,1);assert.match(a.mappings[0].rustApproach,/Open question/);assert.ok(!a.observed.some(o=>o.title.includes('SQL Server')));assert.deepEqual(a.observed[0].evidenceIds,[]);
});
test('already Rust source recommends an audit rather than language migration',()=>{
 const a=rustPortAssessment({...base,files:[{path:'src/main.rs',language:'Rust'}],evidence:[{id:'rust',path:'src/main.rs',excerpt:'fn main() {}'}]});assert.match(a.title,/architecture assessment/);assert.match(a.firstSlice.title,/Audit/);assert.ok(a.mappings.every(m=>!m.source.includes('C#')));
});
test('file names alone never establish ASP.NET or SQL Server and secret excerpts are not copied',()=>{
 const a=rustPortAssessment({...base,files:[{path:'Student.cs',language:'C#'}],evidence:[{id:'x',path:'irrelevant.txt',excerpt:'password=DO_NOT_EXPOSE_123'}]});assert.ok(!JSON.stringify(a).includes('DO_NOT_EXPOSE_123'));assert.ok(!a.observed.some(o=>o.title==='SQL Server dependency'));assert.match(a.summary,/insufficient/);
});

test('a small Rust component does not classify a mixed repository as already Rust',()=>{const a=rustPortAssessment({...base,files:[{path:'native/lib.rs'},{path:'app.py'},{path:'service.py'}],evidence:[{id:'r',excerpt:'use std::io;'}]});assert.notEqual(a.title,'Rust architecture assessment');assert.match(a.summary,/insufficient/);});
