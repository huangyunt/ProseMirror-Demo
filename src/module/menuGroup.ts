import crel from "crelt";
import { EditorView } from "prosemirror-view";
import { MenuItem, MenuItemSpec } from "./menuItem";
import { EditorState } from "prosemirror-state";

export interface MenuGroupSpec {
  name?: string;
  class?: string;
  menus: MenuItemSpec[];
}

export class MenuGroup {
  private menus: MenuItem[];

  dom: HTMLElement;

  constructor(
    private view: EditorView,
    private spec: MenuGroupSpec,
  ) {
    // 创建一个 div
    const dom = crel("div", { class: this.spec.class });
    dom.classList.add("menu-group");

    // 将 dom 保存在 MenuGroup 实例属性上
    this.dom = dom;
    // 通过传递的 menus 配置项，批量创建 menu
    this.menus = spec.menus.map(
      (menuSpec) => new MenuItem(this.view, menuSpec),
    );

    // 最后将 menu 对应的 dom 添加到 menuGroup 的 dom 中
    this.menus.forEach((menu) => {
      dom.appendChild(menu.dom);
    });
  }

  // 定义一个 update, 主要用来批量更新 menu 的 update
  update(view: EditorView, state: EditorState) {
    this.view = view;
    this.menus.forEach((menu) => {
      menu.update(view, state);
    });
  }
}
