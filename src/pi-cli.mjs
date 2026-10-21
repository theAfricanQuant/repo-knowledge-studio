import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=fileURLToPath(new URL('..',import.meta.url));
const command=path.join(root,'node_modules','.bin',process.platform==='win32'?'pi.cmd':'pi');
const child=spawn(command,process.argv.slice(2),{cwd:root,stdio:'inherit',env:{...process.env,PI_CODING_AGENT_DIR:path.join(root,'.state','pi'),PI_TELEMETRY:'0'}});
child.on('error',()=>{console.error('Project-local Pi is unavailable. Run npm install first.');process.exitCode=1;});
child.on('exit',code=>{process.exitCode=code??1;});
