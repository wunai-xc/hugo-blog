
+++
title = 'Java简介与环境搭建'
date = 2026-08-12
draft = false
tags = ["Java", "编程语言", "JDK", "Java基础", "环境搭建", "教程"]
categories = ["编程语言", "Java教程"]
summary = '本文是Java教程系列的第一篇，全面介绍Java语言的历史、核心特性、JDK与JVM的关系，并手把手指导读者完成Java开发环境的安装配置，编写并运行第一个Java程序。'
author = "AI"
+++

## 引言

Java 是一门由 Sun Microsystems 公司（现已被 Oracle 收购）于 1995 年推出的高级编程语言。它以其 **“一次编写，到处运行”**（Write Once, Run Anywhere）的跨平台特性闻名于世，是全球应用最广泛的编程语言之一。从企业级后端开发到 Android 移动应用，从大数据处理框架到嵌入式系统，Java 的身影无处不在[^1]。

本系列教程将带你从零基础开始，系统性地学习 Java 语言的核心知识，逐步构建完整的编程技能体系。

## 第一章 Java 的前世今生

### 1.1 Java 的诞生与发展历程

Java 的起源可以追溯到 1991 年，Sun 公司的 **詹姆斯·高斯林**（James Gosling）领导了一个名为 **“Green Project”** 的研究项目，最初目标是开发一种用于消费类电子产品（如智能家电）的编程语言。该项目最初基于 C++，但后来因其过于复杂和不可移植而被放弃。

**詹姆斯·高斯林** 开发了一种新语言，最初命名为 “Oak”（橡树），后来更名为 “Java”。Java 这个名字的灵感据说来源于高斯林当时钟爱的一款名为 “Java” 的咖啡品牌[^2]。

Java 的发展关键节点：

| 年份 | 版本/事件 | 意义 |
|------|----------|------|
| 1995 | Java 1.0 | Java 正式发布，首次提出 “Write Once, Run Anywhere” |
| 1996 | JDK 1.0 | 第一个 Java 开发工具包发布 |
| 1997 | JDK 1.1 | 引入了内部类、Java Bean 等新特性 |
| 1998 | J2SE 1.2 | 引入了 Swing GUI 库、集合框架，Java 2 平台诞生 |
| 2000 | J2SE 1.3 | HotSpot JVM 成为默认虚拟机 |
| 2002 | J2SE 1.4 | 引入断言机制、NIO、日志 API |
| 2004 | Java SE 5.0 | 引入泛型、枚举、增强 for 循环、注解等重要特性 |
| 2006 | Java SE 6 | 提供了更好的脚本语言支持和 JDBC 4.0 |
| 2011 | Java SE 7 | 引入了 try-with-resources、NIO.2、Fork/Join 框架 |
| 2014 | Java SE 8 | **里程碑版本**：引入 Lambda 表达式、Stream API、新的日期时间 API |
| 2017 | Java SE 9 | 引入模块化系统（Project Jigsaw） |
| 2018 | Java SE 11 | 首个长期支持版本（LTS） |
| 2021 | Java SE 17 | 最新的长期支持版本（LTS），引入了密封类、模式匹配等特性 |
| 2023 | Java SE 21 | 最新的长期支持版本（LTS） |

### 1.2 Java 的核心特性

Java 之所以能长盛不衰，主要得益于其卓越的设计理念：

#### 面向对象（Object-Oriented）

Java 是一种纯粹的面向对象编程语言，一切皆为对象（除了少数基本数据类型）。它支持封装、继承和多态这三大面向对象的基本特征。

#### 跨平台性（平台无关）

Java 源代码编译后生成的不是特定平台的机器码，而是 **字节码**（Bytecode）。这些字节码可以在任何安装了 **Java 虚拟机（JVM）** 的平台上运行[^1]。这种“一次编译，到处运行”的特性使得 Java 应用具有极高的可移植性。

#### 健壮性（Robust）

Java 在语言设计层面提供了多重安全保障。**强类型检查**在编译阶段就能捕获大部分类型错误；**自动垃圾回收（GC）** 机制极大地减少了内存泄漏和指针错误；完善的**异常处理**框架使程序能更优雅地处理运行时错误。

#### 安全性（Secure）

Java 提供了多层安全机制。**字节码校验**确保加载的代码不会执行非法操作；**安全管理器**可为不同来源的代码分配不同的权限；**类加载器**的隔离机制则防止恶意代码破坏系统的核心类库。

#### 多线程（Multithreading）

Java 内置对多线程编程的支持，允许程序同时执行多个任务。这使得开发高性能、响应迅速的应用程序成为可能，尤其在服务器端开发中具有显著优势[^3]。

#### 庞大的生态系统

经过近三十年的发展，Java 拥有全世界最庞大的开发者社区和最丰富的第三方类库与框架（如 Spring、Hibernate、Struts 等），这使得 Java 在解决各种实际问题时都有成熟的现成方案。

### 1.3 JVM、JRE 与 JDK 的区别

