import day from '../assets/examples/pavilion-day.svg?raw'
import night from '../assets/examples/pavilion-night.svg?raw'
import library from '../assets/examples/library.svg?raw'

// Original teaching illustrations and prompts. No user projects or generated renders.
const image = (svg: string): string => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
export const PROMPT_EXAMPLES = [
  {
    id: 'example-pavilion-day',
    text: '设计一座林间小型休憩亭。保持轻盈的水平屋面，使用浅色木构与通透玻璃，步道自然连接到入口。画面采用人眼高度的三分之二侧视角，清晨柔光穿过树叶，材质真实，构图简洁，突出建筑与环境的关系。',
    tags: ['示例', '林间亭', '清晨'],
    image: image(day),
    note: 'Musy 原创入门示例。封面为示意插画，不是生成效果图。试试下方箭头或拖动卡片，切换夜景子卷轴。',
    ts: 1
  },
  {
    id: 'example-pavilion-night',
    parentId: 'example-pavilion-day',
    text: '保持林间休憩亭的体量、水平屋面、木构和相机位置不变，将场景改为蓝调时刻。室内透出温暖且克制的灯光，玻璃呈现轻微反射，树木与步道保持清晰层次，避免过曝与夸张灯带。',
    tags: ['示例', '林间亭', '夜景'],
    image: image(night),
    note: '母子卷轴示例：同一方案的时间与光线变体。提示词可直接复制，也可自行编辑。',
    ts: 2
  },
  {
    id: 'example-library',
    text: '设计一间安静的社区阅读室。空间以浅色木材、书架和长桌为主，侧窗引入柔和自然光，保留充足的通道和无障碍使用空间。采用室内广角但不夸张的透视，强调温暖、清晰、适合长时间阅读的氛围。',
    tags: ['示例', '阅读室', '自然光'],
    image: image(library),
    note: 'Musy 原创入门示例。用自己的预览图、标签与文字替换此卡片即可开始整理。',
    ts: 3
  }
]
