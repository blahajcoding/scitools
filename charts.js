export const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
export const clamp = v => Math.max(0, Math.min(10, Number(v) || 0));
export function wrap(text, max = 26) {
  const lines = []; let line = '';
  for (const word of String(text).split(/\s+/)) {
    if (line && (line + ' ' + word).length > max) { lines.push(line); line = ''; }
    for (let i = 0; i < word.length; i += max) {
      const chunk = word.slice(i, i + max);
      if (i) { if (line) lines.push(line); line = chunk; }
      else line += (line ? ' ' : '') + chunk;
    }
  }
  if (line) lines.push(line);
  return lines.length ? lines : [''];
}
const textLines = (lines, x, y, size = 16, anchor = 'start', color = '#26343b') => `<text x="${x}" y="${y}" text-anchor="${anchor}" fill="${color}" font-family="Arial, sans-serif" font-size="${size}">${lines.map((s, i) => `<tspan x="${x}" dy="${i ? size * 1.4 : 0}">${esc(s)}</tspan>`).join('')}</text>`;
const svg = (w,h,body) => `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img">${body}</svg>`;
export function radarSVG(title, variables, experiments) {
  if (variables.length < 3) throw new Error('Add at least three variables');
  const n = variables.length;
  const series=experiments?.length?experiments:[{name:'Experiment 1',color:'#167b78',values:Object.fromEntries(variables.map((v,i)=>[v.id??i,v.value]))}];
  const color=e=>/^#[0-9a-f]{6}$/i.test(e.color)?e.color:'#167b78';
  const value=(e,v,i)=>clamp(e.values?.[v.id??i]);
  const dashes=['','9 4','3 3','12 4 3 4'];
  // Grow the chart rather than silently dropping axes or crowding labels.
  const labelLines = variables.map(v => wrap(v.label || 'Untitled', 22));
  const labelHeight = Math.max(...labelLines.map(lines => (lines.length + 1) * 23));
  const radius = Math.max(220, n * Math.max(17, labelHeight / (2 * Math.PI)));
  const longest = Math.max(...labelLines.flat().map(l => l.length));
  const margin = Math.max(200, longest * 9 + 60);
  const size = (radius + margin) * 2, cx = size / 2, cy = size / 2 + 30;
  const p = (i,r) => {const a = i * Math.PI * 2 / n - Math.PI / 2; return [cx + Math.cos(a)*r,cy + Math.sin(a)*r];};
  let out = `<rect width="100%" height="100%" fill="white"/>${textLines(wrap(title || 'Radar chart', 65), cx, 45, 24, 'middle')}`;
  for (let level = 2; level <= 10; level += 2) {
    out += `<polygon points="${variables.map((_,i) => p(i,radius*level/10).join(',')).join(' ')}" fill="none" stroke="#d9e0e4"/>`;
    out += textLines([String(level)],cx+8,cy-radius*level/10-5,12);
  }
  variables.forEach((v,i) => {
    const [x,y] = p(i,radius), [lx,ly] = p(i,radius+38);
    out += `<line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" stroke="#d9e0e4"/>`;
    const dx = lx-cx, anchor = Math.abs(dx)<1 ? 'middle' : dx>0 ? 'start' : 'end';
    out += textLines(series.length===1?[...labelLines[i], `${value(series[0],v,i).toFixed(1)} / 10`]:labelLines[i],lx,ly-(labelLines[i].length*18)/2,16,anchor);
  });
  series.forEach((e,j)=>{
    const c=color(e),dash=dashes[j%dashes.length];
    out+=`<polygon points="${variables.map((v,i)=>p(i,radius*value(e,v,i)/10).join(',')).join(' ')}" fill="${c}" fill-opacity="0.08" stroke="${c}" stroke-width="3" stroke-dasharray="${dash}"/>`;
    variables.forEach((v,i)=>{const [x,y]=p(i,radius*value(e,v,i)/10);out+=`<circle cx="${x}" cy="${y}" r="4" fill="${c}"><title>${esc(e.name||'Untitled experiment')}: ${esc(v.label)} = ${value(e,v,i)}</title></circle>`;});
  });
  let legendY=size+60;
  series.forEach((e,j)=>{
    const lines=wrap(e.name||'Untitled experiment',Math.max(20,Math.floor((size-240)/9)));
    out+=`<line x1="80" y1="${legendY-5}" x2="120" y2="${legendY-5}" stroke="${color(e)}" stroke-width="4" stroke-dasharray="${dashes[j%dashes.length]}"/>${textLines(lines,140,legendY,16)}`;
    legendY+=Math.max(36,lines.length*23+12);
  });
  return svg(size,legendY+28,out);
}
export function nodeHeight(node, includeResearch=true) {
  return 36 + wrap(node.title || 'Untitled',24).length*22 + (includeResearch ? wrap(node.notes || '',34).length*18 + (node.source ? wrap(node.source,34).length*16+12 : 0) : 0);
}
export function mapSVG(title,nodes,edges,{research=true}={}) {
  if (!nodes.length) return svg(800,500,'<rect width="100%" height="100%" fill="white"/>');
  const minX=Math.min(...nodes.map(n=>n.x))-50, minY=Math.min(...nodes.map(n=>n.y))-100;
  const maxX=Math.max(...nodes.map(n=>n.x+280))+50, maxY=Math.max(...nodes.map(n=>n.y+nodeHeight(n,research)))+50;
  let body=`<rect x="${minX}" y="${minY}" width="${maxX-minX}" height="${maxY-minY}" fill="white"/><defs><marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="#819198"/></marker></defs>${textLines(wrap(title||'Mind map',70),minX+30,minY+38,24)}`;
  edges.forEach(e=>{
    const a=nodes.find(n=>n.id===e.from),b=nodes.find(n=>n.id===e.to);if(!a||!b)return;
    const ax=a.x+140,ay=a.y+nodeHeight(a,research)/2,bx=b.x+140,by=b.y+nodeHeight(b,research)/2;
    const dx=bx-ax,dy=by-ay, ratio=Math.min(dx?140/Math.abs(dx):Infinity,dy?(nodeHeight(b,research)/2)/Math.abs(dy):Infinity);
    body+=`<line x1="${ax}" y1="${ay}" x2="${bx-dx*ratio}" y2="${by-dy*ratio}" stroke="#819198" stroke-width="2" marker-end="url(#arrow)"/>`;
  });
  nodes.forEach(n=>{
    const h=nodeHeight(n,research), lines=wrap(n.title||'Untitled',24);
    body+=`<rect x="${n.x}" y="${n.y}" width="280" height="${h}" rx="10" fill="${/^#[0-9a-f]{6}$/i.test(n.color)?n.color:'#e7f3ef'}" stroke="#b3c6c1"/>${textLines(lines,n.x+18,n.y+28,18)}`;
    if(research){let y=n.y+38+lines.length*22; const noteLines=wrap(n.notes||'',34); body+=textLines(noteLines,n.x+18,y,13);y+=noteLines.length*18+12;if(n.source)body+=textLines(wrap(n.source,34),n.x+18,y,11,'start','#426a70');}
  });
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${maxX-minX}" height="${maxY-minY}" viewBox="${minX} ${minY} ${maxX-minX} ${maxY-minY}" role="img">${body}</svg>`;
}