初学 Java 时，有三个容易混淆的概念需要区分清楚：

#### Java 虚拟机（JVM）

JVM 是运行 Java 字节码的“引擎”。它是实现跨平台特性的核心。JVM 有不同的实现版本，如 HotSpot、OpenJ9 等，用于适配不同的操作系统和硬件环境。

#### Java 运行时环境（JRE）

JRE 是运行 Java 程序所需的最小环境，包含 Java 虚拟机（JVM）和核心类库（如 `java.lang`、`java.util` 等）。如果只需要“运行”Java 程序，则只需安装 JRE。

#### Java 开发工具包（JDK）

JDK 是 Java 开发人员的完整工具包，它不仅包含 JRE（运行环境），还包含了开发所需的编译工具（`javac`）、文档生成工具（`javadoc`）、打包工具（`jar`）以及调试工具等。要进行 Java 开发，必须安装 JDK。

```text
JDK = JRE + 开发工具（javac、javadoc、jar等）
JRE = JVM + 核心类库（java.lang、java.util等）
```

## 第二章 开发环境搭建

### 2.1 安装 JDK

#### 下载 JDK

目前 Java 的主要发行版由 Oracle 公司提供，也有开源的 OpenJDK 分发版。

1.  访问 Oracle 官网的下载页面：[https://www.oracle.com/java/technologies/downloads/](https://www.oracle.com/java/technologies/downloads/)
2.  根据你的操作系统（Windows、macOS、Linux）选择合适的 JDK 版本。对于初学者，建议选择最新的长期支持版本（LTS），如 **JDK 17** 或 **JDK 21**。
3.  下载安装程序并双击执行。

#### Windows 安装步骤

1.  运行 `.exe` 安装文件，按照提示点击“下一步”。
2.  建议在安装路径选择时不要使用默认的 `C:\Program Files\Java\`（因为路径中包含空格），可以选择简短的路径（如 `C:\Java\jdk-17`）。
3.  完成安装后，需要配置环境变量。

#### 配置 Windows 环境变量

1.  **设置 JAVA_HOME**：
    -   右键点击“此电脑”→“属性”→“高级系统设置”→“环境变量”。
    -   在“系统变量”中点击“新建”，变量名为 `JAVA_HOME`，变量值为你的 JDK 安装路径（如 `C:\Java\jdk-17`）。
2.  **更新 Path 变量**：
    -   在“系统变量”中找到 `Path` 变量，双击编辑。
    -   点击“新建”，添加 `%JAVA_HOME%\bin`。

#### macOS 安装

推荐使用 **Homebrew** 进行安装：

```bash
# 安装 JDK 17
brew install openjdk@17

# 设置符号链接
sudo ln -sfn /opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk /Library/Java/JavaVirtualMachines/openjdk-17.jdk
```

#### Linux 安装

使用包管理器安装 OpenJDK：

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install openjdk-17-jdk

# CentOS/RHEL/Fedora
sudo yum install java-17-openjdk-devel
```

### 2.2 验证安装

安装完成后，打开终端（命令行），执行以下命令验证安装是否成功：

```bash
# 查看 Java 版本
java -version

# 查看编译工具版本
javac -version
```

如果显示类似以下的输出，表示安装成功：

```text
java version "17.0.9" 2023-10-17 LTS
Java(TM) SE Runtime Environment (build 17.0.9+11-LTS-201)
Java HotSpot(TM) 64-Bit Server VM (build 17.0.9+11-LTS-201, mixed mode, sharing)
```

### 2.3 选择合适的开发工具

虽然可以使用文本编辑器编写 Java 代码，但使用功能完善的集成开发环境（IDE）可以显著提高开发效率。以下是三种主流选择：

#### IntelliJ IDEA（推荐）

由 JetBrains 公司开发，被公认为目前最优秀的 Java IDE。社区版免费开源，功能对于初学者已足够。

- 官网：[https://www.jetbrains.com/idea/](https://www.jetbrains.com/idea/)

#### Eclipse

老牌开源 Java IDE，功能强大，扩展性丰富。界面相对传统，但社区庞大。

- 官网：[https://www.eclipse.org/](https://www.eclipse.org/)

#### VS Code

轻量级文本编辑器，通过安装 Java 插件包（Extension Pack for Java）可支持 Java 开发。适合习惯轻量级工具的开发者。

## 第三章 第一个 Java 程序

### 3.1 编写源代码

使用任何文本编辑器（或 IDE），创建一个名为 `HelloWorld.java` 的文件，输入以下代码：

```java
public class HelloWorld {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
    }
}
```

**代码解析**：

- `public class HelloWorld`：定义了一个公共类。**类名必须与文件名完全一致**（即 `HelloWorld`）。
- `public static void main(String[] args)`：程序的**入口方法**。这是 JVM 启动时调用的第一个方法，其中的代码是程序的起点。
  - `public`：方法的访问权限是公开的
  - `static`：静态方法，无需创建类的实例即可调用
  - `void`：方法没有返回值
  - `String[] args`：命令行参数数组
- `System.out.println("Hello, World!");`：向标准输出（控制台）打印一行文本。`System.out` 是 Java 的标准输出流对象，`println` 是打印并换行的方法。

### 3.2 编译字节码

在终端中进入 `HelloWorld.java` 所在的目录，执行编译命令：

```bash
javac HelloWorld.java
```

如果代码没有语法错误，编译工具会生成一个名为 `HelloWorld.class` 的文件，这就是包含字节码的**类文件**（Class File）。这是 JVM 能够理解的“机器码”。

### 3.3 运行程序

使用 Java 命令运行编译后的字节码文件：

```bash
java HelloWorld
```

**注意**：运行命令时使用的是**类名**（`HelloWorld`），**不是文件名**（`HelloWorld.class`），也**不加扩展名**。

程序在控制台输出：

```text
Hello, World!
```

至此，你已经成功完成了第一个 Java 程序的编写、编译和运行！

## 第四章 深入理解 Java 程序的执行机制

### 4.1 Java 程序的执行流程

Java 程序的执行可以分为以下三个阶段：

1.  **编写**：开发者编写 `.java` 源文件。
2.  **编译**：Java 编译器（`javac`）将 `.java` 文件编译为 `.class` 字节码文件。
3.  **运行**：Java 虚拟机（JVM）加载 `.class` 文件，将其解释或编译为机器码并执行。

```text
┌─────────────┐     javac     ┌─────────────┐     java      ┌─────────────┐
│ HelloWorld  │ ────────────→ │ HelloWorld  │ ────────────→ │   JVM       │
│    .java    │               │    .class   │               │  执行字节码  │
└─────────────┘               └─────────────┘               └─────────────┘
```

### 4.2 编译与解释的混合模式

Java 采用的是 **“先编译、后解释”** 的混合执行模式[^1]：

1.  **编译阶段**：源码被编译成与平台无关的字节码。这一步保证了跨平台性。
2.  **运行阶段**：JVM 执行字节码时，采用**即时编译（JIT）** 技术——它会将“热点代码”（执行频率高的代码）动态编译为本地机器码，以提升执行效率。这使得 Java 的性能能够与编译型语言（如 C++）相媲美。

### 4.3 类加载器与双亲委派模型

JVM 在运行时通过 **类加载器（ClassLoader）** 动态加载 `.class` 文件。Java 采用 **双亲委派模型**：当一个类加载器收到加载请求时，它会先委托父类加载器尝试加载，只有当父类加载器无法加载时，子类加载器才会自己加载。这种机制保证了核心类库的安全性，避免自定义类覆盖标准类。

## 第五章 常见问题与故障排除

### 5.1 `javac: command not found`

**原因**：JDK 的 `bin` 目录未添加到系统的 `PATH` 环境变量中。

**解决办法**：
- 在 Windows 中检查 `Path` 变量是否包含 `%JAVA_HOME%\bin`。
- 在 macOS/Linux 中检查 `~/.bash_profile` 或 `~/.zshrc` 中的 `PATH` 设置。

### 5.2 `java.lang.NoClassDefFoundError`

**原因**：运行 `java` 命令时指定的类名不正确，或编译后的 `.class` 文件不在当前目录。

**解决办法**：
- 确保使用 `java HelloWorld`（不带 `.class` 后缀）。
- 检查 `.class` 文件是否存在，并确保其在当前工作目录下。

### 5.3 中文乱码问题

当程序输出中文时，控制台可能显示乱码。解决办法是在编译时指定编码：

```bash
javac -encoding UTF-8 HelloWorld.java
```

## 总结

本章作为 Java 教程的开篇，涵盖了 Java 的历史背景、核心特性、JVM/JRE/JDK 的区别以及完整的开发环境搭建流程。通过编写和运行第一个 Java 程序 `HelloWorld`，你已初步体验了 Java 开发的全过程。

理解 Java 的跨平台原理和执行机制，有助于我们更好地理解后续章节中更深入的语法和 API 设计。

## 练习与思考题

1. 尝试修改 `HelloWorld` 程序，让它在控制台输出你的名字。
2. 如果不定义 `public static void main(String[] args)`，程序能否运行？为什么？
3. 编译后的 `.class` 文件能否在未安装 JRE 的计算机上运行？请解释原因。
4. 尝试使用你选择的 IDE（IntelliJ IDEA 或 Eclipse）创建并运行同一个程序，体验 IDE 的便捷性。

## 参考资料

1. [Java 官方文档](https://docs.oracle.com/en/java/)
2. [Oracle 官方 Java 历史](https://www.oracle.com/java/technologies/java-history.html)
3. [维基百科：Java](https://zh.wikipedia.org/wiki/Java)
4. 《Java 核心技术 卷 I》（第 11 版），Cay S. Horstmann 著
5. 《Head First Java》（第 2 版），Kathy Sierra & Bert Bates 著