import {esc,clamp,radarSVG,mapSVG} from './charts.js';
const $=s=>document.querySelector(s), uid=()=>crypto.randomUUID();
const defaults=()=>({version:1,mapTitle:'How do green spaces affect wellbeing?',radarTitle:'Research profile',nodes:[{id:'a',title:'Green spaces & wellbeing',notes:'How does access to nature influence daily life?',source:'',x:380,y:210,color:'#e1eee4'},{id:'b',title:'Physical health',notes:'Look at activity levels and time spent outdoors.',source:'Add a paper or reference here',x:60,y:70,color:'#f4edda'},{id:'c',title:'Mental wellbeing',notes:'Explore stress, attention and connection to place.',source:'',x:720,y:85,color:'#e6ecf4'},{id:'d',title:'Next questions',notes:'Does proximity matter more than the size of a park?',source:'',x:630,y:420,color:'#f0e6e8'}],edges:[{from:'a',to:'b'},{from:'a',to:'c'},{from:'c',to:'d'}],variables:[{id:'v1',label:'Evidence quality',value:7.5},{id:'v2',label:'Accessibility',value:8},{id:'v3',label:'Impact',value:6.2},{id:'v4',label:'Feasibility',value:8.5},{id:'v5',label:'Originality',value:5.5}]});
let state=defaults(),tool='map',selected='a',zoom=1,timer;
function toast(s){$('#toast').textContent=s;$('#toast').hidden=false;clearTimeout(timer);timer=setTimeout(()=>$('#toast').hidden=true,4500);}
function validate(s){
 if(!s||s.version!==1||!Array.isArray(s.nodes)||!Array.isArray(s.edges)||!Array.isArray(s.variables)||s.variables.length<3)throw Error('This is not a valid scitools project');
 const str=v=>typeof v==='string';
 if(!str(s.mapTitle)||!str(s.radarTitle)||s.nodes.some(n=>!str(n.id)||!str(n.title)||!str(n.notes)||!str(n.source)||!str(n.color)||!Number.isFinite(n.x)||!Number.isFinite(n.y)||n.x<0||n.y<0)||s.variables.some(v=>!str(v.id)||!str(v.label)||!Number.isFinite(v.value)||v.value<0||v.value>10))throw Error('Some project data is invalid');
 const ids=new Set(s.nodes.map(n=>n.id));if(ids.size!==s.nodes.length||new Set(s.variables.map(v=>v.id)).size!==s.variables.length||s.edges.some(e=>!ids.has(e.from)||!ids.has(e.to)||e.from===e.to))throw Error('Invalid connections or duplicate IDs');
 return s;
}
try{const saved=localStorage.getItem('scitools-v1');if(saved)state=validate(JSON.parse(saved));}catch{toast('Could not restore saved work. Open a project backup if you have one.');}
selected=state.nodes[0]?.id;
function save(){try{localStorage.setItem('scitools-v1',JSON.stringify(state));$('#save-status').textContent='Saved on this device';}catch{$('#save-status').textContent='Not saved · download a backup';toast('Browser storage is unavailable or full. Use Save project to keep your work.');}}
function current(){return state.nodes.find(n=>n.id===selected);}
function render(){
 const isMap=tool==='map';
 document.querySelectorAll('.tab').forEach(b=>{b.classList.toggle('active',b.dataset.tool===tool);b.setAttribute('aria-pressed',b.dataset.tool===tool);});
 for(const id of ['map-controls','map-viewport','map-view-buttons'])$('#'+id).hidden=!isMap;
 for(const id of ['radar-controls','radar-preview','radar-caption'])$('#'+id).hidden=isMap;
 $('#tool-number').textContent=isMap?'01 / THINK IN CONNECTIONS':'02 / COMPARE AT A GLANCE';
 $('#heading').textContent=isMap?'A little room for big ideas':'Give your data a shape';
 $('#description').textContent=isMap?'Connect your thoughts. Keep the research attached.':'Turn your variables into a clear, labelled radar chart.';
 $('#document-title').value=isMap?state.mapTitle:state.radarTitle;
 $('#canvas-caption').textContent=isMap?'MIND MAP':'RADAR CHART';
 if(isMap){renderList();renderEditor();renderMap();}else{renderVariables();renderRadar();}
}
function renderList(){const list=$('#node-list');list.replaceChildren();state.nodes.forEach(n=>{const b=document.createElement('button');b.textContent=n.title||'Untitled';b.className=n.id===selected?'selected':'';b.onclick=()=>{selected=n.id;renderList();renderEditor();renderMap();};list.append(b);});}
function renderEditor(){const n=current();$('#node-editor').hidden=!n;if(!n)return;
 $('#node-title').value=n.title;$('#node-notes').value=n.notes;$('#node-source').value=n.source;$('#node-color').value=n.color;
 const targets=state.nodes.filter(x=>x.id!==n.id&&!state.edges.some(e=>e.from===n.id&&e.to===x.id));
 $('#link-target').replaceChildren(...targets.map(x=>new Option(x.title||'Untitled',x.id)));$('#add-link').disabled=!targets.length;
 $('#connections').replaceChildren();state.edges.forEach((e,i)=>{if(e.from!==n.id&&e.to!==n.id)return;const other=state.nodes.find(x=>x.id===(e.from===n.id?e.to:e.from));const row=document.createElement('div');row.className='connection';const text=document.createElement('span');text.textContent=(e.from===n.id?'→ ':'← ')+(other?.title||'Untitled');const b=document.createElement('button');b.type='button';b.textContent='×';b.setAttribute('aria-label','Remove connection');b.onclick=()=>{state.edges.splice(i,1);save();renderEditor();renderMap();};row.append(text,b);$('#connections').append(row);});
}
function renderMap(){
 const cards=$('#map-cards');cards.replaceChildren();
 state.nodes.forEach(n=>{const card=document.createElement('div');card.className='card'+(n.id===selected?' selected':'');card.style.cssText=`left:${n.x}px;top:${n.y}px;background:${/^#[0-9a-f]{6}$/i.test(n.color)?n.color:'#e7f3ef'}`;card.tabIndex=0;card.setAttribute('role','button');card.setAttribute('aria-label',`Edit ${n.title||'Untitled'}`);
 card.innerHTML=`<h3>${esc(n.title||'Untitled')}</h3><p>${esc(n.notes)}</p>${n.source?`<p class="reference">↗ ${esc(n.source)}</p>`:''}`;
 card.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();selected=n.id;renderList();renderEditor();renderMap();}};
 card.onpointerdown=e=>{if(e.button!==0)return;selected=n.id;renderList();renderEditor();cards.querySelectorAll('.card').forEach(c=>c.classList.toggle('selected',c===card));const sx=e.clientX,sy=e.clientY,ox=n.x,oy=n.y;card.setPointerCapture(e.pointerId);
 card.onpointermove=ev=>{n.x=Math.max(0,ox+(ev.clientX-sx)/zoom);n.y=Math.max(0,oy+(ev.clientY-sy)/zoom);card.style.left=n.x+'px';card.style.top=n.y+'px';drawEdges();};
 const end=()=>{card.onpointermove=null;card.onpointerup=null;card.onpointercancel=null;save();drawEdges();};card.onpointerup=end;card.onpointercancel=end;};cards.append(card);});
 drawEdges();$('#count').textContent=`${state.nodes.length} ideas · ${state.edges.length} connections`;
}
function drawEdges(){const w=Math.max(1400,...state.nodes.map(n=>n.x+400)),h=Math.max(900,...state.nodes.map(n=>n.y+500));$('#map-world').style.width=w+'px';$('#map-world').style.height=h+'px';
 $('#map-edges').innerHTML='<defs><marker id="live-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10Z" fill="#91a79a"/></marker></defs>'+state.edges.map(e=>{const a=state.nodes.find(n=>n.id===e.from),b=state.nodes.find(n=>n.id===e.to);if(!a||!b)return '';return `<path d="M${a.x+120},${a.y+45} Q${(a.x+b.x)/2+120},${a.y+45} ${b.x+120},${b.y+5}" fill="none" stroke="#91a79a" stroke-width="2" marker-end="url(#live-arrow)"/>`;}).join('');}
