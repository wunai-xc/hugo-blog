+++
title = '文章编写示例（写作模板）'
date = 2026-08-03
draft = true
tags = ["写作", "模板", "示例"]
categories = ["笔记"]
summary = '本文演示博客支持的所有排版格式：Frontmatter、标题、文本样式、列表、代码块、表格、图片、数学公式、化学符号、化学结构式、文本标记等，可作为新文章的写作参考。'
+++

> 本文为**写作模板**，`draft = true` 不会被部署上线。新建文章时可复制此文件作为起点。
>
> **文件存放位置**：`content/zh/posts/你的文章名.md`（中文文件名也可以）。

---

## 一、Frontmatter（文件头元信息）

每篇文章**必须**以 frontmatter 开头，两种格式都可：

### TOML 格式（推荐，用 `+++` 包裹）

```
toml
+++
title = '文章标题'
date = 2026-08-03
draft = false
tags = ["标签1", "标签2"]
categories = ["分类"]
summary = '一句话摘要，显示在文章列表'
+++
```

### YAML 格式（用 `---` 包裹）

```
yaml
---
title: "文章标题"
date: 2026-08-03
draft: false
tags: ["标签1", "标签2"]
categories: ["分类"]
summary: "一句话摘要"
---
```

**字段说明**：

| 字段 | 必填 | 说明 |
|------|------|------|
| `title` | 是 | 文章标题 |
| `date` | 是 | 发布日期（影响排序） |
| `draft` | 否 | `true` 时不发布，默认 `false` |
| `tags` | 否 | 标签列表 |
| `categories` | 否 | 分类列表 |
| `summary` | 否 | 列表页摘要 |

> **注意**：`draft = true` 的文章本地 `hugo server -D` 能看到，但上线时不部署。要发布记得改成 `false` 或删除该行。

---

## 二、标题层级

```
markdown
# 一级标题（一般不用，文章 title 已经是 H1）
## 二级标题
### 三级标题
#### 四级标题
##### 五级标题
###### 六级标题
```

效果：

## 二级标题
### 三级标题
#### 四级标题

---

## 三、文本样式

```
markdown
**粗体文本**
*斜体文本*
***粗斜体***
~~删除线~~
`行内代码`
[超链接](https://gohugo.io)
<https://gohugo.io>    自动链接
```

效果：

