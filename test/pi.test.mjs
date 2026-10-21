import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {invokePi} from '../src/pi.mjs';
test('Pi errors are handled even with a zero process exit; raw provider details stay private',async()=>{const dir=await fs.mkdtemp(path.join(os.tmpdir(),'rks-pi-'));const cli=path.join(dir,'pi');const old=process.env.PI_BINARY;process.env.PI_BINARY=cli;try{
 await fs.writeFile(cli,'#!/usr/bin/env node\nconsole.log(JSON.stringify({type:"message_end",message:{role:"assistant",stopReason:"error",errorMessage:"402 insufficient credits PRIVATE_DETAIL",content:[]}}));',{mode:0o700});
 await assert.rejects(invokePi({cwd:dir,prompt:'test',model:'provider/test'}),e=>/insufficient credits/.test(e.message)&&!e.message.includes('PRIVATE_DETAIL'));
 await fs.writeFile(cli,'#!/usr/bin/env node\nconsole.log(JSON.stringify({type:"message_end",message:{role:"assistant",stopReason:"stop",content:[{type:"text",text:"{\\"ok\\":true}"}]}}));',{mode:0o700});
 assert.equal(await invokePi({cwd:dir,prompt:'test',model:'provider/test'}),'{"ok":true}');
 }finally{if(old===undefined)delete process.env.PI_BINARY;else process.env.PI_BINARY=old;await fs.rm(dir,{recursive:true,force:true});}});
