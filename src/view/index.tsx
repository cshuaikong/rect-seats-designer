import { Stage, Layer, Line, Ellipse, Rect, Group } from "react-konva";
import React, { PropsWithChildren, useEffect, useRef, useCallback, useMemo, useState } from "react";
import { Stage as StageType } from "konva/lib/Stage";
import { Node, NodeConfig, KonvaEventObject } from "konva/lib/Node";
import { PreviewRect, DrawToolMode } from "../hook/useDrawTools";
import { SeatDrawMode, SeatData, defaultSeatMapConfig } from "../types/seat";
import { Circle as SeatCircle, Text as SeatText } from "react-konva";

interface ViewProps extends PropsWithChildren {
  onSelect?: (
    e?: KonvaEventObject<MouseEvent>,
    itemList?: Node<NodeConfig>[],
  ) => void;
  stage: { stageRef: React.MutableRefObject<any> },
  drawMode: DrawToolMode;
  seatDrawMode?: SeatDrawMode;
  previewRect: PreviewRect | null;
  previewSeats?: SeatData[];
  seatStartPoint?: { x: number; y: number } | null;
  polygonPoints: { x: number; y: number }[];
  polygonTempPoint: { x: number; y: number } | null;
  onDrawMouseDown?: (e: KonvaEventObject<MouseEvent>) => void;
  onDrawMouseMove?: (e: KonvaEventObject<MouseEvent>) => void;
  onDrawMouseUp?: (e?: KonvaEventObject<MouseEvent>) => void;
  onDrawDoubleClick?: (e: KonvaEventObject<MouseEvent>) => void;
  onDrawContextMenu?: (e: KonvaEventObject<MouseEvent>) => void;
  cursor?: string;
}

