import React, { useEffect } from "react";
import logo from "./logo.svg";
import "./App.css";
import "highlight.js/styles/atom-one-dark.css";

// view.ts
import { EditorView } from "prosemirror-view";
import { EditorState, PluginKey, Plugin } from "prosemirror-state";
// 新增以下导入
import { keymap } from "prosemirror-keymap";
// baseKeymap 定义了对于很多基础按键按下后的功能，例如回车换行，删除键等。
import { baseKeymap, chainCommands } from "prosemirror-commands";
// history 是操作历史，提供了对保存操作历史以及恢复等功能，undo，redo 函数对应为进行 undo 操作与 redo 操作，恢复历史数据
import { history, undo, redo } from "prosemirror-history";
import { exampleSetup } from "prosemirror-example-setup";

import { schema } from "./model/schema";

// import { schema } from '../schema-learning/schema'

import {
  insertBlockquote,
  insertDatetime,
  insertHeading,
  insertParagraph,
} from "./utils/insertContent";
import {
  readClipboardText,
  readClipboardDebug,
} from "./examples/readClipboardDirect";
import { Toolbar } from "./module/toolBar";
import { Attrs, MarkType, Schema } from "prosemirror-model";
import { TextSelection } from "prosemirror-state";
import {
  insertCodeBlockCmd,
  insertParagraphCommand,
  selectAllCodeCmd,
  toggleBoldCmd,
} from "./utils/command";
import { isBold, toggleBold } from "./utils/mark";
import { docChangedTimesPlugin } from "./utils/plugin";
import { codeBlockViewConstructor } from "./nodeView/CodeBlockView";
import { codeHighlightPlugin } from "./utils/utils";

// // 加入到 state 中
// const editorState = EditorState.create({
//   schema,
//   plugins: [
//     //...
//   ],
//   doc
// })

// const editorView = new EditorView(editorRoot, {
//   state: editorState,
//   nodeViews: {
//     code_block: codeBlockViewConstructor
//   },
//   // editor View 中增加一个 decorations，通过  Decoration.inline 指定在位置 从 5 -> 10 的文本上，添加 style 样式，为红色
//   decorations(state) {
//     const decoration = Decoration.inline(5,10, { style: 'color: red' });
//     // 返回的 decoration 必须是个 DecorationSet
//     return DecorationSet.create(state.doc, [decoration]);
//   }
// })

export const setupEditor = (el: HTMLElement | null) => {
  if (!el) return;

  const editorRoot = document.createElement("div");
  editorRoot.id = "editorRoot";

  // 先创建一个固定的文本
  const doc = schema.nodeFromJSON({
    type: "doc",
    content: [
      {
        type: "block_tile",
        content: [
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "123456789",
              },
            ],
          },
        ],
      },
    ],
  });

  // 根据 schema 定义，创建 editorState 数据实例
  const editorState = EditorState.create({
    schema,
    plugins: [
      keymap({
        ...baseKeymap,
        Enter: insertParagraphCommand,
        "Mod-a": chainCommands(selectAllCodeCmd, baseKeymap["Mod-a"]),
      }),
      // 接入 history 插件，提供输入历史栈功能
      history(),
      // 将组合按键 ctrl/cmd + z, ctrl/cmd + y 分别绑定到 undo, redo 功能上
      keymap({ "Mod-z": undo, "Mod-y": redo }),
      keymap({ "Mod-b": toggleBoldCmd }),

      new Plugin({
        key: new PluginKey("toolbar"),
        view: (view) =>
          new Toolbar(view, {
            groups: [
              //...
            ],
          }),
      }),

      docChangedTimesPlugin(),
      codeHighlightPlugin(),
    ],
    doc,
  });

  // 创建编辑器视图实例，并挂在到 el 上
  const editorView = new EditorView(editorRoot, {
    state: editorState,
    nodeViews: {
      code_block: codeBlockViewConstructor,
    },
    //
    dispatchTransaction(tr) {
      console.log("tr", tr);
      let newState = editorView.state.apply(tr);
      editorView.updateState(newState);
    },
  });

  const toolbarDom = new Toolbar(editorView, {
    groups: [
      {
        name: "段落",
        menus: [
          {
            label: "添加段落",
            handler: (props) => {
              const { view } = props;
              insertParagraph(view, "新段落");
            },
          },
          {
            label: "添加一级标题",
            handler: (props) => {
              insertHeading(props.view, "新一级标题");
            },
          },
          {
            label: "添加 blockquote",
            handler: (props) => {
              insertBlockquote(props.view);
            },
          },
          {
            label: "添加 datetime",
            handler: (props) => {
              insertDatetime(props.view, Date.now());
            },
          },
          // 然后增加一个按钮，调用命令。
          {
            label: "添加代码块",
            handler: ({ state, dispatch, view }) => {
              insertCodeBlockCmd(state, dispatch, view);
              setTimeout(() => {
                view.focus();
              });
            },
          },
        ],
      },
      {
        name: "格式",
        menus: [
          {
            label: "B",
            handler(props) {
              toggleBold(props.view);
              props.view.focus();
            },
            update(view, state, menuDom) {
              // 编辑器更新时，判断是当前选区内容是否已经设置为 bold, 根据条件，为 menu 增加 is-active 类
              const isActive = isBold(view);
              if (isActive && !menuDom.classList.contains("is-active")) {
                menuDom.classList.add("is-active");
              }

              if (!isActive && menuDom.classList.contains("is-active")) {
                menuDom.classList.remove("is-active");
              }
            },
          },
        ],
      },
    ],
  });

  editorRoot.appendChild(toolbarDom.dom);

  const fragment = document.createDocumentFragment();
  // fragment.appendChild(btnGroup)
  fragment.appendChild(toolbarDom.dom);
  fragment.appendChild(editorRoot);

  el.appendChild(fragment);

  // @ts-ignore
  window.editorView = editorView;
};

function App() {
  useEffect(() => {
    // main.ts
    document.querySelector<HTMLDivElement>("#app")!.innerHTML = /*html*/ `
      <div>
        <h3>prosemirror 案例</h3>
        <div id="editorContainer"></div>
      </div>
    `;
    // 在 main.ts 中，调用 stetupEditor，将编辑器 view 挂在在 editorContainer 中
    setupEditor(document.querySelector("#editorContainer"));
  }, []);

  return (
    <div id="app">
      <div id="editorContainer"></div>
    </div>
  );
}

export default App;
