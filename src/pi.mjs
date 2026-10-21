import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import fs from 'node:fs/promises';
export async function invokePi({cwd,prompt,skillPath,model,signal,onProgress,timeoutMs=1200000}){
 const args=['--print','--mode','json','--no-session','--no-context-files','--no-extensions','--no-mcp','--no-skills','--no-prompt-templates','--no-themes','--no-approve','--tools','read,grep,find,ls'];
 const localConfig=fileURLToPath(new URL('../.state/pi',import.meta.url));
 const configDir=process.env.PI_CODING_AGENT_DIR||localConfig;
 if(!model){try{const settings=JSON.parse(await fs.readFile(path.join(configDir,'settings.json'),'utf8'));if(settings.defaultProvider&&settings.defaultModel)model=settings.defaultProvider+'/'+settings.defaultModel;}catch{}}
 if(!model)throw new Error('Choose a provider/model before analysis. Run project-local Pi login and model setup; the app does not silently choose a provider.');
 if(skillPath)args.push('--append-system-prompt',skillPath);args.push('--model',model); args.push(prompt);
 return await new Promise((resolve,reject)=>{
 const child=spawn(process.env.PI_BINARY || fileURLToPath(new URL('../node_modules/.bin/pi',import.meta.url)),args,{cwd,signal,env:{...process.env,PI_CODING_AGENT_DIR:configDir,PI_TELEMETRY:'0'},stdio:['ignore','pipe','pipe']});let buffer='',texts=[],size=0,stderr='',modelError='';
 let timedOut=false,tooLarge=false,killTimer;
 const timer=setTimeout(()=>{timedOut=true;child.kill('SIGTERM');killTimer=setTimeout(()=>child.kill('SIGKILL'),3000);killTimer.unref();},timeoutMs);timer.unref();
 function consume(line){try{const event=JSON.parse(line);if(event.type==='message_end'&&event.message?.role==='assistant'){const parts=event.message.content||[];const text=parts.filter(p=>p.type==='text').map(p=>p.text).join('\n');if(text)texts.push(text);if(event.message.stopReason==='error'){const raw=event.message.errorMessage||'';modelError=/402|credits|balance/i.test(raw)?'The selected provider rejected the request for insufficient credits or an oversized token allowance. Choose another configured model or adjust provider settings.':/401|403|unauthorized|authentication/i.test(raw)?'The selected provider rejected authentication. Reconnect it with project-local Pi.':'The selected model returned an error. Check its availability and project-local Pi configuration.';}}if(event.type==='tool_execution_start')onProgress?.({stage:'exploring',message:'Pi is inspecting repository evidence.'});}catch{}}
 child.stdout.on('data',chunk=>{size+=chunk.length;if(size>15e6){tooLarge=true;child.kill();return;}buffer+=chunk;const lines=buffer.split('\n');buffer=lines.pop();lines.forEach(consume);});
 child.stderr.on('data',chunk=>{stderr+=chunk.toString();stderr=stderr.slice(-1000);});
 child.on('error',error=>{clearTimeout(timer);reject(new Error(error.code==='ENOENT'?'Pi CLI is not installed.':`Pi could not start (${error.code||error.name}).`));});
 child.on('close',code=>{clearTimeout(timer);clearTimeout(killTimer);if(buffer)consume(buffer);if(timedOut)return reject(new Error('Pi analysis exceeded its time limit. The source scan was retained; retry with a smaller scope or a faster model.'));if(tooLarge)return reject(new Error('Pi output exceeded the application limit.'));if(modelError)return reject(new Error(modelError));if(code!==0)return reject(new Error(`Pi analysis failed (exit ${code}); check local provider configuration. Credentials and raw provider errors are intentionally not displayed.`));const last=texts.at(-1);if(!last)return reject(new Error('Pi returned no final analysis.'));resolve(last);});
 });
}
export function parsePiJson(text){let clean=text.trim();if(clean.startsWith('```'))clean=clean.replace(/^```(?:json)?\s*/,'').replace(/\s*```$/,'');try{return JSON.parse(clean);}catch{throw new Error('Pi returned invalid JSON. The scan was retained; retry generation.');}}
