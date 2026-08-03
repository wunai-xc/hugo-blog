+++
title = '文章编写示例（写作模板）'
date = 2026-08-03
draft = true
tags = ["写作", "模板", "示例"]
categories = ["笔记"]
summary = '本文演示博客支持的所有排版格式：Frontmatter、标题、文本样式、列表、代码块、表格、图片、数学公式、化学符号、化学结构式等，可作为新文章的写作参考。'
+++

> 本文为**写作模板**，`draft = true` 不会被部署上线。新建文章时可复制此文件作为起点。

---

## 一、Frontmatter（文件头元信息）

每篇文章开头必须有 Frontmatter，用 `+++`（TOML）或 `---`（YAML）包裹：

```yaml
---
title: "文章标题"
date: 2026-08-03           # 发布日期，影响排序
draft: false               # true=草稿不发布，false=发布
tags: ["标签1", "标签2"]    # 文章标签
categories: ["分类名"]      # 文章分类
summary: "一句话摘要，显示在文章列表卡片上"
---
```

> **提示**：用 `hugo new content zh/posts/my-post.md` 新建文章会自动套用 [archetypes/default.md](file:///workspace/archetypes/default.md) 模板。

---

## 二、标题层级

```markdown
## 二级标题
### 三级标题
#### 四级标题
##### 五级标题
###### 六级标题
```

> PaperMod 主题的页面目录（TOC）会自动收集 H2-H4，无需手动写目录。

---

## 三、文本样式

| 语法 | 效果 |
|------|------|
| `**粗体**` | **粗体** |
| `*斜体*` | *斜体* |
| `***粗斜体***` | ***粗斜体*** |
| `~~删除线~~` | ~~删除线~~ |
| `` `行内代码` `` | `行内代码` |
| `下标 H~2~O`（部分支持） | H~2~O |
| `上标 10^2^`（部分支持） | 10^2^ |

**引用块**：

> 这是一段引用。
>
> > 嵌套引用第二层。

---

## 四、列表

### 无序列表

```markdown
- 项目一
- 项目二
  - 嵌套项 2.1
  - 嵌套项 2.2
- 项目三
```

效果：
- 项目一
- 项目二
  - 嵌套项 2.1
  - 嵌套项 2.2
- 项目三

### 有序列表

```markdown
1. 第一步
2. 第二步
3. 第三步
```

效果：
1. 第一步
2. 第二步
3. 第三步

### 任务列表

```markdown
- [x] 已完成任务
- [ ] 未完成任务
- [ ] 待办事项
```

效果：
- [x] 已完成任务
- [ ] 未完成任务
- [ ] 待办事项

---

## 五、代码块

### 普通代码块（带语法高亮）

````markdown
```python
def fibonacci(n):
    """生成斐波那契数列"""
    a, b = 0, 1
    for _ in range(n):
        yield a
        a, b = b, a + b

# 输出前 10 项
print(list(fibonacci(10)))
```
````

效果：

```python
def fibonacci(n):
    """生成斐波那契数列"""
    a, b = 0, 1
    for _ in range(n):
        yield a
        a, b = b, a + b

# 输出前 10 项
print(list(fibonacci(10)))
```

### 其他常用语言

```javascript
// JavaScript 示例
const greet = (name) => `Hello, ${name}!`;
console.log(greet("World"));
```

```bash
# Bash 示例
git add .
git commit -m "feat: add new post"
git push origin main
```

```sql
-- SQL 示例
SELECT title, date
FROM posts
WHERE draft = false
ORDER BY date DESC
LIMIT 10;
```

> **提示**：代码块右上角鼠标悬停会显示「复制」按钮。

---

## 六、表格

```markdown
| 列1 | 列2 | 列3 |
|-----|:----|----:|
| 左对齐 | 居中 | 右对齐 |
| 数据 | 数据 | 数据 |
```

效果：

| 列1 | 列2 | 列3 |
|-----|:---:|----:|
| 左对齐 | 居中 | 右对齐 |
| 数据 | 数据 | 数据 |

复杂表格示例：

| 细胞器 | 功能 | 膜结构 |
|--------|------|:------:|
| 线粒体 | ATP 合成 | 双层膜 |
| 核糖体 | 蛋白质合成 | 无膜 |
| 高尔基体 | 蛋白质加工分选 | 单层膜 |

---

## 七、链接与图片

### 链接

```markdown
[行内链接](https://blog.wunai.top)
[带标题的链接](https://blog.wunai.top "鼠标悬停显示")
直接 URL：<https://blog.wunai.top>
```

效果：
- [行内链接](https://blog.wunai.top)
- [带标题的链接](https://blog.wunai.top "鼠标悬停显示")
- 直接 URL：<https://blog.wunai.top>

### 图片

**本地图片**（推荐，加载快）：

把图片放到 `static/images/xxx/` 目录，然后在文章中引用：

```markdown
![图片替代文字](/images/xxx/filename.png)
*图片说明文字（斜体）*
<small>图片来源：xxx</small>
```

> 图片路径以 `/images/` 开头，对应 `static/images/` 目录。
> 例如 `static/images/cell/animal.svg` → 文章中写 `/images/cell/animal.svg`

**外链图片**（不推荐，加载慢且可能失效）：

```markdown
![图片](https://example.com/image.png)
```

---

## 八、数学公式（KaTeX）

### 行内公式

用单个 `$` 包裹：

```markdown
质能方程 $E = mc^2$ 是爱因斯坦提出的。
```

效果：质能方程 $E = mc^2$ 是爱因斯坦提出的。

### 块级公式

用 `$$` 包裹，单独成行居中显示：

```markdown
$$
\int_{-\infty}^{\infty} e^{-x^2} \, dx = \sqrt{\pi}
$$
```

效果：

$$
\int_{-\infty}^{\infty} e^{-x^2} \, dx = \sqrt{\pi}
$$

### 常用公式示例

**矩阵**：

$$
A = \begin{pmatrix} a_{11} & a_{12} \\ a_{21} & a_{22} \end{pmatrix}
$$

**求和与极限**：

$$
\sum_{n=1}^{\infty} \frac{1}{n^2} = \frac{\pi^2}{6}, \quad \lim_{x \to 0} \frac{\sin x}{x} = 1
$$

**分段函数**：

$$
f(x) = \begin{cases} x^2, & x \geq 0 \\ -x, & x < 0 \end{cases}
$$

> **注意**：Markdown 中的下划线 `_` 会被解析为斜体。若公式中有下标 `_{...}`，需写成 `\_{...}` 转义，例如 `\ce{^{14}\_{6}C}`。

---

## 九、化学符号（mhchem）

使用 `\ce{...}` 语法，支持化学方程式：

### 行内化学式

```markdown
水分子是 $\ce{H2O}$，葡萄糖是 $\ce{C6H12O6}$。
```

效果：水分子是 $\ce{H2O}$，葡萄糖是 $\ce{C6H12O6}$。

### 化学方程式

```markdown
$$
\ce{2 H2 + O2 -> 2 H2O}
$$
```

效果：

$$
\ce{2 H2 + O2 -> 2 H2O}
$$

### 复杂反应（带条件、沉淀、气体）

```markdown
$$
\ce{BaCl2 + Na2SO4 -> BaSO4 v + 2 NaCl}
$$
```

效果：

$$
\ce{BaCl2 + Na2SO4 -> BaSO4 v + 2 NaCl}
$$

> 符号说明：`->` 箭头，`v` 沉淀，`^` 气体，`<=>` 可逆反应，`->[催化剂]` 带条件

### 同位素与离子

```markdown
碳-14：$\ce{^{14}\_{6}C}$（下划线需转义）
铁离子：$\ce{Fe^{3+}}$
```

效果：碳-14：$\ce{^{14}\_{6}C}$，铁离子：$\ce{Fe^{3+}}$

---

## 十、化学结构式（SmilesDrawer）

对于环状结构等 mhchem 无法绘制的复杂分子，使用 `chem` shortcode：

````markdown
{{</* chem smiles="SMILES字符串" caption="分子名称" */>}}
````

### 示例

苯环：

````markdown
{{</* chem smiles="c1ccccc1" caption="苯（Benzene）" */>}}
````

葡萄糖（开链式）：

````markdown
{{</* chem smiles="OC[C@H]1OC(O)[C@H](O)[C@@H](O)[C@@H]1O" caption="葡萄糖（Glucose）" */>}}
````

咖啡因：

````markdown
{{</* chem smiles="CN1C=NC2=C1C(=O)N(C(=O)N2C)C" caption="咖啡因（Caffeine）" width="400" height="250" */>}}
````

> **提示**：
> - `smiles` 参数为 SMILES 格式字符串（可在 [Wikipedia](https://en.wikipedia.org/wiki/Simplified_molecular-input_line-entry_system) 或 PubChem 查询）
> - `caption` 为图片下方说明文字
> - 可选 `width` / `height` 控制尺寸（默认 300×200）
> - shortcode 内部用 `{{</* ... */>}}` 写法可在文档中显示原始代码而不被执行

---

## 十一、其他排版元素

### 分隔线

```markdown
---
```

效果：

---

### 脚注

```markdown
这是一段带脚注的文字[^1]。

[^1]: 脚注的具体内容写在这里。
```

效果：

这是一段带脚注的文字[^1]。

[^1]: 脚注的具体内容写在这里。

### HTML 内联

Markdown 支持直接写 HTML：

```html
<small>小字说明</small>
<sub>下标</sub>
<sup>上标</sup>
<kbd>Ctrl</kbd> + <kbd>C</kbd>
```

效果：<small>小字说明</small> H<sub>2</sub>O / 10<sup>2</sup> = 100 / 按 <kbd>Ctrl</kbd> + <kbd>C</kbd> 复制

### 提示框（引用块美化）

```markdown
> **提示**：这是一条提示信息。

> **警告**：注意此操作不可逆！

> **注意**：详见[官方文档](https://gohugo.io)。
```

效果：

> **提示**：这是一条提示信息。

> **警告**：注意此操作不可逆！

> **注意**：详见[官方文档](https://gohugo.io)。

---

## 十二、文章结构建议

一篇完整的科普/技术文章推荐结构：

```markdown
---
# Frontmatter
---

## 引言
# 背景介绍，引出主题

---

## 一、第一个要点
### 1.1 子要点
### 1.2 子要点

---

## 二、第二个要点
### 2.1 子要点
### 2.2 子要点

---

## 总结
# 概括全文，展望未来

> **延伸阅读**：
> - [参考资料1](url)
> - [参考资料2](url)
```

---

## 附录：常用快捷命令

```bash
# 新建文章（自动套用模板）
hugo new content zh/posts/my-post.md

# 本地预览（实时刷新）
hugo server -D    # -D 包含草稿

# 构建生产版本
hugo --gc --minify

# 提交并推送触发自动部署
git add .
git commit -m "new: 新文章标题"
git push
```

---

如需查看完整功能的实战示例，可参考：
- [抗生素发展史](file:///workspace/content/zh/posts/antibiotic-history.md) — 化学结构式 + 表格 + 历史脉络
- [细胞基本结构](file:///workspace/content/zh/posts/cell-basic-structure.md) — 图片 + 表格 + 数学公式
- [Markdown 基本语法](file:///workspace/content/zh/posts/markdown-basic-syntax.md) — 纯 Markdown 语法
