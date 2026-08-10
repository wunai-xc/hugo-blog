+++
title = '{{ replace .File.ContentBaseName "-" " " | title }}'
date = {{ .Date }}
draft = true
tags = []
categories = []
summary = ''
+++

<!--
  两种文章组织方式（「文件夹收纳 = 下面第 ② 种 Leaf Bundle」）：

  ① 单文件：
     content/zh/posts/我的文章.md
     配图放 static/zh/posts/我的文章/pic.png   →   ![](./pic.png)
     （单文件时如果用 render-image hook + static 里同名目录放图，写法也能同 bundle 对齐）

  ② Leaf Bundle 文件夹收纳 ✅（长篇图文推荐）：
     content/zh/posts/我的文章/
     ├── index.md      <-- 这篇文章的正文（上面的 frontmatter 模板）
     ├── cover.png     <-- 封面图，frontmatter 里写 cover.image = "cover.png"（不加 /）
     ├── 1-封面.jpg    <-- 任意随文图片，正文里直接 ![](./1-封面.jpg)
     ├── diagram.svg
     ├── 附件.pdf      <-- 同目录资源都可以，正文写 [下载](./附件.pdf)
     └── ...
     生成的最终 URL 仍为 /zh/posts/我的文章/，和单文件完全一致；
     列表页 / 左栏 / 面包屑 / TOC / 分类标签 全部行为相同。

  frontmatter 的 cover 写法：
    # ② Leaf Bundle（资源在同文件夹）— 不加 /，走 .Page.Resources
    cover:
      image: "cover.png"
      ...
    # ① 单文件或 static 绝对路径 — 加 / 前缀，走站点 static
    cover:
      image: "/images/xxx.png"

  小技巧：如果把一个已经写好的「xxx.md」升级为 bundle，
  只需新建文件夹 xxx/，把原 md 改名为 xxx/index.md，
  再把原本放 static 里的配图一起搬进来，最终 URL 完全不变，
  不影响 RSS / 搜索索引 / 已有外链。
-->

## 正文开始……
