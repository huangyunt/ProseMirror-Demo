import { Command } from "prosemirror-state";
import { toggleMark } from "./mark";

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
