import { useState, useCallback, useRef, useEffect } from 'react';
import { nanoid } from 'nanoid';
import { KonvaEventObject } from 'konva/lib/Node';
import { StageData } from '../redux/currentStageData';
import useItem from './useItem';

export type PolygonPoint = {
  x: number;
  y: number;
};

export type DrawPolygonState = 'idle' | 'drawing';

/**
 * 自由多边形绘制 Hook
 * 点击多个点绘制多边形，大角度自动转为曲线
 */
const useDrawPolygon = () => {
  const { createItem } = useItem();
  
  // 绘制状态
  const [drawState, setDrawState] = useState<DrawPolygonState>('idle');
  
  // 多边形点列表
  const [points, setPoints] = useState<PolygonPoint[]>([]);
  
  // 临时点（鼠标位置）
  const [tempPoint, setTempPoint] = useState<PolygonPoint | null>(null);
  
  // 是否闭合
  const isClosedRef = useRef(false);
  
  // 使用 ref 存储最新状态，避免闭包问题
  const pointsRef = useRef<PolygonPoint[]>([]);
  
  // 同步 ref 和 state
  useEffect(() => {
    pointsRef.current = points;
  }, [points]);

  /**
   * 计算三个点的夹角
   */
  const calculateAngle = (p1: PolygonPoint, p2: PolygonPoint, p3: PolygonPoint): number => {
    const v1 = { x: p1.x - p2.x, y: p1.y - p2.y };
    const v2 = { x: p3.x - p2.x, y: p3.y - p2.y };
    
    const dot = v1.x * v2.x + v1.y * v2.y;
    const det = v1.x * v2.y - v1.y * v2.x;
    
    let angle = Math.atan2(det, dot) * 180 / Math.PI;
    if (angle < 0) angle += 360;
    
    return angle;
  };

  /**
   * 计算点到点的距离
   */
  const getDistance = (p1: PolygonPoint, p2: PolygonPoint): number => {
    return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
  };

  /**
   * 完成多边形绘制 - 必须在 addPoint 之前定义
   */
  const finishPolygon = useCallback(() => {
    const currentPoints = pointsRef.current;
    
    if (currentPoints.length < 3) {
      console.log('点太少，至少需要3个点');
      return;
    }
    
    // 计算路径点（直线连接）
    const pathPoints: number[] = [];
    currentPoints.forEach(p => {
      pathPoints.push(p.x, p.y);
    });
    
    // 闭合多边形
    pathPoints.push(currentPoints[0].x, currentPoints[0].y);
    
    // 检测是否需要曲线（大角度）
    const hasLargeAngle = currentPoints.some((_, i) => {
      if (currentPoints.length < 3) return false;
      const prev = currentPoints[(i - 1 + currentPoints.length) % currentPoints.length];
      const curr = currentPoints[i];
      const next = currentPoints[(i + 1) % currentPoints.length];
      const angle = calculateAngle(prev, curr, next);
      return angle > 120;
    });
    
    // 创建多边形
    const newPolygon: StageData = {
      id: nanoid(),
      attrs: {
        name: 'label-target',
        'data-item-type': 'line',
        x: 0,
        y: 0,
        points: pathPoints,
        fill: hasLargeAngle ? 'rgba(255, 152, 0, 0.3)' : 'transparent',
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
    console.log('创建多边形:', { points: currentPoints.length, hasLargeAngle });
    
    // 重置
    setPoints([]);
    setTempPoint(null);
    setDrawState('idle');
    isClosedRef.current = false;
  }, [createItem]);

  /**
   * 开始绘制
   */
  const startDraw = useCallback(() => {
    console.log('useDrawPolygon: 开始绘制多边形');
    setDrawState('drawing');
    setPoints([]);
    setTempPoint(null);
    isClosedRef.current = false;
    pointsRef.current = [];
  }, []);

  /**
   * 退出绘制
   */
  const exitDraw = useCallback(() => {
    setDrawState('idle');
    setPoints([]);
    setTempPoint(null);
    isClosedRef.current = false;
    pointsRef.current = [];
  }, []);

  /**
   * 添加点
   */
  const addPoint = useCallback((x: number, y: number) => {
    console.log('添加点:', { x, y });
    const newPoint = { x, y };
    
    const currentPoints = pointsRef.current;
    
    // 如果已有至少3个点，检查是否点击了起点（闭合）
    if (currentPoints.length >= 3) {
      const firstPoint = currentPoints[0];
      const distToFirst = getDistance(newPoint, firstPoint);
      console.log('距离起点:', distToFirst);
      
      // 点击起点附近（30像素内）则闭合
      if (distToFirst < 30) {
        console.log('点击起点附近，闭合多边形');
        isClosedRef.current = true;
        finishPolygon();
        return;
      }
    }
    
    setPoints(prev => [...prev, newPoint]);
  }, [finishPolygon]);

  /**
   * 更新临时点（鼠标移动）
   */
  const updateTempPoint = useCallback((x: number, y: number) => {
    if (drawState === 'drawing') {
      setTempPoint({ x, y });
    }
  }, [drawState]);

  /**
   * 双击完成
   */
  const handleDoubleClick = useCallback(() => {
    if (drawState === 'drawing') {
      const currentPoints = pointsRef.current;
      if (currentPoints.length >= 3) {
        isClosedRef.current = true;
        finishPolygon();
      }
    }
  }, [drawState, finishPolygon]);

  /**
   * 右键取消最后一个点
   */
  const handleRightClick = useCallback((e: KonvaEventObject<MouseEvent>) => {
    e.evt.preventDefault();
    setPoints(prev => prev.slice(0, -1));
  }, []);

  return {
    drawState,
    points,
    tempPoint,
    startDraw,
    exitDraw,
    addPoint,
    updateTempPoint,
    finishPolygon,
    handleDoubleClick,
    handleRightClick,
    isDrawing: drawState === 'drawing',
  };
};

export default useDrawPolygon;
