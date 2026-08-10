# hugo-blog
use hugo 搭建
---
## 博客链接：[blog.wunai.top](https://blog.wunai.top)
---
## 为什么使用Hugo

此前，使用过 Hexo Astro 使人眼花缭乱
>（本人学历不高，对代码学习时间有限。过于复杂导致看不大懂，只能借助ai）
虽然现在维护博客依旧 AI [TRAE](https://www.trae.cn/)

之所以选择 [Hugo](https://gohugo.io/)

第一点：**速度快**，基于go语言，构建大量文章耗时短，适合反复折腾。

第二点：**较轻量化**，hugo本身并不大，文件数量少。

第三点：**插件较丰富**，像什么 [paper mod](https://github.com/nanxiaobei/hugo-paper)，[book](https://themes.gohugo.io/themes/hugo-book/),等等……都是即装即用，方便

---
## 项目结构：

```
hugo-blog/
├── hugo.toml              ← 大脑：所有配置都在这里
├── wrangler.toml         ← 部署配置：告诉 Cloudflare Pages 怎么发布
├── archetypes/
│   └── default.md        ← 模板：新建文章时的默认 frontmatter
├── content/              ← 你的文章（对应之前讲的 posts/）
│   ├── zh/posts/         ← 中文文章（约45篇）
│   └── en/posts/         ← 英文文章
├── layouts/             ← 你对 PaperMod 主题的定制覆盖
│   ├── _default/baseof.html   ← 页面骨架
│   ├── single.html            ← 单篇文章页面
│   ├── list.html              ← 文章列表/首页
│   ├── _markup/               ← Markdown 渲染钩子
│   │   ├── render-image.html  ← 图片渲染（支持 Leaf Bundle 同目录资源）
│   │   ├── render-link.html   ← 链接渲染（支持相对 .md 跳转）
│   │   └── render-codeblock.html ← 代码块（mermaid/graphviz/echarts/abc）
│   ├── _partials/             ← 零件（可复用的页面片段）
│   │   ├── head.html          ← <head> 标签内容
│   │   ├── header.html        ← 顶部导航栏
│   │   ├── comments.html      ← 评论区
│   │   ├── pinned_posts.html  ← 置顶文章卡片
│   │   ├── extend_head.html   ← 额外的 head 内容
│   │   └── extend_footer.html ← 额外的页脚内容
│   └── shortcodes/            ← 自定义短代码
│       ├── chem.html          ← 化学结构式渲染
│       ├── color.html         ← 彩色文字
│       └── mark.html          ← 高亮标记
├── static/              ← 静态文件（原样复制到输出）
│   ├── js/math-render.js      ← KaTeX 数学公式渲染
│   ├── sw.js                  ← Service Worker（离线缓存）
│   └── manifest.webmanifest   ← PWA 配置
└── themes/PaperMod/    ← 主题（git submodule，不要手动改）
```


---
### 别的也不多说了，先这样吧……

---

## 文章组织方式（单文件 vs 文件夹收纳）

博客支持两种文章组织方式，**最终 URL 完全相同**，可按文章复杂度自由选择：

### ① 单文件（短文 / 无配图）

```
content/zh/posts/我的文章.md
```

配图放 `static/images/我的文章/pic.png`，正文里写 `![](/images/我的文章/pic.png)`。

### ② 文件夹收纳 / Leaf Bundle（长文 / 多配图 / 有附件）✅ 推荐

```
content/zh/posts/我的文章/
├── index.md          ← 正文（frontmatter 写在这里）
├── cover.png         ← 封面图
├── 1-插图.jpg        ← 随文图片
├── diagram.svg       ← SVG 图
└── 附件.pdf          ← 任意资源
```

正文里用 `./` 相对路径引用同目录资源：`![](./cover.png)`、`[下载](./附件.pdf)`。

**两种方式对比**：

| | 单文件 | 文件夹（Leaf Bundle） |
|------|------|------|
| 文章位置 | `我的文章.md` | `我的文章/index.md` |
| 配图位置 | `static/images/我的文章/` | 同文件夹 |
| 引用写法 | `![](/images/...)` | `![](./pic.png)` |
| 最终 URL | `/zh/posts/我的文章/` | 完全相同 |
| 列表 / 左栏 / TOC / 分类 | ✅ 一致 | ✅ 一致 |

> **已有单文件升级为文件夹**：新建同名文件夹 → 把原 `.md` 改名为 `index.md` → 把配图搬进来。URL 不变，不影响 RSS / 搜索 / 外链。
>
> 实现细节：`layouts/_markup/render-image.html` 和 `render-link.html` 两个渲染钩子负责让两种写法的行为完全对齐。