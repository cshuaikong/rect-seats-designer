import React, { useEffect, useMemo, useState } from "react";
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
import useSelection from "./hook/useSelection";
import useTab from "./hook/useTab";
import useTransformer from "./hook/useTransformer";
import useStage from "./hook/useStage";
import useTool from "./hook/useTool";
import TextItem, { TextItemProps } from "./view/object/text";
import ShapeItem, { ShapeItemProps } from "./view/object/shape";
import IconItem, { IconItemProps } from "./view/object/icon";
import LineItem, { LineItemProps } from "./view/object/line";
import SeatItem, { SeatItemProps } from "./view/object/seat";
import useModal from "./hook/useModal";
import useSeatDrawing from "./hook/useSeatDrawing";
import { SeatDrawMode } from "./types/seat";
import hotkeyList from "./config/hotkey.json";
import useHotkeyFunc from "./hook/useHotkeyFunc";
import useWorkHistory from "./hook/useWorkHistory";
import useI18n from "./hook/usei18n";
import useDrawTools, { DrawToolMode } from "./hook/useDrawTools";
import { initialStageDataList } from "./redux/initilaStageDataList";

export type FileKind = {
  "file-id": string;
  title: string;
  data: Record<string, any>[];
};

export type FileData = Record<string, FileKind>;

