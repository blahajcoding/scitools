export const experimentColors=['#2763c4','#c15228','#16816b','#9950a5','#a57b13','#c23c66','#287e99','#6c7440'];
export function ensureExperiments(state){
 if(state.experiments===undefined)state.experiments=[{id:'experiment-1',name:'Experiment 1',color:experimentColors[0],values:Object.fromEntries(state.variables.map(v=>[v.id,v.value]))}];
 if(!Array.isArray(state.experiments)||!state.experiments.length)throw Error('A chart must have at least one experiment');
 const ids=new Set();
 for(const e of state.experiments){
  if(!e||typeof e.id!=='string'||!e.id||ids.has(e.id)||typeof e.name!=='string'||!/^#[0-9a-f]{6}$/i.test(e.color)||!e.values||typeof e.values!=='object'||Array.isArray(e.values))throw Error('Invalid experiment data');
  ids.add(e.id);
  for(const v of state.variables){const n=e.values[v.id];if(!Number.isFinite(n)||n<0||n>10)throw Error('Experiment values must be between 0 and 10');}
 }
 return state;
}
export function addExperiment(state,id,source){
 const e={id,name:`Experiment ${state.experiments.length+1}`,color:experimentColors[state.experiments.length%experimentColors.length],values:Object.fromEntries(state.variables.map(v=>[v.id,source?.values[v.id]??5]))};
 state.experiments.push(e);return e;
}
export function addSharedVariable(state,v){state.variables.push(v);for(const e of state.experiments)e.values[v.id]=v.value??5;}
export function removeSharedVariable(state,id){if(state.variables.length<=3)return false;state.variables=state.variables.filter(v=>v.id!==id);for(const e of state.experiments)delete e.values[id];return true;}
