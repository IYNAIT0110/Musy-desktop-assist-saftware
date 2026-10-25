const fs=require('node:fs'),path=require('node:path'),{spawnSync}=require('node:child_process')
const root=path.resolve(__dirname,'..')
const files=fs.readdirSync(path.join(root,'tests')).filter(n=>n.endsWith('.test.cjs')).sort().map(n=>path.join(root,'tests',n))
const result=spawnSync(process.execPath,['--test',...files],{stdio:'inherit',cwd:root,windowsHide:true})
if(result.error)console.error(result.error)
process.exitCode=result.status??1
