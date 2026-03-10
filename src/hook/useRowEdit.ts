import { useState, useCallback, useRef, useEffect } from 'react';
import { KonvaEventObject } from 'konva/lib/Node';
import { StageData } from '../redux/currentStageData';
import useItem from './useItem';
import { nanoid } from 'nanoid';

// 行编辑状态
export type RowEditMode = 'idle' | 'editing';

export interface RowData {
  rowNumber: string;
  seats: StageData[];
  centerX: number;
  centerY: number;
  angle: number;
}

export interface UseRowEditReturn {
  rowEditMode: RowEditMode;
  selectedRow: RowData | null;
  startRowEdit: () => void;
  exitRowEdit: () => void;
  selectRowBySeat: (seatData: StageData, allSeats: StageData[]) => void;
  addSeatToStart: () => void;
  addSeatToEnd: () => void;
  removeSeatFromStart: () => void;
  removeSeatFromEnd: () => void;
  rotateRow: (deltaAngle: number) => void;
  moveRow: (deltaX: number, deltaY: number) => void;
  getRowCursor: () => string;
}

export const useRowEdit = (): UseRowEditReturn => {
  const { createItem, updateItem, removeItem } = useItem();
  const [rowEditMode, setRowEditMode] = useState<RowEditMode>('idle');
  const [selectedRow, setSelectedRow] = useState<RowData | null>(null);
  
  // 记录拖动开始位置
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);

  // 开始行编辑模式
  const startRowEdit = useCallback(() => {
    setRowEditMode('editing');
    setSelectedRow(null);
  }, []);

  // 退出行编辑模式
  const exitRowEdit = useCallback(() => {
    setRowEditMode('idle');
    setSelectedRow(null);
  }, []);

  // 通过座位选择整行
  const selectRowBySeat = useCallback((seatData: StageData, allSeats: StageData[]) => {
    if (rowEditMode !== 'editing') return;
    
    const rowNumber = seatData.attrs.rowNumber as string;
    
    // 找到同排的所有座位
    const rowSeats = allSeats
      .filter(seat => seat.attrs.rowNumber === rowNumber)
      .sort((a, b) => {
        const numA = parseInt(a.attrs.seatNumber as string) || 0;
        const numB = parseInt(b.attrs.seatNumber as string) || 0;
        return numA - numB;
      });

    if (rowSeats.length === 0) return;

    // 计算行中心和角度
    const positions = rowSeats.map(seat => ({
      x: seat.attrs.x as number,
      y: seat.attrs.y as number,
    }));

    const centerX = positions.reduce((sum, p) => sum + p.x, 0) / positions.length;
    const centerY = positions.reduce((sum, p) => sum + p.y, 0) / positions.length;

    // 计算角度（基于第一个和最后一个座位）
    const firstSeat = positions[0];
    const lastSeat = positions[positions.length - 1];
    const angle = Math.atan2(lastSeat.y - firstSeat.y, lastSeat.x - firstSeat.x) * (180 / Math.PI);

    setSelectedRow({
      rowNumber,
      seats: rowSeats,
      centerX,
      centerY,
      angle,
    });
  }, [rowEditMode]);

  // 在开头添加座位
  const addSeatToStart = useCallback(() => {
    if (!selectedRow || selectedRow.seats.length === 0) return;

    const firstSeat = selectedRow.seats[0];
    const secondSeat = selectedRow.seats[1];
    
    // 计算间距和方向
    let spacing = 18; // 默认间距
    let angleRad = 0;
    
    if (secondSeat) {
      const dx = (firstSeat.attrs.x as number) - (secondSeat.attrs.x as number);
      const dy = (firstSeat.attrs.y as number) - (secondSeat.attrs.y as number);
      spacing = Math.sqrt(dx * dx + dy * dy);
      angleRad = Math.atan2(dy, dx);
    } else {
      angleRad = selectedRow.angle * (Math.PI / 180);
    }

    // 计算新座位位置（在第一个座位前面）
    const newX = (firstSeat.attrs.x as number) + Math.cos(angleRad) * spacing;
    const newY = (firstSeat.attrs.y as number) + Math.sin(angleRad) * spacing;
    
    const newSeatNumber = String(parseInt(firstSeat.attrs.seatNumber as string) - 1);

    // 创建新座位
    const newSeat: StageData = {
      id: nanoid(),
      attrs: {
        name: 'label-target',
        'data-item-type': 'seat',
        x: newX,
        y: newY,
        radius: 6,
        rowNumber: selectedRow.rowNumber,
        seatNumber: newSeatNumber,
        status: 'available',
        type: 'seat',
        fill: '#A2A2A2',
        stroke: '#444444',
        strokeWidth: 1,
        zIndex: 0,
        updatedAt: Date.now(),
      },
      className: 'Circle',
      children: [],
    };

    createItem(newSeat);

    // 更新选中行（添加新座位到开头）
    setSelectedRow(prev => {
      if (!prev) return null;
      return {
        ...prev,
        seats: [newSeat, ...prev.seats],
      };
    });
  }, [selectedRow, createItem]);

  // 在末尾添加座位
  const addSeatToEnd = useCallback(() => {
    if (!selectedRow || selectedRow.seats.length === 0) return;

    const lastSeat = selectedRow.seats[selectedRow.seats.length - 1];
    const secondLastSeat = selectedRow.seats[selectedRow.seats.length - 2];
    
    let spacing = 18;
    let angleRad = 0;
    
    if (secondLastSeat) {
      const dx = (lastSeat.attrs.x as number) - (secondLastSeat.attrs.x as number);
      const dy = (lastSeat.attrs.y as number) - (secondLastSeat.attrs.y as number);
      spacing = Math.sqrt(dx * dx + dy * dy);
      angleRad = Math.atan2(dy, dx);
    } else {
      angleRad = selectedRow.angle * (Math.PI / 180);
    }

    const newX = (lastSeat.attrs.x as number) + Math.cos(angleRad) * spacing;
    const newY = (lastSeat.attrs.y as number) + Math.sin(angleRad) * spacing;
    
    const newSeatNumber = String(parseInt(lastSeat.attrs.seatNumber as string) + 1);

    const newSeat: StageData = {
      id: nanoid(),
      attrs: {
        name: 'label-target',
        'data-item-type': 'seat',
        x: newX,
        y: newY,
        radius: 6,
        rowNumber: selectedRow.rowNumber,
        seatNumber: newSeatNumber,
        status: 'available',
        type: 'seat',
        fill: '#A2A2A2',
        stroke: '#444444',
        strokeWidth: 1,
        zIndex: 0,
        updatedAt: Date.now(),
      },
      className: 'Circle',
      children: [],
    };

    createItem(newSeat);

    setSelectedRow(prev => {
      if (!prev) return null;
      return {
        ...prev,
        seats: [...prev.seats, newSeat],
      };
    });
  }, [selectedRow, createItem]);

  // 删除开头座位
  const removeSeatFromStart = useCallback(() => {
    if (!selectedRow || selectedRow.seats.length <= 1) return;

    const firstSeat = selectedRow.seats[0];
    removeItem(firstSeat.id);

    setSelectedRow(prev => {
      if (!prev) return null;
      return {
        ...prev,
        seats: prev.seats.slice(1),
      };
    });
  }, [selectedRow, removeItem]);

  // 删除末尾座位
  const removeSeatFromEnd = useCallback(() => {
    if (!selectedRow || selectedRow.seats.length <= 1) return;

    const lastSeat = selectedRow.seats[selectedRow.seats.length - 1];
    removeItem(lastSeat.id);

    setSelectedRow(prev => {
      if (!prev) return null;
      return {
        ...prev,
        seats: prev.seats.slice(0, -1),
      };
    });
  }, [selectedRow, removeItem]);

  // 旋转整行
  const rotateRow = useCallback((deltaAngle: number) => {
    if (!selectedRow) return;

    const newAngle = selectedRow.angle + deltaAngle;
    const angleRad = newAngle * (Math.PI / 180);
    const oldAngleRad = selectedRow.angle * (Math.PI / 180);

    selectedRow.seats.forEach((seat, index) => {
      const relativeX = (seat.attrs.x as number) - selectedRow.centerX;
      const relativeY = (seat.attrs.y as number) - selectedRow.centerY;
      
      // 旋转相对位置
      const cos = Math.cos((deltaAngle * Math.PI) / 180);
      const sin = Math.sin((deltaAngle * Math.PI) / 180);
      
      const newRelativeX = relativeX * cos - relativeY * sin;
      const newRelativeY = relativeX * sin + relativeY * cos;
      
      updateItem(seat.id, () => ({
        ...seat.attrs,
        x: selectedRow.centerX + newRelativeX,
        y: selectedRow.centerY + newRelativeY,
        updatedAt: Date.now(),
      }));
    });

    setSelectedRow(prev => {
      if (!prev) return null;
      return {
        ...prev,
        angle: newAngle,
      };
    });
  }, [selectedRow, updateItem]);

  // 移动整行
  const moveRow = useCallback((deltaX: number, deltaY: number) => {
    if (!selectedRow) return;

    selectedRow.seats.forEach(seat => {
      updateItem(seat.id, () => ({
        ...seat.attrs,
        x: (seat.attrs.x as number) + deltaX,
        y: (seat.attrs.y as number) + deltaY,
        updatedAt: Date.now(),
      }));
    });

    setSelectedRow(prev => {
      if (!prev) return null;
      return {
        ...prev,
        centerX: prev.centerX + deltaX,
        centerY: prev.centerY + deltaY,
      };
    });
  }, [selectedRow, updateItem]);

  // 获取鼠标样式
  const getRowCursor = useCallback(() => {
    if (rowEditMode === 'idle') return 'default';
    return 'pointer';
  }, [rowEditMode]);

  return {
    rowEditMode,
    selectedRow,
    startRowEdit,
    exitRowEdit,
    selectRowBySeat,
    addSeatToStart,
    addSeatToEnd,
    removeSeatFromStart,
    removeSeatFromEnd,
    rotateRow,
    moveRow,
    getRowCursor,
  };
};

export default useRowEdit;
