# Seats.io 座位图编辑器设计参考

## 概述

本文档记录了 Seats.io 座位图编辑器的设计模式、交互方式和功能架构，用于指导我们的座位图编辑器开发。

---

## 一、整体布局架构

### 1.1 三栏式布局

```
┌─────────────────────────────────────────────────────────────┐
│  顶部标题栏 (Logo + 项目名称 + 模式切换 + 全局操作)            │
├──────────┬─────────────────────────────────┬────────────────┤
│          │                                 │                │
│  左侧    │         中央画布区域             │    右侧        │
│  工具栏  │      (座位图可视化编辑区)         │   信息面板      │
│          │                                 │                │
├──────────┴─────────────────────────────────┴────────────────┤
│  底部状态栏 (缩放控制 + 操作提示 + 辅助工具)                   │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 各区域职责

| 区域 | 职责 | 关键元素 |
|------|------|----------|
| 顶部栏 | 项目标识、全局设置、视图切换 | 标题、Read only 开关、预览按钮 |
| 左侧栏 | 编辑工具集合 | 选择、绘制、形状、文字、图标工具 |
| 中央画布 | 可视化编辑核心区域 | 座位渲染、选中状态、拖拽交互 |
| 右侧面板 | 数据展示与状态监控 | 统计信息、验证状态、分类管理 |
| 底部栏 | 视图控制与操作引导 | 缩放、平移、操作提示 |

---

## 二、工具栏设计

### 2.1 工具分类（从上到下）

1. **选择工具** - 光标图标，默认激活状态
2. **绘制工具** - 刷子图标，用于绘制/擦除
3. **形状工具** - 矩形/圆形等几何形状
4. **文本工具** - 文字标注（如 STAGE、ORGAN）
5. **图标工具** - 预设图标库（如无障碍座位图标）
6. **图片工具** - 背景图片上传
7. **区域工具** - 定义特殊区域（General Admission）
8. **分类工具** - 座位类别管理

### 2.2 工具设计原则

- **图标化**：每个工具使用简洁的图标表示
- **垂直排列**：工具沿左侧垂直排列，节省水平空间
- **选中高亮**：当前激活工具有明显的视觉反馈
- **分组间距**：相关工具之间保持适当间距

### 2.3 图标设计规范

使用自定义 SVG 图标，保持一致的视觉风格：

#### 图标风格
- **线宽**：1.5px
- **线条**：圆角线帽（round cap）
- **填充**：无填充（fill="none"）
- **尺寸**：工具栏 20px，子菜单 16px
- **颜色**：currentColor（继承父元素颜色）

#### 图标列表

| 图标 | 名称 | 用途 |
|------|------|------|
| `CursorIcon` | 选择工具 | 默认选择模式 |
| `BrushIcon` | 刷子工具 | 绘制形状 |
| `SeatDrawIcon` | 座位绘制 | 座位绘制模式 |
| `RowIcon` | 单行座位 | 单行绘制 |
| `SectionIcon` | 区块座位 | 多行/区块绘制 |
| `RectIcon` | 矩形 | 矩形工具 |
| `CircleIcon` | 圆形 | 圆形工具 |
| `PolygonIcon` | 多边形 | 多边形工具 |
| `TextIcon` | 文字 | 文字工具 |
| `ImageIcon` | 图片 | 图片工具 |
| `PeopleIcon` | 人物 | 人物/图标工具 |
| `LayerUpIcon` | 图层上移 | 图层控制 |
| `LayerDownIcon` | 图层下移 | 图层控制 |
| `FlipHIcon` | 水平翻转 | 变换工具 |
| `FlipVIcon` | 垂直翻转 | 变换工具 |
| `ZoomInIcon` | 放大 | 视图控制 |
| `ZoomOutIcon` | 缩小 | 视图控制 |
| `ResetZoomIcon` | 重置缩放 | 视图控制 |
| `SaveIcon` | 保存 | 文件操作 |
| `TrashIcon` | 删除 | 删除操作 |
| `KeyboardIcon` | 键盘 | 快捷键 |

#### 使用方式

```tsx
import { CursorIcon, SeatDrawIcon } from './components/icons/EditorIcons';

