import { Command, Selection, TextSelection } from "prosemirror-state";
import { Node as PMNode } from "prosemirror-model";
import { toggleMark } from "./mark";
import type { NodeWithPos } from "./utils";

export const insertParagraphCommand: Command = (state, dispatch) => {
  const { tr, schema } = state;
  const { block_tile, paragraph } = schema.nodes;

  const newLine = block_tile.create({}, paragraph.create());

  if (dispatch) {
    // 使用我们的新 Node 替换选区，如果是使用之前用过的 insert 或 replaceWith，插入之后，光标不在新行中，
    // 还需要我们修改选区，移动光标位置，直接使用下面的 api 插入后，光标就在新行中。
    tr.replaceSelectionWith(newLine);

    // 插入后如果不在可视区，滚动到可视区
    tr.scrollIntoView();
    dispatch(tr);
    return true;
  }
  return false;
};

export const toggleBoldCmd: Command = (state, dispatch, view) => {
  if (view) {
    return toggleMark(view, "bold");
  }
  return false;
};

export const insertCodeBlockCmd: Command = (state, dispatch, view) => {
  // 为了后续方便，每次创新新的 code block，预览就使用上次使用的 langguage，上次的 language 后面会记录在 schema.cached 中
  const lastLanguage = state.schema.cached.lastLanguage || 'plaintext';

  const { block_tile, code_block } = state.schema.nodes;
  const codeBlockNode = block_tile.create({}, code_block.create({ language: lastLanguage }));

  let tr = state.tr;
  tr.replaceSelectionWith(codeBlockNode);
  tr.scrollIntoView();

  if (dispatch) {
    dispatch(tr)
    return true
  }
  return false;
};


export const selectAllCodeCmd: Command = (state, dispatch) => {
  const { selection, tr } = state;

  const codeBlock = findParentNode((node) => node.type.name === 'code_block')(selection);

  if (!codeBlock || !dispatch) return false;

  tr.setSelection(TextSelection.create(
    tr.doc,
    codeBlock.pos + 1,
    codeBlock.pos + codeBlock.node.nodeSize - 1,
  ));

  dispatch(tr);

  return true;
}

/**
 * 从当前选区向上查找满足条件的最近父节点（柯里化）
 *
 * @example
 * findParentNode(node => node.type.name === 'code_block')(state.selection)
 */
export function findParentNode(
  predicate: (node: PMNode) => boolean,
): (selection: Selection) => NodeWithPos | null {
  return (selection) => {
    const { $from } = selection;

    // 从最深的祖先开始向上找，返回第一个匹配的节点（即离光标最近的）
    for (let depth = $from.depth; depth >= 0; depth--) {
      const node = $from.node(depth);
      if (predicate(node)) {
        return {
          node,
          pos: depth === 0 ? 0 : $from.before(depth),
        };
      }
    }

    return null;
  };
}

/**
 * 基于 EditorState 的便捷封装
 */
export function findParentNodeFromState(
  predicate: (node: PMNode) => boolean,
  selection: Selection,
): NodeWithPos | null {
  return findParentNode(predicate)(selection);
}
