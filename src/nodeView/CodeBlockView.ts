import { EditorView, NodeView, NodeViewConstructor } from "prosemirror-view";
import { Node as PMNode } from "prosemirror-model";
import crel from 'crelt'

export class CodeBlockView implements NodeView {
    name = 'block_code';
  
    // view 与 getPos 是我们自己定义的属性，保存一下 editor 与 getPos 方便使用
    private view: EditorView;
    private getPos: () => number | undefined;
  
    // 在 view 中配置 nodeView 时，每个 nodeView 对应的都是个都是个函数，类型为 NodeViewConstructor
    // 里面的参数可以获取到 node,view,getPos 等信息，这里 node 是当前初始化时候 node 节点对应的实例
    // 后续每次更新，这个 node 就是不能用的，因为 prosemirror 每次更新都是 immutable 的，每次都是新数据
    // view 就不说了，getPos 可以获取到当前 node 在文档中的位置
    constructor(...args: Parameters<NodeViewConstructor>) {
      const [node, view, getPos] = args;
      
      this.view = view;
      this.getPos = getPos;
      this.node = node;
  
      // renderUI 就是根据 node 的一些 attrs，生成一个 dom 与 contentDOM，这个方法也是我们自己定义的
      // 后续接入 vue、react、svelte 等，这里的 可以用框架实现，反正最后把组件绑定到 this.dom 上，如果需要里面能输入内容，
      // 就需要一个 contentDOM 专门接收浏览器输入的内容的
      this.renderUI(node)
  
    }
    
    dom!: HTMLElement;
    contentDOM!: HTMLElement;
    node!: PMNode;
  
    // 最后就是 update 了，这个跟我们之前写的插件的 PluginView 有点类似，都是在编辑器内容更新的时候，都会触发这里的 update
    update(...params: Parameters<Required<NodeView>['update']>) {
      const [node] = params;
      this.node = node;
      if (node.type.name !== 'code_block') {
        return false;
      }
  
      this.updateUI(node);
  
      return true;
    };
  
    private getTheme(node: PMNode) {
      return node.attrs.theme === 'light' ? 'light' : 'dark'
    }

    private applyThemeClass(node: PMNode) {
      const theme = this.getTheme(node)
      this.dom.classList.remove('code-block--dark', 'code-block--light')
      this.dom.classList.add(`code-block--${theme}`)
      this.dom.dataset.theme = node.attrs.theme
    }

    /**
     * 渲染 ui, 这里具体就是通过原始的 dom 操作拼 ui 呢
     * @param node 
     */
    private renderUI(node: PMNode) {
      const theme = this.getTheme(node)

      this.dom = crel('div', {
        class: `code-block code-block--${theme}`,
        'data-language': node.attrs.language,
        'data-theme': node.attrs.theme,
        'data-show-line-number': node.attrs.showLineNumber,
        'data-node-type': 'code_block',
        spellcheck: 'false',
      })

      const menuContainer = crel('div',
        {
          class: 'code-block-menu-container',
        },
        crel('div',
          {
            class: 'code-block-menu',
          },
          crel('select', {
            class: 'code-block-select code-name-select',
            onchange: (event: Event) => {
              const { state, dispatch } = this.view;
              const language = (event.target as HTMLSelectElement).value;
              const pos = this.getPos();
              this.view.state.schema.cached.lastLanguage = language;
              if (pos) {
                const tr = state.tr.setNodeAttribute(pos, 'language', language);
                dispatch(tr);
                setTimeout(() => this.view.focus(), 16);
              }
            }
          }, ['plaintext', 'javascript', 'typescript', 'html', 'markdown', 'python', 'java'].map(item => crel('option', { value: item, selected: item === node.attrs.language }, item))),
          crel('div', {
            class: 'code-block-menu-right'
          },
            crel('select',
              {
                class: 'code-block-select show-line-number-select',
                onchange: (event: Event) => {
                  const { state, dispatch } = this.view;
                  const showLineNumber = (event.target as HTMLSelectElement).value === 'true';
                  const pos = this.getPos();
                  if (pos) {
                    const tr = state.tr.setNodeAttribute(pos, 'showLineNumber', showLineNumber);
                    dispatch(tr);
                    setTimeout(() => this.view.focus(), 16)
                  }
                }
              },
              [{ value: 'true', label: '展示行号' }, { value: 'false', label: '隐藏行号' }].map(item => (
                crel('option', {
                  selected: item.value === node.attrs.showLineNumber.toString(),
                  value: item.value

                }, item.label)
              ))
            ),
            crel('button', {
              class: 'code-block-copy-btn',
              type: 'button',
              onmousedown: (event: Event) => {
                event.preventDefault()
                navigator.clipboard.writeText(this.node.textContent).then(() => {
                  alert("copied!")
                })
              }
            }, '复制')
          )
        )
      )

      const codeBody = crel('pre', { class: 'code-block-body' })
      const code = crel('code', {
        class: `code-block-content hljs language-${node.attrs.language} ${node.attrs.showLineNumber ? 'show-line-number' : ''}`,
        lang: node.attrs.language
      })

      this.contentDOM = code

      codeBody.appendChild(code)
      this.dom.appendChild(menuContainer)
      this.dom.appendChild(codeBody)
    }
  
    /**
     * 更新 ui
     * @param node 
     */
    private updateUI(node: PMNode) {
      const { showLineNumber, language } = node.attrs;
      const showLineNumberClass = 'show-line-number'

      this.applyThemeClass(node)
      this.dom.dataset.language = language
      this.dom.dataset.showLineNumber = showLineNumber

      if (showLineNumber && !this.contentDOM.classList.contains(showLineNumberClass)) {
        this.contentDOM.classList.add(showLineNumberClass)
      }
      if (!showLineNumber && this.contentDOM.classList.contains(showLineNumberClass)) {
        this.contentDOM.classList.remove(showLineNumberClass)
      }

      this.contentDOM.className = `code-block-content hljs language-${language} ${showLineNumber ? showLineNumberClass : ''}`.trim()
      this.contentDOM.lang = language

      const languageSelect = this.dom.querySelector('.code-name-select') as HTMLSelectElement | null
      if (languageSelect && languageSelect.value !== language) {
        languageSelect.value = language
      }

      const lineNumberSelect = this.dom.querySelector('.show-line-number-select') as HTMLSelectElement | null
      if (lineNumberSelect) {
        lineNumberSelect.value = showLineNumber.toString()
      }
    }
  }
  
  export const codeBlockViewConstructor: NodeViewConstructor = (...args: Parameters<NodeViewConstructor>) => new CodeBlockView(...args)
  
  
  