- **粗体文本**
- *斜体文本*
- ***粗斜体***
- ~~删除线~~
- `行内代码`
- [超链接](https://gohugo.io)
- <https://gohugo.io>

---

## 四、列表

### 无序列表

```
markdown
- 苹果
- 香蕉
  - 小香蕉
  - 大香蕉
- 橙子
```

效果：

- 苹果
- 香蕉
  - 小香蕉
  - 大香蕉
- 橙子

### 有序列表

```
markdown
1. 第一步
2. 第二步
3. 第三步
```

效果：

1. 第一步
2. 第二步
3. 第三步

### 任务列表

```
markdown
- [x] 完成的任务
- [ ] 未完成的任务
```

效果：

- [x] 完成的任务
- [ ] 未完成的任务

---

## 五、代码块

### 基础代码块（带语法高亮）

````
markdown
```
python
def fibonacci(n):
    """生成斐波那契数列"""
    a, b = 0, 1
    for _ in range(n):
        yield a
        a, b = b, a + b

# 打印前 10 项
print(list(fibonacci(10)))
```
````

效果：

```
python
def fibonacci(n):
    """生成斐波那契数列"""
    a, b = 0, 1
    for _ in range(n):
        yield a
        a, b = b, a + b

# 打印前 10 项
print(list(fibonacci(10)))
```

### 支持的常见语言

````
markdown
```
javascript
const sum = (a, b) => a + b;
console.log(sum(1, 2));
```

```
bash
# 安装 Hugo
brew install hugo
hugo server -D
```

```
sql
SELECT id, name, created_at
FROM users
WHERE active = true
ORDER BY created_at DESC;
```

```
go
package main

import "fmt"

func main() {
    fmt.Println("Hello, Hugo!")
}
```
````

效果：

```
javascript
const sum = (a, b) => a + b;
console.log(sum(1, 2));
```

```
bash
# 安装 Hugo
brew install hugo
hugo server -D
```

```
sql
SELECT id, name, created_at
FROM users
WHERE active = true
ORDER BY created_at DESC;
```

```
go
package main

import "fmt"

func main() {
    fmt.Println("Hello, Hugo!")
}
```

> **提示**：代码块右上角悬停可见「复制」按钮。

---

## 六、表格

### 基础表格

```
markdown
| 姓名 | 年龄 | 城市   |
|------|------|--------|
| 张三 | 25   | 北京   |
| 李四 | 30   | 上海   |
| 王五 | 28   | 广州   |
```

效果：

| 姓名 | 年龄 | 城市 |
|------|------|------|
| 张三 | 25 | 北京 |
| 李四 | 30 | 上海 |
| 王五 | 28 | 广州 |

### 对齐方式

```
markdown
| 左对齐       |   居中对齐   |       右对齐 |
|:-------------|:------------:|-------------:|
| 左           |     中       |           右 |
```

效果：

| 左对齐 | 居中对齐 | 右对齐 |
|:---|:---:|---:|
| 左 | 中 | 右 |

---

## 七、图片与链接

### 本地图片（推荐）

把图片放在 `static/images/你的目录/` 下，文章里用 `/images/你的目录/文件名` 引用：

```
markdown
![替代文字](/images/cell/animal-cell.svg)
*图片说明（斜体）*
```

**目录结构示例**：

```
static/
└── images/
    └── cell/
        ├── animal-cell.svg
        └── plant-cell.png
```

### 外链图片（不推荐，可能加载慢）

```
markdown
![替代文字](https://example.com/image.png)
```

### 带说明的图片

```
markdown
![细胞结构](/images/cell/animal-cell.svg)
*图 1：典型动物细胞结构。图源：LadyofHats, CC0*
```

> **小提示**：用 `<small>` 标签可以让图源说明更小：

```
markdown
<small>图源：Wikimedia Commons, CC0</small>
```

---

## 八、数学公式（KaTeX）

### 行内公式

```
markdown
质能方程 $E = mc^2$ 是爱因斯坦提出的。
```

效果：质能方程 $E = mc^2$ 是爱因斯坦提出的。

### 块级公式

```
markdown
$$
\int_{-\infty}^{\infty} e^{-x^2} \, dx = \sqrt{\pi}
$$
```

效果：

$$
\int_{-\infty}^{\infty} e^{-x^2} \, dx = \sqrt{\pi}
$$

### 矩阵

```
markdown
$$
\begin{bmatrix}
a & b \\
c & d
\end{bmatrix}
\begin{bmatrix}
x \\
y
\end{bmatrix}
=
\begin{bmatrix}
ax + by \\
cx + dy
\end{bmatrix}
$$
```

效果：

$$
\begin{bmatrix}
a & b \\
c & d
\end{bmatrix}
\begin{bmatrix}
x \\
y
\end{bmatrix}
=
\begin{bmatrix}
ax + by \\
cx + dy
\end{bmatrix}
$$

### 求和与极限

```
markdown
$$
\sum_{n=1}^{\infty} \frac{1}{n^2} = \frac{\pi^2}{6}, \quad \lim_{x \to 0} \frac{\sin x}{x} = 1
$$
```

效果：

$$
\sum_{n=1}^{\infty} \frac{1}{n^2} = \frac{\pi^2}{6}, \quad \lim_{x \to 0} \frac{\sin x}{x} = 1
$$

### 分段函数

```
markdown
$$
f(x) = \begin{cases} x^2, & x \geq 0 \\ -x, & x < 0 \end{cases}
$$
```

效果：

$$
f(x) = \begin{cases} x^2, & x \geq 0 \\ -x, & x < 0 \end{cases}
$$

---

## 九、化学符号（mhchem）

用 `\ce{...}` 包裹化学式，支持化学方程式、同位素、配平等。

### 化学式

```
markdown
水是 $\ce{H2O}$，食盐是 $\ce{NaCl}$。
```

效果：水是 $\ce{H2O}$，食盐是 $\ce{NaCl}$。

### 化学方程式

```
markdown
$$
\ce{2H2 + O2 -> 2H2O}
$$
```

效果：

$$
\ce{2H2 + O2 -> 2H2O}
$$

### 可逆反应与条件

```
markdown
$$
\ce{N2(g) + 3H2(g) <=>[高温、高压][催化剂] 2NH3(g)}
$$
```

效果：

$$
\ce{N2(g) + 3H2(g) <=>[高温、高压][催化剂] 2NH3(g)}
$$

### 同位素（注意转义下划线）

> **重要**：化学公式里的下标 `_` 必须写成 `\_{}`，否则会被 Markdown 误解析为斜体。

```
markdown
碳-14 写作 $\ce{^{14}\_{6}C}$，铀-235 写作 $\ce{^{235}\_{92}U}$。
```

效果：碳-14 写作 $\ce{^{14}\_{6}C}$，铀-235 写作 $\ce{^{235}\_{92}U}$。

### 沉淀与气体符号

```
markdown
$$
\ce{Ag+ + Cl- -> AgCl v}
$$
$$
\ce{Zn + 2H+ -> Zn^{2+} + H2 ^}
$$
```

效果：

$$
\ce{Ag+ + Cl- -> AgCl v}
$$
$$
\ce{Zn + 2H+ -> Zn^{2+} + H2 ^}
$$

### 氧化还原反应

```
markdown
$$
\ce{2KMnO4 + 16HCl -> 2KCl + 2MnCl2 + 5Cl2 ^ + 8H2O}
$$
```

效果：

$$
\ce{2KMnO4 + 16HCl -> 2KCl + 2MnCl2 + 5Cl2 ^ + 8H2O}
$$

---

## 十、化学结构式（SmilesDrawer）

用 `chem` shortcode 渲染 2D 化学结构图，传入 SMILES 字符串：

### 基本用法

````
markdown
{{</* chem smiles="NS(=O)(=O)c1ccc(N)cc1" caption="磺胺（对氨基苯磺酰胺）" */>}}
````

效果：

{{< chem smiles="NS(=O)(=O)c1ccc(N)cc1" caption="磺胺（对氨基苯磺酰胺）" >}}

### 指定尺寸

````
markdown
{{</* chem smiles="CC1(C)SC2C(NC(=O)Cc3ccccc3)C(=O)N2C1C(=O)O" caption="青霉素 G" width="400" height="250" */>}}
````

效果：

{{< chem smiles="CC1(C)SC2C(NC(=O)Cc3ccccc3)C(=O)N2C1C(=O)O" caption="青霉素 G（Penicillin G）" width="400" height="250" >}}

### 复杂结构

````
markdown
{{</* chem smiles="O=C(O)c1cn(C2CC2)c3cc(F)c(N4CCNCC4)cc3c1=O" caption="环丙沙星（Ciprofloxacin）" */>}}
````

效果：

{{< chem smiles="O=C(O)c1cn(C2CC2)c3cc(F)c(N4CCNCC4)cc3c1=O" caption="环丙沙星（Ciprofloxacin）" >}}

> **提示**：SMILES 字符串可从 [PubChem](https://pubchem.ncbi.nlm.nih.gov/) 查询。结构式会自动适配暗色主题。

---

## 十一、文本标记增强

### 11.1 引用标记 `[reference:N]`（自动转换）

从 NotebookLM 等 AI 工具复制内容时常带的引用标记，**会被自动渲染成上标编号**：

```
markdown
图灵机由图灵于 1936 年提出[reference:1]，是计算理论的基石[reference:2][reference:3]。
```

效果：图灵机由图灵于 1936 年提出[reference:1]，是计算理论的基石[reference:2][reference:3]。

> 鼠标悬停在编号上会显示「引用 N」提示，无需手动处理这些标记。

### 11.2 高亮文本 `==文字==`（GitHub 扩展语法）

用两个等号包裹文字，**自动渲染成黄色荧光笔高亮**：

```
markdown
这是==重点内容==，注意 ==这里== 也很关键。
```

效果：这是==重点内容==，注意 ==这里== 也很关键。

> 暗色主题下高亮会自动变得柔和。

### 11.3 行内彩色文字 `{{</* color */>}}`

用 shortcode 给文字上色，支持 9 种预设颜色名或任意 hex 色值：

````
markdown
{{</* color red */>}}红色警告{{</* /color */>}}
{{</* color green */>}}绿色成功{{</* /color */>}}
{{</* color blue */>}}蓝色信息{{</* /color */>}}
{{</* color "#7048e8" */>}}自定义紫色{{</* /color */>}}
````

效果：

- {{< color red >}}红色警告{{< /color >}}
- {{< color green >}}绿色成功{{< /color >}}
- {{< color blue >}}蓝色信息{{< /color >}}
- {{< color "#7048e8" >}}自定义紫色{{< /color >}}

**支持的预设颜色名**：`red` `orange` `yellow` `green` `cyan` `blue` `purple` `pink` `gray`/`grey`

### 11.4 行内带色标记块 `{{</* mark */>}}`

类似荧光笔，但带背景色和边框，更显眼。支持 9 种预设颜色：

````
markdown
{{</* mark yellow */>}}默认黄色{{</* /mark */>}}
{{</* mark red */>}}红色标记{{</* /mark */>}}
{{</* mark green */>}}绿色标记{{</* /mark */>}}
{{</* mark blue */>}}蓝色标记{{</* /mark */>}}
````

效果：

{{< mark yellow >}}默认黄色{{< /mark >}} {{< mark red >}}红色标记{{< /mark >}} {{< mark green >}}绿色标记{{< /mark >}} {{< mark blue >}}蓝色标记{{< /mark >}}

**完整颜色列表**：`red` `orange` `yellow` `green` `cyan` `blue` `purple` `pink` `gray`/`grey`

### 11.5 四种标记方式的选择

| 方式 | 语法 | 适用场景 |
|------|------|---------|
| `[reference:N]` | AI 工具自动带 | 从 NotebookLM 等 AI 复制内容时无需处理 |
| `==高亮==` | 双等号 | 简单强调，无需 shortcode |
| `{{</* color 红 */>}}` | shortcode | 需要精确控制文字颜色 |
| `{{</* mark 红 */>}}` | shortcode | 需要带背景色的醒目标记 |

---

## 十二、其他排版元素

### 分隔线

```
markdown
---
```

效果：

---

### 脚注

```
markdown
这是一句话[^1]，还有另一句话[^note]。

[^1]: 这是脚注的内容。
[^note]: 自定义命名的脚注。
```

效果：

这是一句话[^1]，还有另一句话[^note]。

[^1]: 这是脚注的内容。
[^note]: 自定义命名的脚注。

### 引用块

```
markdown
> 这是一级引用
>
> > 这是嵌套引用
```

效果：

> 这是一级引用
>
> > 这是嵌套引用

### 提示框（用引用块模拟）

```
markdown
> **提示**：这是一个提示信息。

> **警告**：这是一个警告信息。
```

效果：

> **提示**：这是一个提示信息。

> **警告**：这是一个警告信息。

### HTML 内联

Markdown 支持直接写 HTML：

```
markdown
<kbd>Ctrl</kbd> + <kbd>C</kbd> 复制

<small>这是小字说明</small>

<sub>下标</sub> 和 <sup>上标</sup>
```

效果：

<kbd>Ctrl</kbd> + <kbd>C</kbd> 复制

<small>这是小字说明</small>

<sub>下标</sub> 和 <sup>上标</sup>

---

## 十三、文章结构建议

一篇完整的科普/技术文章推荐结构：

```
markdown
+++
title = "文章标题"
date = 2026-08-03
draft = false
tags = ["标签"]
categories = ["分类"]
summary = "一句话摘要"
+++

## 引言
（背景介绍，引出主题）

## 主体部分一
### 子标题
（内容）

## 主体部分二
### 子标题
（内容）

## 总结
（回顾要点，延伸思考）

---

## 参考资料
1. [参考资料1](url)
2. [参考资料2](url)
```

---

## 十四、常用命令

| 命令 | 说明 |
|------|------|
| `hugo server -D` | 本地预览（含草稿） |
| `hugo server` | 本地预览（不含草稿） |
| `hugo new posts/xxx.md` | 新建文章 |
| `hugo --gc --minify` | 生产构建 |

> **注意**：详见[官方文档](https://gohugo.io)。

---

## 附录：shortcode 转义写法

在文章里**展示** shortcode 代码（而非执行），用 `{{</* ... */>}}` 包裹：

````
markdown
显示原始代码：{{</* chem smiles="CCO" */>}}

会被执行：{{< chem smiles="CCO" >}}
````

> **关键提示**：
> - shortcode 内部用 `{{</* ... */>}}` 写法可在文档中显示原始代码而不被执行
> - 文章正文里用 `{{</* ... */>}}` 去掉星号写法会被执行
> - 标题、表格里的 shortcode 必须**转义**，否则 Hugo 解析失败导致构建报错
