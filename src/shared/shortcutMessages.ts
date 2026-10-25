// Display translations for the bundled shortcut books. Command codes stay intact.
export const SHORTCUT_MESSAGES: readonly (readonly [string, string, string])[] = `
工具（官方默认）|Tools (official defaults)|ツール（公式の初期設定）
选择|Select|選択
套索选择|Lasso select|投げ縄選択
颜料桶（材质/纹理/环境）|Paint Bucket (materials/textures/environment)|ペイント（マテリアル・テクスチャ・環境）
橡皮擦|Eraser|消しゴム
直线|Line|線分
矩形|Rectangle|長方形
圆|Circle|円
两点圆弧|2-point arc|2点円弧
移动|Move|移動
推/拉|Push/Pull|プッシュ・プル
旋转|Rotate|回転
缩放|Scale|尺度変更
偏移|Offset|オフセット
卷尺|Tape Measure|メジャー
制作组件|Make component|コンポーネントを作成
图像穹顶（照片匹配）|Image dome (photo matching)|画像ドーム（写真照合）
后边线（Back Edges）|Back Edges|背面エッジ
搜索|Search|検索
视图与导航|View and navigation|表示とナビゲーション
环绕观察（或按住中键拖动）|Orbit (or middle-button drag)|オービット（または中ボタンドラッグ）
平移（或 Shift + 中键拖动）|Pan (or Shift + middle-button drag)|パン（または Shift + 中ボタンドラッグ）
缩放（或滚动滚轮）|Zoom (or scroll wheel)|ズーム（またはホイール）
缩放范围（充满视野）|Zoom Extents (fit view)|全体表示（画面に合わせる）
编辑与系统（通用）|Edit and system (general)|編集とシステム（共通）
撤销|Undo|元に戻す
重做|Redo|やり直す
复制|Copy|コピー
粘贴|Paste|貼り付け
剪切|Cut|切り取り
全选|Select all|すべて選択
保存|Save|保存
创建组件（组）|Create component (group)|コンポーネント（グループ）を作成
删除|Delete|削除
取消当前操作|Cancel current action|現在の操作を中止
高效技巧（组合键）|Productivity tips (key combinations)|便利な操作（組み合わせ）
Ctrl + 移动|Ctrl + Move|Ctrl + 移動
移动时按住 Ctrl = 复制|Hold Ctrl while moving to copy|移動中に Ctrl を押すとコピー
数字 + x|Number + x|数値 + x
复制后输入 5x = 复制 5 份|Type 5x after copying to make 5 copies|コピー後に 5x と入力すると5個複製
数字 + /|Number + /|数値 + /
复制后输入 / = 等分间距|Type / after copying for equal spacing|コピー後に / を入力して等間隔に配置
双击 推拉|Double-click Push/Pull|プッシュ・プルをダブルクリック
重复上一次推拉距离|Repeat the last Push/Pull distance|前回のプッシュ・プル距離を繰り返す
三击 选择|Triple-click Select|選択をトリプルクリック
选择所有相连几何体|Select all connected geometry|接続するすべての形状を選択
方向键|Arrow keys|方向キー
锁定红/绿/蓝轴推理（上=蓝轴）|Lock red/green/blue inference (Up = blue)|赤・緑・青軸に固定（上キー＝青軸）
Shift + 推理|Shift + inference|Shift + 推定方向
锁定当前推理方向|Lock the current inference direction|現在の推定方向に固定
默认键盘（F 键）|Default keyboard (function keys)|初期設定（ファンクションキー）
说明（Help）|Help|ヘルプ
命令历史（CommandHistory）|Command History|コマンド履歴
属性（Properties）|Properties|プロパティ
切换选择过滤器|Toggle selection filter|選択フィルターを切り替え
切换摄像机|Toggle camera|カメラを切り替え
格线显示开关|Toggle grid|グリッド表示を切り替え
切换正交（Ortho）|Toggle Ortho|直交モードを切り替え
切换锁定格点（Snap）|Toggle grid snap|グリッドスナップを切り替え
打开控制点（PointsOn）|Points On|制御点を表示
关闭控制点（PointsOff）|Points Off|制御点を非表示
测量手臂点击（DigClick）|Digitizer click (DigClick)|デジタイザークリック（DigClick）
默认键盘（Ctrl 组合）|Default keyboard (Ctrl combinations)|初期設定（Ctrl の組み合わせ）
定义图块（Block）|Define block|ブロックを定義
复制到剪贴板|Copy to clipboard|クリップボードにコピー
搜索文本|Find text|テキストを検索
群组（Group）|Group|グループ化
隐藏（Hide）|Hide|非表示
插入（Insert）|Insert|挿入
组合（Join）|Join|結合
锁定（Lock）|Lock|ロック
工作视窗最大化显示|Maximize viewport|ビューポートを最大化
新建|New|新規作成
打开|Open|開く
打印|Print|印刷
退出（Exit）|Exit|終了
修剪（Trim）|Trim|トリム
缩放（Zoom）|Zoom|ズーム
复原（撤销）|Undo|元に戻す
默认键盘（Shift / Alt / 视图）|Default keyboard (Shift / Alt / view)|初期設定（Shift・Alt・表示）
缩放至最大范围|Zoom Extents|全体表示
解散群组|Ungroup|グループ解除
显示选中（ShowSelected）|Show Selected|選択オブジェクトを表示
解除锁定选中（UnlockSelected）|Unlock Selected|選択オブジェクトのロック解除
分割（Split）|Split|分割
缩放全部至最大范围|Zoom Extents All|すべてのビューを全体表示
显示（Show）|Show|表示
解除锁定（Unlock）|Unlock|ロック解除
显示模式 → 渲染|Display mode → Rendered|表示モード → レンダリング
显示模式 → 着色|Display mode → Shaded|表示モード → シェーディング
显示模式 → 线框|Display mode → Wireframe|表示モード → ワイヤーフレーム
显示模式 → X 光|Display mode → X-Ray|表示モード → X線
复原视图（UndoView）|Undo View|ビューを元に戻す
重做视图（RedoView）|Redo View|ビューをやり直す
最大化 Top / Front / Right / Perspective|Maximize Top / Front / Right / Perspective|Top・Front・Right・Perspective を最大化
切换细分显示模式|Toggle SubD display|SubD 表示を切り替え
滚轮|Scroll wheel|ホイール
缩放视图|Zoom view|ビューをズーム
右键拖动|Right-button drag|右ボタンドラッグ
旋转视图|Rotate view|ビューを回転
Shift + 右键拖动|Shift + right-button drag|Shift + 右ボタンドラッグ
平移视图|Pan view|ビューをパン
曲线命令（英文代码）|Curve commands (command codes)|曲線コマンド（英語コード）
单一直线|Single line|単一線分
多重直线|Polyline|ポリライン
控制点曲线|Control point curve|制御点指定曲線
圆弧|Arc|円弧
椭圆|Ellipse|楕円
正多边形|Polygon|正多角形
螺旋线|Helix|らせん
弹簧线（对数螺旋）|Spiral (logarithmic spiral)|渦巻き（対数らせん）
曲线圆角|Fillet curves|曲線のフィレット
曲线斜角|Chamfer curves|曲線の面取り
曲线混接|Blend curves|曲線のブレンド
偏移曲线|Offset curve|曲線をオフセット
重建曲线/曲面|Rebuild curve/surface|曲線・サーフェスをリビルド
延伸曲线|Extend curve|曲線を延長
曲面命令（英文代码）|Surface commands (command codes)|サーフェスコマンド（英語コード）
挤出成型|Extrude|押し出し
放样|Loft|ロフト
单轨扫掠|Sweep one rail|1レールスイープ
双轨扫掠|Sweep two rails|2レールスイープ
旋转成形|Revolve|回転サーフェス
沿路径旋转|Rail revolve|レールに沿って回転
嵌面|Patch|パッチ
从网线建立曲面|Surface from curve network|曲線ネットワークからサーフェス
曲面混接|Blend surfaces|サーフェスのブレンド
偏移曲面|Offset surface|サーフェスをオフセット
曲面圆角|Fillet surfaces|サーフェスのフィレット
从 3/4 点建立曲面|Surface from 3/4 points|3・4点からサーフェス
从平面曲线建立曲面|Surface from planar curves|平面曲線からサーフェス
布帘（从点云建立曲面）|Drape (surface from point cloud)|ドレープ（点群からサーフェス）
实体与编辑（英文代码）|Solids and editing (command codes)|ソリッドと編集（英語コード）
立方体|Box|直方体
球体|Sphere|球
圆柱体|Cylinder|円柱
圆锥体|Cone|円錐
环状体|Torus|トーラス
圆管|Pipe|パイプ
布尔并集|Boolean union|ブール和
布尔差集|Boolean difference|ブール差
布尔交集|Boolean intersection|ブール積
修剪|Trim|トリム
取消修剪|Untrim|トリム解除
分割|Split|分割
组合|Join|結合
炸开|Explode|分解
群组|Group|グループ化
镜像|Mirror|ミラー
阵列|Array|配列複製
投影|Project|投影
抽离曲面|Extract surface|サーフェスを抽出
建立网格|Create mesh|メッシュを作成
网格转 NURBS|Mesh to NURBS|メッシュを NURBS に変換
分析（英文代码）|Analysis (command codes)|解析（英語コード）
显示控制点|Show control points|制御点を表示
关闭控制点|Hide control points|制御点を非表示
操作轴开关|Toggle Gumball|ガムボールを切り替え
斑马纹分析|Zebra analysis|ゼブラ解析
曲率分析|Curvature analysis|曲率解析
测量距离|Measure distance|距離を計測
面积|Area|面積
选择重复物体|Select duplicates|重複オブジェクトを選択
AutoCAD（命令别名）|AutoCAD (command aliases)|AutoCAD（コマンドエイリアス）
绘图（别名）|Drawing (aliases)|作図（エイリアス）
直线 Line|Line|線分 Line
多段线 PLine|Polyline (PLine)|ポリライン PLine
圆 Circle|Circle|円 Circle
圆弧 Arc|Arc|円弧 Arc
矩形 Rectang|Rectangle (Rectang)|長方形 Rectang
正多边形 Polygon|Polygon|正多角形 Polygon
样条曲线 Spline|Spline|スプライン Spline
椭圆 Ellipse|Ellipse|楕円 Ellipse
构造线 XLine|Construction line (XLine)|構築線 XLine
点 Point|Point|点 Point
圆环 Donut|Donut|ドーナツ Donut
填充 Hatch|Hatch|ハッチング Hatch
渐变色填充 Gradient|Gradient fill|グラデーション Gradient
多行文字 MText|Multiline text (MText)|マルチテキスト MText
单行文字 Text|Single-line text|単一行テキスト Text
创建块 Block|Create block|ブロックを作成 Block
插入块 Insert|Insert block|ブロックを挿入 Insert
写块 WBlock|Write block (WBlock)|ブロックを書き出す WBlock
修改（别名）|Modify (aliases)|修正（エイリアス）
删除 Erase|Erase|削除 Erase
移动 Move|Move|移動 Move
复制 Copy（CP 亦可）|Copy (CP also works)|コピー Copy（CP も可）
旋转 Rotate|Rotate|回転 Rotate
缩放 Scale|Scale|尺度変更 Scale
镜像 Mirror|Mirror|ミラー Mirror
偏移 Offset|Offset|オフセット Offset
阵列 Array|Array|配列複製 Array
修剪 Trim|Trim|トリム Trim
延伸 Extend|Extend|延長 Extend
圆角 Fillet|Fillet|フィレット Fillet
倒角 Chamfer|Chamfer|面取り Chamfer
打断 Break|Break|部分削除 Break
合并 Join|Join|結合 Join
分解（炸开）Explode|Explode|分解 Explode
拉伸 Stretch|Stretch|ストレッチ Stretch
拉长 Lengthen|Lengthen|長さ変更 Lengthen
对齐 Align|Align|位置合わせ Align
特性匹配（格式刷）MatchProp|Match properties (MatchProp)|プロパティコピー MatchProp
编辑多段线 PEdit|Edit polyline (PEdit)|ポリラインを編集 PEdit
标注与查询（别名）|Dimensions and inquiry (aliases)|寸法と計測（エイリアス）
标注样式 DimStyle|Dimension style (DimStyle)|寸法スタイル DimStyle
线性标注 DimLinear|Linear dimension (DimLinear)|長さ寸法 DimLinear
对齐标注 DimAligned|Aligned dimension (DimAligned)|平行寸法 DimAligned
角度标注 DimAngular|Angular dimension (DimAngular)|角度寸法 DimAngular
半径标注 DimRadius|Radius dimension (DimRadius)|半径寸法 DimRadius
直径标注 DimDiameter|Diameter dimension (DimDiameter)|直径寸法 DimDiameter
坐标标注 DimOrdinate|Ordinate dimension (DimOrdinate)|座標寸法 DimOrdinate
基线标注 DimBaseline|Baseline dimension (DimBaseline)|基線寸法 DimBaseline
连续标注 DimContinue|Continue dimension (DimContinue)|連続寸法 DimContinue
圆心标记 DimCenter|Center mark (DimCenter)|中心マーク DimCenter
测量距离 Dist|Distance (Dist)|距離計測 Dist
测量面积 Area|Area|面積計測 Area
列表信息 List|List object information|オブジェクト情報 List
编辑标注 DimEdit|Edit dimension (DimEdit)|寸法を編集 DimEdit
图层与特性（别名）|Layers and properties (aliases)|画層とプロパティ（エイリアス）
图层特性管理 Layer|Layer properties|画層プロパティ Layer
特性 Properties|Properties|プロパティ Properties
设置颜色 Color|Set color|色を設定 Color
线型 Linetype|Linetype|線種 Linetype
线型比例 LTScale|Linetype scale (LTScale)|線種尺度 LTScale
线宽 LWeight|Lineweight (LWeight)|線の太さ LWeight
对象捕捉设置 Osnap|Object snap settings (Osnap)|オブジェクトスナップ設定 Osnap
草图设置 DSettings|Drafting settings (DSettings)|作図設定 DSettings
清理 Purge|Purge|名前削除 Purge
重命名 Rename|Rename|名前変更 Rename
单位 Units|Units|単位 Units
视图与系统（别名 / 组合键）|View and system (aliases / combinations)|表示とシステム（エイリアス・組み合わせ）
缩放 Zoom|Zoom|ズーム Zoom
实时平移 Pan|Real-time pan|リアルタイムパン Pan
重生成 Regen|Regenerate (Regen)|再作図 Regen
全部重生成 RegenAll|Regenerate all (RegenAll)|全体を再作図 RegenAll
对象捕捉开关|Toggle object snap|オブジェクトスナップを切り替え
栅格开关|Toggle grid|グリッドを切り替え
正交开关|Toggle Ortho|直交モードを切り替え
捕捉开关|Toggle snap|スナップを切り替え
极轴追踪开关|Toggle polar tracking|極トラッキングを切り替え
对象捕捉追踪开关|Toggle object snap tracking|オブジェクトスナップトラッキングを切り替え
撤销（U）|Undo (U)|元に戻す（U）
`.trim().split('\n').map(line => {
  const [zh, en, ja] = line.split('|')
  return [zh, en, ja] as const
})
