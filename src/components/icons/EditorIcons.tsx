import React from 'react';

export interface IconProps {
  size?: number;
  color?: string;
  className?: string;
}

// 选择/光标工具
export const CursorIcon: React.FC<IconProps> = ({ 
  size = 24, 
  color = 'currentColor',
  className 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke={color}
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" />
  </svg>
);

// 刷子/绘制工具
export const BrushIcon: React.FC<IconProps> = ({ 
  size = 24, 
  color = 'currentColor',
  className 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke={color}
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M9.06 11.9l8.07-8.06a2.85 2.85 0 114.03 4.03l-8.06 8.08" />
    <path d="M7.07 14.94c-1.66 0-3 1.35-3 3.02 0 1.33-2.5 1.52-2.5 2.98 0 .55.45 1 1 1h3.5c1.66 0 3-1.34 3-3 0-1.32 2.5-1.51 2.5-2.97 0-.55-.45-1.01-1-1.01h-3.5z" />
  </svg>
);

// 座位绘制工具
export const SeatDrawIcon: React.FC<IconProps> = ({ 
  size = 24, 
  color = 'currentColor',
  className 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke={color}
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <circle cx="6" cy="6" r="2.5" />
    <circle cx="12" cy="6" r="2.5" />
    <circle cx="18" cy="6" r="2.5" />
    <circle cx="6" cy="12" r="2.5" />
    <circle cx="12" cy="12" r="2.5" />
    <circle cx="18" cy="12" r="2.5" />
  </svg>
);

// 单行座位
export const RowIcon: React.FC<IconProps> = ({ 
  size = 24, 
  color = 'currentColor',
  className 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke={color}
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <circle cx="4" cy="12" r="2" />
    <circle cx="9" cy="12" r="2" />
    <circle cx="14" cy="12" r="2" />
    <circle cx="19" cy="12" r="2" />
  </svg>
);

// 多行/区块座位
export const SectionIcon: React.FC<IconProps> = ({ 
  size = 24, 
  color = 'currentColor',
  className 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke={color}
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <circle cx="5" cy="5" r="1.5" />
    <circle cx="10" cy="5" r="1.5" />
    <circle cx="15" cy="5" r="1.5" />
    <circle cx="5" cy="10" r="1.5" />
    <circle cx="10" cy="10" r="1.5" />
    <circle cx="15" cy="10" r="1.5" />
    <circle cx="5" cy="15" r="1.5" />
    <circle cx="10" cy="15" r="1.5" />
    <circle cx="15" cy="15" r="1.5" />
  </svg>
);

// 矩形工具
export const RectIcon: React.FC<IconProps> = ({ 
  size = 24, 
  color = 'currentColor',
  className 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke={color}
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <rect x="3" y="3" width="18" height="18" rx="2" />
  </svg>
);

// 圆形工具
export const CircleIcon: React.FC<IconProps> = ({ 
  size = 24, 
  color = 'currentColor',
  className 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke={color}
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <circle cx="12" cy="12" r="9" />
  </svg>
);

// 三角形/多边形工具
export const PolygonIcon: React.FC<IconProps> = ({ 
  size = 24, 
  color = 'currentColor',
  className 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke={color}
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M12 3l9 17H3L12 3z" />
  </svg>
);

// 文字工具
export const TextIcon: React.FC<IconProps> = ({ 
  size = 24, 
  color = 'currentColor',
  className 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke={color}
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M4 7V5h16v2" />
    <path d="M9 20h6" />
    <path d="M12 7v13" />
  </svg>
);

// 图片工具
export const ImageIcon: React.FC<IconProps> = ({ 
  size = 24, 
  color = 'currentColor',
  className 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke={color}
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <circle cx="8.5" cy="8.5" r="1.5" />
    <path d="M21 15l-5-5L5 21" />
  </svg>
);

// 人物图标
export const PeopleIcon: React.FC<IconProps> = ({ 
  size = 24, 
  color = 'currentColor',
  className 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke={color}
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <circle cx="7" cy="7" r="3" />
    <path d="M7 11v4" />
    <path d="M7 15h4" />
    <circle cx="17" cy="7" r="3" />
    <path d="M17 11v4" />
    <path d="M17 15h-4" />
  </svg>
);

// 更多选项
export const MoreIcon: React.FC<IconProps> = ({ 
  size = 24, 
  color = 'currentColor',
  className 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke={color}
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <circle cx="5" cy="12" r="1.5" />
    <circle cx="12" cy="12" r="1.5" />
    <circle cx="19" cy="12" r="1.5" />
  </svg>
);

// 设置图标
export const SettingsIcon: React.FC<IconProps> = ({ 
  size = 24, 
  color = 'currentColor',
  className 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke={color}
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
  </svg>
);

// 图层上移
export const LayerUpIcon: React.FC<IconProps> = ({ 
  size = 24, 
  color = 'currentColor',
  className 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke={color}
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <rect x="3" y="14" width="18" height="7" rx="1" />
    <rect x="6" y="8" width="12" height="6" rx="1" />
    <rect x="9" y="3" width="6" height="5" rx="1" />
  </svg>
);

// 图层下移
export const LayerDownIcon: React.FC<IconProps> = ({ 
  size = 24, 
  color = 'currentColor',
  className 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke={color}
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <rect x="3" y="3" width="18" height="7" rx="1" />
    <rect x="6" y="10" width="12" height="6" rx="1" />
    <rect x="9" y="16" width="6" height="5" rx="1" />
  </svg>
);

// 翻转水平
export const FlipHIcon: React.FC<IconProps> = ({ 
  size = 24, 
  color = 'currentColor',
  className 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke={color}
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M12 20V4" />
    <path d="M18 20V4" />
    <path d="M6 20V4" />
  </svg>
);

// 翻转垂直
export const FlipVIcon: React.FC<IconProps> = ({ 
  size = 24, 
  color = 'currentColor',
  className 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke={color}
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M4 12h16" />
    <path d="M4 18h16" />
    <path d="M4 6h16" />
  </svg>
);

// 缩放重置
export const ResetZoomIcon: React.FC<IconProps> = ({ 
  size = 24, 
  color = 'currentColor',
  className 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke={color}
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M15 3h6v6" />
    <path d="M9 21H3v-6" />
    <path d="M21 3l-7 7" />
    <path d="M3 21l7-7" />
  </svg>
);

// 放大
export const ZoomInIcon: React.FC<IconProps> = ({ 
  size = 24, 
  color = 'currentColor',
  className 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke={color}
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <circle cx="11" cy="11" r="8" />
    <path d="M21 21l-4.35-4.35" />
    <path d="M11 8v6" />
    <path d="M8 11h6" />
  </svg>
);

// 缩小
export const ZoomOutIcon: React.FC<IconProps> = ({ 
  size = 24, 
  color = 'currentColor',
  className 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke={color}
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <circle cx="11" cy="11" r="8" />
    <path d="M21 21l-4.35-4.35" />
    <path d="M8 11h6" />
  </svg>
);

// 保存
export const SaveIcon: React.FC<IconProps> = ({ 
  size = 24, 
  color = 'currentColor',
  className 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke={color}
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
    <polyline points="17 21 17 13 7 13 7 21" />
    <polyline points="7 3 7 8 15 8" />
  </svg>
);

// 删除
export const TrashIcon: React.FC<IconProps> = ({ 
  size = 24, 
  color = 'currentColor',
  className 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke={color}
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
  </svg>
);

// 键盘快捷键
export const KeyboardIcon: React.FC<IconProps> = ({ 
  size = 24, 
  color = 'currentColor',
  className 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke={color}
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="M6 8h.01" />
    <path d="M10 8h.01" />
    <path d="M14 8h.01" />
    <path d="M18 8h.01" />
    <path d="M6 12h.01" />
    <path d="M10 12h.01" />
    <path d="M14 12h.01" />
    <path d="M18 12h.01" />
    <path d="M6 16h12" />
  </svg>
);
