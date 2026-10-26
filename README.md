# Sakura-UI · 樱花界面

《Degrees of Lewdity》的界面皮肤（DoL mod）。只改画面，不碰游戏数据：不读存档、不写存档、不改任何数值。

- 四套配色：樱花色（默认）、莫兰迪粉蓝、复古巧克力、石墨（深色）
- 正文纸色三档：柔（暖白，默认）、亮、暖（护眼）
- 侧栏分卡、正文链接分组、战斗页重排、商店/衣柜/存读档页重排、手机端适配
- 正文正文字体可选（随包内置「什锦黑」，不联网）

当前版本：**1.0.1**

## 安装

### 模组管理器（推荐）

下载 `Sakura-UI-1.0.1.mod.zip`，在 Mod Manager 里导入并启用，重载页面即可。
只有一个包，四套配色都在里面。

### 手动安装

把包内文件解压到游戏 HTML 同目录的 `Sakura-UI/` 文件夹，在 HTML 的最后一个 `</head>` 前插入：

```html
<link rel="stylesheet" href="Sakura-UI/dol-ui-manual.css">
<script src="Sakura-UI/dol-ui.js"></script>
<script src="Sakura-UI/dol-ui-tips.js"></script>
<script src="Sakura-UI/dol-ui-prefs.js"></script>
```

`dol-ui-manual.css` 是手动装法专用的合并成品；不要换成包内的 `dol-ui.css`（那只是配色变量那一份）。

## 设置

游戏内：选项 → 页签条最后一枚「樱花界面」。

这一枚页签依赖 ModLoader 自带的 **TweeReplacer**；缺它时皮肤照常工作，只是没有这一枚页签。
手动装法可在控制台切换：

```js
DolUiPrefs.set('skin', 'sakura')   // 樱花色（默认）／mist／cocoa／ink
DolUiPrefs.set('read', 'soft')     // 正文底色：soft（柔）／bright（亮）／warm（暖）
DolUiPrefs.set('font', 'none')     // 跟随游戏字体；'a' = 什锦黑
```

界面偏好存在浏览器本地，不进存档。

## 验证

控制台执行：

```js
getComputedStyle(document.documentElement).getPropertyValue('--dol-r').trim()
```

- 空字符串：CSS 没加载
- `12px`：皮肤与偏好层正常（浅色档）
- `9px`：皮肤正常，当前为石墨深色档

## 兼容

- 只在游戏 Options → Style 选择 Default / Dark 时接管颜色；选其他主题时颜色让位，布局仍生效。
- 与 ModHub、ModLoader 同装正常。

## 卸载

管理器里禁用/删除对应包即可。想清掉界面偏好：

```js
['dolUiSkin','dolUiFont','dolUiFx','dolUiCap','dolUiRows','dolUiRead'].forEach(k => localStorage.removeItem(k))
```

## 发行

本仓库存放正式发行包与包内文件；源码维护在本地，发行包为去注释产物。
