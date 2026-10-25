const {test}=require('node:test'),assert=require('node:assert/strict')
const fs=require('node:fs'),path=require('node:path'),ts=require('typescript'),vm=require('node:vm')
function library(initial={}){
 const entries=new Map(Object.entries(initial)),cache=new Map()
 const storage={getItem:k=>entries.get(k)??null,setItem:(k,v)=>entries.set(k,v),removeItem:k=>entries.delete(k)}
 const context=vm.createContext({localStorage:storage,window:{dispatchEvent(){},api:{}},CustomEvent:class{},Event:class{},DOMException,console,URL,Date,Math,Set,Map})
 function load(file){
  if(cache.has(file))return cache.get(file)
  const module={exports:{}}
  const code=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText
  const requireLocal=id=>{
   if(id==='./i18n')return {t:k=>k}
   if(id.endsWith('?raw'))return {default:fs.readFileSync(path.resolve(path.dirname(file),id.slice(0,-4)),'utf8')}
   return load(path.resolve(path.dirname(file),id+'.ts'))
  }
  vm.runInContext('(function(require,module,exports){'+code+'\n})',context,{filename:file})(requireLocal,module,module.exports)
  cache.set(file,module.exports);return module.exports
 }
 return {store:load(path.resolve(__dirname,'../src/renderer/src/store.ts')),entries}
}
test('发布预置保留 64 个网站，地址唯一且不含凭据或查询参数',()=>{
 const {store}=library();store.seedIfEmpty();store.seedFirmSites()
 const links=store.getLinks();assert.equal(links.length,64)
 assert.equal(new Set(links.map(l=>l.url)).size,64)
 for(const link of links){const u=new URL(link.url);assert.ok(['http:','https:'].includes(u.protocol));assert.equal(u.username+u.password+u.search+u.hash,'')}
 for(const host of ['www.google.com','drive.google.com','chatgpt.com','www.sanaa.co.jp'])assert.ok(links.some(l=>new URL(l.url).hostname===host))
 store.seedIfEmpty();store.seedFirmSites();assert.equal(store.getLinks().length,64)
})
test('首次卷轴只有三个原创示例，母子关系完整且图片全部内置',()=>{
 const {store}=library();store.seedPromptExamples()
 const prompts=store.getPrompts();assert.equal(prompts.length,3)
 const roots=prompts.filter(p=>!p.parentId);assert.equal(roots.length,2)
 for(const p of prompts){assert.ok(p.tags.includes('示例'));assert.match(p.image,/^data:image\/svg\+xml/);assert.ok(!p.parentId||roots.some(r=>r.id===p.parentId))}
 store.seedPromptExamples();assert.equal(store.getPrompts().length,3)
 store.removePrompt(roots[0].id);store.seedPromptExamples();assert.equal(store.getPrompts().length,1)
})
test('升级不覆盖既有卷轴，已清空的库不会重新填入示例',()=>{
 for(const saved of ['[]',JSON.stringify([{id:'private',text:'用户原有文字',tags:[],ts:9}])]){
  const {store,entries}=library({'musy.prompts':saved});store.seedPromptExamples()
  assert.equal(entries.get('musy.prompts'),saved)
 }
})
