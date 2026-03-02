import React from "react";
import { onDragStart } from "./eventHandler/dragAndDrop";

export type DragSrc = {
  trigger: string;
} & {
  [key: string]: any;
};

type DragProps = {
  dragType: DataTransfer["effectAllowed"];
  dragSrc: DragSrc;
  children: React.ReactNode;
};

const Drag: React.FC<DragProps> = ({ dragType, dragSrc, children }) => {
  const dragSrcString = JSON.stringify(dragSrc);
  
  return (
    <div
      draggable
      data-drag-src={dragSrcString}
      onDragStart={onDragStart(dragType)}
      style={{ display: "inline-block", cursor: "grab" }}
    >
      {children}
    </div>
  );
};

export default Drag;
