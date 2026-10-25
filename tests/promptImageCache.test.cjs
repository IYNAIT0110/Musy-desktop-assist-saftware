const {test}=require('node:test'),assert=require('node:assert/strict')
const fs=require('node:fs'),path=require('node:path'),Module=require('node:module'),ts=require('typescript')
function fixture(t){
 const old=global.Image,created=[]
 global.Image=class {constructor(){created.push(this);this.naturalWidth=100}set src(value){this.source=value}decode(){return new Promise(resolve=>{this.finishDecode=resolve})}}
 t.after(()=>{global.Image=old})
 const file=path.resolve(__dirname,'../src/renderer/src/promptImageCache.ts'),value=new Module(file,module);value.filename=file
 value._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText,file)
 return{api:value.exports,created}
}
test('相同图片只解码一次，只有像素准备就绪才允许切换',async t=>{
 const f=fixture(t);const first=f.api.decodePromptImage('image-a');assert.equal(first,f.api.decodePromptImage('image-a'));assert.equal(f.created.length,1)
 let ready=false;void first.then(()=>{ready=true});f.created[0].onload();await Promise.resolve();assert.equal(ready,false)
 f.created[0].finishDecode();assert.equal(await first,true);assert.equal(ready,true)
 assert.equal(await f.api.decodePromptImage('image-a'),true);assert.equal(f.created.length,1)
})
test('损坏图片不阻塞切换，失败缓存可重试，空预览不发起加载',async t=>{
 const f=fixture(t);assert.equal(await f.api.decodePromptImage(undefined),false);assert.equal(f.created.length,0)
 const failed=f.api.decodePromptImage('bad');f.created[0].onerror();assert.equal(await failed,false)
 const retry=f.api.decodePromptImage('bad');assert.equal(f.created.length,2);f.created[1].onload();f.created[1].finishDecode();assert.equal(await retry,true)
})