// 在组件中使用
<CursorIcon size={20} color="#495057" />
<SeatDrawIcon size={20} color="#1971c2" />
```

#### 图标映射配置

通过 `IconMap` 组件根据名称自动选择图标：

```tsx
import IconMap from './components/icons/IconMap';

// 根据图标名称自动渲染
<IconMap iconName="cursor" size={20} />
<IconMap iconName="seat-draw" size={20} />
```

---

## 三、画布交互设计

### 3.1 座位渲染

```typescript
// 座位视觉属性
interface SeatVisual {
  shape: 'circle';           // 圆形为主
  size: number;              // 固定大小，缩放时保持比例
  color: string;             // 根据分类着色
  border: {
    width: number;
    color: string;
  };
  label: {
    text: string;            // 座位号
    visible: boolean;        // 根据缩放级别显示/隐藏
  };
}
```

### 3.2 座位编排模式

- **弧形排列**：座位按照弧形/扇形排列，符合剧院布局
- **颜色分区**：不同区域使用不同颜色（绿色、粉色、红色）
- **间距均匀**：座位之间有均匀的间距
- **标签定位**：区域标签（STAGE、ORGAN）使用灰色文字

### 3.3 特殊区域

- **General Admission 区域**：
  - 使用矩形边框
  - 红色背景填充
  - 居中文字标签
  - 表示站席或无固定座位区域

### 3.4 交互状态

- **悬停**：鼠标悬停时显示座位信息
- **选中**：高亮边框或颜色变化
- **多选**：支持框选多个座位
- **拖拽**：可整体移动座位组

### 3.5 绘制预览样式（Seats.io 风格）

在绘制座位时，预览效果采用以下设计：

#### 视觉元素组成

```
    ○ ─ ○ ○ ○ ○ ○ ○
        ↑
    连接座位中心的辅助线
    
    蓝色空心圆环（预览状态）
```

#### 设计规范

| 元素 | 预览状态 | 完成状态 |
|------|----------|----------|
| **座位颜色** | 空心圆环 | 灰色填充 |
| **圆环边框** | 蓝色 1.5px | 灰色 1px |
| **座位半径** | 6px | 6px |
| **座位间距** | 18px | 18px |
| **辅助线** | 蓝色虚线连接座位中心 | 无 |

#### 颜色定义

**预览状态（绘制时）**：
```
填充颜色: #D2EDFE (浅蓝色)
首位座位边框: #0985FA (亮蓝色)
中间座位边框: #0E64C8 (深蓝色)
边框宽度: 1.5px
```

**完成状态（绘制后）**：
```
填充颜色: #A2A2A2 (灰色)
边框颜色: #444444 (深灰色)
边框宽度: 1px
```

> ⚠️ **注意**：座位颜色后续可通过状态或分类进行变动，以上为默认绘制颜色。

#### 绘制模式（重要）

**必须是"固定间距实时添加"模式**，不是"均匀分布"模式！

##### ✅ 正确模式：固定间距实时添加

鼠标移动时，座位一个一个实时添加，间距固定：

```typescript
// 1. 起点始终有一个座位
seats.push({ x: startX, y: startY, ... });

