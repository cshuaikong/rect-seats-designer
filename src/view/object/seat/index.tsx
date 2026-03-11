import React, { RefObject, useRef } from 'react';
import { Circle as CircleType } from 'konva/lib/shapes/Circle';
import { Circle, Text, Group } from 'react-konva';
import { KonvaEventObject } from 'konva/lib/Node';
import useItem, { OverrideItemProps } from '../../../hook/useItem';
import { StageData } from '../../../redux/currentStageData';
import { SeatStatus, defaultSeatMapConfig } from '../../../types/seat';

export type SeatItemProps = OverrideItemProps<{
  data: StageData;
}>;

const SeatItem: React.FC<SeatItemProps> = ({ data, onSelect }) => {
  const { attrs } = data;
  const seatRef = useRef() as RefObject<CircleType>;
  const { updateItem } = useItem();
  
  const {
    rowNumber,
    seatNumber,
    status = 'available',
    radius = 6,
    fill,
    stroke,
    strokeWidth,
  } = attrs;
  
  const getStatusColor = (s: SeatStatus): string => {
    return defaultSeatMapConfig.statusColors[s] || defaultSeatMapConfig.statusColors.available;
  };
  
  // 新绘制的座位默认灰色，不应用状态颜色
  const seatColor = fill || '#9E9E9E';
  
  const handleClick = (e: KonvaEventObject<MouseEvent>) => {
    // 阻止事件冒泡，避免触发 Stage 的点击
    e.cancelBubble = true;
    if (onSelect) {
      onSelect(e);
    }
  };
  
  const handleDblClick = (e: KonvaEventObject<MouseEvent>) => {
    e.evt.stopPropagation();
    const statuses: SeatStatus[] = ['available', 'booked', 'reserved', 'disabled'];
    const currentIndex = statuses.indexOf(status as SeatStatus);
    const nextStatus = statuses[(currentIndex + 1) % statuses.length];
    
    updateItem(data.id, () => ({
      ...attrs,
      status: nextStatus,
      fill: defaultSeatMapConfig.statusColors[nextStatus],
      updatedAt: Date.now(),
    }));
  };
  
  return (
    <Group x={attrs.x} y={attrs.y}>
      {/* 主座位圆形 - 包含所有属性和事件 */}
      <Circle
        ref={seatRef}
        onClick={handleClick}
        onTap={handleClick}
        onDblClick={handleDblClick}
        onDblTap={handleDblClick}
        name="label-target"
        data-item-type="seat"
        id={data.id}
        x={0}
        y={0}
        radius={radius}
        fill={seatColor}
        stroke={stroke || '#444444'}
        strokeWidth={strokeWidth || 1}
        rowNumber={rowNumber}
        seatNumber={seatNumber}
        perfectDrawEnabled={false}
        listening={true}
      />
      {/* 文字 - 不监听事件 */}
      <Text
        x={-radius}
        y={-radius}
        width={radius * 2}
        height={radius * 2}
        text={String(seatNumber)}
        fontSize={radius * 0.8}
        fontFamily="Arial"
        fill="#fff"
        align="center"
        verticalAlign="middle"
        listening={false}
      />
    </Group>
  );
};

export default SeatItem;
