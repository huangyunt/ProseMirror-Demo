// crel 就是个 createElement 的缩写，用来创建 dom 元素的，感兴趣的可以看看源码就几十行
import crel from 'crelt'
import { EditorState, Transaction } from 'prosemirror-state'
import { EditorView } from 'prosemirror-view'
// 抽象 menu 的定义，不要每次都定义很多 html
/**
 * const btn = document.createElement('button')
 * btn.classList.add('is-active') // 当前 btn 激活
 * btn.classList.add('is-disabled') // 当前 btn 禁用
 * btn.onClick = fn // 点击 btn 后的效果
 * 
 * update btn style
 */

export interface MenuItemSpec {
  class?: string;
  label: string;
  handler: (
    props: {
      view: EditorView;
      state: EditorState;
      tr: Transaction;
      dispatch: EditorView['dispatch'];
    }, 
    event: MouseEvent
  ) => void;
  update?: (view: EditorView, state: EditorState, menu: HTMLElement) => void;
}

export class MenuItem {
  constructor(private view: EditorView, private spec: MenuItemSpec) {
    const _this = this;
    // 创建 button
    const btn = crel('button', { 
      class: spec.class, 
      // 绑定点击事件，点击按钮时要执行的函数
      onclick(this, event: MouseEvent) {
        // 把 view state 等内容传过去，因为点击按钮的时候不是增加一个node，就是要设置 mark
        spec.handler({
          view: _this.view,
          state: _this.view.state,
          dispatch: _this.view.dispatch,
          tr: _this.view.state.tr
        }, event)
      }
    })

    btn.classList.add('menu-item')

    btn.innerText = spec.label;

    // 将 btn 绑定在当前组件上
    this.dom = btn;
  }

  dom: HTMLElement;
  
  // 定义一个 update 更新方法，在编辑器有更新的时候就调用
  update(view: EditorView, state: EditorState) {
    this.view = view;
    this.spec.update?.(view, state, this.dom)
  }
}
