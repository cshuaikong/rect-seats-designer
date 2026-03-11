import React, { useEffect, useMemo, useState, useCallback } from "react";
import { Transformer } from "react-konva";
import { Node, NodeConfig, KonvaEventObject } from "konva/lib/Node";
import { useHotkeys } from "react-hotkeys-hook";
import { nanoid } from "nanoid";
import { Button, Col, Modal, Row } from "react-bootstrap";
import Header from "./header";
import Layout from "./layout";
import SettingBar from "./settingBar";
import TabGroup from "./tab";
import workModeList from "./config/workMode.json";
import NavBar from "./navBar";
import NavBarButton from "./navBar/NavBarButton";
import View from "./view";
import Frame, { FrameProps } from "./view/frame";
import { StageData } from "./redux/currentStageData";
import useItem from "./hook/useItem";
import { StageDataListItem } from "./redux/stageDataList";
import useStageDataList from "./hook/useStageDataList";
import ImageItem, { ImageItemProps } from "./view/object/image";
import useSmartSelection from "./hook/useSmartSelection";
import useTab from "./hook/useTab";
import useStage from "./hook/useStage";
import useTool from "./hook/useTool";
import TextItem, { TextItemProps } from "./view/object/text";
import ShapeItem, { ShapeItemProps } from "./view/object/shape";
import IconItem, { IconItemProps } from "./view/object/icon";
import LineItem, { LineItemProps } from "./view/object/line";
import SeatItem, { SeatItemProps } from "./view/object/seat";
import useModal from "./hook/useModal";
import useSeatDrawing from "./hook/useSeatDrawing";
import hotkeyList from "./config/hotkey.json";
import useHotkeyFunc from "./hook/useHotkeyFunc";
import useWorkHistory from "./hook/useWorkHistory";
import useI18n from "./hook/usei18n";
import useDrawTools, { DrawToolMode } from "./hook/useDrawTools";
import { initialStageDataList } from "./redux/initilaStageDataList";
import useAutoSave from "./hook/useAutoSave";

export type FileKind = {
  "file-id": string;
  title: string;
  data: Record<string, any>[];
};

export type FileData = Record<string, FileKind>;

// 工具模式类型
type ToolMode = 'select' | 'draw-rect' | 'draw-ellipse' | 'draw-polygon' | 
                'seat-row' | 'seat-section' | 'seat-section-diagonal';

