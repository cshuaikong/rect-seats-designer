import React, { useState, useCallback } from 'react';
import { Layer, Rect, Circle, Line, Text, Group } from 'react-konva';
import { StageData } from '../redux/currentStageData';
import { RowData } from '../hook/useRowEdit';
import { KonvaEventObject } from 'konva/lib/Node';

interface RowEditorProps {
  selectedRow: RowData | null;
  onAddSeatToStart: () => void;
  onAddSeatToEnd: () => void;
  onRemoveSeatFromStart: () => void;
  onRemoveSeatFromEnd: () => void;
  onRotateRow: (deltaAngle: number) => void;
  onMoveRow: (deltaX: number, deltaY: number) => void;
}

const HANDLE_SIZE = 8;
const ROTATION_HANDLE_DISTANCE = 40;

const RowEditor: React.FC<RowEditorProps> = ({
  selectedRow,
  onAddSeatToStart,
  onAddSeatToEnd,
  onRemoveSeatFromStart,
  onRemoveSeatFromEnd,
  onRotateRow,
  onMoveRow,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [isRotating, setIsRotating] = useState(false);
  const [rotationStart, setRotationStart] = useState<number>(0);

  if (!selectedRow || selectedRow.seats.length === 0) return null;

  // 计算行的边界框
  const xs = selectedRow.seats.map(s => s.attrs.x as number);
  const ys = selectedRow.seats.map(s => s.attrs.y as number);
  const minX = Math.min(...xs) - 12;
  const maxX = Math.max(...xs) + 12;
  const minY = Math.min(...ys) - 12;
  const maxY = Math.max(...ys) + 12;
  const width = maxX - minX;
  const height = maxY - minY;

  // 计算旋转手柄位置
  const angleRad = selectedRow.angle * (Math.PI / 180);
  const rotationHandleX = selectedRow.centerX + Math.sin(angleRad) * ROTATION_HANDLE_DISTANCE;
  const rotationHandleY = selectedRow.centerY - Math.cos(angleRad) * ROTATION_HANDLE_DISTANCE;

  // 计算左右手柄位置
  const firstSeat = selectedRow.seats[0];
  const lastSeat = selectedRow.seats[selectedRow.seats.length - 1];
  
  const leftHandleX = (firstSeat.attrs.x as number) - Math.cos(angleRad) * 20;
  const leftHandleY = (firstSeat.attrs.y as number) - Math.sin(angleRad) * 20;
  
  const rightHandleX = (lastSeat.attrs.x as number) + Math.cos(angleRad) * 20;
  const rightHandleY = (lastSeat.attrs.y as number) + Math.sin(angleRad) * 20;

  // 处理整体移动
  const handleMoveStart = useCallback((e: KonvaEventObject<MouseEvent>) => {
    e.cancelBubble = true;
    setIsDragging(true);
    setDragStart({ x: e.evt.clientX, y: e.evt.clientY });
  }, []);

  const handleMoveDrag = useCallback((e: KonvaEventObject<MouseEvent>) => {
    if (!isDragging || !dragStart) return;
    e.cancelBubble = true;
    
    const deltaX = e.evt.clientX - dragStart.x;
    const deltaY = e.evt.clientY - dragStart.y;
    
    onMoveRow(deltaX, deltaY);
    setDragStart({ x: e.evt.clientX, y: e.evt.clientY });
  }, [isDragging, dragStart, onMoveRow]);

  const handleMoveEnd = useCallback(() => {
    setIsDragging(false);
    setDragStart(null);
  }, []);

  // 处理旋转
  const handleRotateStart = useCallback((e: KonvaEventObject<MouseEvent>) => {
    e.cancelBubble = true;
    setIsRotating(true);
    const dx = e.evt.clientX - selectedRow.centerX;
    const dy = e.evt.clientY - selectedRow.centerY;
    setRotationStart(Math.atan2(dy, dx) * (180 / Math.PI));
  }, [selectedRow]);

  const handleRotateDrag = useCallback((e: KonvaEventObject<MouseEvent>) => {
    if (!isRotating) return;
    e.cancelBubble = true;
    
    const dx = e.evt.clientX - selectedRow.centerX;
    const dy = e.evt.clientY - selectedRow.centerY;
    const currentAngle = Math.atan2(dy, dx) * (180 / Math.PI);
    const deltaAngle = currentAngle - rotationStart;
    
    onRotateRow(deltaAngle);
    setRotationStart(currentAngle);
  }, [isRotating, rotationStart, selectedRow, onRotateRow]);

  const handleRotateEnd = useCallback(() => {
    setIsRotating(false);
    setRotationStart(0);
  }, []);

  return (
    <Layer listening={true}>
      {/* 选中行的背景高亮 */}
      <Rect
        x={minX}
        y={minY}
        width={width}
        height={height}
        fill="rgba(25, 113, 194, 0.1)"
        stroke="#1971c2"
        strokeWidth={1}
        dash={[4, 4]}
        rotation={selectedRow.angle}
        offsetX={0}
        offsetY={0}
      />

      {/* 行标签 */}
      <Text
        x={selectedRow.centerX - 20}
        y={minY - 25}
        text={`Row ${selectedRow.rowNumber}`}
        fontSize={12}
        fontFamily="Arial"
        fill="#1971c2"
        fontStyle="bold"
      />

      {/* 左端添加/删除手柄 */}
      <Group
        x={leftHandleX}
        y={leftHandleY}
        rotation={selectedRow.angle}
      >
        {/* 减号按钮 */}
        <Circle
          x={-15}
          y={0}
          radius={10}
          fill="#fa5252"
          stroke="#fff"
          strokeWidth={2}
          onClick={onRemoveSeatFromStart}
          onTap={onRemoveSeatFromStart}
          cursor="pointer"
        />
        <Line
          points={[-20, 0, -10, 0]}
          stroke="#fff"
          strokeWidth={2}
          listening={false}
        />
        
        {/* 加号按钮 */}
        <Circle
          x={-35}
          y={0}
          radius={10}
          fill="#40c057"
          stroke="#fff"
          strokeWidth={2}
          onClick={onAddSeatToStart}
          onTap={onAddSeatToStart}
          cursor="pointer"
        />
        <Line
          points={[-40, 0, -30, 0]}
          stroke="#fff"
          strokeWidth={2}
          listening={false}
        />
        <Line
          points={[-35, -5, -35, 5]}
          stroke="#fff"
          strokeWidth={2}
          listening={false}
        />
      </Group>

      {/* 右端添加/删除手柄 */}
      <Group
        x={rightHandleX}
        y={rightHandleY}
        rotation={selectedRow.angle}
      >
        {/* 加号按钮 */}
        <Circle
          x={15}
          y={0}
          radius={10}
          fill="#40c057"
          stroke="#fff"
          strokeWidth={2}
          onClick={onAddSeatToEnd}
          onTap={onAddSeatToEnd}
          cursor="pointer"
        />
        <Line
          points={[10, 0, 20, 0]}
          stroke="#fff"
          strokeWidth={2}
          listening={false}
        />
        <Line
          points={[15, -5, 15, 5]}
          stroke="#fff"
          strokeWidth={2}
          listening={false}
        />
        
        {/* 减号按钮 */}
        <Circle
          x={35}
          y={0}
          radius={10}
          fill="#fa5252"
          stroke="#fff"
          strokeWidth={2}
          onClick={onRemoveSeatFromEnd}
          onTap={onRemoveSeatFromEnd}
          cursor="pointer"
        />
        <Line
          points={[30, 0, 40, 0]}
          stroke="#fff"
          strokeWidth={2}
          listening={false}
        />
      </Group>

      {/* 旋转控制点 */}
      <Group
        x={rotationHandleX}
        y={rotationHandleY}
        onMouseDown={handleRotateStart}
        onMouseMove={handleRotateDrag}
        onMouseUp={handleRotateEnd}
        onMouseLeave={handleRotateEnd}
        onTouchStart={handleRotateStart as any}
        onTouchMove={handleRotateDrag as any}
        onTouchEnd={handleRotateEnd as any}
      >
        {/* 连接线 */}
        <Line
          points={[0, 0, -Math.sin(angleRad) * ROTATION_HANDLE_DISTANCE, Math.cos(angleRad) * ROTATION_HANDLE_DISTANCE]}
          stroke="#1971c2"
          strokeWidth={1}
          dash={[4, 4]}
        />
        {/* 旋转点 */}
        <Circle
          radius={8}
          fill="#1971c2"
          stroke="#fff"
          strokeWidth={2}
          cursor="crosshair"
        />
        {/* 旋转图标 */}
        <Text
          x={-6}
          y={-6}
          text="↻"
          fontSize={12}
          fill="#fff"
          listening={false}
        />
      </Group>

      {/* 中心移动手柄 */}
      <Circle
        x={selectedRow.centerX}
        y={selectedRow.centerY}
        radius={12}
        fill="#1971c2"
        stroke="#fff"
        strokeWidth={2}
        onMouseDown={handleMoveStart}
        onMouseMove={handleMoveDrag}
        onMouseUp={handleMoveEnd}
        onMouseLeave={handleMoveEnd}
        cursor="move"
        opacity={0.8}
      />
      <Text
        x={selectedRow.centerX - 4}
        y={selectedRow.centerY - 6}
        text="✥"
        fontSize={14}
        fill="#fff"
        listening={false}
      />
    </Layer>
  );
};

export default RowEditor;
