---
title: "1.2 From Gates to Adders"
layout: "dcmc"
weight: 12
description: "Assemble logic gates into a circuit that can compute 1 + 1 = 2."
---

# 1.2 From Gates to Adders

## Half Adder

A half adder adds **two single-bit binary numbers**, outputting a **Sum** bit and a **Carry** bit.

| A | B | Sum | Carry |
|---|---|-----|-------|
| 0 | 0 | 0   | 0     |
| 0 | 1 | 1   | 0     |
| 1 | 0 | 1   | 0     |
| 1 | 1 | 0   | 1     |

It turns out:

- `Sum = A XOR B`
- `Carry = A AND B`

> An XOR gate itself can be built from AND + OR + NOT. Logic gates literally stack up layer by layer.

## Full Adder

A half adder has no input for a carry coming from a lower bit. A **full adder** adds a third input `Cin` so multiple adders can be **chained** to compute multi-bit sums.

String 8, 16, 32 or 64 full adders together and you get an N-bit adder — this is the starting point of the ALU (Arithmetic Logic Unit) inside any CPU.