function App() {
  const [past, setPast] = useState<StageData[][]>([]);
  const [future, setFuture] = useState<StageData[][]>([]);
  const { goToFuture, goToPast, recordPast, clearHistory } = useWorkHistory(
    past,
    future,
    setPast,
    setFuture,
  );
  const transformer = useTransformer();
  const { selectedItems, onSelectItem, setSelectedItems, clearSelection }
    = useSelection(transformer);
  const { tabList, onClickTab, onCreateTab, onDeleteTab } = useTab(transformer, clearHistory);
  const { stageData } = useItem();
  const { initializeFileDataList, updateFileData } = useStageDataList();
  const stage = useStage();
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

  // 统一绘制工具 Hook
  const {
    drawMode,
    previewRect,
    polygonPoints,
    polygonTempPoint,
    startDrawMode,
    exitDrawMode,
    getCursor: getDrawCursor,
    onMouseDown,
    onMouseMove,
    onMouseUp,
    onDoubleClick,
    onContextMenu,
    isDrawing,
  } = useDrawTools();
  
  // 座位绘制工具 Hook
  const {
    drawMode: seatDrawMode,
    previewSeats,
    startPoint: seatStartPoint,
    currentRowLabel,
    sectionConfig,
    drawStep,
    firstRowEnd,
    startSeatMode,
    exitSeatMode,
    setCurrentRowLabel,
    setSectionConfig,
    onMouseDown: onSeatMouseDown,
    onMouseMove: onSeatMouseMove,
    getCursor: getSeatCursor,
  } = useSeatDrawing();

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

  const { getClickCallback } = useTool(
    stage,
    modal,
    selectedItems,
    setSelectedItems,
    transformer,
    createStageDataObject,
    onSelectItem,
  );

  const currentTabId = useMemo(() => tabList.find((tab) => tab.active)?.id ?? null, [tabList]);

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

  const header = (
    <Header>
      <TabGroup
        onClickTab={onClickTab}
        tabList={tabList}
        onCreateTab={onCreateTab}
        onDeleteTab={onDeleteTab}
      />
      {/* 绘制模式指示器 */}
      {isDrawing && (
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
          {drawMode === 'rectangle' && '📐 绘制矩形中...'}
          {drawMode === 'ellipse' && '⭕ 绘制椭圆中...'}
          {drawMode === 'polygon' && `⬡ 绘制多边形中... (${polygonPoints.length} 点)`}
          {seatDrawMode === 'row-straight' && '🎯 行座位模式'}
          {seatDrawMode === 'section' && (
            drawStep === 'second' ? '↗️ 有角度行：确定第一段' :
            drawStep === 'third' ? '↗️ 有角度行：确定第二段方向' :
            '↗️ 有角度行：点击起点'
          )}
          {seatDrawMode === 'section-diagonal' && (
            drawStep === 'second' ? '📐 多行区块：确定第一行方向' :
            drawStep === 'third' ? '📐 多行区块：确定行排列方向和数量' :
            '📐 多行区块：点击起点'
          )}
          {drawMode === 'idle' && seatDrawMode === 'idle' && '选择模式'}
          <button
            onClick={() => {
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
      {(seatDrawMode === 'section' || seatDrawMode === 'section-diagonal') && (
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
            {seatDrawMode === 'section' ? '有角度行' : '多行区块'}
          </div>
          
          {/* 步骤指示 */}
          <div style={{ marginBottom: '12px', padding: '8px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
            <div style={{ 
              color: drawStep === 'idle' || drawStep === 'first' ? '#4CAF50' : '#999',
              fontWeight: drawStep === 'idle' || drawStep === 'first' ? 'bold' : 'normal',
              marginBottom: '4px'
            }}>
              ① 点击确定起点
            </div>
            <div style={{ 
              color: drawStep === 'second' ? '#4CAF50' : '#999',
              fontWeight: drawStep === 'second' ? 'bold' : 'normal',
              marginBottom: '4px'
            }}>
              {seatDrawMode === 'section' ? '② 确定第一段方向' : '② 确定第一行方向'}
            </div>
            <div style={{ 
              color: drawStep === 'third' ? '#4CAF50' : '#999',
              fontWeight: drawStep === 'third' ? 'bold' : 'normal'
            }}>
              {seatDrawMode === 'section' ? '③ 确定第二段方向' : '③ 确定行排列方向和数量'}
            </div>
          </div>

          {seatDrawMode === 'section-diagonal' && (
            <div style={{ marginBottom: '8px', padding: '8px', backgroundColor: '#f5f5f5', borderRadius: '4px', fontSize: '11px', color: '#666' }}>
              每行座位数由第1、2点距离自动计算
            </div>
          )}
          
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
          onClick={(clickedId: string) => {
            console.log("Button clicked:", clickedId);
            
            // 如果已经在绘制模式，先退出
            if (isDrawing) {
              exitDrawMode();
            }
            if (seatDrawMode !== 'idle') {
              exitSeatMode();
            }
            
            // 处理绘制工具
            if (clickedId === 'draw-rectangle') {
              console.log("开始矩形绘制模式");
              startDrawMode('rectangle');
            } else if (clickedId === 'draw-ellipse') {
              console.log("开始椭圆绘制模式");
              startDrawMode('ellipse');
            } else if (clickedId === 'draw-polygon') {
              console.log("开始多边形绘制模式");
              startDrawMode('polygon');
            } else if (clickedId === 'seat-row') {
              console.log("开始行座位绘制模式");
              startSeatMode('row-straight');
            } else if (clickedId === 'seat-section') {
              console.log("开始区块座位绘制模式");
              startSeatMode('section');
            } else if (clickedId === 'seat-section-diagonal') {
              console.log("开始对角区块绘制模式");
              startSeatMode('section-diagonal');
            } else {
              // 其他工具使用原有逻辑
              const callback = getClickCallback(clickedId);
              callback();
            }
          }}
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
      selectedItems={selectedItems}
      clearSelection={clearSelection}
      stageRef={stage.stageRef}
    />
  );

  const renderObject = (item: StageData) => {
    switch (item.attrs["data-item-type"]) {
      case "frame":
        return (
          <Frame
            key={`frame-${item.id}`}
            data={item as FrameProps["data"]}
            onSelect={onSelectItem}
          />
        );
      case "image":
        return (
          <ImageItem
            key={`image-${item.id}`}
            data={item as ImageItemProps["data"]}
            onSelect={onSelectItem}
          />
        );
      case "text":
        return (
          <TextItem
            key={`text-${item.id}`}
            data={item as TextItemProps["data"]}
            transformer={transformer}
            onSelect={onSelectItem}
          />
        );
      case "shape":
        return (
          <ShapeItem
            key={`shape-${item.id}`}
            data={item as ShapeItemProps["data"]}
            transformer={transformer}
            onSelect={onSelectItem}
          />
        );
      case "icon":
        return (
          <IconItem
            key={`icon-${item.id}`}
            data={item as IconItemProps["data"]}
            transformer={transformer}
            onSelect={onSelectItem}
          />
        );
      case "line":
        return (
          <LineItem
            key={`line-${item.id}`}
            data={item as LineItemProps["data"]}
            transformer={transformer}
            onSelect={onSelectItem}
          />
        );
      case "seat":
        return (
          <SeatItem
            key={`seat-${item.id}`}
            data={item as SeatItemProps["data"]}
            transformer={transformer}
            onSelect={onSelectItem}
          />
        );
      default:
        return null;
    }
  };

  useHotkeys(
    "shift+up",
    (e) => {
      e.preventDefault();
      layerUp(selectedItems);
    },
    {},
    [selectedItems],
  );

  useHotkeys(
    "shift+down",
    (e) => {
      e.preventDefault();
      layerDown(selectedItems);
    },
    {},
    [selectedItems],
  );

  useHotkeys(
    "ctrl+d",
    (e) => {
      e.preventDefault();
      duplicateItems(selectedItems, createStageDataObject);
    },
    {},
    [selectedItems, stageData],
  );

  useHotkeys(
    "ctrl+c",
    (e) => {
      e.preventDefault();
      copyItems(selectedItems, setClipboard, createStageDataObject);
    },
    {},
    [selectedItems, stageData, clipboard],
  );

  useHotkeys(
    "ctrl+a",
    (e) => {
      e.preventDefault();
      selectAll(stage, onSelectItem);
    },
    {},
    [selectedItems],
  );

  useHotkeys(
    "ctrl+v",
    (e) => {
      e.preventDefault();
      pasteItems(clipboard);
    },
    {},
    [clipboard],
  );

  useHotkeys(
    "ctrl+z",
    (e) => {
      e.preventDefault();
      goToPast();
    },
    {},
    [goToPast],
  );

  useHotkeys(
    "ctrl+y",
    (e) => {
      e.preventDefault();
      goToFuture();
    },
    {},
    [goToFuture],
  );

  useHotkeys(
    "shift+h",
    (e) => {
      e.preventDefault();
      flipHorizontally(selectedItems);
    },
    {},
    [selectedItems],
  );

  useHotkeys(
    "shift+v",
    (e) => {
      e.preventDefault();
      flipVertically(selectedItems);
    },
    {},
    [selectedItems],
  );

  useHotkeys(
    "backspace",
    (e) => {
      e.preventDefault();
      deleteItems(selectedItems, setSelectedItems, transformer.transformerRef);
    },
    { enabled: Boolean(selectedItems.length) },
    [selectedItems, transformer.transformerRef.current],
  );

  useEffect(() => {
    window.addEventListener("beforeunload", (e) => {
      e.preventDefault();
      e.returnValue = "";
    });
    onCreateTab(undefined, initialStageDataList[0] as StageDataListItem);
    initializeFileDataList(initialStageDataList);
    stage.stageRef.current.setPosition({
      x: Math.max(Math.ceil(stage.stageRef.current.width() - 1280) / 2, 0),
      y: Math.max(Math.ceil(stage.stageRef.current.height() - 760) / 2, 0),
    });
    stage.stageRef.current.batchDraw();
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

  return (
    <Layout header={header} navBar={navBar} settingBar={settingBar}>
      {hotkeyModal}
      <View 
        onSelect={onSelectItem} 
        stage={stage}
        drawMode={drawMode}
        seatDrawMode={seatDrawMode}
        previewRect={previewRect}
        previewSeats={previewSeats}
        seatStartPoint={seatStartPoint}
        polygonPoints={polygonPoints}
        polygonTempPoint={polygonTempPoint}
        onDrawMouseDown={seatDrawMode !== 'idle' ? onSeatMouseDown : onMouseDown}
        onDrawMouseMove={seatDrawMode !== 'idle' ? onSeatMouseMove : onMouseMove}
        onDrawMouseUp={seatDrawMode !== 'idle' ? undefined : onMouseUp}
        onDrawDoubleClick={onDoubleClick}
        onDrawContextMenu={onContextMenu}
        cursor={seatDrawMode !== 'idle' ? getSeatCursor() : getDrawCursor()}
      >
        {stageData.length ? sortedStageData.map((item) => renderObject(item)) : null}
        <Transformer
          ref={transformer.transformerRef}
          keepRatio
          shouldOverdrawWholeArea
          boundBoxFunc={(_, newBox) => newBox}
          onTransformEnd={transformer.onTransformEnd}
        />
      </View>
    </Layout>
  );
}

export default App;
