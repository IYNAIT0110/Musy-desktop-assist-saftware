const {test}=require('node:test'),assert=require('node:assert/strict')
const fs=require('node:fs'),path=require('node:path'),Module=require('node:module'),ts=require('typescript')
function load(file,mocks={}){
 const filename=path.resolve(__dirname,'..',file),value=new Module(filename,module);value.filename=filename;value.paths=Module._nodeModulePaths(path.dirname(filename));const original=value.require.bind(value)
 value.require=name=>Object.hasOwn(mocks,name)?mocks[name]:original(name)
 value._compile(ts.transpileModule(fs.readFileSync(filename,'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText,filename)
 return value.exports
}
const helpers=load('src/renderer/src/promptStack.ts')
const parent={id:'parent',text:'Parent text',tags:[],ts:1},a={id:'a',parentId:'parent',text:'Variant A',tags:[],ts:3},b={id:'b',parentId:'parent',text:'Variant B',tags:[],ts:2}
test('母提示词始终第一张，子卡顺序稳定，排除重复和其他家族',()=>{
 const items=[a,b,parent,{...a,id:'foreign',parentId:'other'}]
 const groups=helpers.promptChildren(items)
 assert.deepEqual(helpers.promptFamily(parent,[a,b,a,items[3]]).map(item=>item.id),['parent','a','b'])
 assert.deepEqual(groups.get('parent').map(item=>item.id),['a','b'])
 assert.equal(items[0].id,'a','不改变存储顺序和原始内容')
 assert.deepEqual(helpers.promptFamily(parent,[]),[parent])
})
test('前后循环能回到母图，纵向滚动和小位移不翻卡',()=>{
 assert.equal(helpers.stepStackIndex(0,-1,3),2);assert.equal(helpers.stepStackIndex(2,1,3),0);assert.equal(helpers.stepStackIndex(0,1,0),0)
 assert.equal(helpers.stackSwipe(-70,3,220),1);assert.equal(helpers.stackSwipe(70,3,220),-1)
 assert.equal(helpers.stackSwipe(10,2,220),0);assert.equal(helpers.stackSwipe(50,80,220),0)
})
function fixture(t){
 const old=global.window;global.window={matchMedia:()=>({matches:false})};t.after(()=>{global.window=old})
 const slots=[];let index=0,activeId=parent.id;const changes=[]
 const react={useRef(initial){const at=index++;return slots[at]??(slots[at]={current:initial})},useState(initial){const at=index++;if(!(at in slots))slots[at]=initial;return[slots[at],next=>{slots[at]=typeof next==='function'?next(slots[at]):next}]},useLayoutEffect(){},useEffect(){}}
 const api=load('src/renderer/src/components/PromptImageStack.tsx',{'react':react,'../promptStack':helpers,'../promptImageCache':{decodePromptImage:()=>Promise.resolve(true)},'../i18n':{tx:value=>value,useLang(){}},'./HoverFeedback':{InteractiveButton:'button'},'./prompt-stack.css':{}})
 const render=()=>{index=0;return api.PromptImageStack({items:[parent,a,b],activeId,onChange:id=>{activeId=id;changes.push(id)}})}
 return{slots,changes,render}
}
test('按钮可双向循环，显示当前身份与计数，控制区点击不打开详情',t=>{
 const f=fixture(t);let node=f.render();let controls=node.props.children[1]
 assert.deepEqual(controls.props.children[1].props.children,['母提示词',' · ',1,'/',3])
 controls.props.children[2].props.onClick();node=f.render();controls=node.props.children[1]
 assert.equal(f.changes.at(-1),'a');assert.equal(controls.props.children[1].props.children[0],'子提示词')
 controls.props.children[0].props.onClick();node=f.render();assert.equal(f.changes.at(-1),'parent')
 let stopped=false;node.props.children[1].props.onClick({stopPropagation(){stopped=true}});assert.equal(stopped,true)
})
test('拖动翻卡抑制随后点击，普通点击仍能交给详情入口',t=>{
 const f=fixture(t),node=f.render(),stage=node.props.children[0]
 f.slots[0].current={style:{},animate(){return{cancel(){}}}}
 const target={clientWidth:220,setPointerCapture(){},hasPointerCapture:()=>true,releasePointerCapture(){}}
 const event=(x,y)=>({pointerId:1,button:0,isPrimary:true,clientX:x,clientY:y,currentTarget:target,cancelable:true,preventDefault(){}})
 stage.props.onPointerDown(event(120,80));stage.props.onPointerMove(event(40,82));stage.props.onPointerUp(event(40,82));assert.equal(f.changes.at(-1),'a')
 assert.match(f.slots[4].from,/translateX\(-80px\)/,'出场从松手位置继续，不能跳回中心')
 let stopped=0;stage.props.onClickCapture({preventDefault(){},stopPropagation(){stopped++}});assert.equal(stopped,1)
 stage.props.onPointerDown(event(80,80));stage.props.onPointerUp(event(80,80));stage.props.onClickCapture({preventDefault(){},stopPropagation(){stopped++}});assert.equal(stopped,1)
})
test('翻牌保留相同图片身份键，母子图不会在前后槽位间重建',t=>{
 const f=fixture(t);const first=f.render()
 const before=first.props.children[0].props.children
 first.props.children[1].props.children[2].props.onClick()
 const after=f.render().props.children[0].props.children
 assert.deepEqual(before.map(node=>node.key),after.map(node=>node.key))
 assert.equal(after.find(node=>node.key==='a').props.className,'prompt-stack-sheet is-front')
 assert.equal(after.find(node=>node.key==='parent').props.className,'prompt-stack-sheet is-leaving')
})
