import React, { RefObject, useRef } from 'react';
import { Circle as CircleType } from 'konva/lib/shapes/Circle';
import { Circle, Text, Group } from 'react-konva';
import { KonvaEventObject } from 'konva/lib/Node';
import useItem, { OverrideItemProps } from '../../../hook/useItem';
import useTransformer from '../../../hook/useTransformer';
import { StageData } from '../../../redux/currentStageData';
import { SeatStatus, defaultSeatMapConfig } from '../../../types/seat';

export type SeatItemProps = OverrideItemProps<{
  data: StageData;
  transformer: ReturnType<typeof useTransformer>;
}>;

const SeatItem: React.FC<SeatItemProps> = ({ data, onSelect }) => {
  const { attrs } = data;
  const seatRef = useRef() as RefObject<CircleType>;
  const { updateItem } = useItem();
  
  const {
    rowNumber,
    seatNumber,
    status = 'available',
    radius = 12,
    fill,
    stroke,
    strokeWidth,
  } = attrs;
  
  const getStatusColor = (s: SeatStatus): string => {
    return defaultSeatMapConfig.statusColors[s] || defaultSeatMapConfig.statusColors.available;
  };
  
  const seatColor = fill || getStatusColor(status as SeatStatus);
  
  const handleClick = (e: KonvaEventObject<MouseEvent>) => {
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
    <Group>
      <Circle
        ref={seatRef}
        onClick={handleClick}
        onDblClick={handleDblClick}
        name="label-target"
        data-item-type="seat"
        id={data.id}
        x={attrs.x}
        y={attrs.y}
        radius={radius}
        fill={seatColor}
        stroke={stroke || '#2E7D32'}
        strokeWidth={strokeWidth || 1}
        draggable
        onDragEnd={(e) => {
          updateItem(data.id, () => ({
            ...attrs,
            x: e.target.x(),
            y: e.target.y(),
            updatedAt: Date.now(),
          }));
        }}
      />
      <Text
        x={attrs.x - radius}
        y={attrs.y - radius}
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
