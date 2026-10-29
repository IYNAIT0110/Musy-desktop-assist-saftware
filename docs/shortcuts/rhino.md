# Rhino 快捷键白皮书

> STArra v0.2.0 离线参考资料。软件版本和自定义键位可能不同；以实际软件设置为准。 [使用指南](../使用指南.md)

> 数据来源：McNeel 官方文档（docs.mcneel.com）「键盘选项」默认快捷键表 + 官方命令列表。
> Rhino 的核心交互是**输入英文命令名**（命令行自动补全），下面把默认键盘快捷键和常用英文命令代码都整理了。

## 默认键盘（F 键）

| 快捷键 | 功能 |
| --- | --- |
| `F1` | 说明（Help） |
| `F2` | 命令历史（CommandHistory） |
| `F3` | 属性（Properties） |
| `F5` | 切换选择过滤器 |
| `F6` | 切换摄像机 |
| `F7` | 格线显示开关 |
| `F8` | 切换正交（Ortho） |
| `F9` | 切换锁定格点（Snap） |
| `F10` | 打开控制点（PointsOn） |
| `F11` | 关闭控制点（PointsOff） |
| `F12` | 测量手臂点击（DigClick） |

## 默认键盘（Ctrl 组合）

| 快捷键 | 功能 |
| --- | --- |
| `Ctrl + A` | 全选 |
| `Ctrl + B` | 定义图块（Block） |
| `Ctrl + C` | 复制到剪贴板 |
| `Ctrl + F` | 搜索文本 |
| `Ctrl + G` | 群组（Group） |
| `Ctrl + H` | 隐藏（Hide） |
| `Ctrl + I` | 插入（Insert） |
| `Ctrl + J` | 组合（Join） |
| `Ctrl + L` | 锁定（Lock） |
| `Ctrl + M` | 工作视窗最大化显示 |
| `Ctrl + N` / `Ctrl + O` / `Ctrl + S` | 新建 / 打开 / 保存 |
| `Ctrl + P` | 打印 |
| `Ctrl + Q` | 退出（Exit） |
| `Ctrl + T` | 修剪（Trim） |
| `Ctrl + V` / `Ctrl + X` | 粘贴 / 剪切 |
| `Ctrl + W` | 缩放（Zoom） |
| `Ctrl + Y` / `Ctrl + Z` | 重做 / 复原（撤销） |

## 默认键盘（Shift / Alt / 视图）

| 快捷键 | 功能 |
| --- | --- |
| `Ctrl + Shift + E` | 缩放至最大范围 |
| `Ctrl + Shift + G` | 解散群组 |
| `Ctrl + Shift + H` | 显示选中（ShowSelected） |
| `Ctrl + Shift + L` | 解除锁定选中（UnlockSelected） |
| `Ctrl + Shift + S` | 分割（Split） |
| `Ctrl + Alt + E` | 缩放全部至最大范围 |
| `Ctrl + Alt + H` | 显示（Show） |
| `Ctrl + Alt + L` | 解除锁定（Unlock） |
| `Ctrl + Alt + R / S / W / X` | 显示模式 → 渲染 / 着色 / 线框 / X 光 |
| `Ctrl + F1..F4` | 最大化 Top / Front / Right / Perspective 视窗 |
| `Home` / `End` | 复原 / 重做视图 |
| `Tab` | 切换细分显示模式 |
| 滚轮 / 右键拖动 / `Shift`+右键拖动 | 缩放 / 旋转 / 平移视图 |

## 曲线命令（英文代码）

| 命令 | 功能 |
| --- | --- |
| `Line` | 单一直线 |
| `Polyline` | 多重直线 |
| `Curve` | 控制点曲线 |
| `Circle` / `Arc` / `Ellipse` | 圆 / 圆弧 / 椭圆 |
| `Rectangle` / `Polygon` | 矩形 / 正多边形 |
| `Helix` / `Spiral` | 螺旋线 / 弹簧线 |
| `Fillet` / `Chamfer` | 曲线圆角 / 斜角 |
| `Blend` | 曲线混接 |
| `Offset` | 偏移曲线 |
| `Rebuild` | 重建曲线 / 曲面 |
| `Extend` | 延伸曲线 |

## 曲面命令（英文代码）

| 命令 | 功能 |
| --- | --- |
| `ExtrudeCrv` | 挤出成型 |
| `Loft` | 放样 |
| `Sweep1` / `Sweep2` | 单轨 / 双轨扫掠 |
| `Revolve` / `RailRevolve` | 旋转成形 / 沿路径旋转 |
| `Patch` | 嵌面 |
| `NetworkSrf` | 从网线建立曲面 |
| `BlendSrf` | 曲面混接 |
| `OffsetSrf` | 偏移曲面 |
| `FilletSrf` | 曲面圆角 |
| `SrfPt` | 从 3/4 点建立曲面 |
| `PlanarSrf` | 从平面曲线建立曲面 |
| `Drape` | 布帘（从点云建立曲面） |

## 实体与编辑（英文代码）

| 命令 | 功能 |
| --- | --- |
| `Box` / `Sphere` / `Cylinder` | 立方体 / 球体 / 圆柱体 |
| `Cone` / `Torus` / `Pipe` | 圆锥体 / 环状体 / 圆管 |
| `BooleanUnion` | 布尔并集 |
| `BooleanDifference` | 布尔差集 |
| `BooleanIntersection` | 布尔交集 |
| `Trim` / `Untrim` | 修剪 / 取消修剪 |
| `Split` / `Join` / `Explode` | 分割 / 组合 / 炸开 |
| `Group` / `Ungroup` | 群组 / 解散群组 |
| `Move` / `Copy` / `Rotate` / `Scale` | 移动 / 复制 / 旋转 / 缩放 |
| `Mirror` / `Array` | 镜像 / 阵列 |
| `Project` | 投影 |
| `ExtractSrf` | 抽离曲面 |
| `Mesh` / `MeshToNURB` | 建立网格 / 网格转 NURBS |

## 分析（英文代码）

| 命令 | 功能 |
| --- | --- |
| `PointsOn` / `PointsOff` | 显示 / 关闭控制点 |
| `Gumball` | 操作轴开关 |
| `Zebra` | 斑马纹分析 |
| `CurvatureAnalysis` | 曲率分析 |
| `Distance` / `Area` | 测量距离 / 面积 |
| `SelDup` | 选择重复物体 |

## 使用技巧

- **重复命令**：`Enter` 或右键直接重复上一条命令。
- **强制命令**：输入 `!Line` 可忽略当前状态强制执行某命令。
- **建立自己的别名**：工具 → 选项 → 别名，把高频命令绑成单键（如 `L` = Line）。
- **命令行自动补全**：只输入前几个字母（如 `sw2`）回车即可命中 `Sweep2`。
