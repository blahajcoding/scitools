// Uses Chrome already present on GitHub-hosted runners. No npm dependencies.
import {spawn} from 'node:child_process';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import assert from 'node:assert/strict';
const profile=await mkdtemp(join(tmpdir(),'scitools-chrome-'));
const server=spawn('python3',['-m','http.server','8145','--bind','127.0.0.1'],{stdio:'ignore'});
const chrome=spawn(process.env.CHROME_BIN||'google-chrome',['--headless','--no-sandbox','--disable-dev-shm-usage','--remote-debugging-port=9222',`--user-data-dir=${profile}`,'about:blank'],{stdio:'ignore'});
let launchError;chrome.on('error',e=>launchError=e);let socket;
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
try{
 let tabs;for(let i=0;i<100;i++){if(launchError)throw launchError;try{tabs=await(await fetch('http://127.0.0.1:9222/json/list')).json();if(tabs.some(t=>t.type==='page'))break;}catch{}await sleep(100);}
 if(!tabs)throw Error('Chrome did not start');
 socket=new WebSocket(tabs.find(t=>t.type==='page').webSocketDebuggerUrl);await new Promise((resolve,reject)=>{socket.onopen=resolve;socket.onerror=reject;});
 let id=0;const pending=new Map(),errors=[];
 socket.onmessage=({data})=>{const msg=JSON.parse(data);if(msg.method==='Runtime.exceptionThrown')errors.push(msg.params.exceptionDetails.text);if(msg.id){const p=pending.get(msg.id);pending.delete(msg.id);if(msg.error)p.reject(Error(msg.error.message));else p.resolve(msg.result);}};
 const send=(method,params={})=>new Promise((resolve,reject)=>{const key=++id;pending.set(key,{resolve,reject});socket.send(JSON.stringify({id:key,method,params}));});
 const evaluate=async expression=>{const r=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true,userGesture:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);return r.result.value;};
 await send('Runtime.enable');await send('Page.enable');await send('Emulation.setDeviceMetricsOverride',{width:1440,height:900,deviceScaleFactor:1,mobile:false});
 await send('Page.navigate',{url:'http://127.0.0.1:8145'});
 let loaded=false;for(let i=0;i<100;i++){if(await evaluate('document.querySelectorAll(".card").length===4')){loaded=true;break;}await sleep(100);}assert.ok(loaded,'app renders four starting ideas');
 assert.equal(await evaluate('getComputedStyle(document.body).backgroundColor'),'rgb(17, 17, 19)');
 assert.equal(await evaluate('document.querySelector("#map-viewport").getBoundingClientRect().height'),900);
 await evaluate('document.querySelector("#tool-hand").click()');assert.equal(await evaluate('document.querySelector("#tool-hand").getAttribute("aria-pressed")'),'true');
 await evaluate('document.querySelector("#tool-select").click();document.querySelector(".card h3").textContent="Edited on canvas";document.querySelector(".card h3").dispatchEvent(new InputEvent("input",{bubbles:true}))');
 assert.equal(await evaluate('JSON.parse(localStorage.getItem("scitools-v1")).nodes[0].title'),'Edited on canvas');
 await evaluate('document.querySelector(".branch-action").click()');assert.equal(await evaluate('document.querySelectorAll(".card").length'),5);
 await evaluate('document.querySelector("#undo").click()');assert.equal(await evaluate('document.querySelectorAll(".card").length'),4);
 await evaluate('document.querySelector("#redo").click()');assert.equal(await evaluate('document.querySelectorAll(".card").length'),5);
 await evaluate('document.querySelector("#tool-select").click();document.querySelectorAll("#node-list button")[1].click();document.querySelector("#tool-link").click();document.querySelectorAll(".card")[2].dispatchEvent(new PointerEvent("pointerdown",{bubbles:true,button:0}))');
 assert.equal(await evaluate('JSON.parse(localStorage.getItem("scitools-v1")).edges.length'),5);
 await evaluate('document.querySelector("#close-properties").click()');assert.equal(await evaluate('getComputedStyle(document.querySelector("#properties")).display'),'none');
 await evaluate('document.querySelector("#toggle-properties").click()');assert.notEqual(await evaluate('getComputedStyle(document.querySelector("#properties")).display'),'none');
 await evaluate('document.querySelector(".swatch").click()');assert.equal(await evaluate('document.querySelector("#node-color").value'),'#f1f1f3');
 await evaluate('document.querySelector("[data-tool=radar]").click()');assert.equal(await evaluate('document.querySelectorAll("#radar-preview circle").length'),5);
 await evaluate('document.querySelector("#add-variable").click()');assert.equal(await evaluate('document.querySelectorAll("#radar-preview circle").length'),6);
 await evaluate('(()=>{const n=document.querySelector(".variable-value input[type=number]");n.value="7.3";n.dispatchEvent(new InputEvent("input",{bubbles:true}));})()');assert.ok(await evaluate('document.querySelector("#radar-preview").textContent.includes("7.3 / 10")'));
 // Experiments share labels but retain independent decimal values and colours.
 await evaluate('document.querySelector("#add-experiment").click()');assert.equal(await evaluate('document.querySelectorAll("#radar-preview circle").length'),12);
 await evaluate('(()=>{const n=document.querySelector("#experiment-name");n.value="Treatment B";n.dispatchEvent(new InputEvent("input",{bubbles:true}));const v=document.querySelector(".variable-value input[type=number]");v.value="2.65";v.dispatchEvent(new InputEvent("input",{bubbles:true}));const c=document.querySelector("#experiment-color");c.value="#aa3399";c.dispatchEvent(new InputEvent("input",{bubbles:true}));})()');
 assert.ok(await evaluate('document.querySelector("#radar-preview").textContent.includes("Treatment B")'));
 assert.equal(await evaluate('JSON.parse(localStorage.getItem("scitools-v1")).experiments[0].values.v1'),7.3);
 assert.equal(await evaluate('JSON.parse(localStorage.getItem("scitools-v1")).experiments[1].values.v1'),2.65);
 assert.equal(await evaluate('JSON.parse(localStorage.getItem("scitools-v1")).experiments[1].color'),'#aa3399');
 await evaluate('(()=>{const s=document.querySelector("#experiment-select");s.selectedIndex=0;s.dispatchEvent(new Event("change",{bubbles:true}));})()');assert.equal(await evaluate('Number(document.querySelector(".variable-value input[type=number]").value)'),7.3);
 await evaluate('document.querySelector("#add-variable").click()');assert.equal(await evaluate('document.querySelectorAll("#radar-preview circle").length'),14);
 assert.ok(await evaluate('(()=>{const s=JSON.parse(localStorage.getItem("scitools-v1"));const id=s.variables.at(-1).id;return s.experiments.every(e=>e.values[id]===5);})()'));
 await evaluate('document.querySelector(".variable-head input").value="Shared axis";document.querySelector(".variable-head input").dispatchEvent(new InputEvent("input",{bubbles:true}))');assert.ok(await evaluate('document.querySelector("#radar-preview").textContent.includes("Shared axis")'));
 // Exercise real SVG decoding and canvas PNG encoding without relying on downloads.
 assert.equal(await evaluate('(async()=>{const svg=document.querySelector("#radar-preview svg").outerHTML;const u=URL.createObjectURL(new Blob([svg],{type:"image/svg+xml"}));try{const i=new Image();i.src=u;await i.decode();const c=document.createElement("canvas");c.width=1200;c.height=1200;c.getContext("2d").drawImage(i,0,0,1200,1200);const b=await new Promise(r=>c.toBlob(r,"image/png"));return b.type;}finally{URL.revokeObjectURL(u);}})()'),'image/png');
 await evaluate('document.querySelector("[data-tool=map]").click()');
 await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});await sleep(100);
 assert.ok(await evaluate('document.querySelector(".tool-dock").getBoundingClientRect().right<=390'));
 assert.equal(await evaluate('document.documentElement.scrollWidth'),390);
 assert.deepEqual(errors,[],'no unhandled browser exceptions');
 console.log('Chrome smoke tests passed: dark layout, tools, inline editing, branching, undo/redo, linking, inspector, colours, radar decimals, PNG encoding and mobile dock');
}finally{socket?.close();chrome.kill();server.kill();await sleep(250);await rm(profile,{recursive:true,force:true});}
