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

// 绘制步骤（用于 section-seatsio 模式）
type DrawStep = 'idle' | 'first' | 'second' | 'third';

interface UseSeatDrawingReturn {
  drawMode: SeatDrawMode;
  isDrawing: boolean;
  previewSeats: SeatData[];
  startPoint: { x: number; y: number } | null;
  currentRowLabel: string;
  // 区块配置
  sectionConfig: {
    seatsPerRow: number;
    rowCount: number;
  };
  // 当前绘制步骤
  drawStep: DrawStep;
  // 第一行信息（第二点确定）
  firstRowEnd: { x: number; y: number } | null;
  
  startSeatMode: (mode: SeatDrawMode) => void;
  exitSeatMode: () => void;
  setCurrentRowLabel: (label: string) => void;
  setSectionConfig: (config: { seatsPerRow?: number; rowCount?: number }) => void;
  
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
  // 区块配置
  const [sectionConfig, setSectionConfigState] = useState({
    seatsPerRow: 8,
    rowCount: 5,
  });
  // 绘制步骤（用于 section-seatsio 模式）
  const [drawStep, setDrawStep] = useState<DrawStep>('idle');
  // 第一行终点（第二点确定）
  const [firstRowEnd, setFirstRowEnd] = useState<{ x: number; y: number } | null>(null);
  
  const rowIndexRef = useRef(0);
  const config = defaultSeatMapConfig;
  
  // 更新区块配置
  const setSectionConfig = useCallback((newConfig: { seatsPerRow?: number; rowCount?: number }) => {
    setSectionConfigState(prev => ({
      ...prev,
      ...newConfig,
    }));
  }, []);
  
  // 开始座位绘制模式
  const startSeatMode = useCallback((mode: SeatDrawMode) => {
    console.log('开始座位绘制模式:', mode);
    setDrawMode(mode);
    setPreviewSeats([]);
    setStartPoint(null);
    setFirstRowEnd(null);
    setDrawStep('idle');
  }, []);
  
