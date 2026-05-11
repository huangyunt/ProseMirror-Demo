// model.ts 文件命名暂时还是以 mvc 模式命名，方便理解，实际中 命名为 schema.ts 更好
import { Schema } from 'prosemirror-model';
export const schema = new Schema({
  nodes: {
    doc: {
      content: 'tile+'
    },
    block_tile: {
      content: 'block+',
      group: 'tile',
      inline: false,
      toDOM: () => {
        return ['div', { 'class': "block_tile" }, 0]
      },
    },
    blockquote: {
      // blockquote 中允许输入多个段落
      content: 'paragraph+',
      group: 'block',
      defining: true,
      toDOM: () => {
        return ['blockquote', 0]
      },
      parseDOM: [
        { tag: 'blockquote' }
      ],
      draggable: true,
      selectable: true,
    },

    paragraph: {
      content: 'inline*',
      group: 'block',
      toDOM: () => {
        return ['p', 0]
      }
    },
    heading: {
      attrs: {
        level: {
          default: 1
        }
      },
      selectable: false,
      content: 'inline*',
      group: 'block',
      toDOM: (node) => {
        const tag = 'h' + node.attrs.level
        return [tag, 0]
      },
      parseDOM: [
        // 这里配置了 6 条规则，将对应 tag 能匹配到的元素，分别转为 heading 节点，并且填充对应的 attrs（类似 Vue React 的 props）
        { tag: 'h1', attrs: { level: 1 } },
        { tag: 'h2', attrs: { level: 2 } },
        { tag: 'h3', attrs: { level: 3 } },
        { tag: 'h4', attrs: { level: 4 } },
        { tag: 'h5', attrs: { level: 5 } },
        { tag: 'h6', attrs: { level: 6 } },
      ],
      // defining: true,
    },
    text: {
      group: 'inline'
    },
    datetime: {
      group: 'inline',
      inline: true,
      atom: true,
      attrs: {
        timestamp: {
          default: null
        }
      },
      toDOM(node) {
        // 自定义 dom 结构
        const dom = document.createElement('span');
        dom.classList.add('datetime')
        dom.dataset.timestamp = node.attrs.timestamp;
        console.log('node.attrs',node.attrs)
  
        let time = '';
        if (node.attrs.timestamp) {
          const date = new Date(node.attrs.timestamp)
          time = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`
        }
  
        const label = document.createElement('label');
        label.innerText = '请选择时间';
  
        const input = document.createElement('input');
        input.type="date";
        input.value = time;
  
        input.addEventListener('input', (event) => {
          dom.dataset.timestamp = new Date((event.target as HTMLInputElement).value).getTime().toString()
        })
  
        dom.appendChild(label)
        dom.appendChild(input)
        // 返回 dom
        return dom;
      },
      parseDOM: [
        {
          tag: 'span.datetime',
          getAttrs(htmlNode) {
            if (typeof htmlNode !== 'string') {
              const timestamp = htmlNode.dataset.timestamp;
              return {
                timestamp: timestamp ? Number(timestamp) : null
              }
            };
            return {
              timestamp: null
            }
          }
        }
      ]
    },
  },
  marks: {
    // 常见的 mark
    // 加粗 b, strong(语义化)
    bold: {
      toDOM: () => {
        return ['strong', 0]
      },
      parseDOM: [
        { tag: 'strong' },
        { tag: 'b', getAttrs: (domNode) => (domNode as HTMLElement).style.fontWeight !== 'normal' && null },
        { style: 'font-weight', getAttrs: (value) => /^(bold(er)?|[5-9]\d{2})$/.test(value as string) && null }
      ]
    },
    // 斜体 em
    italic: {
      group: 'heading',
      toDOM: () => {
        return ['em', 0]
      },
      parseDOM: [
        { tag: 'em' },
        { tag: 'i', getAttrs: (domNode) => (domNode as HTMLElement).style.fontStyle !== 'normal' && null},
        { style: 'font-style=italic' },
      ]
    },
  },
  topNode: 'doc'
})

