---
title: "1.1 Binary & Logic Gates"
layout: "dcmc"
weight: 11
description: "The first step to build the whole digital world using only 0s and 1s."
---

# 1.1 Binary & Logic Gates

## Why binary

Inside a computer there are only two states: on (1) and off (0). That's binary.

Just like decimal carries at 10, binary **carries at 2**:

| Decimal | Binary |
|---------|--------|
| 0 | `0` |
| 1 | `1` |
| 2 | `10` |
| 3 | `11` |
| 4 | `100` |
| 5 | `101` |

## The three basic logic gates

Logic gates are the "blocks" of digital circuits. They operate on 0 / 1.

### AND gate

Output is 1 **only when every input is 1**.

```
  A ──┐
      ├────> AND ───> Y
  B ──┘
```

| A | B | Y = A AND B |
|---|---|-------------|
| 0 | 0 | 0 |
| 0 | 1 | 0 |
| 1 | 0 | 0 |
| 1 | 1 | 1 |

### OR gate

Output is 1 **when at least one input is 1**.

### NOT gate (inverter)

Turns 0 into 1, and 1 into 0.

> With AND, OR and NOT you can theoretically build **any** computing function — adders, memory, CPU. Everything starts from these three tiny building blocks.