export default function View({
  onSelect,
  children,
  stage,
  drawMode,
  seatDrawMode = 'idle',
  previewRect,
  previewSeats = [],
  seatStartPoint,
  polygonPoints,
  polygonTempPoint,
  onDrawMouseDown,
  onDrawMouseMove,
  onDrawMouseUp,
  onDrawDoubleClick,
  onDrawContextMenu,
  cursor = 'default',
}: ViewProps) {
  const { stageRef } = stage;
  const containerRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  const dragCurrentRef = useRef<{ x: number; y: number } | null>(null);
  
  // 鼠标位置（用于座位绘制工具的跟随预览）
  const [mousePosition, setMousePosition] = useState<{ x: number; y: number } | null>(null);
  const stageConfig = useMemo(
    () => ({
      width: Math.max(window.innerWidth - 410, 1280),
      height: Math.max(window.innerHeight - 140, 760),
      draggable: drawMode === 'idle' && seatDrawMode === 'idle',
      x: Math.max(Math.ceil(window.innerWidth - 410 - 1280) / 2, 0),
      y: Math.max(Math.ceil(window.innerHeight - 140 - 760) / 2, 0),
      scale: {
        x: 1,
        y: 1,
      },
    }),
    [drawMode, seatDrawMode],
  );
  const wheelEventHandler = (e: WheelEvent) => {
    e.preventDefault();
    const scaleBy = 1.1;
    const _stage = stageRef.current;
    if (!_stage) return;
    const oldScale = _stage.scaleX();
    const mousePointTo = {
      x:
        _stage.getPointerPosition()!.x / oldScale
        - _stage.x() / oldScale,
      y:
        _stage.getPointerPosition()!.y / oldScale
        - _stage.y() / oldScale,
    };

    const newScale = e.deltaY > 0 ? oldScale * scaleBy : oldScale / scaleBy;

    _stage.scale({ x: newScale, y: newScale });

    const newPos = {
      x:
        -(mousePointTo.x - _stage.getPointerPosition()!.x / newScale)
        * newScale,
      y:
        -(mousePointTo.y - _stage.getPointerPosition()!.y / newScale)
        * newScale,
    };
    _stage.position(newPos);
    _stage.batchDraw();
  };

  const handleMouseDown = useCallback((e: KonvaEventObject<MouseEvent>) => {
    const target = e.target;
    const _stage = target.getStage();
    if (!_stage) return;

    // 座位绘制模式 - 直接传递事件
    if (seatDrawMode !== 'idle' && onDrawMouseDown) {
      onDrawMouseDown(e);
      return;
    }

    // 形状绘制模式
    if (drawMode !== 'idle' && onDrawMouseDown) {
      onDrawMouseDown(e);
      return;
    }

    // 普通选择模式
    if (target === _stage) {
      onSelect?.(e);
    }
  }, [drawMode, seatDrawMode, onDrawMouseDown, onSelect, stage]);

  const handleMouseMove = useCallback((e: KonvaEventObject<MouseEvent>) => {
    // 座位绘制模式：更新鼠标位置用于预览圆圈跟随
    if (seatDrawMode !== 'idle') {
      const stage = e.target.getStage();
      if (stage) {
        const pos = stage.getPointerPosition();
        if (pos) {
          const scale = stage.scaleX();
          const x = (pos.x - stage.x()) / scale;
          const y = (pos.y - stage.y()) / scale;
          setMousePosition({ x, y });
        }
      }
      if (onDrawMouseMove) {
        onDrawMouseMove(e);
      }
      return;
    }
    
    if (drawMode !== 'idle' && onDrawMouseMove) {
      onDrawMouseMove(e);
    }
  }, [drawMode, seatDrawMode, onDrawMouseMove]);

  const handleMouseUp = useCallback(() => {
    if ((drawMode !== 'idle' || seatDrawMode !== 'idle') && onDrawMouseUp) {
      onDrawMouseUp();
    }
  }, [drawMode, seatDrawMode, onDrawMouseUp]);

  const handleDoubleClick = useCallback((e: KonvaEventObject<MouseEvent>) => {
    if ((drawMode !== 'idle' || seatDrawMode !== 'idle') && onDrawDoubleClick) {
      onDrawDoubleClick(e);
    }
  }, [drawMode, seatDrawMode, onDrawDoubleClick]);

  const handleContextMenu = useCallback((e: KonvaEventObject<MouseEvent>) => {
    e.evt.preventDefault();
    if ((drawMode !== 'idle' || seatDrawMode !== 'idle') && onDrawContextMenu) {
      onDrawContextMenu(e);
    }
  }, [drawMode, seatDrawMode, onDrawContextMenu]);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.addEventListener("wheel", wheelEventHandler, {
        passive: false,
      });
    }
  }, []);

  // 全局鼠标事件监听（用于绘制模式）
  useEffect(() => {
    if (drawMode !== 'idle' || seatDrawMode !== 'idle') {
      const handleGlobalMouseUp = () => {
        if (onDrawMouseUp) {
          onDrawMouseUp();
        }
      };
      
      window.addEventListener('mouseup', handleGlobalMouseUp);
      return () => {
        window.removeEventListener('mouseup', handleGlobalMouseUp);
      };
    }
  }, [drawMode, seatDrawMode, onDrawMouseUp]);

  // 渲染多边形预览点
  const renderPolygonPreview = useMemo(() => {
    if (polygonPoints.length === 0 && !polygonTempPoint) return null;

    const elements = [];
    
    // 渲染已有点
    polygonPoints.forEach((point, index) => {
      // 顶点标记
      elements.push(
        <Rect
          key={`polygon-point-${index}`}
          x={point.x - 4}
          y={point.y - 4}
          width={8}
          height={8}
          fill={index === 0 ? "#4CAF50" : "#2196F3"}
          stroke="white"
          strokeWidth={2}
        />
      );
    });

    // 渲染连线
    if (polygonPoints.length >= 2) {
      const linePoints = [];
      for (let i = 0; i < polygonPoints.length; i++) {
        linePoints.push(polygonPoints[i].x, polygonPoints[i].y);
      }
      // 添加临时点形成最后一条线
      if (polygonTempPoint) {
        linePoints.push(polygonTempPoint.x, polygonTempPoint.y);
      }

      elements.push(
        <Line
          key="polygon-lines"
          points={linePoints}
          stroke="#2196F3"
          strokeWidth={2}
          dash={[5, 5]}
        />
      );
    }

    return elements;
  }, [polygonPoints, polygonTempPoint]);

  return (
    <div className="position-relative" ref={containerRef}>
      <Stage
        className="position-relative"
        style={{
          background: "#f5f5f5",
          overflow: "hidden",
          cursor: cursor,
        }}
        ref={stageRef}
        {...stageConfig}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onDblClick={handleDoubleClick}
        onContextMenu={handleContextMenu}
      >
        <Layer>
          {/* 拖拽预览 - 矩形 */}
          {previewRect && drawMode === 'rectangle' && previewRect.visible && (
            <Rect
              x={previewRect.x}
              y={previewRect.y}
              width={previewRect.width}
              height={previewRect.height}
              fill="rgba(76, 175, 80, 0.3)"
              stroke="#4CAF50"
              strokeWidth={2}
            />
          )}
          
          {/* 拖拽预览 - 椭圆 */}
          {previewRect && drawMode === 'ellipse' && previewRect.visible && (
            <Ellipse
              x={previewRect.x + previewRect.width / 2}
              y={previewRect.y + previewRect.height / 2}
              radiusX={Math.abs(previewRect.width / 2)}
              radiusY={Math.abs(previewRect.height / 2)}
              fill="rgba(33, 150, 243, 0.3)"
              stroke="#2196F3"
              strokeWidth={2}
            />
          )}

          {/* 多边形预览 */}
          {renderPolygonPreview}
          
          {/* 座位起点标记 */}
          {seatDrawMode !== 'idle' && seatStartPoint && (
            <>
              <SeatCircle
                x={seatStartPoint.x}
                y={seatStartPoint.y}
                radius={6}
                fill="#FF5722"
                stroke="#fff"
                strokeWidth={2}
              />
              <SeatText
                x={seatStartPoint.x - 20}
                y={seatStartPoint.y - 25}
                text="起点"
                fontSize={12}
                fontFamily="Arial"
                fill="#FF5722"
              />
            </>
          )}
          
          {/* 座位绘制工具 - 鼠标跟随预览圆圈（首位座位颜色） */}
          {/* 仅在未开始绘制时显示（seatStartPoint 为 null） */}
          {seatDrawMode !== 'idle' && mousePosition && !seatStartPoint && (
            <SeatCircle
              x={mousePosition.x}
              y={mousePosition.y}
              radius={6}
              fill="#D2EDFE"
              stroke="#0985FA"
              strokeWidth={1.5}
              listening={false}
              perfectDrawEnabled={false}
            />
          )}
          
          {/* Seats.io 风格座位预览 */}
          {seatDrawMode !== 'idle' && previewSeats.length > 0 && (
            <>
              {/* 辅助线 - 连接座位中心的水平线 */}
              <Line
                points={[
                  previewSeats[0].x,
                  previewSeats[0].y,
                  previewSeats[previewSeats.length - 1].x,
                  previewSeats[previewSeats.length - 1].y
                ]}
                stroke="#2196F3"
                strokeWidth={1}
                opacity={0.5}
                dash={[4, 4]}
                listening={false}
              />
              
              {/* 预览座位 - 首位边框#0985FA，中间边框#0E64C8，填充#D2EDFE */}
              {previewSeats.map((seat, index) => (
                <SeatCircle
                  key={`preview-seat-circle-${seat.id}`}
                  x={seat.x}
                  y={seat.y}
                  radius={seat.radius || 6}
                  fill="#D2EDFE"
                  stroke={index === 0 ? "#0985FA" : "#0E64C8"}
                  strokeWidth={1.5}
                  listening={false}
                />
              ))}
            </>
          )}
        </Layer>
        <Layer>{children}</Layer>
      </Stage>
    </div>
  );
}
