---
title: "2.1 Intro to Sorting Algorithms"
layout: "dcmc"
weight: 21
description: "Bubble, Selection, Insertion and QuickSort — an intuitive comparison of four classics."
---

# 2.1 Intro to Sorting Algorithms

Sorting is the classic first step into algorithms. Sorting a shuffled array "from smallest to largest" looks simple, but there's a lot of subtlety in how you do it.

## Bubble Sort

The simplest approach: **compare neighbors, swap the bigger one backwards**.

```python
def bubble_sort(arr):
    n = len(arr)
    for i in range(n - 1):
        for j in range(n - 1 - i):
            if arr[j] > arr[j + 1]:
                arr[j], arr[j + 1] = arr[j + 1], arr[j]
    return arr
```

- Time complexity: $O(n^2)$
- Pros: extremely simple code
- Cons: **slow**, gets really bad with large inputs

## QuickSort

Classic "divide & conquer": pick a **pivot**, put smaller items on the left, larger on the right, then recurse on both sides.

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

- Average time complexity: $O(n \log n)$
- One of the most widely-used algorithms in practice (many stdlib sorts are variants of this)

> Same problem, different "block stacking strategies", can differ by hundreds or thousands of times in performance. Algorithmics is the study of "how to stack more efficiently".
