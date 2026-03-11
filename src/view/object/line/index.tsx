import { Context } from "konva/lib/Context";
import { Group as GroupType } from "konva/lib/Group";
import { KonvaEventObject } from "konva/lib/Node";
import { Shape as ShapeType, ShapeConfig } from "konva/lib/Shape";
import React, { RefObject, useCallback, useRef } from "react";
import { Group, Shape } from "react-konva";
import useItem, { OverrideItemProps } from "../../../hook/useItem";

import { StageData } from "../../../redux/currentStageData";

export type LineItemKind = {
  "data-item-type": string;
  id: string;
  icon: string;
  x: number;
  y: number;
  sides: number;
  radius: number;
};

export type LineItemProps = OverrideItemProps<{
  data: StageData;
}>;

const LineItem: React.FC<LineItemProps> = ({ data, onSelect }) => {
  const {
    attrs: { updatedAt, zIndex, points, ...attrs },
  } = data;
  const lineRef = useRef() as RefObject<GroupType>;
  const { updateItem } = useItem();

  const draw = (ctx: Context, shape: ShapeType<ShapeConfig>) => {
    if (!points || points.length < 4) return;
    
    ctx.beginPath();
    ctx.moveTo(points[0], points[1]);
    
    // 处理多边形（多点，大于4个点即2个坐标对）
    if (points.length > 4) {
      // 多边形：依次连接所有点
      for (let i = 2; i < points.length; i += 2) {
        ctx.lineTo(points[i], points[i + 1]);
      }
    } else if (points.length === 4) {
      // 直线
      ctx.lineTo(points[2], points[3]);
    }
    
    // 如果标记为闭合，则闭合路径
    if (attrs.closed || points.length > 4) {
      ctx.closePath();
    }
    
    shape.strokeWidth(attrs.strokeWidth || 3);
    
    // 如果有填充则填充
    if (attrs.fill && attrs.fill !== 'transparent') {
      ctx.fillShape(shape);
    }
    
    ctx.strokeShape(shape);
  };

  // 定义 hit 检测区域，确保选中与视觉一致
  const hitFunc = (ctx: Context, shape: ShapeType<ShapeConfig>) => {
    if (!points || points.length < 4) return;
    
    ctx.beginPath();
    ctx.moveTo(points[0], points[1]);
    
    if (points.length > 4) {
      for (let i = 2; i < points.length; i += 2) {
        ctx.lineTo(points[i], points[i + 1]);
      }
    } else if (points.length === 4) {
      ctx.lineTo(points[2], points[3]);
    }
    
    if (attrs.closed || points.length > 4) {
      ctx.closePath();
    }
    
    // 设置 hit 检测的线宽稍大一些，便于选中
    shape.strokeWidth((attrs.strokeWidth || 3) + 10);
    ctx.strokeShape(shape);
    
    // 如果是闭合图形且有填充，也要填充 hit 区域
    if ((attrs.closed || points.length > 4) && attrs.fill && attrs.fill !== 'transparent') {
      ctx.fillShape(shape);
    }
  };

  const onDragMoveFrame = useCallback((e: KonvaEventObject<DragEvent>) => {
    e.target.getLayer()?.batchDraw();
  }, []);

  const onDragEndFrame = useCallback(
    (e: KonvaEventObject<DragEvent>) => {
      e.evt.preventDefault();
      e.evt.stopPropagation();
      updateItem(e.target.id(), () => ({
        ...e.target.attrs,
      }));
      e.target.getLayer()?.batchDraw();
    },
    [data],
  );

  return (
    <Group>
      <Shape
        ref={lineRef}
        onClick={onSelect}
        sceneFunc={draw}
        hitFunc={hitFunc}
        name="label-target"
        data-item-type="line"
        id={data.id}
        {...attrs}
        draggable
        onDragMove={onDragMoveFrame}
        onDragEnd={onDragEndFrame}
      />
    </Group>
  );
};

export default LineItem;
