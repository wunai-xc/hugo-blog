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