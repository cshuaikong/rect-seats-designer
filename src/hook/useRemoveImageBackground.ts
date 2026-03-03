import { MutableRefObject, useRef } from "react";

/**
 * 禁用图片背景移除功能
 * TensorFlow 模型加载有 CORS 问题，暂时禁用
 */
const useRemoveImageBackground = () => {
  const modelRef = useRef<any>(null);

  const loadModel = async () => {
    // 禁用模型加载
    console.log("背景移除功能已禁用");
    return null;
  };

  const autoRemoveBackground = async (image: HTMLImageElement): Promise<string> => {
    // 直接返回原图
    console.log("背景移除功能已禁用，返回原图");
    const canvas = document.createElement("canvas");
    canvas.width = image.width;
    canvas.height = image.height;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(image, 0, 0);
      return canvas.toDataURL();
    }
    return image.src;
  };

  return {
    modelRef,
    loadModel,
    autoRemoveBackground,
  };
};

export default useRemoveImageBackground;
