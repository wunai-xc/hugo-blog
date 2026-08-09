+++
title = 'Threejs教程'
date = 2026-08-09
draft = false
tags = ["Threejs", "3D"]
categories = ["教程"]
summary = '本文摘要自Threejs官网教程'
+++

---

## 开启 Web 3D 之门：WebGL与Three.js简介
在过去的几年里，网页已经从单纯的文字和图片展示，进化到了拥有丰富交互和视觉特效的平台。在这场变革中，Three.js 无疑是最璀璨的明星之一。它降低了 Web 3D 开发的门槛，让开发者无需精通复杂的图形学底层原理，也能在浏览器中创造出惊艳的 3D 世界。要了解Three.js，首先要从WebGL说起。

---
## 什么是 WebGL
**WebGL (Web Graphics Library)** 是一种 JavaScript API，它允许网页在不使用插件的情况下，利用 GPU（图形处理器）在浏览器中渲染高性能的 2D 和 3D 图形。它具有以下优点：

- **硬件加速**： 传统的网页渲染主要靠 CPU，而 WebGL 将复杂的数学计算交给显卡（GPU）。GPU 擅长并行处理成千上万个像素的计算，这使得实现流畅的 3D 动画成为可能。

- **跨平台**： 只要浏览器支持 WebGL（现代浏览器如 Chrome, Edge, Safari 均支持），3D应用就能在手机、平板和电脑上运行。

同时，因为WebGL的语法非常复杂，直接使用原生WebGL开发极其痛苦。开发者需要编写大量的GLSL（着色器语言）代码，手动管理缓冲区、矩阵变换和复杂的数学运算。即便只是在屏幕上画一个红色的三角形，可能也需要编写上百行代码。为了简化WebGL的开发，Three.js应运而生。

---
## 什么是 Three.js
**Three.js** 是由 Ricardo Cabello（网名 Mr.doob）发起的开源轻量级3D库。核心目标是：**让在浏览器中创建 3D 内容变得简单**， 官方网址：https://threejs.org。

Three.js 封装了 WebGL 的细节，提供了一个简单易用的对象模型。通过 Three.js，你可以使用直观的“场景”、“相机”、“材质”和“灯光”等概念来构建 3D 应用，而无需从零开始编写复杂的图形渲染管线。

Three.js的出现继承并扩展了WebGL的优点：

1. **易用性**：相比原生 WebGL，Three.js 大幅减少了代码量。一个简单的旋转立方体，在 WebGL 中可能需要上百行代码，而在 Three.js 中仅需十几行。
2. **生态**：它是目前 GitHub 上最流行的 Web 3D 库，拥有庞大的社区和丰富的示例。
3. **跨平台**：只要浏览器支持 WebGL（目前的现代浏览器如 Chrome, Firefox, Safari, Edge 均完美支持），你的 3D 应用就可以在桌面端和移动端流畅运行。
4. **功能丰富**：支持模型加载（GLTF, OBJ, FBX 等）、物理引擎集成、后期特效（幻觉、景深、抗锯齿）、高级材质渲染（PBR）等。

---
## Three.js 的核心概念
要理解 Three.js 的工作原理，可以想象自己在拍摄一部电影。你需要以下四个基本要素：

1. **场景 (Scene)**
场景就像是舞台。它是所有物体、灯光和背景的容器。没有场景，你就没有地方放置你的 3D 对象。

2. **相机 (Camera)**
相机就像是观众的眼睛。在 3D 空间中，相机的位置和朝向决定了屏幕上显示的内容。最常用的是透视相机 ，它模拟了人眼的视觉效果（近大远小）。

3. **渲染器 (Renderer)**
渲染器是幕后的魔术师。它负责接收“场景”和“相机”，并将 3D 数据计算成 2D 像素画在网页的 `<canvas>` 元素上。

4. **网格 (Mesh)**
网格是我们在场景中看到的核心物体。它由两部分组成：

- 几何体 (Geometry)：定义物体的形状（如球体、立方体、平面）。
- 材质 (Material)：定义物体的外观（如颜色、反光度、纹理贴图）。

---
## Three.js结合Vite开发第一个场景
上节我们对Three.js的概念有了基本的了解，本节通过实际代码，初体验Three.js的开发过程。在现代 Web 开发中，我们不再推荐直接在 HTML 中引入 `<script>` 标签，而是使用更高效的构建工具。本节我们将使用 [Vite](https://cn.vite.dev/guide/)
—— 目前前端界最快、最轻量的构建工具。

---
## 为什么选择Vite？
在 Three.js 开发中， 使用 Vite 这样的构建工具有几个巨大的优势：

1. 模块化开发(ES Modules)： 我们可以把代码拆分成多个文件（ 如 Scene.js, Camera.js, Cube.js）， 方便管理。
2. 热更新(HMR)： 修改代码后， 浏览器毫秒级更新， 调整材质和动画参数时无需手动刷新页面， 体验极佳。
3. 资源处理： Vite 能自动处理.glb, .png, .hdr 等 3D 资源的路径和打包问题。

---
## 第一步：初始化 Vite 项目
WARNING

首先，确保你的电脑上安装了 [Node.js](https://nodejs.org/)
，版本视当前所用的Vite决定。

打开终端（命令行），运行以下命令来创建一个纯净的 `JavaScript` 项目：

```bash
# 创建项目文件夹并进入
mkdir three - app

# 进入文件夹
cd three - app

# 初始化 Vite 项目（ 选择 Vanilla JS 即可， 不需要 React / Vue）
npm create vite @latest.-- --template vanilla

# 安装依赖
npm install

# 安装 Three.js 核心库
npm install three
```

---

## 第二步： 清理工程
Vite 默认生成的模板包含一些示例代码， 我们需要清理一下， 只保留最基础的结构。

1、 打开 index.html， 将 `<div #app>`改为 `<div #webgl>`， 它将作为我们 `<canvas>`的容器：

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>three-app</title>
  </head>
  <body>
    <canvas id="webgl"></canvas>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>

```

2、打开 `src/style.css`，清空内容，只写入最基础的重置样式：

```css
html,
body,
#webgl {
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 0;
  overflow: hidden;
}
```

3、清空 `src/main.ts` 中的内容，注意保留`import './style.css'`。

4、删除`src/counter.js`文件。

---
## 第三步：编写代码 Hello Cube
现在，我们在 `src/main.js` 中编写`Three.js`代码，实现一个自动旋转的立方体。

```javascript
import "./style.css";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

// 初始化相机、场景、渲染器等
const canvas = document.getElementById("webgl");
const camera = new THREE.PerspectiveCamera(30, window.innerWidth / window.innerHeight, 1, 3000);
camera.position.set(100, 100, 100);
camera.lookAt(0, 0, 0);

// 创建场景
const scene = new THREE.Scene();

// 创建渲染器
const renderer = new THREE.WebGLRenderer({ antialias: true, canvas: canvas });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);

// 创建控制器
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 0, 0);
controls.update();

// 创建一个简单的立方体
const geometry = new THREE.BoxGeometry(10, 10, 10);
const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
const cube = new THREE.Mesh(geometry, material);
scene.add(cube);

// 动画循环
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  // 让立方体旋转起来
  cube.rotation.x += 0.01;
  cube.rotation.y += 0.01;
  renderer.render(scene, camera);
}

animate();

```
运行 `<npm run dev>`，打开浏览器，你应该能看到一个正在旋转的绿色立方体了！