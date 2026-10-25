const {test}=require('node:test'),assert=require('node:assert/strict')
const fs=require('node:fs'),path=require('node:path'),Module=require('node:module'),ts=require('typescript')
const file=path.resolve(__dirname,'../src/shared/floatLayout.ts'),value=new Module(file,module);value.filename=file
value._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,file)
const {floatInsets,floatSize,floatGutterContains,reframeFloatBounds}=value.exports
const area={x:0,y:0,width:1920,height:1080}
test('小球与二级导航共用纵向画布，可见内容仍为 64px',()=>{
 assert.deepEqual(floatSize(1,1080),{w:64,h:208});assert.deepEqual(floatInsets(1),{top:72,bottom:72})
 assert.deepEqual(floatSize(2,1080),{w:312,h:208})
 assert.equal(floatSize(3,1080).h-floatInsets(3).top,680)
 assert.ok(floatSize(4,900).h<=888)
 assert.deepEqual(floatInsets(999),floatInsets(1));assert.deepEqual(floatSize(999,1080),floatSize(1,1080))
})
test('小球与胶囊往返时视觉顶部和内容高度不跳变',()=>{
 const original={x:100,y:200,width:64,height:208}
 const expanded=reframeFloatBounds(original,floatInsets(1),floatInsets(2),floatSize(2,1080),area)
 assert.equal(expanded.y,original.y);assert.equal(expanded.height,original.height)
 const collapsed=reframeFloatBounds({...expanded,width:312},floatInsets(2),floatInsets(1),floatSize(1,1080),area)
 assert.equal(collapsed.y,original.y);assert.equal(collapsed.height,original.height)
 const panel=reframeFloatBounds({...expanded,width:312},floatInsets(2),floatInsets(3),floatSize(3,1080),area)
 assert.equal(panel.y,expanded.y);assert.equal(panel.height-72,64)
})
test('贴近屏幕边缘时预留动画空间，跨屏原点计算正确',()=>{
 const frame=reframeFloatBounds({x:1900,y:2,width:64,height:208},floatInsets(1),floatInsets(2),floatSize(2,1080),area)
 assert.ok(frame.x+312<=1920);assert.ok(frame.y>=0)
 const monitor={x:-1920,y:-200,width:1920,height:1080}
 const negative=reframeFloatBounds({x:-1900,y:-190,width:64,height:208},floatInsets(1),floatInsets(2),floatSize(2,1080),monitor)
 assert.equal(negative.y,-190)
})
test('只有透明留白穿透鼠标，按钮与正文区域仍可点击',()=>{
 const bounds={x:100,y:100,width:312,height:208},inset=floatInsets(2)
 assert.equal(floatGutterContains(bounds,inset,{x:120,y:110}),true)
 assert.equal(floatGutterContains(bounds,inset,{x:120,y:180}),false)
 assert.equal(floatGutterContains(bounds,inset,{x:120,y:250}),true)
 assert.equal(floatGutterContains(bounds,inset,{x:10,y:110}),false)
 const ball={x:100,y:100,width:64,height:208}
 assert.equal(floatGutterContains(ball,floatInsets(1),{x:120,y:110}),true)
 assert.equal(floatGutterContains(ball,floatInsets(1),{x:120,y:180}),false)
 // Expanded link/file bubbles share the same canvas: their content stays clickable.
 assert.equal(floatGutterContains({...ball,width:345},floatInsets(1),{x:400,y:180}),false)
})
