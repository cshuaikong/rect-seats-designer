import { useEffect, useCallback } from "react";
import { StageDataListItem } from "../redux/stageDataList";
import { StageData } from "../redux/currentStageData";
import useLocalStorage from "./useLocalStorage";

export const AUTO_SAVE_KEY = "react-image-editor-autosave";
export const AUTO_SAVE_ENABLED_KEY = "react-image-editor-autosave-enabled";

export type AutoSaveData = {
  version: number;
  timestamp: number;
  stageDataList: StageDataListItem[];
  currentTabId: string | null;
};

const CURRENT_VERSION = 1;

const useAutoSave = (
  stageDataList: StageDataListItem[],
  currentStageData: StageData[],
  currentTabId: string | null,
) => {
  const { getValue, setValue } = useLocalStorage();

  // 检查是否启用了自动保存
  const isAutoSaveEnabled = useCallback((): boolean => {
    const data = getValue(AUTO_SAVE_ENABLED_KEY);
    return data?.enabled !== false; // 默认启用
  }, [getValue]);

  // 设置自动保存开关
  const setAutoSaveEnabled = useCallback((enabled: boolean) => {
    setValue(AUTO_SAVE_ENABLED_KEY, { enabled });
  }, [setValue]);

  // 保存数据到 localStorage
  const saveData = useCallback(() => {
    if (!isAutoSaveEnabled()) return;

    // 更新当前标签页的数据
    const updatedList = stageDataList.map((item) =>
      item.id === currentTabId ? { ...item, data: currentStageData } : item,
    );

    const saveData: AutoSaveData = {
      version: CURRENT_VERSION,
      timestamp: Date.now(),
      stageDataList: updatedList,
      currentTabId,
    };

    setValue(AUTO_SAVE_KEY, saveData);
    console.log("[AutoSave] 数据已保存", new Date().toLocaleTimeString());
  }, [stageDataList, currentStageData, currentTabId, isAutoSaveEnabled, setValue]);

  // 从 localStorage 加载数据
  const loadData = useCallback((): AutoSaveData | null => {
    const data = getValue(AUTO_SAVE_KEY);
    if (!data) return null;

    // 版本检查
    if (data.version !== CURRENT_VERSION) {
      console.warn("[AutoSave] 数据版本不匹配，将使用默认数据");
      return null;
    }

    return data as AutoSaveData;
  }, [getValue]);

  // 清除保存的数据
  const clearSavedData = useCallback(() => {
    setValue(AUTO_SAVE_KEY, null);
    console.log("[AutoSave] 保存的数据已清除");
  }, [setValue]);

  // 导出数据为 JSON 文件
  const exportToFile = useCallback(() => {
    const updatedList = stageDataList.map((item) =>
      item.id === currentTabId ? { ...item, data: currentStageData } : item,
    );

    const exportData: AutoSaveData = {
      version: CURRENT_VERSION,
      timestamp: Date.now(),
      stageDataList: updatedList,
      currentTabId,
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `image-editor-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [stageDataList, currentStageData, currentTabId]);

  // 从 JSON 文件导入数据
  const importFromFile = useCallback(
    (file: File): Promise<AutoSaveData | null> => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const data = JSON.parse(e.target?.result as string) as AutoSaveData;
            if (data.version !== CURRENT_VERSION) {
              reject(new Error("文件版本不兼容"));
              return;
            }
            resolve(data);
          } catch (err) {
            reject(new Error("无效的 JSON 文件"));
          }
        };
        reader.onerror = () => reject(new Error("读取文件失败"));
        reader.readAsText(file);
      });
    },
    [],
  );

  // 自动保存 effect
  useEffect(() => {
    if (!isAutoSaveEnabled() || !currentTabId) return;

    // 延迟保存，避免频繁操作时的重复保存
    const timeoutId = setTimeout(() => {
      saveData();
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [currentStageData, stageDataList, currentTabId, isAutoSaveEnabled, saveData]);

  return {
    isAutoSaveEnabled,
    setAutoSaveEnabled,
    saveData,
    loadData,
    clearSavedData,
    exportToFile,
    importFromFile,
  };
};

export default useAutoSave;
