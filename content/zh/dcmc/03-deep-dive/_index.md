---
title: "第 3 章 · 深入（MC 代码/协议）"
layout: "dcmc"
weight: 30
description: "Minecraft 核心代码、存档结构、NBT 格式、区块系统、协议栈、数据包、渲染管线等底层技术分析。"
---

# 第 3 章 · 深入（MC 代码 / 协议分析）

> 万丈高楼的地基 —— DCMC 的核心区域。

本章是 **DeepCoreMineCraft** 的重点章节，围绕 Minecraft 底层展开：

- **存档与数据格式**：`.minecraft/saves` 目录结构、Region 文件（`.mca`）、Anvil 格式、NBT（Named Binary Tag）编码
- **区块系统**：Chunk 生命周期、Section / Palette / BlockState、区块加载与卸载、Block Tick
- **世界生成算法**：噪声叠加链、生物群系温度/湿度、结构生成（村庄/要塞/矿脉）
- **网络协议栈**：Netty 管线、握手/登录/状态/播放四大阶段、核心封包列表、压缩与加密（AES-CFB-8）
- **客户端渲染管线**：Render Chunk 构建、VAO/VBO、遮挡剔除、区块合并与实体渲染
- **方块与实体更新**：BlockState 属性、BlockEntity、TEISR、Entity Tracker
- **Mod 开发原理**：Forge / Fabric 架构、Mixin 注入、Access Transformer、Coremod、映射表（Mojmap / Yarn / MCP）
- **反编译与逆向**：ForgeGradle 反混淆工作流、从 jar 到源码、断点调试、性能 Profiler

各小节将在后续陆续补充。
