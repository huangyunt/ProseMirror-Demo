import React, { useEffect } from "react";
import logo from "./logo.svg";
import "./App.css";

// view.ts
import { EditorView } from "prosemirror-view";
import { EditorState } from "prosemirror-state";
// 新增以下导入
import { keymap } from "prosemirror-keymap";
// baseKeymap 定义了对于很多基础按键按下后的功能，例如回车换行，删除键等。
import { baseKeymap } from "prosemirror-commands";
// history 是操作历史，提供了对保存操作历史以及恢复等功能，undo，redo 函数对应为进行 undo 操作与 redo 操作，恢复历史数据
import { history, undo, redo } from "prosemirror-history";
import {exampleSetup} from "prosemirror-example-setup"

import { schema } from "./model/schema";


// import { schema } from '../schema-learning/schema'

import { insertBlockquote, insertDatetime, insertHeading, insertParagraph } from './utils/insertContent'
import { readClipboardText, readClipboardDebug } from './examples/readClipboardDirect'
import { Toolbar } from "./module/toolBar";
import { Attrs, MarkType, Schema } from "prosemirror-model";
import { TextSelection } from "prosemirror-state";

export const setupEditor = (el: HTMLElement | null) => {
  if (!el) return;
  
  const editorRoot = document.createElement('div');
  editorRoot.id = 'editorRoot';

  // 根据 schema 定义，创建 editorState 数据实例
  const editorState = EditorState.create({
    schema,
    plugins: [
      keymap(baseKeymap),
      // 接入 history 插件，提供输入历史栈功能
      history(),
      // 将组合按键 ctrl/cmd + z, ctrl/cmd + y 分别绑定到 undo, redo 功能上
      keymap({"Mod-z": undo, "Mod-y": redo}),
    ]
  })
  
  // 创建编辑器视图实例，并挂在到 el 上
  const editorView = new EditorView(editorRoot, {
    state: editorState,
    //
    dispatchTransaction(tr) {
      console.log('tr',tr)
      let newState = editorView.state.apply(tr);
      editorView.updateState(newState);
      toolbarDom.update(editorView, editorView.state)
    }
  })


  const toolbarDom = new Toolbar(editorView, {
    groups: [
      {
        name: '段落',
        menus: [
          {
            label: '添加段落',
            handler: (props) => {
              const { view } = props;
              insertParagraph(view, '新段落')
            },
          },
          {
            label: '添加一级标题',
            handler: (props) => {
              insertHeading(props.view, '新一级标题')
            },
          },
          {
            label: '添加 blockquote',
            handler: (props) => {
              insertBlockquote(props.view)
            },
          },
          {
            label: '添加 datetime',
            handler: (props) => {
              insertDatetime(props.view, Date.now())
            },
          },
        ]
      },
      {
        name: '格式',
        menus: [
          {
            label: 'B',
            handler(props) {
              toggleBold(props.view);
              props.view.focus();
            },
            update(view, state, menuDom) {
              // 编辑器更新时，判断是当前选区内容是否已经设置为 bold, 根据条件，为 menu 增加 is-active 类
              const isActive = isBold(view)
              if (isActive && !menuDom.classList.contains('is-active')) {
                menuDom.classList.add('is-active')
              }
          
              if (!isActive && menuDom.classList.contains('is-active')) {
                menuDom.classList.remove('is-active')
              }
            }
          },
        ]
      }
    ]
  })

  editorRoot.appendChild(toolbarDom.dom)
  // 添加两个 button 分别插入段落和标题
  // const btnGroup = document.createElement('div');
  // btnGroup.style.marginBottom = '12px';
  // const addParagraphBtn = document.createElement('button');
  // addParagraphBtn.innerText = '添加新段落';
  // addParagraphBtn.addEventListener('click', () => insertParagraph(editorView, '新段落'))

  // const addHeadingBtn = document.createElement('button');
  // addHeadingBtn.innerText = '添加新一级标题';
  // addHeadingBtn.addEventListener('click', () => insertHeading(editorView, '新一级标题'))

  // const addBlockquoteBtn = document.createElement('button');
  // addBlockquoteBtn.innerText = '添加新引用';
  // addBlockquoteBtn.addEventListener('click', () => insertBlockquote(editorView, '新引用'))

  // const addDatetimeBtn = document.createElement('button');
  // addDatetimeBtn.innerText = '添加时间选择器';
  // addDatetimeBtn.addEventListener('click', () => insertDatetime(editorView, Date.now()))

  // const readClipboardRichBtn = document.createElement('button');
  // readClipboardRichBtn.innerText = '读取剪贴板（含 HTML 调试）';
  // readClipboardRichBtn.title = '使用 navigator.clipboard.read() 列出各 MIME';
  // readClipboardRichBtn.addEventListener('click', async () => {
  //   try {
  //     const items = await readClipboardDebug();
  //     console.log(items)
  //   } catch (err) {
  //     const message = err instanceof Error ? err.message : String(err);
  //     console.log(message)
  //   }
  // });


  // btnGroup.appendChild(addParagraphBtn)
  // btnGroup.appendChild(addHeadingBtn)
  // btnGroup.appendChild(addBlockquoteBtn)
  // btnGroup.appendChild(addDatetimeBtn)
  // btnGroup.appendChild(readClipboardRichBtn)
  
  const fragment = document.createDocumentFragment()
  // fragment.appendChild(btnGroup)
  fragment.appendChild(toolbarDom.dom)
  fragment.appendChild(editorRoot)

  el.appendChild(fragment)
  

  // @ts-ignore
  window.editorView = editorView
}

