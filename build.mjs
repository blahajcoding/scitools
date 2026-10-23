import {mkdir,copyFile} from 'node:fs/promises';
await mkdir('dist',{recursive:true});
for(const name of ['index.html','style.css','app.js','charts.js','map-tools.js','.nojekyll','favicon.svg','og.png'])await copyFile(name,`dist/${name}`);
console.log('Built static site in dist/');
