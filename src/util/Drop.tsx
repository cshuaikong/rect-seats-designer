import React, { useEffect } from "react";
import { DropCallback, onDragOver, onDrop } from "./eventHandler/dragAndDrop";

type DropProps = {
  callback: DropCallback;
  targetDOMElement: HTMLElement | null;
};

const Drop: React.FC<DropProps> = ({ callback, targetDOMElement }) => {
  useEffect(() => {
    if (!targetDOMElement) {
      return;
    }
    const handleDragOver = (e: DragEvent) => {
      onDragOver("copy")(e);
    };
    const handleDrop = (e: DragEvent) => {
      onDrop(callback)(e);
    };
    targetDOMElement.addEventListener("dragover", handleDragOver);
    targetDOMElement.addEventListener("drop", handleDrop);
    return () => {
      targetDOMElement.removeEventListener("dragover", handleDragOver);
      targetDOMElement.removeEventListener("drop", handleDrop);
    };
  }, [targetDOMElement, callback]);
  return <></>;
};

export default Drop;
