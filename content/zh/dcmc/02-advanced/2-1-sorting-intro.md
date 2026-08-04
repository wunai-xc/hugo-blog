---
title: "2.1 排序算法入门"
layout: "dcmc"
weight: 21
description: "冒泡、选择、插入、快速排序 —— 四种经典算法的直观对比。"
---

# 2.1 排序算法入门

排序是算法的经典入门。把一堆乱序的数「从小到大」排好，看似简单，做法却有非常多的讲究。

## 冒泡排序（Bubble Sort）

最简单的一种：**相邻两个比大小，大的往后冒**。

```python
def bubble_sort(arr):
    n = len(arr)
    for i in range(n - 1):
        for j in range(n - 1 - i):
            if arr[j] > arr[j + 1]:
                arr[j], arr[j + 1] = arr[j + 1], arr[j]
    return arr
```

- 时间复杂度：$O(n^2)$（$n$ 是元素个数）
- 优点：代码极其简单
- 缺点：**慢**，元素多了会非常卡

## 快速排序（QuickSort）

经典的「分治」思想：选一个基准，比它小的放左边，比它大的放右边，然后左右两边递归。

```python
def quicksort(arr):
    if len(arr) <= 1:
        return arr
    pivot = arr[len(arr) // 2]
    left  = [x for x in arr if x < pivot]
    mid   = [x for x in arr if x == pivot]
    right = [x for x in arr if x > pivot]
    return quicksort(left) + mid + quicksort(right)
```

- 平均时间复杂度：$O(n \log n)$
- 工程上最常用的排序算法之一（很多语言库底层就是它的变体）

> 同一道题，用不同的「搭法」，性能可以差几百上千倍。算法就是研究「怎么搭更高效」的学问。
