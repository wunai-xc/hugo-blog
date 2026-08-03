---
title: "数学公式、化学符号与代码块功能演示"
date: 2026-08-03
draft: false
tags: ["教程", "KaTeX", "Hugo"]
categories: ["笔记"]
summary: "演示博客中数学公式（KaTeX）、化学符号（mhchem）以及代码块高亮与复制功能的使用方法与效果。"
---

这篇文章全面演示博客新增的三大功能：**左侧文章快速导航**、**数学公式与化学符号渲染**、**代码块美化与一键复制**。

## 一、数学公式（KaTeX）

KaTeX 支持行内与块级两种公式模式，语法与标准 LaTeX 一致。

### 1.1 行内公式

行内公式使用单个 `$...$` 包裹，例如质能方程 $E = mc^2$，二次方程求根公式 $x = \dfrac{-b \pm \sqrt{b^2 - 4ac}}{2a}$，以及欧拉恒等式 $e^{i\pi} + 1 = 0$。

也可以写成集合与数域：实数集 $\RR$、复数集 $\CC$、整数集 $\ZZ$。

### 1.2 块级公式

块级公式使用 `$$...$$` 包裹，独立居中显示：

**高斯积分：**

$$
\int_{-\infty}^{+\infty} e^{-x^2} dx = \sqrt{\pi}
$$

**3×3 矩阵行列式：**

$$
\begin{vmatrix}
a & b & c \\
d & e & f \\
g & h & i
\end{vmatrix}
= a(ei - fh) - b(di - fg) + c(dh - eg)
$$

**泰勒展开（指数函数）：**

$$
e^x = \sum_{n=0}^{\infty} \frac{x^n}{n!} = 1 + x + \frac{x^2}{2!} + \frac{x^3}{3!} + \cdots
$$

**极限与导数：**

$$
f'(x) = \lim_{\Delta x \to 0} \frac{f(x + \Delta x) - f(x)}{\Delta x}
$$

---

## 二、化学符号（mhchem）

mhchem 扩展提供了 `\ce{}` 命令，用于优雅地渲染化学方程式与结构式。

### 2.1 化学式与反应式

**常见化学式：** 水 $\ce{H2O}$、二氧化碳 $\ce{CO2}$、硫酸 $\ce{H2SO4}$、乙醇 $\ce{C2H5OH}$、葡萄糖 $\ce{C6H12O6}$。

**离子与电荷：** 钠离子 $\ce{Na+}$、钙离子 $\ce{Ca^2+}$、硫酸根 $\ce{SO4^2-}$、铵根 $\ce{NH4+}$。

### 2.2 化学方程式

**光合作用：**

$$
\ce{6 CO2 + 6 H2O ->[光能][叶绿体] C6H12O6 + 6 O2}
$$

**酸碱中和：**

$$
\ce{HCl + NaOH -> NaCl + H2O}
$$

**可逆反应（合成氨）：**

$$
\ce{N2 + 3 H2 <=>[高温高压][催化剂] 2 NH3}
$$

**沉淀与气体符号：**

$$
\ce{AgNO3 + NaCl -> AgCl v + NaNO3}
$$

$$
\ce{Zn + 2 H+ -> Zn^2+ + H2 ^}
$$

### 2.3 同位素与化学键

**同位素：** 碳-14 $\ce{^{14}_{6}C}$、铀-235 $\ce{^{235}_{92}U}$。

**苯环与键级：** 甲烷 $\ce{CH4}$、乙烯 $\ce{H2C=CH2}$、乙炔 $\ce{HC#CH}$。

---

## 三、代码块（高亮 + 复制）

所有代码块自动启用 Chroma 语法高亮，鼠标悬停右上角可看到**复制**按钮。

### 3.1 Python

```python
def quicksort(arr):
    """快速排序算法（递归实现）"""
    if len(arr) <= 1:
        return arr
    pivot = arr[len(arr) // 2]
    left  = [x for x in arr if x < pivot]
    mid   = [x for x in arr if x == pivot]
    right = [x for x in arr if x > pivot]
    return quicksort(left) + mid + quicksort(right)

if __name__ == "__main__":
    data = [3, 6, 1, 8, 2, 9, 4, 7, 5]
    print(quicksort(data))
```

### 3.2 JavaScript（ES6+）

```javascript
// 使用异步函数 + fetch 调用 REST API
async function fetchUserPosts(userId) {
  const base = 'https://jsonplaceholder.typicode.com';
  const resp = await fetch(`${base}/posts?userId=${userId}`);
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
  return resp.json();
}

fetchUserPosts(1)
  .then(posts => posts.forEach(p => console.log(p.title)))
  .catch(err  => console.error('失败：', err));
```

### 3.3 Go

```go
package main

import (
	"fmt"
	"sync"
)

// 使用 Goroutine + WaitGroup 并发计算平方
func main() {
	nums := []int{1, 2, 3, 4, 5}
	results := make([]int, len(nums))
	var wg sync.WaitGroup

	for i, v := range nums {
		wg.Add(1)
		go func(i, v int) {
			defer wg.Done()
			results[i] = v * v
		}(i, v)
	}
	wg.Wait()
	fmt.Println("平方结果：", results)
}
```

### 3.4 Rust

```rust
// Rust 所有权与借用示例
fn main() {
    let s1 = String::from("hello");
    let len = calculate_length(&s1);
    println!("字符串 '{}' 的长度 = {}", s1, len);
}

fn calculate_length(s: &String) -> usize {
    s.len()
} // s 离开作用域，但因为它是借用，所以不会 drop
```

### 3.5 Bash

```bash
#!/usr/bin/env bash
# 批量将当前目录下的 .md 文件重命名为带日期前缀
DATE=$(date +%Y-%m-%d)
for file in *.md; do
  [ -f "$file" ] || continue
  newname="${DATE}-${file}"
  mv -v "$file" "$newname"
done
```

### 3.6 行内代码

除了代码块，也可以在行内引用代码，例如设置 `enableEmoji = true`，或者调用 `renderMathInElement(document.body, options)` 函数。

---

## 四、三栏布局说明

当你的屏幕宽度大于等于 **1280px** 时，页面会自动切换到三栏布局：

| 栏位 | 内容 | 说明 |
|------|------|------|
| 左栏 | 全部文章列表 | 快速切换文章，当前项高亮 |
| 中栏 | 正文内容 | 阅读区，宽度自适应 |
| 右栏 | 本页目录 TOC | 滚动实时高亮，点击跳转标题 |

屏幕较小时自动退化为 PaperMod 默认的单栏布局，不影响阅读体验。

---

## 五、更多标题（测试 TOC 滚动高亮）

为了演示右侧目录的滚动高亮效果，这里补充若干标题占位。

### 5.1 小节一

滚动到这里时，右侧目录对应项会自动高亮并平滑滚动进入可视区。

### 5.2 小节二

#### 5.2.1 子小节 A

嵌套标题同样支持，左侧缩进，高亮颜色区分。

#### 5.2.2 子小节 B

继续向下滚动，观察高亮项的变化。

### 5.3 小节三

### 5.4 小节四

### 5.5 总结

到这里，所有功能点已演示完毕。如果效果符合预期，就可以把这些功能推送到线上啦 🎉