function App() {
  useEffect(() => {
    // main.ts
    document.querySelector<HTMLDivElement>("#app")!.innerHTML = /*html*/ `
      <div>
        <h3>从第一个 prosemirror 案例开始认识它</h3>
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

/**
 * 设置 mark
 * 
 * @param view 
 * @param markType 
 * @param attrs 
 */
function setMark(view: EditorView, markType: MarkType | string, attrs: Attrs | null = null) {
  const { schema, selection, tr } = view.state;
  const { $from, $to, empty } = selection;

  const realMarkType = getMarkType(markType, schema);
  const mark = realMarkType.create(attrs);

  // 光标状态，如果 storedMarks 里没有 当前 mark，就把当前 mark 加进去
  if (empty) {
    if (!realMarkType.isInSet(tr.storedMarks || [])) {
      tr.addStoredMark(mark)
    }
  } else {
    // 否则再执行之前的逻辑
    tr.addMark($from.pos, $to.pos, mark);
  }

  view.dispatch(tr);

  return true;
}

/**
 * 选区内所有的内容都被设置了 mark，那就是 active
 * 
 * @param view 
 * @param markType 
 */
function isMarkActive(view: EditorView, markType: MarkType | string) {
  const { schema, selection, tr } = view.state;

  // 暂时规定：如果不是文本选区，就不能设置 mark
  if (!isTextSelection(selection)) {
    return false;
  }

  const { $from, $to, empty } = selection;
  
  const realMarkType = getMarkType(markType, schema);

  let isActive = true;

  // 增加 光标情况下，判断当前是否处于 markType 下
  if (empty) {
    if (!realMarkType.isInSet(tr.storedMarks || [])) {
      isActive = false;
    }
  } else {
    tr.doc.nodesBetween($from.pos, $to.pos, (node) => {
      if (!isActive) return false;
      if (node.isInline) {
        const mark = realMarkType.isInSet(node.marks)
        if (!mark) {
          isActive = false;
        }
      }
    })
  }
  

  return isActive;
}


/**
 * 设置加粗
 * 
 * @param view 
 * @returns 
 */
export function setBold(view: EditorView) {
  const boldMarkType = view.state.schema.marks.bold;

  return setMark(view, boldMarkType);
}

/**
 * 取消 mark
 * 
 * @param view 
 * @param markType 
 */
function unsetMark(view: EditorView, markType: MarkType | string) {
  const { schema, selection, tr } = view.state;
  const { $from, $to } = selection;
  
  const type = typeof markType === 'string' ? schema.marks[markType] : markType;

  tr.removeMark($from.pos, $to.pos, type);
  
  view.dispatch(tr)

  return true;
}

/**
 * 取消加粗
 * 
 * @param view 
 * @returns 
 */
export function unsetBold(view: EditorView) {
  const boldMarkType = view.state.schema.marks.bold;

  return unsetMark(view, boldMarkType);
}


// 将获取 markType 的功能封装为函数方便调用
function getMarkType(markType: MarkType | string, schema: Schema) {
  return typeof markType === 'string' ? schema.marks[markType] : markType;
}
// 判断当前 selection 是否是 文本选区，prosemirror 中除了文本选区，还有 Node 选区 NodeSelection，即当前选中的是某个 Node 节点而不是文本
function isTextSelection(selection: unknown): selection is TextSelection {
  return selection instanceof TextSelection;
}

/**
 * toggle mark
 * 
 * @param view 
 * @param markType 
 * @returns 
 */
function toggleMark(view: EditorView, markType: MarkType | string) {
  if (isMarkActive(view, markType)) {
    return unsetMark(view, markType)
  } else {
    return setMark(view, markType)
  }
}

// 其实也没必要封装了，后续可以直接使用 isMarkActive() 传入字符串
export function isBold(view: EditorView) {
  const boldMarkType = view.state.schema.marks.bold;
  
  return isMarkActive(view, boldMarkType)
}

// toggleBold
export function toggleBold(view: EditorView) {
  return toggleMark(view, 'bold');
}

