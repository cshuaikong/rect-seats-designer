import React from 'react';
import * as Icons from './EditorIcons';

interface IconMapProps {
  iconName: string;
  size?: number;
  color?: string;
  className?: string;
}

// 图标名称映射
const iconMap: Record<string, React.FC<Icons.IconProps>> = {
  // 工具图标
  'cursor': Icons.CursorIcon,
  'brush': Icons.BrushIcon,
  'seat-draw': Icons.SeatDrawIcon,
  'row': Icons.RowIcon,
  'section': Icons.SectionIcon,
  'rect': Icons.RectIcon,
  'circle': Icons.CircleIcon,
  'polygon': Icons.PolygonIcon,
  'text': Icons.TextIcon,
  'image': Icons.ImageIcon,
  'people': Icons.PeopleIcon,
  'more': Icons.MoreIcon,
  
  // 操作图标
  'settings': Icons.SettingsIcon,
  'layer-up': Icons.LayerUpIcon,
  'layer-down': Icons.LayerDownIcon,
  'flip-h': Icons.FlipHIcon,
  'flip-v': Icons.FlipVIcon,
  'reset-zoom': Icons.ResetZoomIcon,
  'zoom-in': Icons.ZoomInIcon,
  'zoom-out': Icons.ZoomOutIcon,
  'save': Icons.SaveIcon,
  'trash': Icons.TrashIcon,
  'keyboard': Icons.KeyboardIcon,
};

export const IconMap: React.FC<IconMapProps> = ({ 
  iconName, 
  size = 20, 
  color = 'currentColor',
  className 
}) => {
  const IconComponent = iconMap[iconName];
  
  if (!IconComponent) {
    // 如果没有找到图标，返回默认的 Bootstrap 图标
    return <i className={`bi-${iconName}`} style={{ fontSize: size }} />;
  }
  
  return <IconComponent size={size} color={color} className={className} />;
};

export default IconMap;