// 2. 沿着路径每隔 spacing 放置一个座位
let currentDist = spacing;
while (currentDist <= distance) {
  const ratio = currentDist / distance;
  const seatX = startX + Math.cos(angle) * distance * ratio;
  const seatY = startY + Math.sin(angle) * distance * ratio;
  seats.push({ x: seatX, y: seatY, ... });
  currentDist += spacing;
}
```

**效果**：鼠标移动时，每超过一个间距就新增一个座位，座位是逐个出现的。

##### ❌ 错误模式：均匀分布

```typescript
// 不要这样！这是均匀分布，不是实时添加
const seatCount = Math.max(1, Math.round(distance / spacing));
for (let i = 0; i < seatCount; i++) {
  const ratio = seatCount === 1 ? 0 : i / (seatCount - 1);
  const seatX = startX + Math.cos(angle) * distance * ratio;
  // ...
}
```

**错误原因**：
1. 这种模式是首尾固定，中间均匀插入
2. 鼠标移动时座位数量不会逐个增加
3. 最后一个座位一定在终点位置，不是根据间距动态添加

##### 关键区别

| 特性 | 固定间距实时添加 ✅ | 均匀分布 ❌ |
|------|---------------------|-------------|
| 第一个座位 | 在起点 | 在起点 |
| 最后一个座位 | 根据鼠标位置动态确定 | 一定在终点 |
| 座位添加方式 | 鼠标移动时逐个添加 | 一次性计算所有位置 |
| 间距 | 严格固定为 spacing | 实际间距 = distance / (count-1) |
| 视觉效果 | 像拖出一条座位线 | 像拉伸一排座位 |

---

##### ⚠️ **折线/有角度单行（Row with Segment）关键逻辑**

**这是容易出错的复杂场景，必须严格遵循以下逻辑：**

**三段式绘制流程**：
1. **第1点**：确定起点
2. **第2点**：确定第一段的终点方向（**注意：不是转折点位置！**）
3. **第3点**：确定第二段的方向

**核心规则**：
```typescript
// 第一段：从第1点开始，每隔 spacing 放置座位
let lastSeatPos = { x: firstPoint.x, y: firstPoint.y };
let currentDist = spacing;
while (currentDist <= segment1Distance) {
  // ... 放置座位
  lastSeatPos = { x: seatX, y: seatY }; // 记录最后一个座位位置
  currentDist += spacing;
}

// 第二段：从第一段最后一个座位的实际位置（转折点）开始
const segment2Distance = getDistance(lastSeatPos.x, lastSeatPos.y, thirdPoint.x, thirdPoint.y);
const segment2Angle = getAngle(lastSeatPos.x, lastSeatPos.y, thirdPoint.x, thirdPoint.y);

// 从转折点开始，每隔 spacing 放置座位
currentDist = spacing;
while (currentDist <= segment2Distance) {
  const seatX = lastSeatPos.x + Math.cos(segment2Angle) * segment2Distance * ratio;
  // ...
}
```

**关键要点**：
- 转折点是**第一段最后一个座位的实际位置**，不是鼠标点击的第2点
- 第二段从这个实际转折点开始延伸
- 这样两段座位**无缝连接**，不会出现间隙或重叠

**常见错误**：
```typescript
// ❌ 错误：把第二段起点设为鼠标点击的第2点
const segment2Distance = getDistance(secondPoint.x, secondPoint.y, ...);

// ✅ 正确：把第二段起点设为第一段最后一个座位的实际位置
const lastSeatOfSeg1 = seats[seats.length - 1];
const segment2Distance = getDistance(lastSeatOfSeg1.x, lastSeatOfSeg1.y, ...);
```

#### 实现代码参考

```tsx
// 辅助线 - 连接第一个座位到最后一个座位的中心
<Line
  points={[firstSeat.x, firstSeat.y, lastSeat.x, lastSeat.y]}
  stroke="#2196F3"
  strokeWidth={1}
  opacity={0.5}
  dash={[4, 4]}
/>

// 预览座位 - 蓝色空心圆环
<Circle
  x={seat.x}
  y={seat.y}
  radius={6}
  fill="transparent"
  stroke="#2196F3"
  strokeWidth={1.5}
/>

// 完成后的真实座位 - 灰色填充
<Circle
  x={seat.x}
  y={seat.y}
  radius={6}
  fill="#9E9E9E"
  stroke="#757575"
  strokeWidth={1}
