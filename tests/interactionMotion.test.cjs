const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs'), path = require('node:path'), Module = require('node:module'), ts = require('typescript')
function load(file, mocks = {}) {
 const source=path.resolve(__dirname,'..',file), value=new Module(source,module)
 value.filename=source;value.paths=Module._nodeModulePaths(path.dirname(source))
 const original=value.require.bind(value)
 value.require=name=>Object.hasOwn(mocks,name)?mocks[name]:original(name)
 value._compile(ts.transpileModule(fs.readFileSync(source,'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText,source)
 return value.exports
}
function hooks() {
 const slots=[],cleanups=[]; let index=0
 return { reset(){index=0}, dispose(){cleanups.forEach(fn=>fn?.())}, react:{
   useRef(initial){const at=index++;return slots[at]??(slots[at]={current:initial})},
   useState(initial){const at=index++;if(!(at in slots))slots[at]=initial;return[slots[at],next=>{slots[at]=next}]},
   useEffect(effect){const at=index++;if(!(at in slots)){slots[at]=true;cleanups.push(effect())}}
 } }
}
test('磁吸偏移限于 4px，中心不移动；卡片展开保持等比缩放',()=>{
 const api=load('src/renderer/src/interactionMotion.ts',{'react':{}})
 const rect={left:10,top:20,width:40,height:40}
 assert.deepEqual(api.magneticOffset(rect,30,40),{x:0,y:0})
 assert.deepEqual(api.magneticOffset(rect,1000,-1000),{x:4,y:-4})
 assert.equal(api.expansionTransform({left:10,top:20,width:100,height:100},{left:0,top:0,width:500,height:400}),'translate3d(-190px,-130px,0) scale(0.2)')
})
function buttons(t) {
 const h=hooks()
 const api=load('src/renderer/src/components/InteractionMotion.tsx',{
  'react':h.react,'./HoverFeedback':{InteractiveButton:'button'},'../i18n':{tx:value=>value,useLang(){}},'../interactionMotion':{magneticOffset:()=>({x:4,y:2}),prefersReducedMotion:()=>false},'./interaction-motion.css':{}
 })
 const render=props=>{h.reset();return api.StateButton({children:'Save',...props})}
 t.after(()=>h.dispose())
 return {api,h,render}
}
test('状态按钮防止重复提交，只在成功后打勾，取消不显示成功',async t=>{
 const {render}=buttons(t)
 let finish,calls=0
 const props={onAction:()=>{calls++;return new Promise(resolve=>{finish=resolve})}}
 let node=render(props);const running=node.props.onClick({})
 await node.props.onClick({});assert.equal(calls,1)
 node=render(props);assert.equal(node.props['aria-busy'],true);assert.equal(node.props.disabled,true)
 finish(true);await running;node=render(props);assert.equal(node.props['data-phase'],'success')
 await render({onAction:()=>false}).props.onClick({});assert.equal(render({}).props['data-phase'],'idle')
 await render({onAction:()=>{throw Error('disk full')}}).props.onClick({});assert.equal(render({}).props['data-phase'],'error')
})
test('表单只执行一次动作，外部 pending 保持真实忙碌状态',async t=>{
 const {render}=buttons(t);let prevented=0,calls=0
 await render({type:'submit',onAction:()=>{calls++;return true}}).props.onClick({preventDefault(){prevented++}})
 assert.equal(prevented,1);assert.equal(calls,1)
 const node=render({pending:true});assert.equal(node.props['data-phase'],'busy');assert.equal(node.props.disabled,true)
})
test('卡片收回被快速切换打断时，不会关闭新详情；减少动态效果立即退出',async t=>{
 const old={window:global.window,requestAnimationFrame:global.requestAnimationFrame,cancelAnimationFrame:global.cancelAnimationFrame}
 t.after(()=>Object.assign(global,old))
 let reduced=false,cleanup,pending,closed=0
 const slots=[];let index=0
 global.window={innerHeight:900,matchMedia:()=>({matches:reduced,addEventListener(){},removeEventListener(){}})}
 global.requestAnimationFrame=()=>1;global.cancelAnimationFrame=()=>{}
 const api=load('src/renderer/src/interactionMotion.ts',{'react':{
   useRef(value){const at=index++;return slots[at]??(slots[at]={current:value})},
   useLayoutEffect(effect){cleanup=effect()}
 }})
 const node={getBoundingClientRect:()=>({left:0,top:0,width:500,height:400}),animate(){let resolve;const finished=new Promise(r=>{resolve=r});pending={finished,cancel:()=>resolve()};return pending}}
 const ref={current:node};let close=api.useCardExpansion('first',ref)
 const first=close(()=>{closed++});cleanup();index=0;close=api.useCardExpansion('second',ref);await first;assert.equal(closed,0)
 reduced=true;await close(()=>{closed++});assert.equal(closed,1);cleanup()
})
