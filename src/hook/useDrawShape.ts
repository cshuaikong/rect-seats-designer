import { useState, useCallback, useRef } from 'react';
import { nanoid } from 'nanoid';
import { KonvaEventObject } from 'konva/lib/Node';
import { StageData } from '../redux/currentStageData';
import useItem from './useItem';

export type DrawMode = 'idle' | 'rectangle' | 'ellipse';

export type PreviewRect = {
  x: number;
  y: number;
  width: number;
  height: number;
  visible: boolean;
};

/**
 * 形状绘制 Hook
 * 支持手动拖拽绘制矩形、椭圆等形状
 */
const useDrawShape = () => {
  const { createItem } = useItem();
  
  // 绘制模式
  const [drawMode, setDrawMode] = useState<DrawMode>('idle');
  
  // 预览矩形
  const [previewRect, setPreviewRect] = useState<PreviewRect>({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    visible: false,
  });
  
  // 绘制状态
  const isDrawingRef = useRef(false);
  const startPosRef = useRef({ x: 0, y: 0 });

  /**
   * 开始绘制模式
   */
  const startDrawMode = useCallback((mode: DrawMode) => {
    setDrawMode(mode);
    console.log('进入绘制模式:', mode);
  }, []);

  /**
   * 退出绘制模式
   */
  const exitDrawMode = useCallback(() => {
    setDrawMode('idle');
    setPreviewRect({ x: 0, y: 0, width: 0, height: 0, visible: false });
    isDrawingRef.current = false;
    console.log('退出绘制模式');
  }, []);

  /**
   * 处理鼠标按下 - 开始绘制
   */
  const handleMouseDown = useCallback((e: KonvaEventObject<MouseEvent>) => {
    if (drawMode === 'idle') return;
    
    // 只响应左键
    if (e.evt.button !== 0) return;
    
    const stage = e.target.getStage();
    if (!stage) return;
    
    // 获取鼠标位置（考虑画布缩放和平移）
    const pointerPos = stage.getPointerPosition();
    if (!pointerPos) return;
    
    const scale = stage.scaleX();
    const stageX = stage.x();
    const stageY = stage.y();
    
    // 计算相对于画布的坐标
    const x = (pointerPos.x - stageX) / scale;
    const y = (pointerPos.y - stageY) / scale;
    
    isDrawingRef.current = true;
    startPosRef.current = { x, y };
    
    setPreviewRect({
      x,
      y,
      width: 0,
      height: 0,
      visible: true,
    });
    
    console.log('开始绘制:', { x, y });
  }, [drawMode]);

  /**
   * 处理鼠标移动 - 实时预览
   */
  const handleMouseMove = useCallback((e: KonvaEventObject<MouseEvent>) => {
    if (drawMode === 'idle') return;
    if (!isDrawingRef.current) return;
    
    const stage = e.target.getStage();
    if (!stage) return;
    
    const pointerPos = stage.getPointerPosition();
    if (!pointerPos) return;
    
    const scale = stage.scaleX();
    const stageX = stage.x();
    const stageY = stage.y();
    
    const currentX = (pointerPos.x - stageX) / scale;
    const currentY = (pointerPos.y - stageY) / scale;
    
    const startX = startPosRef.current.x;
    const startY = startPosRef.current.y;
    
    // 计算矩形（支持向任意方向拖拽）
    const x = Math.min(startX, currentX);
    const y = Math.min(startY, currentY);
    const width = Math.abs(currentX - startX);
    const height = Math.abs(currentY - startY);
    
    setPreviewRect({
      x,
      y,
      width,
      height,
      visible: true,
    });
  }, [drawMode]);

  /**
   * 处理鼠标松开 - 完成绘制
   */
  const handleMouseUp = useCallback(() => {
    if (drawMode === 'idle') return;
    if (!isDrawingRef.current) return;
    
    isDrawingRef.current = false;
    
    const { x, y, width, height } = previewRect;
    
    // 太小则不创建
    if (width < 10 || height < 10) {
      setPreviewRect({ x: 0, y: 0, width: 0, height: 0, visible: false });
      return;
    }
    
    // 根据模式创建不同形状
    if (drawMode === 'rectangle') {
      createRectangle(x, y, width, height);
    } else if (drawMode === 'ellipse') {
      createEllipse(x, y, width, height);
    }
    
    // 重置预览
    setPreviewRect({ x: 0, y: 0, width: 0, height: 0, visible: false });
    
    // 可选：退出绘制模式
    // exitDrawMode();
  }, [drawMode, previewRect, exitDrawMode]);

  /**
   * 创建矩形
   */
  const createRectangle = (x: number, y: number, width: number, height: number) => {
    // Konva Rect 使用左上角坐标 (x, y)
    // 直接使用 width/height，不通过 radius 计算
    const newRect: StageData = {
      id: nanoid(),
      attrs: {
        name: 'label-target',
        'data-item-type': 'shape',
        x: x,  // 左上角 x
        y: y,  // 左上角 y
        width,
        height,
        fill: '#4CAF50',
        stroke: '#2E7D32',
        strokeWidth: 2,
        sides: 4,
        radius: 0,  // 矩形不需要 radius
        zIndex: 0,
        brightness: 0,
        updatedAt: Date.now(),
      },
      className: 'Rect',
      children: [],
    };
    
    createItem(newRect);
    console.log('创建矩形:', { x, y, width, height });
  };

  /**
   * 创建椭圆
   */
  const createEllipse = (x: number, y: number, width: number, height: number) => {
    // Konva Ellipse 使用中心点和 radiusX/radiusY
    const centerX = x + width / 2;
    const centerY = y + height / 2;
    const radiusX = width / 2;
    const radiusY = height / 2;
    
    const newEllipse: StageData = {
      id: nanoid(),
      attrs: {
        name: 'label-target',
        'data-item-type': 'shape',
        x: centerX,  // 椭圆中心点
        y: centerY,
        radiusX,
        radiusY,
        fill: '#2196F3',  // 蓝色
        stroke: '#1565C0',
        strokeWidth: 2,
        sides: 0,  // 标记为椭圆
        radius: 0,
        zIndex: 0,
        brightness: 0,
        updatedAt: Date.now(),
      },
      className: 'Ellipse',
      children: [],
    };
    
    createItem(newEllipse);
    console.log('创建椭圆:', { centerX, centerY, radiusX, radiusY });
  };

  /**
   * 获取鼠标样式
   */
  const getCursor = () => {
    switch (drawMode) {
      case 'rectangle':
        return 'crosshair';  // 十字光标
      case 'ellipse':
        return 'crosshair';
      default:
        return 'default';
    }
  };

  return {
    drawMode,
    previewRect,
    startDrawMode,
    exitDrawMode,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    getCursor,
    isDrawing: drawMode !== 'idle',
  };
};

export default useDrawShape;
