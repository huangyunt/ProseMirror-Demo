import { NodeSpec } from "prosemirror-model";

export const codeBlock: NodeSpec = {
    // 内容只支持纯文本
    content: 'text*',
    // 归属于 block 分组
    group: 'block',
    // mark 为空字符串，拒绝添加任何mark
    marks: '',
    // 标记 code 为 true, 内部一些处理会对 节点内容中包含 code 的节点进行特殊处理
    code: true,
    // defining 为true, 之前讲过它，全选它的内容，粘贴文本，不会直接把 code 的标签给替掉
    defining: true,
    draggable: false,
    selectable: true,
  
    // attrs 增加语言，主题，行号配置（主题本次不实现）
    attrs: {
      language: {
        default: 'plaintext'
      },
      theme: {
        default: 'dark'
      },
      showLineNumber: {
        default: true
      },
    },
  
    toDOM(node) {
      const theme = node.attrs.theme === 'light' ? 'light' : 'dark'
      return ['pre', {
        class: `code-block code-block--${theme}`,
        'data-language': node.attrs.language,
        'data-theme': node.attrs.theme,
        'data-show-line-number': node.attrs.showLineNumber,
        'data-node-type': 'code_block',
      }, ['code', 0]]
    },
  
    parseDOM: [
      {
        tag: 'pre',
        preserveWhitespace: 'full',
        getAttrs(node) {
          const domNode = node as HTMLElement;
          return {
            language: domNode.getAttribute('data-language'),
            theme: domNode.getAttribute('data-theme'),
            showLineNumber: domNode.getAttribute('data-show-line-number')
          }
        }
      }
    ]
  }
  