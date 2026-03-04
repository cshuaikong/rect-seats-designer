/**
 * 座位相关类型定义
 * 参考 Seats.io 座位图设计器
 */

// 座位状态
export type SeatStatus = 'available' | 'booked' | 'reserved' | 'disabled';

// 座位类型
export type SeatType = 'seat' | 'booth' | 'table' | 'general' | 'wheelchair';

// 座位基础数据
export interface SeatData {
  id: string;
  rowNumber: string;      // 行号，如 "A", "1", "26"
  seatNumber: string;     // 座位号，如 "1", "2", "15"
  x: number;
  y: number;
  radius?: number;        // 座位圆半径，默认 12
  status: SeatStatus;
  type: SeatType;
  category?: string;      // 分类/区域，如 "VIP", "普通席"
  // 无障碍标识
  isWheelchair?: boolean;
  isCompanion?: boolean;
}

// 行段（一段连续的座位）
export interface RowSegment {
  id: string;
  startSeatNumber: number;  // 起始座位号
  seatCount: number;        // 座位数量
  gapAfter?: number;        // 段后间距（像素）
}

// 行数据
export interface SeatRow {
  id: string;
  rowNumber: string;
  x: number;                // 行起点 X
  y: number;                // 行起点 Y
  seatRadius: number;       // 座位半径
  seatSpacing: number;      // 座位间距
  segments: RowSegment[];   // 行段列表（支持间断行）
  angle?: number;           // 行角度（用于弧形排布）
  status: SeatStatus;
  category?: string;
}

// 座位区块（多行组成）
export interface SeatSection {
  id: string;
  name: string;
  x: number;
  y: number;
  rows: SeatRow[];
  category?: string;
  color?: string;           // 区块颜色
}

// 座位图配置
export interface SeatMapConfig {
  defaultSeatRadius: number;
  defaultSeatSpacing: number;
  defaultRowSpacing: number;
  showRowLabels: boolean;
  showSeatLabels: boolean;
  // 座位状态颜色
  statusColors: Record<SeatStatus, string>;
  // 分类颜色
  categoryColors: Record<string, string>;
}

// 默认配置
export const defaultSeatMapConfig: SeatMapConfig = {
  defaultSeatRadius: 12,
  defaultSeatSpacing: 28,
  defaultRowSpacing: 32,
  showRowLabels: true,
  showSeatLabels: true,
  statusColors: {
    available: '#4CAF50',  // 绿色 - 可用
    booked: '#F44336',     // 红色 - 已预订
    reserved: '#FF9800',   // 橙色 - 预留
    disabled: '#9E9E9E',   // 灰色 - 禁用
  },
  categoryColors: {
    'VIP': '#FFD700',
    '普通席': '#4CAF50',
    '特价席': '#2196F3',
    '无障碍': '#9C27B0',
  },
};

// 绘制模式
export type SeatDrawMode = 
  | 'idle' 
  | 'single-seat'      // 单座位
  | 'row-straight'     // 直行
  | 'row-curved'       // 弧形行
  | 'row-segments'     // 带间断的行
  | 'section'          // 区块（自动计算）
  | 'section-diagonal';// 区块（对角线形式，可控制长宽）

// 绘制工具配置
export interface SeatDrawTool {
  id: SeatDrawMode;
  name: string;
  icon: string;
  description: string;
}

export const seatDrawTools: SeatDrawTool[] = [
  { id: 'single-seat', name: '单座位', icon: 'chair', description: '绘制单个座位' },
  { id: 'row-straight', name: '直行', icon: 'view-week', description: '绘制一排直行座位' },
  { id: 'row-curved', name: '弧形行', icon: 'panorama-wide-angle', description: '绘制弧形排布的座位' },
  { id: 'row-segments', name: '行段', icon: 'view-module', description: '绘制带间断的座位行' },
  { id: 'section', name: '区块', icon: 'grid-on', description: '绘制多行组成的座位区块' },
  { id: 'section-diagonal', name: '对角区块', icon: 'diagonal', description: '对角线形式，可控制行列数' },
];
