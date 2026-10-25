const {test}=require('node:test')
const assert=require('node:assert/strict')
const fs=require('node:fs'),path=require('node:path'),Module=require('node:module'),ts=require('typescript')
function load(){
 const file=path.resolve(__dirname,'../src/renderer/src/buttonRipple.ts'),value=new Module(file,module)
 value.filename=file;value.paths=Module._nodeModulePaths(path.dirname(file))
 value._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText,file)
 return value.exports
}
test('水波起点按实际点击位置计算，四角均被覆盖；键盘从中心扩散',()=>{
 const {rippleGeometry}=load(),rect={left:10,top:20,width:100,height:40}
 assert.deepEqual(rippleGeometry(rect,{x:10,y:20}),{x:0,y:0,diameter:2*Math.hypot(100,40)})
 const centered=rippleGeometry(rect);assert.equal(centered.x,50);assert.equal(centered.y,20)
 assert.equal(centered.diameter,2*Math.hypot(50,20))
 assert.equal(rippleGeometry(rect,{x:-20,y:999}).y,40)
})
function fixture(t){
 const old={window:global.window,document:global.document,Element:global.Element,getComputedStyle:global.getComputedStyle,requestAnimationFrame:global.requestAnimationFrame,cancelAnimationFrame:global.cancelAnimationFrame}
 const events=new Map(),mediaEvents=new Map(),frames=new Map(),animations=[];let next=0
 const media={matches:false,addEventListener:(name,fn)=>mediaEvents.set(name,fn),removeEventListener:name=>mediaEvents.delete(name)}
 class Element{
  constructor(tag='button'){this.tag=tag;this.style={};this.attrs={};this.children=[];this.isConnected=tag==='button';this.rect={left:10,top:20,width:100,height:40};this.color='rgb(240, 240, 240)'}
  getBoundingClientRect(){return {...this.rect,right:this.rect.left+this.rect.width,bottom:this.rect.top+this.rect.height}}
  closest(selector){if(selector==='button')return this.tag==='button'?this:this.parent?.closest(selector)??null;return this.attrs[selector]?this:null}
  getAttribute(name){return this.attrs[name]??null}
  setAttribute(name,value){this.attrs[name]=value}
  append(node){node.parent=this;node.isConnected=true;this.children.push(node)}
  remove(){this.isConnected=false;if(this.parent)this.parent.children=this.parent.children.filter(node=>node!==this)}
  animate(keyframes,options){let finish,reject;const finished=new Promise((a,b)=>{finish=a;reject=b});const animation={finished,cancel:()=>reject(Error('canceled')),finish,keyframes,options};animations.push(animation);return animation}
 }
 global.Element=Element
 global.document={hidden:false,body:new Element('body'),createElement:tag=>new Element(tag),addEventListener:(name,fn,capture)=>events.set(name,{fn,capture}),removeEventListener:name=>events.delete(name)}
 global.window={innerWidth:1000,innerHeight:800,matchMedia:()=>media,addEventListener(){},removeEventListener(){}}
 global.getComputedStyle=button=>({borderRadius:'12px',color:button.color})
 global.requestAnimationFrame=fn=>{const id=++next;frames.set(id,fn);return id}
 global.cancelAnimationFrame=id=>frames.delete(id)
 const api=load(),cleanup=api.initButtonRipples()
 t.after(()=>{cleanup();Object.assign(global,old)})
 const pointer=(button,more={})=>events.get('pointerdown').fn({target:button,button:0,isPrimary:true,clientX:15,clientY:25,...more})
 const tick=()=>{const current=[...frames.values()];frames.clear();current.forEach(fn=>fn())}
 return {api,cleanup,Element,events,media,mediaEvents,animations,frames,pointer,tick,body:global.document.body}
}
test('统一捕获嵌套图标按钮，保留主题圆角和文字颜色，不改变点击语义',t=>{
 const f=fixture(t),button=new f.Element(),icon=new f.Element('svg');button.append(icon)
 assert.equal(f.api.initButtonRipples(),f.cleanup);assert.equal(f.events.get('pointerdown').capture,true)
 f.pointer(icon)
 assert.equal(f.body.children.length,1)
 const layer=f.body.children[0];assert.equal(layer.attrs['aria-hidden'],'true');assert.equal(layer.style.borderRadius,'12px');assert.equal(layer.style.color,button.color)
 assert.equal(button.children.length,1,'不在 React 按钮中插入额外 DOM')
 assert.equal(layer.style.transform,'translate3d(10px,20px,0)')
 button.rect.left=80;f.tick();assert.equal(layer.style.transform,'translate3d(80px,20px,0)')
})
test('禁用、忙碌、右键和多指点击不生成水波，键盘长按不重复触发',t=>{
 const f=fixture(t),button=new f.Element()
 button.disabled=true;f.pointer(button);button.disabled=false
 button.attrs['aria-busy']='true';f.pointer(button);delete button.attrs['aria-busy']
 f.pointer(button,{button:2});f.pointer(button,{isPrimary:false});assert.equal(f.body.children.length,0)
 f.events.get('keydown').fn({target:button,key:'Enter',repeat:true});assert.equal(f.body.children.length,0)
 f.events.get('keydown').fn({target:button,key:'Enter',repeat:false});assert.equal(f.body.children.length,1)
})
test('快速点击保留最多三圈；按钮卸载、后台和偏好变化及时清理',t=>{
 const f=fixture(t),button=new f.Element()
 for(let i=0;i<10;i++)f.pointer(button)
 assert.equal(f.body.children.length,3)
 button.isConnected=false;f.tick();assert.equal(f.body.children.length,0);assert.equal(f.frames.size,0)
 button.isConnected=true;f.pointer(button);f.mediaEvents.get('change')();assert.equal(f.body.children.length,0)
 f.pointer(button);global.document.hidden=true;f.events.get('visibilitychange').fn();assert.equal(f.body.children.length,0)
})
test('减少动态效果保留短暂透明反馈，动画完成后移除所有临时节点',async t=>{
 const f=fixture(t),button=new f.Element();f.media.matches=true;f.pointer(button)
 const animation=f.animations[0];assert.equal(animation.options.duration,120);assert.ok(animation.keyframes.every(frame=>!('transform'in frame)))
 animation.finish();await Promise.resolve();assert.equal(f.body.children.length,0);assert.equal(f.frames.size,0)
})