function renderVariables(){const list=$('#variable-list');list.replaceChildren();state.variables.forEach((v,i)=>{const row=document.createElement('div');row.className='variable';row.innerHTML=`<div class="variable-head"><input aria-label="Variable ${i+1} label" value="${esc(v.label)}" maxlength="160"><button aria-label="Remove variable ${i+1}" ${state.variables.length<=3?'disabled':''}>×</button></div><div class="variable-value"><input type="range" min="0" max="10" step="0.1" value="${v.value}" aria-label="${esc(v.label)} slider"><input type="number" min="0" max="10" step="0.1" value="${v.value}" aria-label="${esc(v.label)} value"></div>`;
 const [label,slider,number]=row.querySelectorAll('input');label.oninput=()=>{v.label=label.value;slider.setAttribute('aria-label',v.label+' slider');number.setAttribute('aria-label',v.label+' value');save();renderRadar();};slider.oninput=()=>{v.value=clamp(slider.value);number.value=v.value;save();renderRadar();};number.oninput=()=>{if(number.value===''||!Number.isFinite(number.valueAsNumber))return;v.value=clamp(number.value);slider.value=v.value;save();renderRadar();};number.onchange=()=>{number.value=v.value;};row.querySelector('button').onclick=()=>{state.variables.splice(i,1);save();renderVariables();renderRadar();};list.append(row);});}
