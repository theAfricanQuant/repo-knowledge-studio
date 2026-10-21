// Media stays tied to recorded source evidence; explicit author placements take priority.
export function mediaForDocument(document,diagrams,videos){
 const blocks=document.learningBlocks;
 if(Array.isArray(blocks))return {diagrams:diagrams.filter(d=>blocks.some(b=>b.type==='diagram'&&b.id===d.id)),videos:videos.filter(v=>blocks.some(b=>b.type==='video'&&b.id===v.id))};
 if(/glossary|plan|questions|assumptions/.test(document.id||''))return {diagrams:[],videos:[]};
 const refs=new Set(document.evidenceIds||[]);
 const rank=items=>items.map(item=>{const ids=item.evidenceIds||[];const overlap=ids.filter(id=>refs.has(id)).length;return {item,score:overlap/Math.max(refs.size,ids.length,1),overlap};}).filter(r=>r.overlap>0&&r.score>=.25).sort((a,b)=>b.score-a.score||b.overlap-a.overlap).map(r=>r.item);
 const candidates=diagrams.filter(d=>!d.id.startsWith('architecture-')||/architecture|map|overview|purpose/.test(document.id||''));
 return {diagrams:rank(candidates).slice(0,1),videos:rank(videos).slice(0,1)};
}
export function pageMedia(knowledge,diagrams,videos){return Object.fromEntries(['handbook','chapters'].map(type=>[type,Object.fromEntries((knowledge[type]||[]).map(d=>[d.id,mediaForDocument(d,diagrams,videos)]))]));}
export function videoUrls(id,edition,videos){const prefix=edition?`editions/${edition}/`:'';const url=p=>`/artifacts/${id}/${prefix}${p}`;return videos.map(v=>({...v,previewUrl:url(v.previewPath||`videos/${v.id}/preview.html`),videoUrl:v.videoPath||v.outputPath?url(v.videoPath||v.outputPath):null,posterUrl:v.posterPath?url(v.posterPath):null,captionsUrl:v.captionsPath?url(v.captionsPath):null}));}