  // 退出绘制模式
  const exitSeatMode = useCallback(() => {
    setDrawMode('idle');
    setPreviewSeats([]);
    setStartPoint(null);
    setFirstRowEnd(null);
    setDrawStep('idle');
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
  const generatePreview = useCallback((
    startX: number, 
    startY: number, 
    endX: number, 
    endY: number, 
    mode: SeatDrawMode,
    step?: DrawStep,
    firstRowEndPoint?: { x: number; y: number } | null
  ) => {
    const distance = getDistance(startX, startY, endX, endY);
    const angle = getAngle(startX, startY, endX, endY);
    const spacing = config.defaultSeatSpacing;
    
    if (mode === 'row-straight') {
      // 固定间距实时添加模式：鼠标移动时一个一个添加座位
      const seats: SeatData[] = [];
      let seatNumber = 1;
      
      // 起点始终显示（第一个座位）
      seats.push({
        id: `preview-start`,
        rowNumber: currentRowLabel,
        seatNumber: String(seatNumber++),
        x: startX,
        y: startY,
        radius: config.defaultSeatRadius,
        status: 'available' as SeatStatus,
        type: 'seat' as const,
      });
      
      // 沿着路径每隔 spacing 放置一个座位（实时添加模式）
      let currentDist = spacing;
      while (currentDist <= distance) {
        const ratio = currentDist / distance;
        const seatX = startX + Math.cos(angle) * distance * ratio;
        const seatY = startY + Math.sin(angle) * distance * ratio;
        seats.push({
          id: `preview-${Math.round(currentDist)}`,
          rowNumber: currentRowLabel,
          seatNumber: String(seatNumber++),
          x: seatX,
          y: seatY,
          radius: config.defaultSeatRadius,
          status: 'available' as SeatStatus,
          type: 'seat' as const,
        });
        currentDist += spacing;
      }
      return seats
    } else if (mode === 'section') {
      // 三点式折线行绘制
      const currentStep = step || 'first';
      
      if (currentStep === 'first') {
        // 第一步：只显示起点
        return [{
          id: 'start-point',
          rowNumber: currentRowLabel,
          seatNumber: '1',
          x: startX,
          y: startY,
          radius: config.defaultSeatRadius,
          status: 'available' as SeatStatus,
          type: 'seat' as const,
        }];
      } else if (currentStep === 'second') {
        // 第二步：固定间距实时添加模式
        const seats: SeatData[] = [];
        let seatNumber = 1;
        
        // 起点始终显示
        seats.push({
          id: `preview-start`,
          rowNumber: currentRowLabel,
          seatNumber: String(seatNumber++),
          x: startX,
          y: startY,
          radius: config.defaultSeatRadius,
          status: 'available' as SeatStatus,
          type: 'seat' as const,
        });
        
        // 沿着路径每隔 spacing 放置一个座位
        let currentDist = spacing;
        while (currentDist <= distance) {
          const ratio = currentDist / distance;
          const seatX = startX + Math.cos(angle) * distance * ratio;
          const seatY = startY + Math.sin(angle) * distance * ratio;
          seats.push({
            id: `preview-${Math.round(currentDist)}`,
            rowNumber: currentRowLabel,
            seatNumber: String(seatNumber++),
            x: seatX,
            y: seatY,
            radius: config.defaultSeatRadius,
            status: 'available' as SeatStatus,
            type: 'seat' as const,
          });
          currentDist += spacing;
        }
        return seats
      } else if (currentStep === 'third' && firstRowEndPoint) {
        // 第三步：显示完整的有角度单行
        // 关键：第二段起点是第一段最后一个座位的实际位置，不是鼠标点击的第2点
        const seats: SeatData[] = [];
        let seatNumber = 1;
        
        // 第一段：从第1点向第2点方向绘制，每隔 spacing 放一个座位
        const segment1Distance = getDistance(startX, startY, firstRowEndPoint.x, firstRowEndPoint.y);
        const segment1Angle = getAngle(startX, startY, firstRowEndPoint.x, firstRowEndPoint.y);
        
        // 第1点（起点）
        seats.push({
          id: `preview-s1-start`,
          rowNumber: currentRowLabel,
          seatNumber: String(seatNumber++),
          x: startX,
          y: startY,
          radius: config.defaultSeatRadius,
          status: 'available' as SeatStatus,
          type: 'seat' as const,
        });
        
        // 沿着第一段每隔 spacing 放置一个座位
        let currentDist = spacing;
        while (currentDist <= segment1Distance) {
          const ratio = currentDist / segment1Distance;
          const seatX = startX + Math.cos(segment1Angle) * segment1Distance * ratio;
          const seatY = startY + Math.sin(segment1Angle) * segment1Distance * ratio;
          seats.push({
            id: `preview-s1-${Math.round(currentDist)}`,
            rowNumber: currentRowLabel,
            seatNumber: String(seatNumber++),
            x: seatX,
            y: seatY,
            radius: config.defaultSeatRadius,
            status: 'available' as SeatStatus,
            type: 'seat' as const,
          });
          currentDist += spacing;
        }
        
        // 获取第一段最后一个座位的实际位置（转折点）
        const lastSeatOfSeg1 = seats[seats.length - 1];
        const turningPoint = { x: lastSeatOfSeg1.x, y: lastSeatOfSeg1.y };
        
        // 第二段：从第一段最后一个座位的实际位置（转折点）向鼠标方向继续延伸
        const segment2Distance = getDistance(turningPoint.x, turningPoint.y, endX, endY);
        const segment2Angle = getAngle(turningPoint.x, turningPoint.y, endX, endY);
        
        // 第二段从 spacing 开始（转折点已经是第一段最后一个座位）
        let currentDist2 = spacing;
        while (currentDist2 <= segment2Distance) {
          const ratio = currentDist2 / segment2Distance;
          const seatX = turningPoint.x + Math.cos(segment2Angle) * segment2Distance * ratio;
          const seatY = turningPoint.y + Math.sin(segment2Angle) * segment2Distance * ratio;
          seats.push({
            id: `preview-s2-${Math.round(currentDist2)}`,
            rowNumber: currentRowLabel,
            seatNumber: String(seatNumber++),
            x: seatX,
            y: seatY,
            radius: config.defaultSeatRadius,
            status: 'available' as SeatStatus,
            type: 'seat' as const,
          });
          currentDist2 += spacing;
        }
        return seats
      }
      return [];
    } else if (mode === 'section-diagonal') {
      // Seats.io 风格三点式绘制
      const currentStep = step || 'first';
      
      if (currentStep === 'first') {
        // 第一步：只显示起点
        return [{
          id: 'start-point',
          rowNumber: currentRowLabel,
          seatNumber: '1',
          x: startX,
          y: startY,
          radius: config.defaultSeatRadius,
          status: 'available' as SeatStatus,
          type: 'seat' as const,
        }];
      } else if (currentStep === 'second') {
        // 第二步：显示第一行的预览（固定间距实时添加）
        const seats: SeatData[] = [];
        let seatNumber = 1;
        
        // 起点始终显示
        seats.push({
          id: `preview-r0-start`,
          rowNumber: currentRowLabel,
          seatNumber: String(seatNumber++),
          x: startX,
          y: startY,
          radius: config.defaultSeatRadius,
          status: 'available' as SeatStatus,
          type: 'seat' as const,
        });
        
        // 沿着路径每隔 spacing 放置一个座位
        let currentDist = spacing;
        while (currentDist <= distance) {
          const ratio = currentDist / distance;
          const seatX = startX + Math.cos(angle) * distance * ratio;
          const seatY = startY + Math.sin(angle) * distance * ratio;
          seats.push({
            id: `preview-r0-${Math.round(currentDist)}`,
            rowNumber: currentRowLabel,
            seatNumber: String(seatNumber++),
            x: seatX,
            y: seatY,
            radius: config.defaultSeatRadius,
            status: 'available' as SeatStatus,
            type: 'seat' as const,
          });
          currentDist += spacing;
        }
        return seats
      } else if (currentStep === 'third' && firstRowEndPoint) {
        // 第三步：显示多行区块预览（固定间距实时添加）
        const firstRowDistance = getDistance(startX, startY, firstRowEndPoint.x, firstRowEndPoint.y);
        const firstRowAngle = getAngle(startX, startY, firstRowEndPoint.x, firstRowEndPoint.y);
        
        // 计算行的方向和距离（从第2点到鼠标位置）
        const rowDirectionAngle = getAngle(firstRowEndPoint.x, firstRowEndPoint.y, endX, endY);
        const rowDistance = getDistance(firstRowEndPoint.x, firstRowEndPoint.y, endX, endY);
        
        const rowSpacing = config.defaultRowSpacing;
        
        const seats: SeatData[] = [];
        let rowIndex = 0;
        
        // 生成每一行（固定行间距实时添加）
        let currentRowDist = 0;
        while (currentRowDist <= rowDistance) {
          const rowRatio = rowDistance === 0 ? 0 : currentRowDist / rowDistance;
          // 每行的起点 = 第1点 + 行方向偏移
          const rowOffsetX = Math.cos(rowDirectionAngle) * rowDistance * rowRatio;
          const rowOffsetY = Math.sin(rowDirectionAngle) * rowDistance * rowRatio;
          const rowStartX = startX + rowOffsetX;
          const rowStartY = startY + rowOffsetY;
          const rowLabel = generateRowLabel(rowIndexRef.current + rowIndex);
          
          // 为这一行生成座位（固定间距实时添加）
          let seatNumber = 1;
          
          // 该行的起点
          seats.push({
            id: `preview-r${rowIndex}-start`,
            rowNumber: rowLabel,
            seatNumber: String(seatNumber++),
            x: rowStartX,
            y: rowStartY,
            radius: config.defaultSeatRadius,
            status: 'available' as SeatStatus,
            type: 'seat' as const,
          });
          
          // 沿着该行每隔 spacing 放置一个座位
          let currentSeatDist = spacing;
          while (currentSeatDist <= firstRowDistance) {
            const seatRatio = currentSeatDist / firstRowDistance;
            const seatX = rowStartX + Math.cos(firstRowAngle) * firstRowDistance * seatRatio;
            const seatY = rowStartY + Math.sin(firstRowAngle) * firstRowDistance * seatRatio;
            seats.push({
              id: `preview-r${rowIndex}-${Math.round(currentSeatDist)}`,
              rowNumber: rowLabel,
              seatNumber: String(seatNumber++),
              x: seatX,
              y: seatY,
              radius: config.defaultSeatRadius,
              status: 'available' as SeatStatus,
              type: 'seat' as const,
            });
            currentSeatDist += spacing;
          }
          
          currentRowDist += rowSpacing;
          rowIndex++;
        }
        return seats
      }
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
        status: 'available' as SeatStatus,
        type: 'seat' as const,
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
    
    rowIndexRef.current++;
    setCurrentRowLabel(generateRowLabel(rowIndexRef.current));
  }, [config, currentRowLabel, createItem]);
  
  // 创建行 - 固定间距实时添加模式
  const createRow = useCallback((startX: number, startY: number, endX: number, endY: number) => {
    const distance = getDistance(startX, startY, endX, endY);
    const angle = getAngle(startX, startY, endX, endY);
    const spacing = config.defaultSeatSpacing;
    
    console.log('创建行:', { startX, startY, endX, endY });
    
    let seatNumber = 1;
    
    // 起点座位（第一个）
    const startSeatData: StageData = {
      id: nanoid(),
      attrs: {
        name: 'label-target',
        'data-item-type': 'seat',
        x: startX,
        y: startY,
        radius: config.defaultSeatRadius,
        rowNumber: currentRowLabel,
        seatNumber: String(seatNumber++),
        status: 'available' as SeatStatus,
        type: 'seat' as const,
        fill: '#A2A2A2',
        stroke: '#444444',
        strokeWidth: 1,
        zIndex: 0,
        updatedAt: Date.now(),
      },
      className: 'Circle',
      children: [],
    };
    createItem(startSeatData);
    
    // 沿着路径每隔 spacing 放置一个座位
    let currentDist = spacing;
    while (currentDist <= distance) {
      const ratio = currentDist / distance;
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
          seatNumber: String(seatNumber++),
          status: 'available' as SeatStatus,
          type: 'seat' as const,
          fill: '#A2A2A2',
          stroke: '#444444',
          strokeWidth: 1,
          zIndex: 0,
          updatedAt: Date.now(),
        },
        className: 'Circle',
        children: [],
      };
      createItem(seatData);
      currentDist += spacing;
    }
    
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
    
    rowIndexRef.current++;
    setCurrentRowLabel(generateRowLabel(rowIndexRef.current));
  }, [config, currentRowLabel, createItem]);
  
  // 创建三点式有角度单行座位 - 第一段终点是转折点，第二段从转折点延伸
  const createAngledRow = useCallback((
    firstPoint: { x: number; y: number },
    secondPoint: { x: number; y: number },
    thirdPoint: { x: number; y: number }
  ) => {
    const spacing = config.defaultSeatSpacing;
    let seatNumber = 1;
    
    console.log('创建有角度单行:', { firstPoint, secondPoint, thirdPoint });
    
    // 第一段：从第1点到第2点（单行逻辑，最后一点正好是第2点）
    const segment1Distance = getDistance(firstPoint.x, firstPoint.y, secondPoint.x, secondPoint.y);
    const segment1Angle = getAngle(firstPoint.x, firstPoint.y, secondPoint.x, secondPoint.y);
    
    // 第1点（起点）
    createItem({
      id: nanoid(),
      attrs: {
        name: 'label-target',
        'data-item-type': 'seat',
        x: firstPoint.x,
        y: firstPoint.y,
        radius: config.defaultSeatRadius,
        rowNumber: currentRowLabel,
        seatNumber: String(seatNumber++),
        status: 'available' as SeatStatus,
        type: 'seat' as const,
        fill: '#A2A2A2',
        stroke: '#444444',
        strokeWidth: 1,
        zIndex: 0,
        updatedAt: Date.now(),
      },
      className: 'Circle',
      children: [],
    });
    
    // 沿着第一段每隔 spacing 放置一个座位
    let currentDist = spacing;
    let lastSeatPos = { x: firstPoint.x, y: firstPoint.y };
    while (currentDist <= segment1Distance) {
      const ratio = currentDist / segment1Distance;
      const seatX = firstPoint.x + Math.cos(segment1Angle) * segment1Distance * ratio;
      const seatY = firstPoint.y + Math.sin(segment1Angle) * segment1Distance * ratio;
      
      createItem({
        id: nanoid(),
        attrs: {
          name: 'label-target',
          'data-item-type': 'seat',
          x: seatX,
          y: seatY,
          radius: config.defaultSeatRadius,
          rowNumber: currentRowLabel,
          seatNumber: String(seatNumber++),
          status: 'available' as SeatStatus,
          type: 'seat' as const,
          fill: '#A2A2A2',
          stroke: '#444444',
          strokeWidth: 1,
          zIndex: 0,
          updatedAt: Date.now(),
        },
        className: 'Circle',
        children: [],
      });
      
      lastSeatPos = { x: seatX, y: seatY };
      currentDist += spacing;
    }
    
    // 第二段：从第一段最后一个座位的实际位置（转折点）向第3点方向继续延伸
    const segment2Distance = getDistance(lastSeatPos.x, lastSeatPos.y, thirdPoint.x, thirdPoint.y);
    const segment2Angle = getAngle(lastSeatPos.x, lastSeatPos.y, thirdPoint.x, thirdPoint.y);
    
    // 从转折点开始，每隔 spacing 放置一个座位
    let currentDist2 = spacing;
    while (currentDist2 <= segment2Distance) {
      const ratio = currentDist2 / segment2Distance;
      const seatX = lastSeatPos.x + Math.cos(segment2Angle) * segment2Distance * ratio;
      const seatY = lastSeatPos.y + Math.sin(segment2Angle) * segment2Distance * ratio;
      
      createItem({
        id: nanoid(),
        attrs: {
          name: 'label-target',
          'data-item-type': 'seat',
          x: seatX,
          y: seatY,
          radius: config.defaultSeatRadius,
          rowNumber: currentRowLabel,
          seatNumber: String(seatNumber++),
          status: 'available' as SeatStatus,
          type: 'seat' as const,
          fill: '#A2A2A2',
          stroke: '#444444',
          strokeWidth: 1,
          zIndex: 0,
          updatedAt: Date.now(),
        },
        className: 'Circle',
        children: [],
      });
      currentDist2 += spacing;
    }
    
    // 行标签放在起点
    const labelData: StageData = {
      id: nanoid(),
      attrs: {
        name: 'label-target',
        'data-item-type': 'text',
        x: firstPoint.x - 30,
        y: firstPoint.y - 8,
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
    
    rowIndexRef.current++;
    setCurrentRowLabel(generateRowLabel(rowIndexRef.current));
  }, [config, currentRowLabel, createItem]);
  
  // 创建多行区块（基于三点式，第3点决定行排列）- 固定间距实时添加模式
  const createMultiRowSection = useCallback((
    firstPoint: { x: number; y: number },
    secondPoint: { x: number; y: number },
    thirdPoint: { x: number; y: number }
  ) => {
    const spacing = config.defaultSeatSpacing;
    const firstRowDistance = getDistance(firstPoint.x, firstPoint.y, secondPoint.x, secondPoint.y);
    const firstRowAngle = getAngle(firstPoint.x, firstPoint.y, secondPoint.x, secondPoint.y);
    
    // 计算行的方向和距离（从第2点到第3点）
    const rowDirectionAngle = getAngle(secondPoint.x, secondPoint.y, thirdPoint.x, thirdPoint.y);
    const rowDistance = getDistance(secondPoint.x, secondPoint.y, thirdPoint.x, thirdPoint.y);
    
    const rowSpacing = config.defaultRowSpacing;
    
    console.log('创建多行区块:', { firstRowDistance, rowDistance });
    
    let rowIndex = 0;
    let currentRowDist = 0;
    
    // 生成每一行（固定行间距实时添加）
    while (currentRowDist <= rowDistance) {
      const rowRatio = rowDistance === 0 ? 0 : currentRowDist / rowDistance;
      // 每行的起点 = 第1点 + 行方向偏移
      const rowOffsetX = Math.cos(rowDirectionAngle) * rowDistance * rowRatio;
      const rowOffsetY = Math.sin(rowDirectionAngle) * rowDistance * rowRatio;
      const rowStartX = firstPoint.x + rowOffsetX;
      const rowStartY = firstPoint.y + rowOffsetY;
      const rowLabel = generateRowLabel(rowIndexRef.current + rowIndex);
      
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
      
      // 该行座位（固定间距实时添加）
      let seatNumber = 1;
      
      // 该行起点座位
      const startSeatData: StageData = {
        id: nanoid(),
        attrs: {
          name: 'label-target',
          'data-item-type': 'seat',
          x: rowStartX,
          y: rowStartY,
          radius: config.defaultSeatRadius,
          rowNumber: rowLabel,
          seatNumber: String(seatNumber++),
          status: 'available' as SeatStatus,
          type: 'seat' as const,
          fill: '#A2A2A2',
          stroke: '#444444',
          strokeWidth: 1,
          zIndex: 0,
          updatedAt: Date.now(),
        },
        className: 'Circle',
        children: [],
      };
      createItem(startSeatData);
      
      // 沿着该行每隔 spacing 放置一个座位
      let currentSeatDist = spacing;
      while (currentSeatDist <= firstRowDistance) {
        const seatRatio = currentSeatDist / firstRowDistance;
        const seatX = rowStartX + Math.cos(firstRowAngle) * firstRowDistance * seatRatio;
        const seatY = rowStartY + Math.sin(firstRowAngle) * firstRowDistance * seatRatio;
        
        const seatData: StageData = {
          id: nanoid(),
          attrs: {
            name: 'label-target',
            'data-item-type': 'seat',
            x: seatX,
            y: seatY,
            radius: config.defaultSeatRadius,
            rowNumber: rowLabel,
            seatNumber: String(seatNumber++),
            status: 'available' as SeatStatus,
            type: 'seat' as const,
            fill: '#A2A2A2',
            stroke: '#444444',
            strokeWidth: 1,
            zIndex: 0,
            updatedAt: Date.now(),
          },
          className: 'Circle',
          children: [],
        };
        createItem(seatData);
        currentSeatDist += spacing;
      }
      
      currentRowDist += rowSpacing;
      rowIndex++;
    }
    
    rowIndexRef.current += rowIndex;
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
    
    // Seats.io 风格三点式区块
    if (drawMode === 'section-diagonal') {
      if (drawStep === 'idle' || drawStep === 'first') {
        // 第一步：确定起点
        console.log('Seats.io 第一步 - 起点:', { x, y });
        setStartPoint({ x, y });
        setDrawStep('second');
        setPreviewSeats([{
          id: 'start-point',
          rowNumber: currentRowLabel,
          seatNumber: '1',
          x, y,
          radius: config.defaultSeatRadius,
          status: 'available' as SeatStatus,
          type: 'seat' as const,
        }]);
      } else if (drawStep === 'second') {
        // 第二步：确定第一行终点
        console.log('Seats.io 第二步 - 第一行终点:', { x, y });
        if (startPoint) {
          setFirstRowEnd({ x, y });
          setDrawStep('third');
        }
      } else if (drawStep === 'third') {
        // 第三步：确定行方向，创建区块
        console.log('Seats.io 第三步 - 创建区块:', { x, y });
        if (startPoint && firstRowEnd) {
          createMultiRowSection(startPoint, firstRowEnd, { x, y });
          
          // 重置状态
          setStartPoint(null);
          setFirstRowEnd(null);
          setDrawStep('idle');
          setPreviewSeats([]);
        }
      }
      return;
    }
    
    // 三点式有角度单行（section 模式）
    if (drawMode === 'section') {
      if (drawStep === 'idle' || drawStep === 'first') {
        // 第一步：确定起点
        console.log('有角度行 第一步 - 起点:', { x, y });
        setStartPoint({ x, y });
        setDrawStep('second');
        setPreviewSeats([{
          id: 'start-point',
          rowNumber: currentRowLabel,
          seatNumber: '1',
          x, y,
          radius: config.defaultSeatRadius,
          status: 'available' as SeatStatus,
          type: 'seat' as const,
        }]);
      } else if (drawStep === 'second') {
        // 第二步：确定第一行终点（也是第二行起点）
        console.log('有角度行 第二步 - 第一行终点:', { x, y });
        if (startPoint) {
          setFirstRowEnd({ x, y });
          setDrawStep('third');
        }
      } else if (drawStep === 'third') {
        // 第三步：确定第二行方向，创建有角度单行
        console.log('有角度行 第三步 - 创建:', { x, y });
        if (startPoint && firstRowEnd) {
          createAngledRow(startPoint, firstRowEnd, { x, y });
          
          // 重置状态
          setStartPoint(null);
          setFirstRowEnd(null);
          setDrawStep('idle');
          setPreviewSeats([]);
        }
      }
      return;
    }
    
    // 行模式：第一次点击确定起点，第二次点击确定终点
    if (!startPoint) {
      console.log('设置起点:', { x, y });
      setStartPoint({ x, y });
      setPreviewSeats([{
        id: 'start-point',
        rowNumber: currentRowLabel,
        seatNumber: '1',
        x, y,
        radius: config.defaultSeatRadius,
        status: 'available' as SeatStatus,
        type: 'seat' as const,
      }]);
    } else {
      console.log('设置终点，创建行:', { start: startPoint, end: { x, y } });
      createRow(startPoint.x, startPoint.y, x, y);
      setStartPoint(null);
      setPreviewSeats([]);
    }
  }, [drawMode, drawStep, startPoint, firstRowEnd, currentRowLabel, config, createSingleSeat, createRow, createAngledRow, createMultiRowSection]);
  
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
    
    // 三点式预览（section 和 section-diagonal 模式）
    let newPreview: SeatData[];
    if (drawMode === 'section' || drawMode === 'section-diagonal') {
      newPreview = generatePreview(startPoint.x, startPoint.y, x, y, drawMode, drawStep, firstRowEnd);
    } else {
      newPreview = generatePreview(startPoint.x, startPoint.y, x, y, drawMode);
    }
    
    // 只有当预览实际变化时才更新状态，避免不必要的重渲染
    setPreviewSeats(prev => {
      if (prev.length !== newPreview.length) return newPreview;
      for (let i = 0; i < prev.length; i++) {
        if (prev[i].id !== newPreview[i].id || 
            Math.abs(prev[i].x - newPreview[i].x) > 0.5 || 
            Math.abs(prev[i].y - newPreview[i].y) > 0.5) {
          return newPreview;
        }
      }
      return prev;
    });
  }, [drawMode, drawStep, startPoint, firstRowEnd, generatePreview]);
  
  // 键盘事件 - ESC取消
  const onKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      if ((drawMode === 'section' || drawMode === 'section-diagonal') && drawStep !== 'idle') {
        console.log('取消三点式绘制');
        setStartPoint(null);
        setFirstRowEnd(null);
        setDrawStep('idle');
        setPreviewSeats([]);
      } else if (startPoint) {
        console.log('取消当前绘制');
        setStartPoint(null);
        setPreviewSeats([]);
      }
    }
  }, [drawMode, drawStep, startPoint]);
  
  // 注册键盘事件
  useEffect(() => {
    if (drawMode !== 'idle') {
      window.addEventListener('keydown', onKeyDown);
      return () => window.removeEventListener('keydown', onKeyDown);
    }
  }, [drawMode, onKeyDown]);
  
  // 获取鼠标样式 - 座位绘制模式使用普通光标
  const getCursor = useCallback(() => {
    return 'default';
  }, []);
  
  return {
    drawMode,
    isDrawing: drawMode !== 'idle',
    previewSeats,
    startPoint,
    currentRowLabel,
    sectionConfig,
    drawStep,
    firstRowEnd,
    startSeatMode,
    exitSeatMode,
    setCurrentRowLabel,
    setSectionConfig,
    onMouseDown,
    onMouseMove,
    onKeyDown,
    getCursor,
  };
};

export default useSeatDrawing;
