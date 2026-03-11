import { Ellipse as EllipseType } from "konva/lib/shapes/Ellipse";
import { RegularPolygon as RegularPolygonType } from "konva/lib/shapes/RegularPolygon";
import { Rect as RectType } from "konva/lib/shapes/Rect";
import React, { RefObject, useEffect, useRef } from "react";
import { Ellipse, Rect, RegularPolygon } from "react-konva";
import { OverrideItemProps } from "../../../hook/useItem";

import { StageData } from "../../../redux/currentStageData";
import useDragAndDrop from "../../../hook/useDragAndDrop";
import useStage from "../../../hook/useStage";

export type ShapeItemKind = {
  "data-item-type": string;
  id: string;
  icon: string;
  x: number;
  y: number;
  sides: number;
  radius: number;
};

export type ShapeItemProps = OverrideItemProps<{
  data: StageData;
}>;

const ShapeItem: React.FC<ShapeItemProps> = ({ data, onSelect }) => {
  const { attrs } = data;

  const shapeRef = useRef() as RefObject<RegularPolygonType | RectType | EllipseType>;
  const stage = useStage();
  const { onDragMoveFrame, onDragEndFrame, checkIsInFrame } = useDragAndDrop(
    stage.stageRef,
    stage.dragBackgroundOrigin,
  );
  
  // 判断是否为椭圆（radiusX 和 radiusY 存在，且不是多边形）
  const isEllipse = attrs.radiusX !== undefined && attrs.radiusY !== undefined && attrs.sides === 0;
  
  // 判断是否为多边形（sides >= 3，但排除矩形 sides === 4 且有 width/height 的情况）
  const isPolygon = attrs.sides >= 3 && !(attrs.sides === 4 && attrs.width !== undefined && attrs.height !== undefined);

  useEffect(() => {
    if (shapeRef.current) {
      stage.setStageRef(shapeRef.current.getStage()!);
      checkIsInFrame(shapeRef.current);
    }
  }, [data]);

  // 椭圆
  if (isEllipse) {
    return (
      <Ellipse
        ref={shapeRef as RefObject<EllipseType>}
        onClick={onSelect}
        name="label-target"
        data-item-type="shape"
        id={data.id}
        x={attrs.x}
        y={attrs.y}
        radiusX={attrs.radiusX}
        radiusY={attrs.radiusY}
        scaleX={attrs.scaleX}
        scaleY={attrs.scaleY}
        fill={attrs.fill ?? "#2196F3"}
        stroke={attrs.stroke ?? null}
        strokeWidth={attrs.stroke ? 5 : undefined}
        opacity={attrs.opacity ?? 1}
        rotation={attrs.rotation ?? 0}
        draggable
        onDragMove={onDragMoveFrame}
        onDragEnd={onDragEndFrame}
      />
    );
  }

  // 多边形（三角形、五边形、六边形等）
  if (isPolygon) {
    // 使用 radiusX 作为实际半径，如果没有则回退到原来的计算方式
    const radius = attrs.radiusX ?? Math.sqrt(attrs.radius * 2);
    
    return (
      <RegularPolygon
        ref={shapeRef as RefObject<RegularPolygonType>}
        onClick={onSelect}
        name="label-target"
        data-item-type="shape"
        id={data.id}
        x={attrs.x}
        y={attrs.y}
        sides={attrs.sides}
        radius={radius}
        scaleX={attrs.scaleX}
        scaleY={attrs.scaleY}
        fill={attrs.fill ?? "#FF9800"}
        stroke={attrs.stroke ?? null}
        strokeWidth={attrs.stroke ? 5 : undefined}
        opacity={attrs.opacity ?? 1}
        rotation={attrs.rotation ?? 0}
        draggable
        onDragMove={onDragMoveFrame}
        onDragEnd={onDragEndFrame}
      />
    );
  }

  // 矩形
  if (attrs.sides === 4) {
    // 如果有 width/height 直接用，否则用 radius 计算（兼容旧数据）
    const width = attrs.width ?? Math.sqrt(attrs.radius * 2);
    const height = attrs.height ?? Math.sqrt(attrs.radius * 2);
    
    return (
      <Rect
        ref={shapeRef as RefObject<RectType>}
        onClick={onSelect}
        name="label-target"
        data-item-type="shape"
        id={data.id}
        x={attrs.x}
        y={attrs.y}
        width={width}
        height={height}
        sides={attrs.sides}
        radius={attrs.radius}
        scaleX={attrs.scaleX}
        scaleY={attrs.scaleY}
        fill={attrs.fill ?? "#000000"}
        stroke={attrs.stroke ?? null}
        strokeWidth={attrs.stroke ? 5 : undefined}
        opacity={attrs.opacity ?? 1}
        rotation={attrs.rotation ?? 0}
        draggable
        onDragMove={onDragMoveFrame}
        onDragEnd={onDragEndFrame}
      />
    );
  }

  return (
    <RegularPolygon
      ref={shapeRef as RefObject<RegularPolygonType>}
      onClick={onSelect}
      name="label-target"
      data-item-type="shape"
      id={data.id}
      x={attrs.x}
      y={attrs.y}
      sides={attrs.sides}
      radius={attrs.radius}
      scaleX={attrs.scaleX}
      scaleY={attrs.scaleY}
      fill={attrs.fill ?? "#000000"}
      stroke={attrs.stroke ?? null}
      strokeWidth={attrs.stroke ? 5 : undefined}
      opacity={attrs.opacity ?? 1}
      rotation={attrs.rotation ?? 0}
      draggable
      onDragMove={onDragMoveFrame}
      onDragEnd={onDragEndFrame}
    />
  );
};

export default ShapeItem;
