/**
 * 直接读剪贴板（不依赖 paste 事件）。
 * 注意：须在用户手势内调用（如 click）；页面需 HTTPS 或 localhost；可能弹权限。
 */

/** 只读纯文本（最简单） */
export async function readClipboardText(): Promise<string> {
  return navigator.clipboard.readText();
}

/** 读剪贴板里所有条目及每种 MIME 的字符串/说明（富文本常为 text/html） */
export async function readClipboardDebug(): Promise<string> {
  const items = await navigator.clipboard.read();
  const lines: string[] = [];

  for (const item of items) {
    lines.push(`条目 types: ${item.types.join(', ')}`);
    for (const type of item.types) {
      const blob = await item.getType(type);
      if (type === 'text/plain' || type === 'text/html') {
        lines.push(`  [${type}] ${(await blob.text()).slice(0, 500)}${blob.size > 500 ? '…' : ''}`);
      } else {
        lines.push(`  [${type}] <二进制 ${blob.size} bytes>`);
      }
    }
  }

  return lines.join('\n');
}
