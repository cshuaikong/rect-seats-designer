import { KonvaEventObject } from "konva/lib/Node";
import React from "react";
import { DragSrc } from "../Drag";

const CUSTOM_DRAG_TYPE = "application/x-custom-drag";

export const onDragStart
  = (dataTransferType: DataTransfer["effectAllowed"]) => (e: React.DragEvent<HTMLElement>) => {
    if (!e.currentTarget.dataset.dragSrc) {
      return;
    }
    e.dataTransfer!.effectAllowed = dataTransferType;
    // 使用自定义 MIME 类型避免被 Konva 覆盖
    e.dataTransfer!.setData(CUSTOM_DRAG_TYPE, e.currentTarget.dataset.dragSrc);
    // 同时设置 text/plain 用于兼容性
    e.dataTransfer!.setData("text/plain", e.currentTarget.dataset.dragSrc);
  };

export const onDragOver = (dataTransferType: DataTransfer["dropEffect"]) => (e: DragEvent) => {
  e.preventDefault();
  if (!e.dataTransfer) {
    return;
  }
  e.dataTransfer.dropEffect = dataTransferType;
};

export type DropCallback = (dragSrc: DragSrc, e: DragEvent) => void;

export const onDrop = (callback: DropCallback) => (e: DragEvent) => {
  e.preventDefault();
  if (!e.dataTransfer) {
    return;
  }
  // 优先使用自定义 MIME 类型，避免被 Konva 覆盖
  let dragSrc = e.dataTransfer.getData(CUSTOM_DRAG_TYPE);
  // 如果没有，则回退到 text/plain
  if (!dragSrc) {
    dragSrc = e.dataTransfer.getData("text/plain");
  }
  try {
    const parsed = JSON.parse(dragSrc);
    callback(parsed, e);
  } catch (err) {
    console.error("[DragAndDrop] Failed to parse drag data:", dragSrc, err);
  }
};

export const defaultOnMouseDown = (e: KonvaEventObject<MouseEvent>) => {
  if (e.currentTarget.getStage()?.draggable()) {
    // true if user dragging background
    e.currentTarget.draggable(false);
  }
};

export const defaultOnMouseUp = (e: KonvaEventObject<MouseEvent>) => {
  e.currentTarget.draggable(true);
};