/>
```

#### 交互逻辑

1. **未点击状态**：鼠标处显示蓝色空心圆圈（6px，1.5px边框）作为光标提示
2. **拖动中**：
   - 显示蓝色虚线连接所有预览座位中心
   - 显示所有预览座位的蓝色空心圆环
3. **点击确认后**：预览消失，生成灰色填充的真实座位

---

## 四、右侧面板设计

### 4.1 统计信息

```typescript
interface ChartStats {
  title: string;             // "Small theatre with GA chart"
  categories: {
    count: number;           // 3 categories
    manageable: boolean;     // 是否可管理
  };
  places: {
    total: number;           // 699 places
  };
}
```

### 4.2 验证状态列表

显示数据完整性的检查结果：

| 检查项 | 状态 | 说明 |
|--------|------|------|
| No duplicate objects | ✓ | 无重复对象 |
| All objects are labeled | ✓ | 所有对象已标记 |
| All objects are categorized | ✓ | 所有对象已分类 |
| Categories on multiple object types | ! | 警告/提示信息 |
| Focal point is set | ✓ | 焦点已设置（用于视角中心） |

### 4.3 设计要点

- **图标+文字**：每个状态项前有图标标识
- **颜色编码**：绿色表示正常，其他颜色表示警告
- **可展开**：某些项可以展开查看详情

---

## 五、顶部工具栏设计

### 5.1 元素组成

```
[项目名称] [Read only 开关] [眼睛图标] [主题切换] [帮助] [分享] [删除]
```

### 5.2 关键功能

- **Read only 模式**：切换只读/编辑模式
- **预览按钮**：眼睛图标，切换预览视图
- **主题切换**：亮度图标，支持深色/浅色模式
- **撤销/重做**：在标题栏右侧

---

## 六、底部状态栏设计

### 6.1 元素组成

```
[手型平移工具] [缩放滑块/按钮] [当前操作提示]
```

### 6.2 操作提示

根据当前工具动态显示提示：
- 选择工具："Click & drag select multiple objects"
- 绘制工具："Click to add seat, Shift+click to remove"

---

## 七、设计模式总结

### 7.1 视觉设计

| 元素 | 设计 |
|------|------|
| 座位 | 圆形，6px 半径，分类着色 |
| 选中态 | 边框高亮或颜色加深 |
| 标签 | 灰色(#999)，大写，分散字距 |
| 特殊区域 | 半透明背景 + 边框 |
| 画布背景 | 纯白色，提供对比 |
| 绘制预览 | 蓝色空心圆环 + 十字辅助线 + 数量指示器 |

### 7.2 颜色系统

```
绿色座位: #8BC34A 或类似 (普通区)
粉色座位: #F48FB1 或类似 (另一类)
红色区域: #EF5350 + 透明度 (GA区域)
灰色文字: #9E9E9E (标签)
蓝色图标: #2196F3 (无障碍等特殊标记)
```

### 7.3 交互模式

1. **即时反馈**：鼠标悬停、点击立即有视觉反馈
2. **批量操作**：支持框选、多选
3. **模式切换**：工具切换清晰，当前模式明确
4. **数据验证**：实时显示数据完整性状态

---

## 八、实现建议

### 8.1 技术栈建议

- **渲染**：Canvas 或 SVG（SVG 更适合交互）
- **状态管理**：Redux / Zustand 管理编辑器状态
- **拖拽**：react-dnd 或自研拖拽逻辑
- **缩放/平移**：CSS transform + mouse/touch 事件

### 8.2 数据结构

```typescript
interface SeatMap {
  id: string;
  name: string;
  categories: Category[];
  seats: Seat[];
  sections: Section[];      // 区域（如 General Admission）
  labels: Label[];          // 文字标签（STAGE、ORGAN）
  focalPoint: Point;        // 焦点坐标
}

interface Seat {
  id: string;
  x: number;
  y: number;
  category: string;
  label: string;
  status: 'available' | 'occupied' | 'locked';
}

interface Category {
  id: string;
  name: string;
  color: string;
}
```

### 8.3 关键功能优先级

1. **P0**：画布渲染、座位渲染、基础选择
2. **P1**：工具栏、分类着色、缩放平移
3. **P2**：右侧面板统计、数据验证
4. **P3**：高级工具（形状绘制、图片上传）

---

## 九、参考链接

- Seats.io 官网：https://seats.io/
- 编辑器示例：需要注册账号体验