function renderRadar(){$('#radar-preview').innerHTML=radarSVG(state.radarTitle,state.variables);$('#count').textContent=`${state.variables.length} labelled variables · 0–10 scale`;}
function setZoom(z){zoom=Math.min(2,Math.max(.2,z));$('#map-world').style.transform=`scale(${zoom})`;$('#zoom-label').textContent=Math.round(zoom*100)+'%';}
$('.tab');document.querySelectorAll('.tab').forEach(b=>b.onclick=()=>{tool=b.dataset.tool;render();});
$('#document-title').oninput=e=>{state[tool==='map'?'mapTitle':'radarTitle']=e.target.value;save();if(tool==='radar')renderRadar();};
$('#add-node').onclick=()=>{const n={id:uid(),title:'New idea',notes:'',source:'',x:Math.max(20,$('#map-viewport').scrollLeft/zoom+80+Math.random()*150),y:Math.max(20,$('#map-viewport').scrollTop/zoom+80+Math.random()*150),color:'#e7f3ef'};state.nodes.push(n);selected=n.id;save();render();$('#node-title').focus();$('#node-title').select();};
for(const [id,key] of [['node-title','title'],['node-notes','notes'],['node-source','source'],['node-color','color']])$('#'+id).oninput=e=>{if(!current())return;current()[key]=e.target.value;save();renderList();renderMap();};
$('#node-editor').onsubmit=e=>e.preventDefault();
$('#add-link').onclick=()=>{const to=$('#link-target').value;if(!to||!current())return;state.edges.push({from:selected,to});save();renderEditor();renderMap();};
$('#delete-node').onclick=()=>{if(!current()||!confirm('Delete this idea and its connections?'))return;state.nodes=state.nodes.filter(n=>n.id!==selected);state.edges=state.edges.filter(e=>e.from!==selected&&e.to!==selected);selected=state.nodes[0]?.id;save();render();};
$('#add-variable').onclick=()=>{state.variables.push({id:uid(),label:`Variable ${state.variables.length+1}`,value:5});save();renderVariables();renderRadar();$('#variable-list').lastElementChild.querySelector('input').focus();};
$('#zoom-in').onclick=()=>setZoom(zoom+.1);$('#zoom-out').onclick=()=>setZoom(zoom-.1);$('#fit-map').onclick=()=>{if(!state.nodes.length)return;const vp=$('#map-viewport');const minX=Math.min(...state.nodes.map(n=>n.x)),minY=Math.min(...state.nodes.map(n=>n.y)),maxX=Math.max(...state.nodes.map(n=>n.x+280)),maxY=Math.max(...state.nodes.map(n=>n.y+260));setZoom(Math.min(vp.clientWidth/(maxX-minX+80),vp.clientHeight/(maxY-minY+80),1));vp.scrollLeft=Math.max(0,(minX-30)*zoom);vp.scrollTop=Math.max(0,(minY-30)*zoom);};
function download(blob,name){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);}
const filename=()=>((tool==='map'?state.mapTitle:state.radarTitle)||'scitools').replace(/[^a-z0-9-_]+/gi,'-').slice(0,80);
function exportSVG(){let s=tool==='map'?mapSVG(state.mapTitle,state.nodes,state.edges,{research:$('#include-research').checked}):radarSVG(state.radarTitle,state.variables);if($('#transparent').checked)s=s.replace(/<rect\b[^>]*fill="white"[^>]*\/>/,'');return s;}
$('#export-svg').onclick=()=>{download(new Blob([exportSVG()],{type:'image/svg+xml'}),filename()+'.svg');toast('SVG exported. Text and lines stay crisp at any size.');};
$('#export-png').onclick=async()=>{const button=$('#export-png');button.disabled=true;try{const s=exportSVG(),doc=new DOMParser().parseFromString(s,'image/svg+xml'),root=doc.documentElement,w=Number(root.getAttribute('width')),h=Number(root.getAttribute('height'));let scale=Number($('#resolution').value);scale=Math.min(scale,Math.sqrt(32000000/(w*h)),16000/w,16000/h);const url=URL.createObjectURL(new Blob([s],{type:'image/svg+xml'}));try{const img=new Image();img.src=url;await img.decode();const canvas=document.createElement('canvas');canvas.width=Math.ceil(w*scale);canvas.height=Math.ceil(h*scale);const ctx=canvas.getContext('2d');if(!ctx)throw Error('Canvas is unavailable');ctx.drawImage(img,0,0,canvas.width,canvas.height);const blob=await new Promise(r=>canvas.toBlob(r,'image/png'));if(!blob)throw Error('Could not generate the image');download(blob,filename()+'.png');toast(`PNG exported · ${canvas.width} × ${canvas.height} pixels${scale<Number($('#resolution').value)?' · size adjusted for browser limits':''}`);}finally{URL.revokeObjectURL(url);}}catch(e){toast('PNG export failed. Try SVG instead. '+e.message);}finally{button.disabled=false;}};
$('#backup').onclick=()=>download(new Blob([JSON.stringify(state,null,2)],{type:'application/json'}),'scitools-project.json');$('#restore').onclick=()=>$('#file').click();$('#file').onchange=async e=>{const file=e.target.files[0];if(!file)return;try{if(file.size>10000000)throw Error('Project file is too large');const next=validate(JSON.parse(await file.text()));if(!confirm('Replace your current work with this project?'))return;state=next;selected=state.nodes[0]?.id;save();render();toast('Project opened');}catch(err){toast(err.message);}finally{e.target.value='';}};
render();
