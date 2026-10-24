# AutoCAD 快捷键白皮书

> 数据来源：Autodesk 官方「Command Aliases」（acad.pgp 默认别名）+ 官方快捷键参考。
> 命令别名输入后按 `空格` 或 `Enter` 执行。

## 绘图（别名）

| 别名 | 功能（命令） |
| --- | --- |
| `L` | 直线 Line |
| `PL` | 多段线 PLine |
| `C` | 圆 Circle |
| `A` | 圆弧 Arc |
| `REC` | 矩形 Rectang |
| `POL` | 正多边形 Polygon |
| `SPL` | 样条曲线 Spline |
| `EL` | 椭圆 Ellipse |
| `XL` | 构造线 XLine |
| `PO` | 点 Point |
| `DO` | 圆环 Donut |
| `H` | 填充 Hatch |
| `GD` | 渐变色填充 Gradient |
| `T` | 多行文字 MText |
| `DT` | 单行文字 Text |
| `B` | 创建块 Block |
| `I` | 插入块 Insert |
| `W` | 写块 WBlock |

## 修改（别名）

| 别名 | 功能（命令） |
| --- | --- |
| `E` | 删除 Erase |
| `M` | 移动 Move |
| `CO` | 复制 Copy（`CP` 亦可） |
| `RO` | 旋转 Rotate |
| `SC` | 缩放 Scale |
| `MI` | 镜像 Mirror |
| `O` | 偏移 Offset |
| `AR` | 阵列 Array |
| `TR` | 修剪 Trim |
| `EX` | 延伸 Extend |
| `F` | 圆角 Fillet |
| `CHA` | 倒角 Chamfer |
| `BR` | 打断 Break |
| `J` | 合并 Join |
| `X` | 分解（炸开）Explode |
| `S` | 拉伸 Stretch |
| `LEN` | 拉长 Lengthen |
| `AL` | 对齐 Align |
| `MA` | 特性匹配（格式刷）MatchProp |
| `PE` | 编辑多段线 PEdit |

## 标注与查询（别名）

| 别名 | 功能（命令） |
| --- | --- |
| `D` | 标注样式 DimStyle |
| `DLI` | 线性标注 DimLinear |
| `DAL` | 对齐标注 DimAligned |
| `DAN` | 角度标注 DimAngular |
| `DRA` | 半径标注 DimRadius |
| `DDI` | 直径标注 DimDiameter |
| `DOR` | 坐标标注 DimOrdinate |
| `DBA` | 基线标注 DimBaseline |
| `DCO` | 连续标注 DimContinue |
| `DCE` | 圆心标记 DimCenter |
| `DI` | 测量距离 Dist |
| `AA` | 测量面积 Area |
| `LI` | 列表信息 List |
| `DED` | 编辑标注 DimEdit |

## 图层与特性（别名）

| 别名 | 功能（命令） |
| --- | --- |
| `LA` | 图层特性管理 Layer |
| `CH` | 特性 Properties |
| `COL` | 设置颜色 Color |
| `LT` | 线型 Linetype |
| `LTS` | 线型比例 LTScale |
| `LW` | 线宽 LWeight |
| `OS` | 对象捕捉设置 Osnap |
| `DS` | 草图设置 DSettings |
| `PU` | 清理 Purge |
| `REN` | 重命名 Rename |
| `UN` | 单位 Units |

## 视图与系统（别名 / 组合键）

| 快捷键 | 功能 |
| --- | --- |
| `Z` | 缩放 Zoom |
| `P` | 实时平移 Pan |
| `RE` | 重生成 Regen |
| `REA` | 全部重生成 RegenAll |
| `F3` | 对象捕捉开关 |
| `F7` | 栅格开关 |
| `F8` | 正交开关 |
| `F9` | 捕捉开关 |
| `F10` | 极轴追踪开关 |
| `F11` | 对象捕捉追踪开关 |
| `Ctrl + Z` | 撤销（U） |
| `Ctrl + Y` | 重做 |
| `Ctrl + S` | 保存 |
| `Ctrl + P` | 打印 |
| `Ctrl + N` / `Ctrl + O` | 新建 / 打开 |

## 使用技巧

- **TR 修剪提速**：输入 `TR` 后连按两次 `Enter`，默认全部对象为剪切边，直接点要剪的线。
- **命令透明执行**：绘图过程中输入 `'Z`（带撇号的 Zoom）缩放后自动回到原命令。
- **自定义别名**：工具 → 自定义 → 编辑程序参数（acad.pgp），重启后生效。
- **别名规则**：官方惯例是取命令前 1~3 个字母（`L`=Line、`PL`=PLine、`REC`=Rectang），后缀加相关别名（`R`=Redraw、`RA`=RedrawAll）。
