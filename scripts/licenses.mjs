import { readFile } from 'node:fs/promises';
export async function noticesFor(packages) {
  let notices='# Drittanbieter-Lizenzen\n\nDie folgenden Bibliotheken werden im Plugin oder in der lokalen Profilvorbereitung verwendet. Entwicklungsabhängigkeiten sind im package-lock.json nachvollziehbar.\n';
  for(const pkg of packages){
    const root='node_modules/'+pkg;const metadata=JSON.parse(await readFile(root+'/package.json','utf8'));
    let license='';for(const file of ['LICENSE','LICENSE.md','LICENSE.txt'])try{license=await readFile(root+'/'+file,'utf8');break;}catch{}
    notices+=`\n## ${pkg} ${metadata.version}\n\n${license||'Lizenz: '+metadata.license+'; Paketquelle: '+JSON.stringify(metadata.repository)}\n`;
  }
  return notices;
}
