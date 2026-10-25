const {test}=require('node:test'),assert=require('node:assert/strict')
const fs=require('node:fs'),path=require('node:path'),Module=require('node:module'),ts=require('typescript')
function load(file,mocks={}){
 const filename=path.resolve(__dirname,'..',file),value=new Module(filename,module);value.filename=filename;value.paths=Module._nodeModulePaths(path.dirname(filename));const original=value.require.bind(value)
 value.require=name=>Object.hasOwn(mocks,name)?mocks[name]:original(name)
 value._compile(ts.transpileModule(fs.readFileSync(filename,'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText,filename)
 return value.exports
}
const geometry=load('src/renderer/src/hoverMotion.ts')
test('按卡片比例判定四边方向，横长与竖长图片一致',()=>{
 const rect={left:10,top:20,width:200,height:60}
 for(const [x,y,side]of[[9,50,'left'],[211,50,'right'],[110,19,'top'],[110,81,'bottom']])assert.equal(geometry.hoverDirection(rect,x,y),side)
 assert.equal(geometry.hoverDirection({left:0,top:0,width:60,height:200},30,201),'bottom')
 assert.equal(geometry.directionOffset('left'),'translate3d(-100%,0,0)')
})
function fixture(t){
 const old={window:global.window,getComputedStyle:global.getComputedStyle},refs=[],effects=[],animations=[]
 let reduced=false
 global.window={matchMedia:query=>({matches:query.includes('reduce')?reduced:true,addEventListener(){},removeEventListener(){}})}
 global.getComputedStyle=node=>({transform:node.style.transform??'none',opacity:node.style.opacity??'0',justifyContent:'space-between'})
 const react={forwardRef:fn=>fn,useImperativeHandle(){},useRef(value){const result={current:value};refs.push(result);return result},useLayoutEffect(fn){effects.push(fn)}}
 const api=load('src/renderer/src/components/HoverFeedback.tsx',{'react':react,'../hoverMotion':geometry,'./hover-feedback.css':{}})
 t.after(()=>Object.assign(global,old))
 return{api,refs,effects,animations,setReduced:value=>{reduced=value}}
}
test('按钮保留类型、表单、禁用与原点击回调；悬停副本不进入无障碍名称',t=>{
 const f=fixture(t),click=()=>{},node=f.api.InteractiveButton({children:'Save',type:'submit',form:'edit',onClick:click,disabled:true},null)
 assert.equal(node.type,'button');assert.equal(node.props.type,'submit');assert.equal(node.props.form,'edit');assert.equal(node.props.disabled,true);assert.equal(node.props.onClick,click)
 const [fill,rest,active]=node.props.children;assert.equal(fill.props['aria-hidden'],'true');assert.equal(active.props['aria-hidden'],'true');assert.equal(rest.props.children,'Save')
 const styles=new Map();f.refs[0].current={dataset:{},style:{setProperty:(k,v)=>styles.set(k,v)},getBoundingClientRect:()=>({width:50,height:32}),querySelector:()=>({textContent:'Save'})}
 f.effects[0]();assert.equal(f.refs[0].current.dataset.hoverCompact,'true');assert.equal(styles.get('--hover-justify'),'space-between')
})
test('卡片可中途反向，拖拽和取消会清除反馈并保留原事件',t=>{
 const f=fixture(t);let dragged=0,canceled=0
 const node=f.api.DirectionalHover({children:'Image',onDragStart:()=>{dragged++},onPointerCancel:()=>{canceled++}})
 const root={dataset:{},closest:()=>null,getBoundingClientRect:()=>({left:0,top:0,width:100,height:100})}
 const layer={style:{},animate(frames,options){const animation={playState:'running',cancel(){this.playState='idle'},frames,options};f.animations.push(animation);return animation}}
 f.refs[0].current=root;f.refs[1].current=layer
 node.props.onPointerEnter({clientX:-1,clientY:50,pointerType:'mouse'});assert.equal(root.dataset.hoverDirection,'left');assert.equal(f.animations[0].frames[0].transform,'translate3d(-100%,0,0)')
 node.props.onPointerLeave({clientX:101,clientY:50,pointerType:'mouse'});assert.equal(root.dataset.hoverDirection,'right');assert.equal(f.animations[0].playState,'idle')
 node.props.onDragStart({});assert.equal(dragged,1);assert.equal(layer.style.opacity,'0')
 node.props.onPointerCancel({});assert.equal(canceled,1)
 f.setReduced(true);node.props.onPointerEnter({clientX:50,clientY:-1,pointerType:'mouse'});assert.ok(f.animations.at(-1).frames.every(frame=>!('transform'in frame)))
})
test('所有组件的原生按钮均通过共享按钮或方向卡片呈现',()=>{
 const dir=path.resolve(__dirname,'../src/renderer/src/components')
 for(const file of fs.readdirSync(dir).filter(name=>name.endsWith('.tsx')&&name!=='HoverFeedback.tsx')){
  const code=fs.readFileSync(path.join(dir,file),'utf8'),source=ts.createSourceFile(file,code,ts.ScriptTarget.Latest,true)
  function visit(node){if(ts.isJsxOpeningElement(node)||ts.isJsxSelfClosingElement(node))assert.notEqual(node.tagName.getText(source),'button',file+' has unstyled native button');ts.forEachChild(node,visit)}visit(source)
 }
})
