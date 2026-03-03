import { useState, useCallback, useRef, useEffect } from 'react';
import { nanoid } from 'nanoid';
import { KonvaEventObject } from 'konva/lib/Node';
import { 
  SeatData, 
  SeatDrawMode, 
  SeatStatus,
  defaultSeatMapConfig,
} from '../types/seat';
import { StageData } from '../redux/currentStageData';
import useItem from './useItem';

// 行号生成器
const generateRowLabel = (index: number): string => {
  if (index < 26) {
    return String.fromCharCode(65 + index);
  }
  return String(index - 25);
};

interface UseSeatDrawingReturn {
  drawMode: SeatDrawMode;
  isDrawing: boolean;
  previewSeats: SeatData[];
  startPoint: { x: number; y: number } | null;
  currentRowLabel: string;
  
  startSeatMode: (mode: SeatDrawMode) => void;
  exitSeatMode: () => void;
  setCurrentRowLabel: (label: string) => void;
  
  onMouseDown: (e: KonvaEventObject<MouseEvent>) => void;
  onMouseMove: (e: KonvaEventObject<MouseEvent>) => void;
  onKeyDown: (e: KeyboardEvent) => void;
  
  getCursor: () => string;
}

export const useSeatDrawing = (): UseSeatDrawingReturn => {
  const { createItem } = useItem();
  
  const [drawMode, setDrawMode] = useState<SeatDrawMode>('idle');
  const [previewSeats, setPreviewSeats] = useState<SeatData[]>([]);
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null);
  const [currentRowLabel, setCurrentRowLabel] = useState('A');
  
  const rowIndexRef = useRef(0);
  const config = defaultSeatMapConfig;
  
  // 开始座位绘制模式
  const startSeatMode = useCallback((mode: SeatDrawMode) => {
    console.log('开始座位绘制模式:', mode);
    setDrawMode(mode);
    setPreviewSeats([]);
    setStartPoint(null);
  }, []);
  
  // 退出绘制模式
  const exitSeatMode = useCallback(() => {
    setDrawMode('idle');
    setPreviewSeats([]);
    setStartPoint(null);
  }, []);
  
  // 计算两点距离
  const getDistance = (x1: number, y1: number, x2: number, y2: number) => {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
  };
  
  // 计算两点角度
  const getAngle = (x1: number, y1: number, x2: number, y2: number) => {
    return Math.atan2(y2 - y1, x2 - x1);
  };
  
  // 生成预览座位
  const generatePreview = useCallback((startX: number, startY: number, endX: number, endY: number, mode: SeatDrawMode) => {
    const distance = getDistance(startX, startY, endX, endY);
    const angle = getAngle(startX, startY, endX, endY);
    const spacing = config.defaultSeatSpacing;
    
    if (mode === 'row-straight') {
      const seatCount = Math.max(1, Math.round(distance / spacing));
      const seats: SeatData[] = [];
      
      for (let i = 0; i < seatCount; i++) {
        const ratio = seatCount === 1 ? 0 : i / (seatCount - 1);
        seats.push({
          id: `preview-${i}`,
          rowNumber: currentRowLabel,
          seatNumber: String(i + 1),
          x: startX + Math.cos(angle) * distance * ratio,
          y: startY + Math.sin(angle) * distance * ratio,
          radius: config.defaultSeatRadius,
          status: 'available',
          type: 'seat',
        });
      }
      return seats;
    } else if (mode === 'section') {
      const seatsPerRow = Math.max(1, Math.round(distance / spacing));
      const rowSpacing = config.defaultRowSpacing;
      const perpendicularAngle = angle + Math.PI / 2;
      
      // 根据垂直方向的距离决定行数
      const rowDistance = Math.abs((endY - startY) * Math.cos(perpendicularAngle) - (endX - startX) * Math.sin(perpendicularAngle));
      const rowCount = Math.max(1, Math.round(rowDistance / rowSpacing) + 1);
      
      const seats: SeatData[] = [];
      
      for (let r = 0; r < rowCount; r++) {
        const rowOffset = r * rowSpacing;
        const rowStartX = startX + Math.cos(perpendicularAngle) * rowOffset;
        const rowStartY = startY + Math.sin(perpendicularAngle) * rowOffset;
        const rowLabel = generateRowLabel(rowIndexRef.current + r);
        
        for (let s = 0; s < seatsPerRow; s++) {
          const ratio = seatsPerRow === 1 ? 0 : s / (seatsPerRow - 1);
          seats.push({
            id: `preview-${r}-${s}`,
            rowNumber: rowLabel,
            seatNumber: String(s + 1),
            x: rowStartX + Math.cos(angle) * distance * ratio,
            y: rowStartY + Math.sin(angle) * distance * ratio,
            radius: config.defaultSeatRadius,
            status: 'available',
            type: 'seat',
          });
        }
      }
      return seats;
    }
    
    return [];
  }, [config, currentRowLabel]);
  
  // 创建单个座位
  const createSingleSeat = useCallback((x: number, y: number) => {
    const seatData: StageData = {
      id: nanoid(),
      attrs: {
        name: 'label-target',
        'data-item-type': 'seat',
        x,
        y,
        radius: config.defaultSeatRadius,
        rowNumber: currentRowLabel,
        seatNumber: '1',
        status: 'available',
        type: 'seat',
        fill: config.statusColors.available,
        stroke: '#2E7D32',
        strokeWidth: 1,
        zIndex: 0,
        updatedAt: Date.now(),
      },
      className: 'Circle',
      children: [],
    };
    
    createItem(seatData);
    
    // 更新行号
    rowIndexRef.current++;
    setCurrentRowLabel(generateRowLabel(rowIndexRef.current));
  }, [config, currentRowLabel, createItem]);
  
  // 创建行
  const createRow = useCallback((startX: number, startY: number, endX: number, endY: number) => {
    const distance = getDistance(startX, startY, endX, endY);
    const angle = getAngle(startX, startY, endX, endY);
    const spacing = config.defaultSeatSpacing;
    const seatCount = Math.max(1, Math.round(distance / spacing));
    
    console.log('创建行:', { startX, startY, endX, endY, seatCount });
    
    // 创建座位
    for (let i = 0; i < seatCount; i++) {
      const ratio = seatCount === 1 ? 0 : i / (seatCount - 1);
      const seatX = startX + Math.cos(angle) * distance * ratio;
      const seatY = startY + Math.sin(angle) * distance * ratio;
      
      const seatData: StageData = {
        id: nanoid(),
        attrs: {
          name: 'label-target',
          'data-item-type': 'seat',
          x: seatX,
          y: seatY,
          radius: config.defaultSeatRadius,
          rowNumber: currentRowLabel,
          seatNumber: String(i + 1),
          status: 'available',
          type: 'seat',
          fill: config.statusColors.available,
          stroke: '#2E7D32',
          strokeWidth: 1,
          zIndex: 0,
          updatedAt: Date.now(),
        },
        className: 'Circle',
        children: [],
      };
      createItem(seatData);
    }
    
    // 创建行标签
    const labelData: StageData = {
      id: nanoid(),
      attrs: {
        name: 'label-target',
        'data-item-type': 'text',
        x: startX - 30,
        y: startY - 8,
        text: currentRowLabel,
        fontSize: 14,
        fontFamily: 'Arial',
        fill: '#333',
        zIndex: 1,
        updatedAt: Date.now(),
      },
      className: 'Text',
      children: [],
    };
    createItem(labelData);
    
    // 更新行号
    rowIndexRef.current++;
    setCurrentRowLabel(generateRowLabel(rowIndexRef.current));
  }, [config, currentRowLabel, createItem]);
  
  // 创建区块
  const createSection = useCallback((startX: number, startY: number, endX: number, endY: number) => {
    const distance = getDistance(startX, startY, endX, endY);
    const angle = getAngle(startX, startY, endX, endY);
    const spacing = config.defaultSeatSpacing;
    const rowSpacing = config.defaultRowSpacing;
    
    const seatsPerRow = Math.max(1, Math.round(distance / spacing));
    const perpendicularAngle = angle + Math.PI / 2;
    const rowDistance = Math.abs((endY - startY) * Math.cos(perpendicularAngle) - (endX - startX) * Math.sin(perpendicularAngle));
    const rowCount = Math.max(1, Math.round(rowDistance / rowSpacing) + 1);
    
    console.log('创建区块:', { seatsPerRow, rowCount });
    
    for (let r = 0; r < rowCount; r++) {
      const rowOffset = r * rowSpacing;
      const rowStartX = startX + Math.cos(perpendicularAngle) * rowOffset;
      const rowStartY = startY + Math.sin(perpendicularAngle) * rowOffset;
      const rowLabel = generateRowLabel(rowIndexRef.current + r);
      
      // 行标签
      const labelData: StageData = {
        id: nanoid(),
        attrs: {
          name: 'label-target',
          'data-item-type': 'text',
          x: rowStartX - 30,
          y: rowStartY - 8,
          text: rowLabel,
          fontSize: 14,
          fontFamily: 'Arial',
          fill: '#333',
          zIndex: 1,
          updatedAt: Date.now(),
        },
        className: 'Text',
        children: [],
      };
      createItem(labelData);
      
      // 该行座位
      for (let s = 0; s < seatsPerRow; s++) {
        const ratio = seatsPerRow === 1 ? 0 : s / (seatsPerRow - 1);
        const seatData: StageData = {
          id: nanoid(),
          attrs: {
            name: 'label-target',
            'data-item-type': 'seat',
            x: rowStartX + Math.cos(angle) * distance * ratio,
            y: rowStartY + Math.sin(angle) * distance * ratio,
            radius: config.defaultSeatRadius,
            rowNumber: rowLabel,
            seatNumber: String(s + 1),
            status: 'available',
            type: 'seat',
            fill: config.statusColors.available,
            stroke: '#2E7D32',
            strokeWidth: 1,
            zIndex: 0,
            updatedAt: Date.now(),
          },
          className: 'Circle',
          children: [],
        };
        createItem(seatData);
      }
    }
    
    rowIndexRef.current += rowCount;
    setCurrentRowLabel(generateRowLabel(rowIndexRef.current));
  }, [config, createItem]);
  
  // 鼠标按下/点击
  const onMouseDown = useCallback((e: KonvaEventObject<MouseEvent>) => {
    if (e.evt.button !== 0) return;
    
    const stage = e.target.getStage();
    if (!stage) return;
    
    const pos = stage.getPointerPosition();
    if (!pos) return;
    
    const scale = stage.scaleX();
    const x = (pos.x - stage.x()) / scale;
    const y = (pos.y - stage.y()) / scale;
    
    // 单座位模式：点击直接创建
    if (drawMode === 'single-seat') {
      createSingleSeat(x, y);
      return;
    }
    
    // 行或区块模式：第一次点击确定起点，第二次点击确定终点
    if (!startPoint) {
      // 第一次点击 - 设置起点
      console.log('设置起点:', { x, y });
      setStartPoint({ x, y });
      setPreviewSeats([{
        id: 'start-point',
        rowNumber: currentRowLabel,
        seatNumber: '1',
        x, y,
        radius: config.defaultSeatRadius,
        status: 'available',
        type: 'seat',
      }]);
    } else {
      // 第二次点击 - 确定终点，创建座位
      console.log('设置终点，创建座位:', { start: startPoint, end: { x, y } });
      
      if (drawMode === 'row-straight') {
        createRow(startPoint.x, startPoint.y, x, y);
      } else if (drawMode === 'section') {
        createSection(startPoint.x, startPoint.y, x, y);
      }
      
      // 重置起点，准备下一行/区块
      setStartPoint(null);
      setPreviewSeats([]);
    }
  }, [drawMode, startPoint, currentRowLabel, config, createSingleSeat, createRow, createSection]);
  
  // 鼠标移动 - 更新预览
  const onMouseMove = useCallback((e: KonvaEventObject<MouseEvent>) => {
    if (!startPoint) return;
    if (drawMode === 'single-seat') return;
    
    const stage = e.target.getStage();
    if (!stage) return;
    
    const pos = stage.getPointerPosition();
    if (!pos) return;
    
    const scale = stage.scaleX();
    const x = (pos.x - stage.x()) / scale;
    const y = (pos.y - stage.y()) / scale;
    
    // 生成预览
    const preview = generatePreview(startPoint.x, startPoint.y, x, y, drawMode);
    setPreviewSeats(preview);
  }, [drawMode, startPoint, generatePreview]);
  
  // 键盘事件 - ESC取消
  const onKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape' && startPoint) {
      console.log('取消当前绘制');
      setStartPoint(null);
      setPreviewSeats([]);
    }
  }, [startPoint]);
  
  // 注册键盘事件
  useEffect(() => {
    if (drawMode !== 'idle') {
      window.addEventListener('keydown', onKeyDown);
      return () => window.removeEventListener('keydown', onKeyDown);
    }
  }, [drawMode, onKeyDown]);
  
  // 获取鼠标样式
  const getCursor = useCallback(() => {
    if (drawMode === 'idle') return 'default';
    if (startPoint) return 'crosshair';
    return 'crosshair';
  }, [drawMode, startPoint]);
  
  return {
    drawMode,
    isDrawing: drawMode !== 'idle',
    previewSeats,
    startPoint,
    currentRowLabel,
    startSeatMode,
    exitSeatMode,
    setCurrentRowLabel,
    onMouseDown,
    onMouseMove,
    onKeyDown,
    getCursor,
  };
};

export default useSeatDrawing;
