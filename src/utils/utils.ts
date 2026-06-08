import hljs from "highlight.js";
import type { HighlightResult } from "highlight.js";
import type { NodeType, Node as PMNode } from "prosemirror-model";
import { Plugin, PluginKey } from "prosemirror-state";
import { Decoration, DecorationSet } from "prosemirror-view";

export interface NodeWithPos {
  node: PMNode;
  pos: number;
}

type EmitterTreeNode =
  | string
  | {
      scope?: string;
      children: EmitterTreeNode[];
    };

/** hljs highlight 后 _emitter 内部 token 树（TokenTreeEmitter） */
type HighlightEmitter = HighlightResult["_emitter"] & {
  root: EmitterTreeNode;
  finalize(): boolean;
};

interface HighlightToken {
  text: string;
  className: string | null;
}

const HLJS_CLASS_PREFIX = "hljs-";

/** 与 highlight.js HTMLRenderer 保持一致的 scope → class 转换 */
function scopeToCSSClass(name: string, prefix = HLJS_CLASS_PREFIX): string {
  if (name.startsWith("language:")) {
    return name.replace("language:", "language-");
  }

  if (name.includes(".")) {
    const pieces = name.split(".");
    return [
      `${prefix}${pieces.shift()}`,
      ...pieces.map((part, index) => `${part}${"_".repeat(index + 1)}`),
    ].join(" ");
  }

  return `${prefix}${name}`;
}

function resolveCodeBlockLanguage(
  rawLanguage: string | null | undefined,
  text: string,
): string {
  const normalized = (rawLanguage || "").toLowerCase().trim();

  if (normalized && hljs.getLanguage(normalized)) {
    return normalized;
  }

  if (text) {
    const auto = hljs.highlightAuto(text);
    if (auto.language && hljs.getLanguage(auto.language)) {
      return auto.language;
    }
  }

  return "plaintext";
}

/**
 * 遍历 _emitter 拼出来的 token 树，按文本片段收集 hljs class
 * （内部由 hljs 的 _emit / addText / startScope 构建）
 */
function walkEmitterTree(
  node: EmitterTreeNode,
  classStack: string[],
  tokens: HighlightToken[],
): void {
  if (typeof node === "string") {
    if (node) {
      tokens.push({
        text: node,
        className: classStack.length ? classStack.join(" ") : null,
      });
    }
    return;
  }

  const hasScope = Boolean(node.scope);

  if (hasScope && node.scope) {
    classStack.push(scopeToCSSClass(node.scope));
  }

  node.children.forEach((child) => walkEmitterTree(child, classStack, tokens));

  if (hasScope) {
    classStack.pop();
  }
}

function tokensFromHighlightResult(
  highlightResult: HighlightResult,
): HighlightToken[] {
  const tokens: HighlightToken[] = [];
  const emitter = highlightResult._emitter as HighlightEmitter;

  // highlight() 返回前通常已 finalize，这里兜底一次
  emitter.finalize();

  walkEmitterTree(emitter.root, [], tokens);
  return tokens;
}

function buildTokenDecorations(
  tokens: HighlightToken[],
  from: number,
): Decoration[] {
  const decorations: Decoration[] = [];
  let offset = 0;

  tokens.forEach(({ text, className }) => {
    const length = text.length;

    if (length > 0 && className) {
      decorations.push(
        Decoration.inline(from + offset, from + offset + length, {
          class: className,
        }),
      );
    }

    offset += length;
  });

  return decorations;
}

function buildCodeBlockDecorations(block: NodeWithPos): Decoration[] {
  const text = block.node.textContent;
  const language = resolveCodeBlockLanguage(block.node.attrs.language, text);
  const contentFrom = block.pos + 1;
  const showLineNumberClass = block.node.attrs.showLineNumber
    ? "show-line-number"
    : "";

  const nodeDecoration = Decoration.node(
    block.pos,
    block.pos + block.node.nodeSize,
    {
      class: `code-block-highlight language-${language} ${showLineNumberClass}`.trim(),
      "data-language": language,
    },
  );

  if (!text || language === "plaintext" || !hljs.getLanguage(language)) {
    return [nodeDecoration];
  }

  const highlightResult = hljs.highlight(text, { language });
  const tokens = tokensFromHighlightResult(highlightResult);
  const mergedText = tokens.map((t) => t.text).join("");

  if (mergedText !== text) {
    return [nodeDecoration];
  }

  return [nodeDecoration, ...buildTokenDecorations(tokens, contentFrom)];
}

export function codeHighlightPlugin() {
  return new Plugin({
    key: new PluginKey("code-highlight"),
    props: {
      decorations(state) {
        return DecorationSet.create(state.doc, getDecs(state.doc));
      },
    },
  });
}

/**
 * 获取所有指定类型的 node
 */
export function findNodesOfType(
  doc: PMNode,
  type: string | string[] | NodeType | NodeType[],
) {
  const schema = doc.type.schema;

  const tempTypes: string[] | NodeType[] = Array.isArray(type)
    ? type
    : ([type] as string[] | NodeType[]);
  const types = tempTypes
    .map((item) => (typeof item === "string" ? schema.nodes[item] : item))
    .filter((item) => item);

  const nodes: NodeWithPos[] = [];

  doc.descendants((node, pos) => {
    if (types.includes(node.type)) {
      nodes.push({
        node,
        pos,
      });
    }
  });

  return nodes;
}

export function getDecs(doc: PMNode): Decoration[] {
  if (!doc?.nodeSize) {
    return [];
  }

  const blocks = findNodesOfType(doc, "code_block");
  return blocks.flatMap((block) => buildCodeBlockDecorations(block));
}
