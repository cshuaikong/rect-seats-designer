import { useState, useCallback, useRef, useEffect } from 'react';
import { nanoid } from 'nanoid';
import { KonvaEventObject } from 'konva/lib/Node';
import { StageData } from '../redux/currentStageData';
import useItem from './useItem';

export type DrawToolMode = 'idle' | 'rectangle' | 'ellipse' | 'polygon';

export type PolygonPoint = { x: number; y: number };

export type PreviewRect = {
  x: number;
  y: number;
  width: number;
  height: number;
  visible: boolean;
};

/**
 * 统一绘制工具 Hook
 * 管理矩形、椭圆、多边形的绘制
 */
const useDrawTools = () => {
  const { createItem } = useItem();
  
  // 当前绘制模式
  const [drawMode, setDrawMode] = useState<DrawToolMode>('idle');
  
  // 矩形/椭圆预览
  const [previewRect, setPreviewRect] = useState<PreviewRect>({
    x: 0, y: 0, width: 0, height: 0, visible: false,
  });
  
  // 多边形点列表
  const [polygonPoints, setPolygonPoints] = useState<PolygonPoint[]>([]);
  const [polygonTempPoint, setPolygonTempPoint] = useState<PolygonPoint | null>(null);
  
  // 绘制状态
  const isDrawingRef = useRef(false);
  const startPosRef = useRef({ x: 0, y: 0 });
  const pointsRef = useRef<PolygonPoint[]>([]);
  const previewRectRef = useRef(previewRect);
  
  // 同步 ref
  useEffect(() => {
    pointsRef.current = polygonPoints;
  }, [polygonPoints]);
  
  useEffect(() => {
    previewRectRef.current = previewRect;
  }, [previewRect]);

  /**
   * 开始绘制模式
   */
  const startDrawMode = useCallback((mode: DrawToolMode) => {
    console.log('开始绘制模式:', mode);
    setDrawMode(mode);
    setPreviewRect({ x: 0, y: 0, width: 0, height: 0, visible: false });
    setPolygonPoints([]);
    setPolygonTempPoint(null);
    isDrawingRef.current = false;
  }, []);

  /**
   * 退出绘制模式
   */
  const exitDrawMode = useCallback(() => {
    console.log('退出绘制模式');
    setDrawMode('idle');
    setPreviewRect({ x: 0, y: 0, width: 0, height: 0, visible: false });
    setPolygonPoints([]);
    setPolygonTempPoint(null);
    isDrawingRef.current = false;
  }, []);

  /**
   * 获取鼠标样式
   */
  const getCursor = useCallback(() => {
    return drawMode !== 'idle' ? 'crosshair' : 'default';
  }, [drawMode]);

  // ==================== 矩形/椭圆绘制 ====================

  /**
   * 处理鼠标按下（矩形/椭圆）
   */
  const handleShapeMouseDown = useCallback((e: KonvaEventObject<MouseEvent>) => {
    console.log('handleShapeMouseDown 被调用', { button: e.evt.button, drawMode });
    if (e.evt.button !== 0) return;
    
    const stage = e.target.getStage();
    if (!stage) {
      console.log('没有找到 stage');
      return;
    }
    
    const pos = stage.getPointerPosition();
    if (!pos) {
      console.log('没有获取到指针位置');
      return;
    }
    
    const scale = stage.scaleX();
    const x = (pos.x - stage.x()) / scale;
    const y = (pos.y - stage.y()) / scale;
    
    console.log('开始矩形/椭圆绘制:', { x, y });
    isDrawingRef.current = true;
    startPosRef.current = { x, y };
    
    setPreviewRect({ x, y, width: 0, height: 0, visible: true });
  }, [drawMode]);

  /**
   * 处理鼠标移动（矩形/椭圆）
   */
  const handleShapeMouseMove = useCallback((e: KonvaEventObject<MouseEvent>) => {
    if (!isDrawingRef.current) {
      console.log('鼠标移动但不在绘制中');
      return;
    }
    
    const stage = e.target.getStage();
    if (!stage) return;
    
    const pos = stage.getPointerPosition();
    if (!pos) return;
    
    const scale = stage.scaleX();
    const currentX = (pos.x - stage.x()) / scale;
    const currentY = (pos.y - stage.y()) / scale;
    
    const startX = startPosRef.current.x;
    const startY = startPosRef.current.y;
    
    const x = Math.min(startX, currentX);
    const y = Math.min(startY, currentY);
    const width = Math.abs(currentX - startX);
    const height = Math.abs(currentY - startY);
    
    console.log('更新预览:', { x, y, width, height });
    setPreviewRect({ x, y, width, height, visible: true });
  }, []);

  /**
   * 处理鼠标松开（矩形/椭圆）
   */
  const handleShapeMouseUp = useCallback(() => {
    console.log('handleShapeMouseUp 被调用', { isDrawing: isDrawingRef.current });
    if (!isDrawingRef.current) return;
    
    isDrawingRef.current = false;
    const { x, y, width, height } = previewRectRef.current;
    console.log('创建形状:', { drawMode, x, y, width, height });
    
    if (width < 10 || height < 10) {
      console.log('尺寸太小，取消创建');
      setPreviewRect({ x: 0, y: 0, width: 0, height: 0, visible: false });
      return;
    }
    
    if (drawMode === 'rectangle') {
      createRectangle(x, y, width, height);
    } else if (drawMode === 'ellipse') {
      createEllipse(x, y, width, height);
    }
    
    setPreviewRect({ x: 0, y: 0, width: 0, height: 0, visible: false });
  }, [drawMode]);

  /**
   * 创建矩形
   */
  const createRectangle = (x: number, y: number, width: number, height: number) => {
    const newRect: StageData = {
      id: nanoid(),
      attrs: {
        name: 'label-target',
        'data-item-type': 'shape',
        x, y, width, height,
        fill: '#4CAF50',
        stroke: '#2E7D32',
        strokeWidth: 2,
        sides: 4,
        radius: 0,
        zIndex: 0,
        brightness: 0,
        updatedAt: Date.now(),
      },
      className: 'Rect',
      children: [],
    };
    createItem(newRect);
  };

  /**
   * 创建椭圆
   */
  const createEllipse = (x: number, y: number, width: number, height: number) => {
    const newEllipse: StageData = {
      id: nanoid(),
      attrs: {
        name: 'label-target',
        'data-item-type': 'shape',
        x: x + width / 2,
        y: y + height / 2,
        radiusX: width / 2,
        radiusY: height / 2,
        fill: '#2196F3',
        stroke: '#1565C0',
        strokeWidth: 2,
        sides: 0,
        zIndex: 0,
        brightness: 0,
        updatedAt: Date.now(),
      },
      className: 'Ellipse',
      children: [],
    };
    createItem(newEllipse);
  };

  // ==================== 多边形绘制 ====================

  /**
   * 处理多边形点击
   */
  const handlePolygonClick = useCallback((e: KonvaEventObject<MouseEvent>) => {
    const stage = e.target.getStage();
    if (!stage) return;
    
    const pos = stage.getPointerPosition();
    if (!pos) return;
    
    const scale = stage.scaleX();
    const x = (pos.x - stage.x()) / scale;
    const y = (pos.y - stage.y()) / scale;
    
    const newPoint = { x, y };
    const currentPoints = pointsRef.current;
    
    // 检查是否点击起点（闭合）
    if (currentPoints.length >= 3) {
      const firstPoint = currentPoints[0];
      const dist = Math.sqrt(Math.pow(x - firstPoint.x, 2) + Math.pow(y - firstPoint.y, 2));
      if (dist < 30) {
        finishPolygon();
        return;
      }
    }
    
    setPolygonPoints(prev => [...prev, newPoint]);
  }, []);

  /**
   * 处理多边形鼠标移动
   */
  const handlePolygonMove = useCallback((e: KonvaEventObject<MouseEvent>) => {
    const stage = e.target.getStage();
    if (!stage) return;
    
    const pos = stage.getPointerPosition();
    if (!pos) return;
    
    const scale = stage.scaleX();
    const x = (pos.x - stage.x()) / scale;
    const y = (pos.y - stage.y()) / scale;
    
    setPolygonTempPoint({ x, y });
  }, []);

  /**
   * 完成多边形
   */
  const finishPolygon = useCallback(() => {
    const currentPoints = pointsRef.current;
    if (currentPoints.length < 3) return;
    
    // 计算边界框
    const xs = currentPoints.map(p => p.x);
    const ys = currentPoints.map(p => p.y);
    const minX = Math.min(...xs);
    const minY = Math.min(...ys);
    const maxX = Math.max(...xs);
    const maxY = Math.max(...ys);
    const width = maxX - minX;
    const height = maxY - minY;
    
    // 将点转换为相对于边界框左上角的坐标
    const pathPoints: number[] = [];
    currentPoints.forEach(p => {
      pathPoints.push(p.x - minX, p.y - minY);
    });
    
    const newPolygon: StageData = {
      id: nanoid(),
      attrs: {
        name: 'label-target',
        'data-item-type': 'line',
        x: minX,
        y: minY,
        width,
        height,
        points: pathPoints,
        fill: 'rgba(255, 152, 0, 0.3)',
        stroke: '#FF9800',
        strokeWidth: 3,
        closed: true,
        zIndex: 0,
        brightness: 0,
        updatedAt: Date.now(),
      },
      className: 'Line',
      children: [],
    };
    
    createItem(newPolygon);
    exitDrawMode();
  }, [createItem, exitDrawMode]);

  /**
   * 多边形右键撤销
   */
  const handlePolygonRightClick = useCallback((e: KonvaEventObject<MouseEvent>) => {
    e.evt.preventDefault();
    setPolygonPoints(prev => prev.slice(0, -1));
  }, []);

  /**
   * 多边形双击完成
   */
  const handlePolygonDoubleClick = useCallback(() => {
    const currentPoints = pointsRef.current;
    if (currentPoints.length >= 3) {
      finishPolygon();
    }
  }, [finishPolygon]);

  /**
   * 统一鼠标按下处理
   */
  const onMouseDown = useCallback((e: KonvaEventObject<MouseEvent>) => {
    if (drawMode === 'rectangle' || drawMode === 'ellipse') {
      handleShapeMouseDown(e);
    } else if (drawMode === 'polygon') {
      handlePolygonClick(e);
    }
  }, [drawMode, handleShapeMouseDown, handlePolygonClick]);

  /**
   * 统一鼠标移动处理
   */
  const onMouseMove = useCallback((e: KonvaEventObject<MouseEvent>) => {
    if (drawMode === 'rectangle' || drawMode === 'ellipse') {
      handleShapeMouseMove(e);
    } else if (drawMode === 'polygon') {
      handlePolygonMove(e);
    }
  }, [drawMode, handleShapeMouseMove, handlePolygonMove]);

  /**
   * 统一鼠标松开处理
   */
  const onMouseUp = useCallback(() => {
    if (drawMode === 'rectangle' || drawMode === 'ellipse') {
      handleShapeMouseUp();
    }
  }, [drawMode, handleShapeMouseUp]);

  /**
   * 统一双击处理
   */
  const onDoubleClick = useCallback((e: KonvaEventObject<MouseEvent>) => {
    if (drawMode === 'polygon') {
      handlePolygonDoubleClick();
    }
  }, [drawMode, handlePolygonDoubleClick]);

  /**
   * 统一右键处理
   */
  const onContextMenu = useCallback((e: KonvaEventObject<MouseEvent>) => {
    if (drawMode === 'polygon') {
      handlePolygonRightClick(e);
    }
  }, [drawMode, handlePolygonRightClick]);

  return {
    // 状态
    drawMode,
    previewRect,
    polygonPoints,
    polygonTempPoint,
    
    // 控制
    startDrawMode,
    exitDrawMode,
    getCursor,
    
    // 事件处理
    onMouseDown,
    onMouseMove,
    onMouseUp,
    onDoubleClick,
    onContextMenu,
    
    // 判断
    isDrawing: drawMode !== 'idle',
    isPolygonMode: drawMode === 'polygon',
  };
};

export default useDrawTools;