function App() {
  const [past, setPast] = useState<StageData[][]>([]);
  const [future, setFuture] = useState<StageData[][]>([]);
  const { goToFuture, goToPast, recordPast, clearHistory } = useWorkHistory(
    past,
    future,
    setPast,
    setFuture,
  );
  
  // 使用新的智能选择 hook
  const stage = useStage();
  const {
    selection,
    selectedNodes,
    isMarqueeSelecting,
    marqueeBox,
    handleSelect,
    startMarquee,
    updateMarquee,
    endMarquee,
    clearSelection,
    getTransformerConfig,
    getSelectionCursor,
  } = useSmartSelection({ stageRef: stage.stageRef });
  
  const { tabList, onClickTab, onCreateTab, onDeleteTab, moveTab } = useTab(clearHistory);
  const { stageData, updateItem } = useItem();
  const { stageDataList, initializeFileDataList, updateFileData } = useStageDataList();
  const modal = useModal();
  const {
    deleteItems,
    copyItems,
    selectAll,
    pasteItems,
    duplicateItems,
    layerDown,
    layerUp,
    flipHorizontally,
    flipVertically,
  } = useHotkeyFunc();
  const { getTranslation } = useI18n();
  const [clipboard, setClipboard] = useState<StageData[]>([]);
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  // 当前工具模式
  const [toolMode, setToolMode] = useState<ToolMode>('select');

  // 统一绘制工具 Hook
  const {
    drawMode,
    previewRect,
    polygonPoints,
    polygonTempPoint,
    startDrawMode,
    exitDrawMode,
    isDrawing,
    onMouseDown: onDrawMouseDown,
    onMouseMove: onDrawMouseMove,
    onMouseUp: onDrawMouseUp,
    onDoubleClick,
    onContextMenu,
  } = useDrawTools();
  
  // 座位绘制工具 Hook
  const {
    drawMode: seatDrawMode,
    previewSeats,
    startPoint: seatStartPoint,
    currentRowLabel,
    drawStep,
    startSeatMode,
    exitSeatMode,
    onMouseDown: onSeatMouseDown,
    onMouseMove: onSeatMouseMove,
  } = useSeatDrawing();

  // 根据工具状态判断是否在绘制模式
  const isInDrawingMode = drawMode !== 'idle' || seatDrawMode !== 'idle';

  const createStageDataObject = (item: Node<NodeConfig>): StageData => {
    const { id } = item.attrs;
    const target = item.attrs["data-item-type"] === "frame" ? item.getParent() : item;
    return {
      id: nanoid(),
      attrs: {
        ...(stageData.find((_item) => _item.attrs.id === id)?.attrs ?? {}),
      },
      className: target.getType(),
      children: [],
    };
  };

  const currentTabId = useMemo(() => tabList.find((tab) => tab.active)?.id ?? null, [tabList]);

  // 自动保存功能
  const {
    loadData,
    exportToFile,
    importFromFile,
    clearSavedData,
  } = useAutoSave(stageDataList, stageData, currentTabId);

  const sortedStageData = useMemo(
    () =>
      stageData.sort((a, b) => {
        if (a.attrs.zIndex === b.attrs.zIndex) {
          if (a.attrs.zIndex < 0) {
            return b.attrs.updatedAt - a.attrs.updatedAt;
          }
          return a.attrs.updatedAt - b.attrs.updatedAt;
        }
        return a.attrs.zIndex - b.attrs.zIndex;
      }),
    [stageData],
  );

  // 处理工具切换
  const handleToolClick = useCallback((clickedId: string) => {
    console.log("Button clicked:", clickedId);
    
    // 先退出所有绘制模式
    if (drawMode !== 'idle') {
      exitDrawMode();
    }
    if (seatDrawMode !== 'idle') {
      exitSeatMode();
    }
    
    // 切换到选择模式
    setToolMode('select');
    
    // 处理具体工具
    switch (clickedId) {
      case 'draw-rectangle':
        setToolMode('draw-rect');
        startDrawMode('rectangle');
        break;
      case 'draw-ellipse':
        setToolMode('draw-ellipse');
        startDrawMode('ellipse');
        break;
      case 'draw-polygon':
        setToolMode('draw-polygon');
        startDrawMode('polygon');
        break;
      case 'seat-row':
        setToolMode('seat-row');
        startSeatMode('row-straight');
        break;
      case 'seat-section':
        setToolMode('seat-section');
        startSeatMode('section');
        break;
      case 'seat-section-diagonal':
        setToolMode('seat-section-diagonal');
        startSeatMode('section-diagonal');
        break;
      case 'export-json':
        exportToFile();
        break;
      case 'import-json':
        handleImportFile();
        break;
      case 'clear-data':
        handleClearData();
        break;
      default:
        // 其他工具暂未实现
        console.log("Tool not implemented:", clickedId);
        break;
    }
  }, [drawMode, seatDrawMode, exitDrawMode, exitSeatMode, startDrawMode, startSeatMode, 
      exportToFile]);

  // 处理导入文件
  const handleImportFile = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        try {
          const importedData = await importFromFile(file);
          if (importedData) {
            initializeFileDataList(importedData.stageDataList);
            if (importedData.currentTabId) {
              moveTab(importedData.currentTabId, importedData.stageDataList.find(
                (tab) => tab.id === importedData.currentTabId,
              ));
            }
            console.log("[App] 数据导入成功");
          }
        } catch (err) {
          alert(`导入失败: ${err instanceof Error ? err.message : '未知错误'}`);
        }
      }
    };
    input.click();
  };

  // 处理清除数据
  const handleClearData = () => {
    if (confirm("确定要清除所有保存的数据吗？这将重置为默认状态。")) {
      clearSavedData();
      window.location.reload();
    }
  };

  // 检查按钮是否处于激活状态
  const isButtonActive = (data: any): boolean => {
    if (data["sub-button"]) {
      return data["sub-button"].some((sub: any) => {
        if (sub.id === 'draw-rectangle') return toolMode === 'draw-rect';
        if (sub.id === 'draw-ellipse') return toolMode === 'draw-ellipse';
        if (sub.id === 'draw-polygon') return toolMode === 'draw-polygon';
        if (sub.id === 'seat-row') return toolMode === 'seat-row';
        if (sub.id === 'seat-section') return toolMode === 'seat-section';
        if (sub.id === 'seat-section-diagonal') return toolMode === 'seat-section-diagonal';
        return false;
      });
    }
    return false;
  };

  const header = (
    <Header>
      <TabGroup
        onClickTab={onClickTab}
        tabList={tabList}
        onCreateTab={onCreateTab}
        onDeleteTab={onDeleteTab}
      />
      {/* 绘制模式指示器 */}
      {isInDrawingMode && (
        <div
          style={{
            position: 'absolute',
            right: '20px',
            top: '50%',
            transform: 'translateY(-50%)',
            backgroundColor: '#4CAF50',
            color: 'white',
            padding: '4px 12px',
            borderRadius: '4px',
            fontSize: '12px',
            fontWeight: 'bold',
          }}
        >
          {toolMode === 'draw-rect' && '📐 绘制矩形中...'}
          {toolMode === 'draw-ellipse' && '⭕ 绘制椭圆中...'}
          {toolMode === 'draw-polygon' && `⬡ 绘制多边形中... (${polygonPoints.length} 点)`}
          {toolMode === 'seat-row' && '🎯 行座位模式'}
          {toolMode === 'seat-section' && '↗️ 有角度行模式'}
          {toolMode === 'seat-section-diagonal' && '📐 多行区块模式'}
          <button
            onClick={() => {
              setToolMode('select');
              exitDrawMode();
              exitSeatMode();
            }}
            style={{
              marginLeft: '8px',
              background: 'none',
              border: 'none',
              color: 'white',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            ✕
          </button>
        </div>
      )}
      {/* 三点式绘制配置面板 */}
      {(toolMode === 'seat-section' || toolMode === 'seat-section-diagonal') && (
        <div
          style={{
            position: 'absolute',
            right: '20px',
            top: 'calc(50% + 50px)',
            transform: 'translateY(-50%)',
            backgroundColor: 'white',
            color: '#333',
            padding: '12px 16px',
            borderRadius: '8px',
            fontSize: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            minWidth: '160px',
          }}
        >
          <div style={{ marginBottom: '10px', fontWeight: 'bold', borderBottom: '1px solid #eee', paddingBottom: '6px' }}>
            {toolMode === 'seat-section' ? '有角度行' : '多行区块'}
          </div>
          
          <div style={{ marginBottom: '12px', padding: '8px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
            <div style={{ color: '#4CAF50', fontWeight: 'bold', marginBottom: '4px' }}>
              ① 点击确定起点
            </div>
            <div style={{ color: '#4CAF50', fontWeight: 'bold', marginBottom: '4px' }}>
              ② 确定方向
            </div>
            <div style={{ color: '#4CAF50', fontWeight: 'bold' }}>
              ③ 完成绘制
            </div>
          </div>
          
          <div style={{ marginTop: '10px', fontSize: '11px', color: '#999', lineHeight: '1.4' }}>
            按 ESC 取消当前绘制
          </div>
        </div>
      )}
    </Header>
  );

  const navBar = (
    <NavBar>
      {workModeList.map((data) => (
        <NavBarButton
          key={`navbar-${data.id}`}
          data={data}
          stage={stage}
          isActive={isButtonActive(data)}
          onClick={handleToolClick}
        />
      ))}
    </NavBar>
  );

  const hotkeyModal = (
    <Modal show={modal.displayModal} onHide={modal.closeModal}>
      <Modal.Header closeButton>
        <Modal.Title>Keyboard Shortcut</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {hotkeyList.map((hotkey) => (
          <Col key={hotkey.name}>
            <h6>{getTranslation("hotkey", hotkey.id, "name")}</h6>
            <Row className="justify-content-end" xs={4}>
              {hotkey.keys.map((key, idx) => (
                <React.Fragment key={hotkey.name + key}>
                  {idx !== 0 && "+"}
                  <Col xs="auto" className="align-items-center">
                    <Button disabled>{key}</Button>
                  </Col>
                </React.Fragment>
              ))}
            </Row>
          </Col>
        ))}
      </Modal.Body>
    </Modal>
  );

  const settingBar = (
    <SettingBar
      selectedItems={selectedNodes}
      clearSelection={clearSelection}
      stageRef={stage.stageRef}
    />
  );

  // 处理 TransformEnd - 批量更新选中对象
  const handleTransformEnd = useCallback((e: KonvaEventObject<Event>) => {
    const target = e.target;
    if (!target) return;

    // 如果选中的是单行或多行，批量更新所有座位
    if (selection.type === 'row' || selection.type === 'multi-row') {
      selectedNodes.forEach((node) => {
        updateItem(node.id(), () => ({
          ...node.attrs,
          x: node.x(),
          y: node.y(),
          rotation: node.rotation(),
          scaleX: node.scaleX(),
          scaleY: node.scaleY(),
          updatedAt: Date.now(),
        }));
      });
    } else {
      // 单个对象更新
      updateItem(target.id(), () => ({
        ...target.attrs,
        x: target.x(),
        y: target.y(),
        rotation: target.rotation(),
        scaleX: target.scaleX(),
        scaleY: target.scaleY(),
        updatedAt: Date.now(),
      }));
    }
    
    target.getStage()?.batchDraw();
  }, [selection.type, selectedNodes, updateItem]);

  const renderObject = (item: StageData) => {
    const commonProps = {
      onSelect: handleSelect,
    };

    switch (item.attrs["data-item-type"]) {
      case "frame":
        return (
          <Frame
            key={`frame-${item.id}`}
            data={item as FrameProps["data"]}
            {...commonProps}
          />
        );
      case "image":
        return (
          <ImageItem
            key={`image-${item.id}`}
            data={item as ImageItemProps["data"]}
            {...commonProps}
          />
        );
      case "text":
        return (
          <TextItem
            key={`text-${item.id}`}
            data={item as TextItemProps["data"]}
            {...commonProps}
          />
        );
      case "shape":
        return (
          <ShapeItem
            key={`shape-${item.id}`}
            data={item as ShapeItemProps["data"]}
            {...commonProps}
          />
        );
      case "icon":
        return (
          <IconItem
            key={`icon-${item.id}`}
            data={item as IconItemProps["data"]}
            {...commonProps}
          />
        );
      case "line":
        return (
          <LineItem
            key={`line-${item.id}`}
            data={item as LineItemProps["data"]}
            {...commonProps}
          />
        );
      case "seat":
        return (
          <SeatItem
            key={`seat-${item.id}`}
            data={item as SeatItemProps["data"]}
            {...commonProps}
          />
        );
      default:
        return null;
    }
  };

  // 快捷键
  useHotkeys("shift+up", (e) => { e.preventDefault(); layerUp(selectedNodes); }, {}, [selectedNodes]);
  useHotkeys("shift+down", (e) => { e.preventDefault(); layerDown(selectedNodes); }, {}, [selectedNodes]);
  useHotkeys("ctrl+d", (e) => { e.preventDefault(); duplicateItems(selectedNodes, createStageDataObject); }, {}, [selectedNodes, stageData]);
  useHotkeys("ctrl+c", (e) => { e.preventDefault(); copyItems(selectedNodes, setClipboard, createStageDataObject); }, {}, [selectedNodes, stageData, clipboard]);
  useHotkeys("ctrl+a", (e) => { e.preventDefault(); selectAll(stage, handleSelect as any); }, {}, [selectedNodes]);
  useHotkeys("ctrl+v", (e) => { e.preventDefault(); pasteItems(clipboard); }, {}, [clipboard]);
  useHotkeys("ctrl+z", (e) => { e.preventDefault(); goToPast(); }, {}, [goToPast]);
  useHotkeys("ctrl+y", (e) => { e.preventDefault(); goToFuture(); }, {}, [goToFuture]);
  useHotkeys("shift+h", (e) => { e.preventDefault(); flipHorizontally(selectedNodes); }, {}, [selectedNodes]);
  useHotkeys("shift+v", (e) => { e.preventDefault(); flipVertically(selectedNodes); }, {}, [selectedNodes]);
  useHotkeys("backspace", (e) => {
    e.preventDefault();
    // 这里需要传入 transformer ref，暂时简化处理
    deleteItems(selectedNodes, clearSelection, { current: null });
  }, { enabled: Boolean(selectedNodes.length) }, [selectedNodes]);
  
  // ESC 退出绘制模式
  useHotkeys("esc", () => {
    if (isInDrawingMode) {
      setToolMode('select');
      exitDrawMode();
      exitSeatMode();
    } else {
      clearSelection();
    }
  }, {}, [isInDrawingMode, exitDrawMode, exitSeatMode, clearSelection]);

  useEffect(() => {
    window.addEventListener("beforeunload", (e) => {
      e.preventDefault();
      e.returnValue = "";
    });

    // 尝试从 localStorage 加载保存的数据
    const savedData = loadData();
    if (savedData && savedData.stageDataList.length > 0) {
      const hasValidData = savedData.stageDataList.some(item => item.data && item.data.length > 0);
      if (!hasValidData) {
        console.log("[App] localStorage 数据为空，使用默认初始数据");
        onCreateTab(undefined, initialStageDataList[0] as StageDataListItem);
        initializeFileDataList(initialStageDataList);
      } else {
        console.log("[App] 从 localStorage 加载保存的数据");
        initializeFileDataList(savedData.stageDataList);
        if (savedData.currentTabId) {
          const tabToActivate = savedData.stageDataList.find(
            (tab) => tab.id === savedData.currentTabId,
          );
          if (tabToActivate && tabToActivate.id !== savedData.stageDataList[savedData.stageDataList.length - 1]?.id) {
            moveTab(savedData.currentTabId, tabToActivate);
          }
        }
      }
    } else {
      console.log("[App] 使用默认初始数据");
      onCreateTab(undefined, initialStageDataList[0] as StageDataListItem);
      initializeFileDataList(initialStageDataList);
    }

    setIsDataLoaded(true);
    if (stage.stageRef.current) {
      stage.stageRef.current.setPosition({
        x: Math.max(Math.ceil(stage.stageRef.current.width() - 1280) / 2, 0),
        y: Math.max(Math.ceil(stage.stageRef.current.height() - 760) / 2, 0),
      });
      stage.stageRef.current.batchDraw();
    }
  }, []);

  useEffect(() => {
    if (currentTabId) {
      updateFileData({
        id: currentTabId,
        data: stageData,
      });
    }
    recordPast(stageData);
  }, [stageData]);

  // 获取 Transformer 配置
  const transformerConfig = useMemo(() => {
    return getTransformerConfig(selection.type);
  }, [selection.type, getTransformerConfig]);

  // 判断是否需要显示 Transformer
  const showTransformer = selection.type !== 'none' && selectedNodes.length > 0;

  return (
    <Layout header={header} navBar={navBar} settingBar={settingBar}>
      {hotkeyModal}
      <View 
        onSelect={handleSelect}
        onMarqueeStart={startMarquee}
        onMarqueeMove={updateMarquee}
        onMarqueeEnd={endMarquee}
        stage={stage}
        drawMode={drawMode}
        seatDrawMode={seatDrawMode}
        previewRect={previewRect}
        previewSeats={previewSeats}
        seatStartPoint={seatStartPoint}
        polygonPoints={polygonPoints}
        polygonTempPoint={polygonTempPoint}
        onDrawMouseDown={seatDrawMode !== 'idle' ? onSeatMouseDown : onDrawMouseDown}
        onDrawMouseMove={seatDrawMode !== 'idle' ? onSeatMouseMove : onDrawMouseMove}
        onDrawMouseUp={seatDrawMode !== 'idle' ? undefined : onDrawMouseUp}
        onDrawDoubleClick={onDoubleClick}
        onDrawContextMenu={onContextMenu}
        cursor={isInDrawingMode ? 'crosshair' : getSelectionCursor(selection.type)}
        isMarqueeSelecting={isMarqueeSelecting}
        marqueeBox={marqueeBox}
        hasSelection={selection.type !== 'none'}
      >
        {stageData.length ? sortedStageData.map((item) => renderObject(item)) : null}
        
        {/* 动态 Transformer */}
        {showTransformer && (
          <Transformer
            nodes={selectedNodes}
            keepRatio
            shouldOverdrawWholeArea
            {...transformerConfig}
            onTransformEnd={handleTransformEnd}
          />
        )}
      </View>
    </Layout>
  );
}

export default App;
