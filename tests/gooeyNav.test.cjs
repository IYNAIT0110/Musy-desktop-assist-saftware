const {test}=require('node:test'),assert=require('node:assert/strict')
const fs=require('node:fs'),path=require('node:path'),Module=require('node:module'),ts=require('typescript')
function load(file,mocks={}){
 const filename=path.resolve(__dirname,'..',file),value=new Module(filename,module);value.filename=filename;value.paths=Module._nodeModulePaths(path.dirname(filename));const original=value.require.bind(value)
 value.require=name=>Object.hasOwn(mocks,name)?mocks[name]:original(name)
 value._compile(ts.transpileModule(fs.readFileSync(filename,'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText,filename)
 return value.exports
}
test('截图参数完整保留，五个图标和中等边框可在二级窗口内完整容纳',()=>{
 const settings=load('src/renderer/src/gooeyNavSettings.ts').GOOEY_NAV_SETTINGS
 assert.deepEqual(settings,{color:'#f4f4f5',size:'md',frame:true,hoverEffect:true,particleCount:5,spread:56,animationTime:600,timeVariance:350,gooeyness:.7,wobble:.5})
 assert.equal(66+5*40+4*6+2*6+10,312)
})
function fixture(t){
 const old={window:global.window,document:global.document,ResizeObserver:global.ResizeObserver,requestAnimationFrame:global.requestAnimationFrame,cancelAnimationFrame:global.cancelAnimationFrame}
 const mediaEvents=new Map(),effects=[],cleanups=[],refs=[],deps=[];let at=0,effectAt=0
 global.window={devicePixelRatio:1,matchMedia:()=>({matches:false,addEventListener:(event,fn)=>mediaEvents.set(event,fn),removeEventListener:event=>mediaEvents.delete(event)})}
 global.document={fonts:{ready:Promise.resolve()}}
 global.ResizeObserver=class{observe(){}disconnect(){}}
 global.requestAnimationFrame=()=>1;global.cancelAnimationFrame=()=>{}
 const schedule=(fn,next)=>{const i=effectAt++;if(!deps[i]||next.some((value,j)=>value!==deps[i][j])){deps[i]=next;effects.push(()=>{cleanups[i]?.();cleanups[i]=fn()})}}
 const react={useState:()=>[0,()=>{}],useRef:value=>refs[at++]??(refs[at-1]={current:value}),useLayoutEffect:schedule,useEffect:schedule}
 const api=load('src/renderer/src/components/GooeyNav.tsx',{'react':react,'./HoverFeedback':{InteractiveButton:'button'},'./GooeyNav.css':{}}).default
 const style=()=>({}),rect=(x,w=40)=>({left:x,top:0,width:w,height:40}),events=new Map()
 const list={style:style(),children:Array.from({length:5},(_,i)=>({getBoundingClientRect:()=>rect(i*46)})),addEventListener:(name,fn)=>events.set(name,fn),removeEventListener:name=>events.delete(name)}
 const stage={getBoundingClientRect:()=>rect(0,224)},canvas={style:style(),getContext:()=>null},overlay={style:style()},fallback={style:style()}
 const items=Array.from({length:5},(_,i)=>({icon:'Icon '+i,ariaLabel:'Feature '+i,title:'Hint '+i}))
 const changes=[]
 const render=(activeIndex=0,inactive=false)=>{
  at=0;effectAt=0
  const tree=api({items,activeIndex,inactive,onChange:index=>changes.push(index)})
  refs[0].current=stage;refs[1].current=canvas;refs[2].current=list;refs[3].current=overlay;refs[4].current=fallback
  while(effects.length)effects.shift()()
  return tree
 }
 t.after(()=>{cleanups.forEach(fn=>fn?.());Object.assign(global,old)})
 return{render,changes,fallback,canvas,mediaEvents}
}
const links=tree=>tree.props.children[1].props.children[2].props.children
test('五个功能均可立即切换；第一个功能可从未选中状态打开',t=>{
 const f=fixture(t);let tree=f.render(0,true),prevented=0
 links(tree)[0].props.children.props.onClick({preventDefault(){prevented++}})
 assert.deepEqual(f.changes,[0]);assert.equal(prevented,1)
 tree=f.render(0,false)
 for(let i=1;i<5;i++)links(tree)[i].props.children.props.onClick({preventDefault(){}})
 assert.deepEqual(f.changes,[0,1,2,3,4])
 tree=f.render(4,false);const last=links(tree)[4].props.children
 assert.equal(last.props['aria-label'],'Feature 4');assert.equal(last.props['aria-current'],'page')
 assert.match(f.fallback.style.transform,/184\.00px/)
})
test('没有 WebGL 时仍显示正确选中项，减少动态效果可即时生效',t=>{
 const f=fixture(t);f.render(2,false)
 assert.equal(f.canvas.style.display,'none');assert.equal(f.fallback.style.display,'block')
 assert.match(f.fallback.style.transform,/92\.00px/)
 f.mediaEvents.get('change')();assert.match(f.fallback.style.transform,/92\.00px/)
})
