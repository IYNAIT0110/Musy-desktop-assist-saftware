/**
 * 快捷键白皮书数据：SketchUp / Rhino / AutoCAD。
 * 数据来源（官方）：
 * - SketchUp：help.sketchup.com「默认键盘快捷键」
 * - Rhino：docs.mcneel.com「键盘选项」默认快捷键表 + 官方命令列表
 * - AutoCAD：Autodesk 官方「Command Aliases」（acad.pgp）
 */

export interface ShortcutItem {
  keys: string[]
  desc: string
}

export interface ShortcutCategory {
  name: string
  items: ShortcutItem[]
}

export interface SoftwareShortcuts {
  key: 'su' | 'rhino' | 'cad'
  name: string
  full: string
  color: string
  /** 官网地址（用于抓取官方 logo） */
  site: string
  categories: ShortcutCategory[]
}

export const SHORTCUT_BOOKS: SoftwareShortcuts[] = [
  {
    key: 'su',
    name: 'SketchUp',
    full: 'SketchUp Pro',
    color: '#e8574f',
    site: 'https://www.sketchup.com/',
    categories: [
      {
        name: '工具（官方默认）',
        items: [
          { keys: ['Space'], desc: '选择' },
          { keys: ['Shift + Space'], desc: '套索选择' },
          { keys: ['B'], desc: '颜料桶（材质/纹理/环境）' },
          { keys: ['E'], desc: '橡皮擦' },
          { keys: ['L'], desc: '直线' },
          { keys: ['R'], desc: '矩形' },
          { keys: ['C'], desc: '圆' },
          { keys: ['A'], desc: '两点圆弧' },
          { keys: ['M'], desc: '移动' },
          { keys: ['P'], desc: '推/拉' },
          { keys: ['Q'], desc: '旋转' },
          { keys: ['S'], desc: '缩放' },
          { keys: ['F'], desc: '偏移' },
          { keys: ['T'], desc: '卷尺' },
          { keys: ['G'], desc: '制作组件' },
          { keys: ['I'], desc: '图像穹顶（照片匹配）' },
          { keys: ['K'], desc: '后边线（Back Edges）' },
          { keys: ['Shift + S'], desc: '搜索' }
        ]
      },
      {
        name: '视图与导航',
        items: [
          { keys: ['O'], desc: '环绕观察（或按住中键拖动）' },
          { keys: ['H'], desc: '平移（或 Shift + 中键拖动）' },
          { keys: ['Z'], desc: '缩放（或滚动滚轮）' },
          { keys: ['Shift + Z'], desc: '缩放范围（充满视野）' }
        ]
      },
      {
        name: '编辑与系统（通用）',
        items: [
          { keys: ['Ctrl + Z'], desc: '撤销' },
          { keys: ['Ctrl + Y'], desc: '重做' },
          { keys: ['Ctrl + C'], desc: '复制' },
          { keys: ['Ctrl + V'], desc: '粘贴' },
          { keys: ['Ctrl + X'], desc: '剪切' },
          { keys: ['Ctrl + A'], desc: '全选' },
          { keys: ['Ctrl + S'], desc: '保存' },
          { keys: ['Ctrl + G'], desc: '创建组件（组）' },
          { keys: ['Delete'], desc: '删除' },
          { keys: ['Esc'], desc: '取消当前操作' }
        ]
      },
      {
        name: '高效技巧（组合键）',
        items: [
          { keys: ['Ctrl + 移动'], desc: '移动时按住 Ctrl = 复制' },
          { keys: ['数字 + x'], desc: '复制后输入 5x = 复制 5 份' },
          { keys: ['数字 + /'], desc: '复制后输入 / = 等分间距' },
          { keys: ['双击 推拉'], desc: '重复上一次推拉距离' },
          { keys: ['三击 选择'], desc: '选择所有相连几何体' },
          { keys: ['方向键'], desc: '锁定红/绿/蓝轴推理（上=蓝轴）' },
          { keys: ['Shift + 推理'], desc: '锁定当前推理方向' }
        ]
      }
    ]
  },
  {
    key: 'rhino',
    name: 'Rhino',
    full: 'Rhinoceros 3D',
    color: '#4f6de8',
    site: 'https://www.rhino3d.com/',
    categories: [
      {
        name: '默认键盘（F 键）',
        items: [
          { keys: ['F1'], desc: '说明（Help）' },
          { keys: ['F2'], desc: '命令历史（CommandHistory）' },
          { keys: ['F3'], desc: '属性（Properties）' },
          { keys: ['F5'], desc: '切换选择过滤器' },
          { keys: ['F6'], desc: '切换摄像机' },
          { keys: ['F7'], desc: '格线显示开关' },
          { keys: ['F8'], desc: '切换正交（Ortho）' },
          { keys: ['F9'], desc: '切换锁定格点（Snap）' },
          { keys: ['F10'], desc: '打开控制点（PointsOn）' },
          { keys: ['F11'], desc: '关闭控制点（PointsOff）' },
          { keys: ['F12'], desc: '测量手臂点击（DigClick）' }
        ]
      },
      {
        name: '默认键盘（Ctrl 组合）',
        items: [
          { keys: ['Ctrl + A'], desc: '全选' },
          { keys: ['Ctrl + B'], desc: '定义图块（Block）' },
          { keys: ['Ctrl + C'], desc: '复制到剪贴板' },
          { keys: ['Ctrl + F'], desc: '搜索文本' },
          { keys: ['Ctrl + G'], desc: '群组（Group）' },
          { keys: ['Ctrl + H'], desc: '隐藏（Hide）' },
          { keys: ['Ctrl + I'], desc: '插入（Insert）' },
          { keys: ['Ctrl + J'], desc: '组合（Join）' },
          { keys: ['Ctrl + L'], desc: '锁定（Lock）' },
          { keys: ['Ctrl + M'], desc: '工作视窗最大化显示' },
          { keys: ['Ctrl + N'], desc: '新建' },
          { keys: ['Ctrl + O'], desc: '打开' },
          { keys: ['Ctrl + P'], desc: '打印' },
          { keys: ['Ctrl + Q'], desc: '退出（Exit）' },
          { keys: ['Ctrl + S'], desc: '保存' },
          { keys: ['Ctrl + T'], desc: '修剪（Trim）' },
          { keys: ['Ctrl + V'], desc: '粘贴' },
          { keys: ['Ctrl + W'], desc: '缩放（Zoom）' },
          { keys: ['Ctrl + X'], desc: '剪切' },
          { keys: ['Ctrl + Y'], desc: '重做' },
          { keys: ['Ctrl + Z'], desc: '复原（撤销）' }
        ]
      },
      {
        name: '默认键盘（Shift / Alt / 视图）',
        items: [
          { keys: ['Ctrl + Shift + E'], desc: '缩放至最大范围' },
          { keys: ['Ctrl + Shift + G'], desc: '解散群组' },
          { keys: ['Ctrl + Shift + H'], desc: '显示选中（ShowSelected）' },
          { keys: ['Ctrl + Shift + L'], desc: '解除锁定选中（UnlockSelected）' },
          { keys: ['Ctrl + Shift + S'], desc: '分割（Split）' },
          { keys: ['Ctrl + Alt + E'], desc: '缩放全部至最大范围' },
          { keys: ['Ctrl + Alt + H'], desc: '显示（Show）' },
          { keys: ['Ctrl + Alt + L'], desc: '解除锁定（Unlock）' },
          { keys: ['Ctrl + Alt + R'], desc: '显示模式 → 渲染' },
          { keys: ['Ctrl + Alt + S'], desc: '显示模式 → 着色' },
          { keys: ['Ctrl + Alt + W'], desc: '显示模式 → 线框' },
          { keys: ['Ctrl + Alt + X'], desc: '显示模式 → X 光' },
          { keys: ['Home'], desc: '复原视图（UndoView）' },
          { keys: ['End'], desc: '重做视图（RedoView）' },
          { keys: ['Ctrl + F1..F4'], desc: '最大化 Top / Front / Right / Perspective' },
          { keys: ['Tab'], desc: '切换细分显示模式' },
          { keys: ['滚轮'], desc: '缩放视图' },
          { keys: ['右键拖动'], desc: '旋转视图' },
          { keys: ['Shift + 右键拖动'], desc: '平移视图' }
        ]
      },
      {
        name: '曲线命令（英文代码）',
        items: [
          { keys: ['Line'], desc: '单一直线' },
          { keys: ['Polyline'], desc: '多重直线' },
          { keys: ['Curve'], desc: '控制点曲线' },
          { keys: ['Circle'], desc: '圆' },
          { keys: ['Arc'], desc: '圆弧' },
          { keys: ['Ellipse'], desc: '椭圆' },
          { keys: ['Rectangle'], desc: '矩形' },
          { keys: ['Polygon'], desc: '正多边形' },
          { keys: ['Helix'], desc: '螺旋线' },
          { keys: ['Spiral'], desc: '弹簧线（对数螺旋）' },
          { keys: ['Fillet'], desc: '曲线圆角' },
          { keys: ['Chamfer'], desc: '曲线斜角' },
          { keys: ['Blend'], desc: '曲线混接' },
          { keys: ['Offset'], desc: '偏移曲线' },
          { keys: ['Rebuild'], desc: '重建曲线/曲面' },
          { keys: ['Extend'], desc: '延伸曲线' }
        ]
      },
      {
        name: '曲面命令（英文代码）',
        items: [
          { keys: ['ExtrudeCrv'], desc: '挤出成型' },
          { keys: ['Loft'], desc: '放样' },
          { keys: ['Sweep1'], desc: '单轨扫掠' },
          { keys: ['Sweep2'], desc: '双轨扫掠' },
          { keys: ['Revolve'], desc: '旋转成形' },
          { keys: ['RailRevolve'], desc: '沿路径旋转' },
          { keys: ['Patch'], desc: '嵌面' },
          { keys: ['NetworkSrf'], desc: '从网线建立曲面' },
          { keys: ['BlendSrf'], desc: '曲面混接' },
          { keys: ['OffsetSrf'], desc: '偏移曲面' },
          { keys: ['FilletSrf'], desc: '曲面圆角' },
          { keys: ['SrfPt'], desc: '从 3/4 点建立曲面' },
          { keys: ['PlanarSrf'], desc: '从平面曲线建立曲面' },
          { keys: ['Drape'], desc: '布帘（从点云建立曲面）' }
        ]
      },
      {
        name: '实体与编辑（英文代码）',
        items: [
          { keys: ['Box'], desc: '立方体' },
          { keys: ['Sphere'], desc: '球体' },
          { keys: ['Cylinder'], desc: '圆柱体' },
          { keys: ['Cone'], desc: '圆锥体' },
          { keys: ['Torus'], desc: '环状体' },
          { keys: ['Pipe'], desc: '圆管' },
          { keys: ['BooleanUnion'], desc: '布尔并集' },
          { keys: ['BooleanDifference'], desc: '布尔差集' },
          { keys: ['BooleanIntersection'], desc: '布尔交集' },
          { keys: ['Trim'], desc: '修剪' },
          { keys: ['Untrim'], desc: '取消修剪' },
          { keys: ['Split'], desc: '分割' },
          { keys: ['Join'], desc: '组合' },
          { keys: ['Explode'], desc: '炸开' },
          { keys: ['Group'], desc: '群组' },
          { keys: ['Ungroup'], desc: '解散群组' },
          { keys: ['Move'], desc: '移动' },
          { keys: ['Copy'], desc: '复制' },
          { keys: ['Rotate'], desc: '旋转' },
          { keys: ['Scale'], desc: '缩放' },
          { keys: ['Mirror'], desc: '镜像' },
          { keys: ['Array'], desc: '阵列' },
          { keys: ['Project'], desc: '投影' },
          { keys: ['ExtractSrf'], desc: '抽离曲面' },
          { keys: ['Mesh'], desc: '建立网格' },
          { keys: ['MeshToNURB'], desc: '网格转 NURBS' }
        ]
      },
      {
        name: '分析（英文代码）',
        items: [
          { keys: ['PointsOn'], desc: '显示控制点' },
          { keys: ['PointsOff'], desc: '关闭控制点' },
          { keys: ['Gumball'], desc: '操作轴开关' },
          { keys: ['Zebra'], desc: '斑马纹分析' },
          { keys: ['CurvatureAnalysis'], desc: '曲率分析' },
          { keys: ['Distance'], desc: '测量距离' },
          { keys: ['Area'], desc: '面积' },
          { keys: ['SelDup'], desc: '选择重复物体' }
        ]
      }
    ]
  },
  {
    key: 'cad',
    name: 'AutoCAD',
    full: 'AutoCAD（命令别名）',
    color: '#e0a63c',
    site: 'https://www.autodesk.com/',
    categories: [
      {
        name: '绘图（别名）',
        items: [
          { keys: ['L'], desc: '直线 Line' },
          { keys: ['PL'], desc: '多段线 PLine' },
          { keys: ['C'], desc: '圆 Circle' },
          { keys: ['A'], desc: '圆弧 Arc' },
          { keys: ['REC'], desc: '矩形 Rectang' },
          { keys: ['POL'], desc: '正多边形 Polygon' },
          { keys: ['SPL'], desc: '样条曲线 Spline' },
          { keys: ['EL'], desc: '椭圆 Ellipse' },
          { keys: ['XL'], desc: '构造线 XLine' },
          { keys: ['PO'], desc: '点 Point' },
          { keys: ['DO'], desc: '圆环 Donut' },
          { keys: ['H'], desc: '填充 Hatch' },
          { keys: ['GD'], desc: '渐变色填充 Gradient' },
          { keys: ['T'], desc: '多行文字 MText' },
          { keys: ['DT'], desc: '单行文字 Text' },
          { keys: ['B'], desc: '创建块 Block' },
          { keys: ['I'], desc: '插入块 Insert' },
          { keys: ['W'], desc: '写块 WBlock' }
        ]
      },
      {
        name: '修改（别名）',
        items: [
          { keys: ['E'], desc: '删除 Erase' },
          { keys: ['M'], desc: '移动 Move' },
          { keys: ['CO'], desc: '复制 Copy（CP 亦可）' },
          { keys: ['RO'], desc: '旋转 Rotate' },
          { keys: ['SC'], desc: '缩放 Scale' },
          { keys: ['MI'], desc: '镜像 Mirror' },
          { keys: ['O'], desc: '偏移 Offset' },
          { keys: ['AR'], desc: '阵列 Array' },
          { keys: ['TR'], desc: '修剪 Trim' },
          { keys: ['EX'], desc: '延伸 Extend' },
          { keys: ['F'], desc: '圆角 Fillet' },
          { keys: ['CHA'], desc: '倒角 Chamfer' },
          { keys: ['BR'], desc: '打断 Break' },
          { keys: ['J'], desc: '合并 Join' },
          { keys: ['X'], desc: '分解（炸开）Explode' },
          { keys: ['S'], desc: '拉伸 Stretch' },
          { keys: ['LEN'], desc: '拉长 Lengthen' },
          { keys: ['AL'], desc: '对齐 Align' },
          { keys: ['MA'], desc: '特性匹配（格式刷）MatchProp' },
          { keys: ['PE'], desc: '编辑多段线 PEdit' }
        ]
      },
      {
        name: '标注与查询（别名）',
        items: [
          { keys: ['D'], desc: '标注样式 DimStyle' },
          { keys: ['DLI'], desc: '线性标注 DimLinear' },
          { keys: ['DAL'], desc: '对齐标注 DimAligned' },
          { keys: ['DAN'], desc: '角度标注 DimAngular' },
          { keys: ['DRA'], desc: '半径标注 DimRadius' },
          { keys: ['DDI'], desc: '直径标注 DimDiameter' },
          { keys: ['DOR'], desc: '坐标标注 DimOrdinate' },
          { keys: ['DBA'], desc: '基线标注 DimBaseline' },
          { keys: ['DCO'], desc: '连续标注 DimContinue' },
          { keys: ['DCE'], desc: '圆心标记 DimCenter' },
          { keys: ['DI'], desc: '测量距离 Dist' },
          { keys: ['AA'], desc: '测量面积 Area' },
          { keys: ['LI'], desc: '列表信息 List' },
          { keys: ['DED'], desc: '编辑标注 DimEdit' }
        ]
      },
      {
        name: '图层与特性（别名）',
        items: [
          { keys: ['LA'], desc: '图层特性管理 Layer' },
          { keys: ['CH'], desc: '特性 Properties' },
          { keys: ['COL'], desc: '设置颜色 Color' },
          { keys: ['LT'], desc: '线型 Linetype' },
          { keys: ['LTS'], desc: '线型比例 LTScale' },
          { keys: ['LW'], desc: '线宽 LWeight' },
          { keys: ['OS'], desc: '对象捕捉设置 Osnap' },
          { keys: ['DS'], desc: '草图设置 DSettings' },
          { keys: ['PU'], desc: '清理 Purge' },
          { keys: ['REN'], desc: '重命名 Rename' },
          { keys: ['UN'], desc: '单位 Units' }
        ]
      },
      {
        name: '视图与系统（别名 / 组合键）',
        items: [
          { keys: ['Z'], desc: '缩放 Zoom' },
          { keys: ['P'], desc: '实时平移 Pan' },
          { keys: ['RE'], desc: '重生成 Regen' },
          { keys: ['REA'], desc: '全部重生成 RegenAll' },
          { keys: ['F3'], desc: '对象捕捉开关' },
          { keys: ['F7'], desc: '栅格开关' },
          { keys: ['F8'], desc: '正交开关' },
          { keys: ['F9'], desc: '捕捉开关' },
          { keys: ['F10'], desc: '极轴追踪开关' },
          { keys: ['F11'], desc: '对象捕捉追踪开关' },
          { keys: ['Ctrl + Z'], desc: '撤销（U）' },
          { keys: ['Ctrl + Y'], desc: '重做' },
          { keys: ['Ctrl + S'], desc: '保存' },
          { keys: ['Ctrl + P'], desc: '打印' },
          { keys: ['Ctrl + N'], desc: '新建' },
          { keys: ['Ctrl + O'], desc: '打开' }
        ]
      }
    ]
  }
]

/** 统计某软件的快捷键总条数 */
export function shortcutCount(s: SoftwareShortcuts): number {
  return s.categories.reduce((n, c) => n + c.items.length, 0)
}
