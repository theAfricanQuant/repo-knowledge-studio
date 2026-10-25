import {diagramsFor} from './visuals.mjs';
export const escapeHtml=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function paragraphs(body){
 const inline=t=>escapeHtml(t).replace(/`([^`]+)`/g,'<code>$1</code>').replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>');
 const lines=String(body||'').replace(/\r\n/g,'\n').split('\n');let html='',paragraph=[],list=[],listType=null,code=null;
 const flushParagraph=()=>{if(paragraph.length){html+='<p>'+paragraph.map(inline).join('<br>')+'</p>';paragraph=[];}};
 const flushList=()=>{if(list.length){html+='<'+listType+'>'+list.map(item=>'<li>'+inline(item)+'</li>').join('')+'</'+listType+'>';list=[];listType=null;}};
 for(const line of lines){
  if(code){if(/^```\s*$/.test(line)){html+='<pre data-language="'+escapeHtml(code.language)+'"><code>'+escapeHtml(code.lines.join('\n'))+'</code></pre>';code=null;}else code.lines.push(line);continue;}
  const fence=line.match(/^```([\w+-]*)\s*$/);if(fence){flushParagraph();flushList();code={language:fence[1]||'text',lines:[]};continue;}
  const heading=line.match(/^(#{1,4})\s+(.+)$/);if(heading){flushParagraph();flushList();const level=Math.min(4,heading[1].length+1);html+='<h'+level+'>'+inline(heading[2])+'</h'+level+'>';continue;}
  if(!line.trim()){flushParagraph();flushList();continue;}
  const item=line.match(/^\s*(?:([-*])\s+|(\d+)\.\s+)(.*)$/);if(item){flushParagraph();const kind=item[1]?'ul':'ol';if(listType&&listType!==kind)flushList();listType=kind;list.push(item[3]);continue;}
  flushList();paragraph.push(line);
 }
 flushParagraph();flushList();if(code)html+='<pre data-language="'+escapeHtml(code.language)+'"><code>'+escapeHtml(code.lines.join('\n'))+'</code></pre>';return html;
}
function githubEvidenceUrl(k,e){
 try{
  const repo=new URL(k.source?.url);
  const parts=repo.pathname.split('/').filter(Boolean);
  const revision=String(k.source?.revision||'');
  if(k.source?.dirty||repo.protocol!=='https:'||repo.hostname!=='github.com'||parts.length!==2||! /^[\w.-]+$/.test(parts[0])||! /^[\w.-]+$/.test(parts[1].replace(/\.git$/,''))||! /^[a-f\d]{7,64}$/i.test(revision))return null;
  const file=String(e.path||'').split('/');
  if(!file.length||file.some(part=>!part||part==='.'||part==='..'||part.includes('\\')))return null;
  const path=file.map(encodeURIComponent).join('/');
  const start=Number(e.startLine),end=Number(e.endLine);
  if(!Number.isSafeInteger(start)||start<1||!Number.isSafeInteger(end)||end<start)return null;
  return `https://github.com/${parts[0]}/${parts[1].replace(/\.git$/,'')}/blob/${revision}/${path}#L${start}-L${end}`;
 }catch{return null;}
}
export function exportGuide(k,{chapterId}={}){
 const esc=escapeHtml;
 const focused=chapterId!==undefined;
 const chapter=focused?k.chapters.find(d=>d.id===chapterId):null;
 if(focused&&!chapter)throw new Error('Learning chapter not found.');
 const chapters=focused?[chapter]:k.chapters;
 const handbook=focused?[]:k.handbook;
 const diagrams=focused?[]:diagramsFor(k);
 const evMap=new Map(k.evidence.map(e=>[e.id,e]));
 const relevantIds=focused?new Set(chapter.evidenceIds||[]):null;
 const evidence=focused?k.evidence.filter(e=>relevantIds.has(e.id)):k.evidence;
 const refs=ids=>'<ul class="references">'+(ids||[]).map(id=>{
  const e=evMap.get(id);if(!e)return '';
  const github=githubEvidenceUrl(k,e);
  return `<li><a href="#e-${esc(id)}">${esc(e.path)}:${esc(e.startLine)}–${esc(e.endLine)}</a>${github?` · <a href="${esc(github)}" target="_blank" rel="noopener noreferrer">Open source on GitHub ↗</a>`:''}</li>`;
 }).join('')+'</ul>';
 const section=(d,type,index,list)=>`${type==='chapter'&&d.part&&(index===0||list[index-1]?.part!==d.part)?`<div class="part-divider"><p class="eyebrow">${esc(d.part)}</p></div>`:''}<section id="${type}-${esc(d.id)}"><p class="eyebrow">${type==='chapter'?'Chapter '+(index+1)+' of '+list.length:'Handbook'}</p><h2>${esc(d.title)}</h2>${type==='chapter'?`<p class="reading-time">About ${Math.max(1,Math.ceil(String(d.body||'').split(/\s+/).length/200))} minutes of reading</p>`:''}${paragraphs(d.body)}${refs(d.evidenceIds)}${d.quiz?`<details><summary>${esc(d.quiz.question)}</summary><p>${esc(d.quiz.answer)}</p></details>`:''}<nav class="page-nav" aria-label="${type==='chapter'?'Chapter':'Handbook'} navigation">${index>0?`<a href="#${type}-${esc(list[index-1].id)}">← ${esc(list[index-1].title)}</a>`:''}<a href="#contents">Contents ↑</a>${index<list.length-1?`<a href="#${type}-${esc(list[index+1].id)}">${esc(list[index+1].title)} →</a>`:''}</nav></section>`;
 const title=focused?`${chapter.title} · ${k.name}`:`${k.name} · Knowledge guide`;
 const studioLink=focused?`<a href="/#project=${encodeURIComponent(k.id)}&amp;tab=learn&amp;doc=${encodeURIComponent(chapter.id)}">Return to this chapter in Studio ↗</a>`:'';
 const intro=focused?`<section id="contents"><p class="eyebrow">CHAPTER DEEP DIVE</p><h2>${esc(chapter.title)}</h2><p>A focused, source-linked reading of this chapter from ${esc(k.name)}.</p><p class="tag">Revision ${esc(k.source?.revision||'unversioned')} · ${esc(k.generatedAt)}</p><p>${studioLink}</p><p><a href="#sources">Jump to this chapter's source code ↓</a></p></section>`:`<section id="contents"><p class="eyebrow">Start here</p><h2>Choose your way through the codebase</h2><p>Use the handbook to find a specific answer. Follow the chapters in order to build your understanding.</p><div class="contents-grid"><div><h3>Practical handbook</h3><ul>${handbook.map(d=>`<li><a href="#handbook-${esc(d.id)}">${esc(d.title)}</a></li>`).join('')}</ul></div><div><h3>Learn step by step</h3><ol class="chapter-index">${chapters.map(d=>`<li><article class="chapter-index-card"><h3><a href="#chapter-${esc(d.id)}">${esc(d.title)}</a></h3></article><a class="chapter-deep-link" href="#chapter-${esc(d.id)}">Open chapter deep dive ↗</a></li>`).join('')}</ol></div></div><p><a href="#diagrams">Explore the diagrams</a> · <a href="#sources">Check the source evidence</a></p></section>`;
 const body=focused?`${section(chapter,'chapter',0,chapters)}`:`<div class="notice">${k.warnings.map(esc).join('<br>')}</div><h2 id="handbook">The practical handbook</h2>${handbook.map((d,i,list)=>section(d,'handbook',i,list)).join('')}<h2 id="learn">Learn the codebase</h2>${chapters.map((d,i,list)=>section(d,'chapter',i,list)).join('')}<section id="diagrams"><h2>See the connections</h2>${diagrams.map(d=>`<figure>${d.svg}<figcaption>${esc(d.title)}</figcaption></figure>`).join('')}</section>`;
 return `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title><style>:root{color-scheme:light;--paper:#f2f5fa;--ink:#23334d;--accent:#9a522f}*{box-sizing:border-box}body{margin:0;background:var(--paper);color:var(--ink);font:17px/1.75 system-ui,sans-serif}header,main,footer{max-width:1050px;margin:auto;padding:36px 24px}header{padding-top:70px}h1{font:400 clamp(44px,8vw,82px)/1.05 Georgia,serif;letter-spacing:-.035em}h2{font:400 36px/1.15 Georgia,serif}h3{font-size:22px}h4{font-size:19px}.part-divider{margin-top:50px;padding:14px 20px;background:#23334d;color:white}.part-divider .eyebrow{color:white}.reading-time{font-size:13px;color:#536580}pre[data-language]::before{content:attr(data-language);display:block;text-transform:uppercase;font:10px system-ui;letter-spacing:.1em;margin-bottom:14px;color:#536580}p{max-width:76ch}section{padding:35px 0;border-top:1px solid #cbd5e4}a{color:var(--accent);overflow-wrap:anywhere}.eyebrow{font-size:12px;text-transform:uppercase;letter-spacing:.13em;color:#536580}.notice{background:#e6edf7;border-left:4px solid #9a522f;padding:20px}.contents-grid{display:grid;grid-template-columns:1fr 1fr;gap:30px}.contents-grid li{margin:9px 0}.chapter-index{display:grid;gap:10px;list-style:none;padding:0}.chapter-index>li{display:grid;gap:8px}.chapter-index-card{padding:12px 16px;border:1px solid #cbd5e4;background:white;border-radius:10px}.chapter-index-card h3{margin:0;font-size:16px}.chapter-index-card h3 a{text-decoration:none}.chapter-deep-link{justify-self:start;color:var(--accent);font-size:13px}.page-nav{margin-top:30px;padding-top:18px;border-top:1px solid #cbd5e4;justify-content:space-between;font-size:14px}section{scroll-margin-top:20px}@media(max-width:650px){.contents-grid{grid-template-columns:1fr}}nav{display:flex;flex-wrap:wrap;gap:12px}.references{font:12px/1.6 ui-monospace,monospace}.references li{margin:6px 0}figure{margin:24px 0;background:white;padding:24px;border:1px solid #cbd5e4;border-radius:16px;overflow:auto}svg{max-width:100%;min-width:600px}figcaption{font-size:14px;color:#536580}details{background:white;padding:20px;margin:20px 0;border:1px solid #cbd5e4;border-radius:12px}summary{cursor:pointer;font-weight:600}pre{padding:20px;background:#e5ebf4;overflow:auto;font:13px/1.65 ui-monospace,monospace}.tag{font-size:12px;padding:4px 9px;background:#e6edf7;border-radius:5px}@media print{body{background:white}section{break-before:page}pre{white-space:pre-wrap}svg{min-width:0}details{break-inside:avoid}}</style><header><p class="eyebrow">Repo Knowledge Studio · ${esc(k.mode==='pi'?'AI-generated, source-linked':k.mode==='curated'?'Curated reference example':'Structural inventory')}</p>${focused?`<h1>${esc(k.name)}<br>Chapter deep dive.</h1><p>${esc(k.summary)}</p><nav>${studioLink}<a href="#sources">Source code ↓</a></nav>`:`<h1>${esc(k.name)}<br>A codebase, explained.</h1><p>${esc(k.summary)}</p><p class="tag">Revision ${esc(k.source?.revision||'unversioned')} · ${esc(k.generatedAt)}</p><nav><a href="#handbook">Handbook</a><a href="#learn">Learn</a><a href="#diagrams">Diagrams</a><a href="#sources">Source evidence</a></nav>`}</header><main>${intro}${body}<section id="sources"><h2>${focused?'This chapter’s source code':'Source evidence'}</h2><p>Excerpts are a snapshot of the source revision above. They establish a reference, not proof that every generated interpretation is correct.</p>${evidence.map(e=>{const github=githubEvidenceUrl(k,e);return `<details id="e-${esc(e.id)}"><summary>${esc(e.path)}:${esc(e.startLine)}–${esc(e.endLine)}</summary>${github?`<p><a href="${esc(github)}" target="_blank" rel="noopener noreferrer">Open these lines on GitHub ↗</a></p>`:''}<pre>${esc(e.excerpt)}</pre></details>`;}).join('')}</section></main><footer>Generated locally with Repo Knowledge Studio. Model-produced explanations require review; code excerpts are from the analyzed repository.</footer></html>`;
}
