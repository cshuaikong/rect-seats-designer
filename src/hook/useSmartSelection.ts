import { KonvaEventObject, Node, NodeConfig } from "konva/lib/Node";
import { useState, useCallback, useRef, useMemo } from "react";
import Konva from "konva";

export type SelectionType = 'none' | 'single' | 'row' | 'multi-row' | 'mixed';

export interface SelectionState {
  type: SelectionType;
  ids: string[];           // 选中的对象ID
  rowNumbers: string[];    // 选中的行号（座位）
}

export interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface UseSmartSelectionOptions {
  stageRef: React.RefObject<Konva.Stage>;
}

const useSmartSelection = ({ stageRef }: UseSmartSelectionOptions) => {
  const [selection, setSelection] = useState<SelectionState>({
    type: 'none',
    ids: [],
    rowNumbers: [],
  });

  const [isMarqueeSelecting, setIsMarqueeSelecting] = useState(false);
  const [marqueeBox, setMarqueeBox] = useState<Box | null>(null);
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);

  // 查找所有座位节点
  const findAllSeats = useCallback((): Node<NodeConfig>[] => {
    if (!stageRef.current) return [];
    return stageRef.current.find('.label-target').filter(
      node => node.attrs['data-item-type'] === 'seat'
    ) as Node<NodeConfig>[];
  }, [stageRef]);

  // 根据行号查找座位
  const findSeatsByRow = useCallback((rowNumber: string): Node<NodeConfig>[] => {
    return findAllSeats().filter(
      node => node.attrs['rowNumber'] === rowNumber
    );
  }, [findAllSeats]);

  // 根据 ID 查找节点
  const findNodeById = useCallback((id: string): Node<NodeConfig> | null => {
    if (!stageRef.current) return null;
    const node = stageRef.current.findOne(`#${id}`);
    return node as Node<NodeConfig> | null;
  }, [stageRef]);

  // 获取当前选中的节点（动态查找）
  const selectedNodes = useMemo((): Node<NodeConfig>[] => {
    if (!stageRef.current || selection.ids.length === 0) return [];
    return selection.ids
      .map(id => findNodeById(id))
      .filter((node): node is Node<NodeConfig> => node !== null);
  }, [selection.ids, stageRef, findNodeById]);

  // 按行号分组座位
  const groupSeatsByRow = useCallback((seats: Node<NodeConfig>[]) => {
    const groups = new Map<string, Node<NodeConfig>[]>();
    seats.forEach(seat => {
      const rowNumber = seat.attrs['rowNumber'];
      if (!groups.has(rowNumber)) {
        groups.set(rowNumber, []);
      }
      groups.get(rowNumber)!.push(seat);
    });
    return Array.from(groups.entries()).map(([rowNumber, seats]) => ({
      rowNumber,
      seats,
    }));
  }, []);

  // 选中单行
  const selectRow = useCallback((rowNumber: string) => {
    const seats = findSeatsByRow(rowNumber);
    if (seats.length === 0) return;

    setSelection({
      type: 'row',
      ids: seats.map(s => s.id()),
      rowNumbers: [rowNumber],
    });
  }, [findSeatsByRow]);

  // 选中单个
  const selectSingle = useCallback((node: Node<NodeConfig>, addToSelection = false) => {
    if (addToSelection && selection.type !== 'none') {
      setSelection(prev => ({
        type: 'mixed',
        ids: [...prev.ids, node.id()],
        rowNumbers: prev.rowNumbers,
      }));
    } else {
      setSelection({
        type: 'single',
        ids: [node.id()],
        rowNumbers: [],
      });
    }
  }, [selection.type]);

  // 清空选择
  const clearSelection = useCallback(() => {
    setSelection({
      type: 'none',
      ids: [],
      rowNumbers: [],
    });
  }, []);

  // 处理点击选择
  const handleSelect = useCallback((
    e?: KonvaEventObject<MouseEvent>,
    itemList?: Node<NodeConfig>[] | { shiftKey?: boolean }
  ) => {
    if (!e) return;
    
    const target = e.target;
    // 判断第二个参数是 itemList 还是 options
    const shiftKey = itemList && Array.isArray(itemList) ? false : (itemList as { shiftKey?: boolean })?.shiftKey || false;
    
    // 如果传入了 itemList，直接使用
    if (itemList && Array.isArray(itemList) && itemList.length > 0) {
      setSelection({
        type: 'mixed',
        ids: itemList.map(n => n.id()),
        rowNumbers: [],
      });
      return;
    }

    // 点击空白区域
    if (target.getType() === 'Stage') {
      clearSelection();
      return;
    }

    const itemType = target.attrs['data-item-type'];

    // 座位处理
    if (itemType === 'seat') {
      const rowNumber = target.attrs['rowNumber'];
      
      // 如果当前已经选中了该行，点击该行中的座位保持整行选中（不切换为单个）
      if (selection.type === 'row' && selection.rowNumbers.includes(rowNumber)) {
        // 点击已选中行的座位，保持整行选中不变
        return;
      }
      
      if (shiftKey) {
        // Shift+点击座位 → 选中单个
        selectSingle(target);
      } else {
        // 普通点击座位 → 选中整行
        selectRow(rowNumber);
      }
      return;
    }

    // 其他对象（图片、文本、形状等）
    if (shiftKey) {
      selectSingle(target, true);
    } else {
      selectSingle(target);
    }
  }, [selectRow, selectSingle, clearSelection, selection]);

  // 开始框选
  const startMarquee = useCallback((e: KonvaEventObject<MouseEvent>) => {
    if (!stageRef.current) return;
    
    const pos = stageRef.current.getPointerPosition();
    if (!pos) return;

    dragStartRef.current = pos;
    setIsMarqueeSelecting(true);
    setMarqueeBox({
      x: pos.x,
      y: pos.y,
      width: 0,
      height: 0,
    });
  }, [stageRef]);

  // 更新框选
  const updateMarquee = useCallback((e: KonvaEventObject<MouseEvent>) => {
    if (!isMarqueeSelecting || !dragStartRef.current || !stageRef.current) return;

    const pos = stageRef.current.getPointerPosition();
    if (!pos) return;

    const start = dragStartRef.current;
    setMarqueeBox({
      x: Math.min(start.x, pos.x),
      y: Math.min(start.y, pos.y),
      width: Math.abs(pos.x - start.x),
      height: Math.abs(pos.y - start.y),
    });
  }, [isMarqueeSelecting, stageRef]);

  // 结束框选
  const endMarquee = useCallback(() => {
    if (!isMarqueeSelecting || !marqueeBox || !stageRef.current) {
      setIsMarqueeSelecting(false);
      setMarqueeBox(null);
      dragStartRef.current = null;
      return;
    }

    // 获取框选区域内的所有对象
    const stage = stageRef.current;
    const box = marqueeBox;

    // 转换为舞台坐标
    const selectionRect = {
      x: (box.x - stage.x()) / stage.scaleX(),
      y: (box.y - stage.y()) / stage.scaleY(),
      width: box.width / stage.scaleX(),
      height: box.height / stage.scaleY(),
    };

    // 查找所有可选对象
    const allNodes = stage.find('.label-target') as Node<NodeConfig>[];
    const intersectingNodes = allNodes.filter(node => {
      const nodeBox = node.getClientRect();
      return Konva.Util.haveIntersection(selectionRect, nodeBox);
    });

    if (intersectingNodes.length > 0) {
      // 分离座位和其他对象
      const seats = intersectingNodes.filter(n => n.attrs['data-item-type'] === 'seat');
      const others = intersectingNodes.filter(n => n.attrs['data-item-type'] !== 'seat');

      if (others.length > 0) {
        // 包含非座位对象 → 混合选择
        setSelection({
          type: 'mixed',
          ids: intersectingNodes.map(n => n.id()),
          rowNumbers: [],
        });
      } else if (seats.length > 0) {
        // 全是座位 → 按行分组
        const rowGroups = groupSeatsByRow(seats);
        
        if (rowGroups.length === 1) {
          // 只有一行
          setSelection({
            type: 'row',
            ids: rowGroups[0].seats.map(s => s.id()),
            rowNumbers: [rowGroups[0].rowNumber],
          });
        } else {
          // 多行
          setSelection({
            type: 'multi-row',
            ids: seats.map(s => s.id()),
            rowNumbers: rowGroups.map(g => g.rowNumber),
          });
        }
      }
    }

    setIsMarqueeSelecting(false);
    setMarqueeBox(null);
    dragStartRef.current = null;
  }, [isMarqueeSelecting, marqueeBox, stageRef, groupSeatsByRow]);

  // 获取 Transformer 配置
  const getTransformerConfig = useCallback((selectionType: SelectionType) => {
    switch (selectionType) {
      case 'row':
        return {
          enabledAnchors: ['middle-left', 'middle-right'] as string[],
          rotateEnabled: true,
          anchorStyleFunc: (anchor: any) => {
            // 设置锚点样式
            anchor.cornerRadius(4);
            anchor.stroke('#00BFFF');
            anchor.strokeWidth(1);
            anchor.fill('#FFFFFF');
          },
        };
      case 'multi-row':
        return {
          enabledAnchors: [] as string[], // 多行只允许移动和旋转
          rotateEnabled: true,
        };
      case 'mixed':
      case 'single':
      default:
        return {
          enabledAnchors: [
            'top-left', 'top-center', 'top-right',
            'middle-left', 'middle-right',
            'bottom-left', 'bottom-center', 'bottom-right'
          ] as string[],
          rotateEnabled: true,
        };
    }
  }, []);

  // 获取选择状态下的鼠标样式
  const getSelectionCursor = useCallback((selectionType: SelectionType): string => {
    switch (selectionType) {
      case 'row':
      case 'multi-row':
        return 'move'; // 整行/多行选中时显示移动光标
      default:
        return 'default';
    }
  }, []);

  return {
    selection,
    selectedNodes,
    isMarqueeSelecting,
    marqueeBox,
    handleSelect,
    startMarquee,
    updateMarquee,
    endMarquee,
    clearSelection,
    selectRow,
    selectSingle,
    getTransformerConfig,
    getSelectionCursor,
  };
};

export default useSmartSelection;
