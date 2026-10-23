export function branchPosition(parent, nodes, width = 240) {
  const x = parent.x + width + 100;
  let y = parent.y;
  while (nodes.some(n => Math.abs(n.x - x) < width + 24 && Math.abs(n.y - y) < 200)) y += 220;
  return {x, y};
}
export function connect(nodes, edges, from, to) {
  if (from === to || !nodes.some(n => n.id === from) || !nodes.some(n => n.id === to) || edges.some(e => e.from === from && e.to === to)) return false;
  edges.push({from,to});
  return true;
}
export function curveBetween(a, b) {
  const ax=a.x+a.width/2, ay=a.y+a.height/2, bx=b.x+b.width/2, by=b.y+b.height/2;
  const dx=bx-ax, dy=by-ay;
  if (!dx && !dy) return '';
  const start=Math.min(dx?a.width/2/Math.abs(dx):Infinity,dy?a.height/2/Math.abs(dy):Infinity);
  const end=Math.min(dx?b.width/2/Math.abs(dx):Infinity,dy?b.height/2/Math.abs(dy):Infinity);
  const x1=ax+dx*start,y1=ay+dy*start,x2=bx-dx*end,y2=by-dy*end;
  const mx=(x1+x2)/2;
  return `M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}`;
}
export class History {
  constructor(initial,limit=100){this.current=JSON.stringify(initial);this.past=[];this.future=[];this.limit=limit;}
  record(state){const next=JSON.stringify(state);if(next===this.current)return;this.past.push(this.current);if(this.past.length>this.limit)this.past.shift();this.current=next;this.future=[];}
  undo(){if(!this.past.length)return null;this.future.push(this.current);this.current=this.past.pop();return JSON.parse(this.current);}
  redo(){if(!this.future.length)return null;this.past.push(this.current);this.current=this.future.pop();return JSON.parse(this.current);}
}
