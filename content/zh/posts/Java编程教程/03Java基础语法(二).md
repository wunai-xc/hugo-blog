+++
title = 'Java基础语法（二）：运算符与表达式'
date = 2026-08-12
draft = false
tags = ["Java", "编程语言", "基础语法", "运算符", "表达式", "教程"]
categories = ["编程语言", "Java教程"]
summary = '本文是Java教程系列的第三篇，系统讲解Java中的各类运算符，包括算术运算符、赋值运算符、关系运算符、逻辑运算符、位运算符和三元运算符，并深入探讨运算符优先级与表达式求值规则。'
author = "AI"
+++

## 引言

在上一篇文章中，我们学习了Java的基本数据类型、变量与常量的声明与使用。然而，仅仅声明变量并不能完成任何有意义的计算——我们需要**运算符**来对数据进行操作和运算。

运算符是编程语言中用于执行数据运算的符号。Java提供了丰富多样的运算符，涵盖算术运算、赋值运算、关系比较、逻辑判断、位运算等多个方面。理解这些运算符的用法和优先级规则，是编写正确程序的基础。

本文将系统讲解Java中的所有运算符类型，并通过大量示例帮助读者掌握运算符的使用。

## 第一章 运算符概述

### 1.1 什么是运算符

**运算符**是一种特殊符号，用于告诉程序对操作数执行特定的数学或逻辑运算。

**表达式**是由运算符和操作数组成的式子。例如 `a + b` 中，`+` 是运算符，`a` 和 `b` 是操作数。

### 1.2 运算符分类

Java中的运算符按功能可分为以下几类：

| 类别 | 运算符 |
|------|--------|
| 算术运算符 | `+` `-` `*` `/` `%` `++` `--` |
| 赋值运算符 | `=` `+=` `-=` `*=` `/=` `%=` `&=` `\|=` `^=` `<<=` `>>=` `>>>=` |
| 关系运算符 | `==` `!=` `>` `<` `>=` `<=` |
| 逻辑运算符 | `&&` `\|\|` `!` |
| 位运算符 | `&` `\|` `^` `~` `<<` `>>` `>>>` |
| 三元运算符 | `? :` |
| instanceof 运算符 | `instanceof` |

按操作数数量分类：

- **一元运算符**：只需一个操作数（如 `++`、`--`、`!`、`~`）
- **二元运算符**：需要两个操作数（如 `+`、`-`、`*`、`/`、`==`）
- **三元运算符**：需要三个操作数（`? :`）

## 第二章 算术运算符

算术运算符用于执行数学运算，如加减乘除、取余、自增自减等。

### 2.1 基本算术运算符（+、-、*、/、%）

| 运算符 | 名称 | 示例 | 结果 |
|--------|------|------|------|
| `+` | 加法 | `5 + 3` | `8` |
| `-` | 减法 | `5 - 3` | `2` |
| `*` | 乘法 | `5 * 3` | `15` |
| `/` | 除法 | `10 / 3` | `3`（整数除法） |
| `%` | 取余（模运算） | `10 % 3` | `1` |

```java
public class ArithmeticDemo {
    public static void main(String[] args) {
        int a = 10, b = 3;
        int sum = a + b;         // 13
        int diff = a - b;        // 7
        int product = a * b;     // 30
        int quotient = a / b;    // 3（整数除法，舍去小数）
        int remainder = a % b;   // 1

        System.out.println("10 + 3 = " + sum);
        System.out.println("10 - 3 = " + diff);
        System.out.println("10 * 3 = " + product);
        System.out.println("10 / 3 = " + quotient);
        System.out.println("10 % 3 = " + remainder);

        // 浮点数除法
        double d1 = 10.0 / 3;    // 3.3333333333333335
        double d2 = 10 / 3.0;    // 3.3333333333333335
        double d3 = 10 / 3;      // 3.0（整数除法后转double）

        System.out.println("10.0 / 3 = " + d1);
        System.out.println("10 / 3.0 = " + d2);
        System.out.println("10 / 3 = " + d3);
    }
}
```

> **注意**：两个整数相除的结果仍是整数，小数部分会被直接舍去。如果希望得到精确的小数结果，至少需要将其中一个操作数转换为浮点数。

### 2.2 自增与自减运算符（++、--）

自增（`++`）和自减（`--`）运算符用于对变量加1或减1。它们可以放在变量之前（前缀）或之后（后缀），含义不同。

```java
int x = 5;
int y = 10;

// 后缀：先使用变量的值，再自增/自减
int a = x++;  // a = 5, x = 6（先赋值，后自增）
int b = y--;  // b = 10, y = 9（先赋值，后自减）

// 前缀：先自增/自减，再使用变量的值
int c = ++x;  // x = 7, c = 7（先自增，后赋值）
int d = --y;  // y = 8, d = 8（先自减，后赋值）
```

**口诀**：
- 前置（`++i`）：先自增，再使用（先加后用）
- 后置（`i++`）：先使用，再自增（先用后加）

## 第三章 赋值运算符

赋值运算符用于将右侧的值赋给左侧的变量。最基本的赋值运算符是 `=`。

### 3.1 简单赋值

```java
int a = 10;      // 将10赋值给a
String name = "张三"; // 将字符串赋值给name
boolean flag = true; // 将布尔值赋值给flag
```

### 3.2 复合赋值运算符

复合赋值运算符将算术运算与赋值操作合并在一起。

| 运算符 | 等价形式 | 示例 |
|--------|---------|------|
| `+=` | `a = a + b` | `a += 5` |
| `-=` | `a = a - b` | `a -= 5` |
| `*=` | `a = a * b` | `a *= 5` |
| `/=` | `a = a / b` | `a /= 5` |
| `%=` | `a = a % b` | `a %= 5` |
| `&=` | `a = a & b` | `a &= 5` |
| `\|=` | `a = a \| b` | `a \|= 5` |
| `^=` | `a = a ^ b` | `a ^= 5` |
| `<<=` | `a = a << b` | `a <<= 2` |
| `>>=` | `a = a >> b` | `a >>= 2` |
| `>>>=` | `a = a >>> b` | `a >>>= 2` |

```java
public class AssignmentDemo {
    public static void main(String[] args) {
        int a = 10;
        a += 5;   // a = 15
        a -= 3;   // a = 12
        a *= 2;   // a = 24
        a /= 4;   // a = 6
        a %= 4;   // a = 2

        System.out.println("最终结果: " + a);

        // 复合赋值运算符不会改变数据类型
        byte b = 10;
        b += 5;   // 等价于 b = (byte)(b + 5)
        // 这里自动进行了类型转换，不会报错
    }
}
```

## 第四章 关系运算符

关系运算符用于比较两个值之间的关系，返回布尔值（`true` 或 `false`）。

| 运算符 | 名称 | 示例 | 说明 |
|--------|------|------|------|
| `==` | 等于 | `a == b` | 判断a和b是否相等 |
| `!=` | 不等于 | `a != b` | 判断a和b是否不相等 |
| `>` | 大于 | `a > b` | 判断a是否大于b |
| `<` | 小于 | `a < b` | 判断a是否小于b |
| `>=` | 大于等于 | `a >= b` | 判断a是否大于等于b |
| `<=` | 小于等于 | `a <= b` | 判断a是否小于等于b |

```java
public class CompareDemo {
    public static void main(String[] args) {
        int a = 10, b = 20;

        System.out.println("a == b: " + (a == b)); // false
        System.out.println("a != b: " + (a != b)); // true
        System.out.println("a > b:  " + (a > b));  // false
        System.out.println("a < b:  " + (a < b));  // true
        System.out.println("a >= b: " + (a >= b)); // false
        System.out.println("a <= b: " + (a <= b)); // true

        // 比较字符（基于Unicode码值）
        char c1 = 'A', c2 = 'B';
        System.out.println("'A' < 'B': " + (c1 < c2)); // true

        // 比较对象（比较的是引用地址，不是内容）
        String s1 = new String("Hello");
        String s2 = new String("Hello");
        System.out.println("s1 == s2: " + (s1 == s2)); // false
        System.out.println("s1.equals(s2): " + s1.equals(s2)); // true
    }
}
```

> **关键注意**：`==` 比较基本数据类型时比较的是值；比较引用类型时比较的是内存地址。比较字符串内容应使用 `equals()` 方法。

## 第五章 逻辑运算符

逻辑运算符用于对布尔值进行逻辑判断，常用于条件语句中。

| 运算符 | 名称 | 示例 | 说明 |
|--------|------|------|------|
| `&&` | 逻辑与 | `a && b` | a和b都为true时结果为true |
| `\|\|` | 逻辑或 | `a \|\| b` | a或b有一个为true时结果为true |
| `!` | 逻辑非 | `!a` | a为true时结果为false，反之亦然 |

```java
public class LogicDemo {
    public static void main(String[] args) {
        boolean isAdult = true;
        boolean isStudent = false;
        boolean isVip = true;

        // 逻辑与：两个条件都满足
        boolean canGetDiscount = isAdult && isStudent;
        System.out.println("canGetDiscount: " + canGetDiscount); // false

        // 逻辑或：至少满足一个条件
        boolean canEnter = isAdult || isVip;
        System.out.println("canEnter: " + canEnter); // true

        // 逻辑非：取反
        boolean notAdult = !isAdult;
        System.out.println("notAdult: " + notAdult); // false

        // 短路与（&&）：如果第一个条件为false，不再计算第二个条件
        int x = 10;
        boolean result1 = (x > 5) && (x++ > 5);
        System.out.println("x: " + x); // x = 11

        int y = 10;
        boolean result2 = (y > 5) && (y++ > 5);
        // 这行和上面效果一样，这里只是为了演示短路

        int z = 10;
        boolean result3 = (z < 5) && (z++ > 5);
        System.out.println("z: " + z); // z = 10（第二个条件未执行）

        // 短路或（||）：如果第一个条件为true，不再计算第二个条件
        int w = 10;
        boolean result4 = (w < 5) || (w++ > 5);
        System.out.println("w: " + w); // w = 11（第一个条件为false，执行第二个条件）

        int v = 10;
        boolean result5 = (v > 5) || (v++ > 5);
        System.out.println("v: " + v); // v = 10（第一个条件为true，短路，第二个条件未执行）
    }
}
```

> **短路运算**是逻辑运算符的重要特性：`&&` 如果左侧为 `false`，右侧不再求值；`||` 如果左侧为 `true`，右侧不再求值。这可以避免不必要的计算，但也需要注意避免因短路导致的逻辑错误。

## 第六章 位运算符

位运算符直接操作整数在内存中的二进制位，运算效率极高，常用于系统编程和性能优化。

### 6.1 按位运算符

| 运算符 | 名称 | 示例 | 说明 |
|--------|------|------|------|
| `&` | 按位与 | `a & b` | 对应位都为1时结果为1 |
| `\|` | 按位或 | `a \| b` | 对应位有一个为1时结果为1 |
| `^` | 按位异或 | `a ^ b` | 对应位不同时结果为1 |
| `~` | 按位取反 | `~a` | 每一位取反 |

```java
public class BitwiseDemo {
    public static void main(String[] args) {
        int a = 60;  // 二进制: 0011 1100
        int b = 13;  // 二进制: 0000 1101

        // 按位与：对应位都为1 -> 1
        int resultAnd = a & b; // 0000 1100 = 12
        System.out.println("a & b = " + resultAnd);

        // 按位或：对应位至少一个为1 -> 1
        int resultOr = a | b;  // 0011 1101 = 61
        System.out.println("a | b = " + resultOr);

        // 按位异或：对应位不同 -> 1
        int resultXor = a ^ b; // 0011 0001 = 49
        System.out.println("a ^ b = " + resultXor);

        // 按位取反：每一位取反
        int resultNot = ~a;    // 1100 0011 = -61（补码表示）
        System.out.println("~a = " + resultNot);
    }
}
```

### 6.2 移位运算符

移位运算符将二进制位向左或向右移动指定的位数。

| 运算符 | 名称 | 示例 | 说明 |
|--------|------|------|------|
| `<<` | 左移 | `a << n` | 左移n位，低位补0，相当于乘以2ⁿ |
| `>>` | 右移 | `a >> n` | 右移n位，高位补符号位，相当于除以2ⁿ |
| `>>>` | 无符号右移 | `a >>> n` | 右移n位，高位补0 |

```java
public class ShiftDemo {
    public static void main(String[] args) {
        int a = 8;  // 0000 1000

        // 左移1位：相当于乘以2
        int leftShift = a << 1;  // 0001 0000 = 16
        System.out.println("8 << 1 = " + leftShift);

        // 左移2位：相当于乘以4
        int leftShift2 = a << 2; // 0010 0000 = 32
        System.out.println("8 << 2 = " + leftShift2);

        // 右移1位：相当于除以2
        int rightShift = a >> 1; // 0000 0100 = 4
        System.out.println("8 >> 1 = " + rightShift);

        // 负数右移：高位补1
        int negative = -8;
        int rightShiftNeg = negative >> 1; // 保持符号位
        System.out.println("-8 >> 1 = " + rightShiftNeg);

        // 无符号右移：高位补0
        int unsignedShift = negative >>> 1;
        System.out.println("-8 >>> 1 = " + unsignedShift);
    }
}
```

## 第七章 三元运算符

三元运算符（条件运算符）是Java中唯一的三元运算符，用于简化简单的 if-else 语句。

### 7.1 基本语法

```text
条件 ? 表达式1 : 表达式2
```

如果条件为 `true`，执行表达式1；如果条件为 `false`，执行表达式2。

```java
public class TernaryDemo {
    public static void main(String[] args) {
        int age = 20;

        // 使用三元运算符
        String status = (age >= 18) ? "成年人" : "未成年人";
        System.out.println("状态：" + status);

        // 等效的 if-else 代码
        String status2;
        if (age >= 18) {
            status2 = "成年人";
        } else {
            status2 = "未成年人";
        }
        System.out.println("状态2：" + status2);

        // 三元运算符可以嵌套使用
        int score = 85;
        String grade = (score >= 90) ? "A" :
                       (score >= 80) ? "B" :
                       (score >= 70) ? "C" :
                       (score >= 60) ? "D" : "F";
        System.out.println("等级：" + grade);
    }
}
```

## 第八章 instanceof 运算符

`instanceof` 运算符用于检查对象是否属于特定的类型（类、子类或接口）。

```java
public class InstanceofDemo {
    public static void main(String[] args) {
        String str = "Hello";

        // 检查str是否是String类型
        boolean isString = str instanceof String;
        System.out.println("str instanceof String: " + isString); // true

        // 检查str是否是Object类型（所有类都是Object的子类）
        boolean isObject = str instanceof Object;
        System.out.println("str instanceof Object: " + isObject); // true

        // null不是任何类型的实例
        String nullStr = null;
        boolean isNull = nullStr instanceof String;
        System.out.println("nullStr instanceof String: " + isNull); // false
    }
}
```

## 第九章 运算符优先级

当表达式中同时出现多个运算符时，**运算符优先级**决定了运算的执行顺序。

### 9.1 优先级表

| 优先级 | 运算符 | 结合性 |
|--------|--------|--------|
| 最高 | `++` `--` `+` `-` `~` `!`（一元） | 从右到左 |
| 2 | `*` `/` `%` | 从左到右 |
| 3 | `+` `-`（二元） | 从左到右 |
| 4 | `<<` `>>` `>>>` | 从左到右 |
| 5 | `<` `<=` `>` `>=` | 从左到右 |
| 6 | `==` `!=` | 从左到右 |
| 7 | `&` | 从左到右 |
| 8 | `^` | 从左到右 |
| 9 | `\|` | 从左到右 |
| 10 | `&&` | 从左到右 |
| 11 | `\|\|` | 从左到右 |
| 12 | `? :` | 从右到左 |
| 最低 | `=` `+=` `-=` `*=` `/=` `%=` `&=` `^=` `\|=` `<<=` `>>=` `>>>=` | 从右到左 |

### 9.2 优先级示例

```java
public class PrecedenceDemo {
    public static void main(String[] args) {
        // 算术运算符优先级：* 和 / 优先于 + 和 -
        int result1 = 10 + 5 * 2;   // 20，而非30（先乘后加）
        int result2 = (10 + 5) * 2; // 30，使用括号改变优先级

        System.out.println("10 + 5 * 2 = " + result1);
        System.out.println("(10 + 5) * 2 = " + result2);

        // 混合运算符
        int a = 10, b = 20, c = 30;
        boolean result3 = a > b && b < c; // false（先比较，后逻辑与）
        boolean result4 = a > b || b < c; // true

        // 建议使用括号明确优先级，提高代码可读性
        boolean result5 = (a > b) && (b < c);
        System.out.println("(a > b) && (b < c) = " + result5);
    }
}
```

### 9.3 提高可读性的建议

虽然记住优先级很重要，但在实际编程中，使用括号明确运算顺序是更好的实践：

```java
// 难以理解
int x = a + b * c / d - e;

// 更清晰
int y = a + ((b * c) / d) - e;
```

## 第十章 综合示例

以下示例综合运用了多种运算符，实现一个简单的计算器功能。

```java
import java.util.Scanner;

public class CalculatorDemo {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);

        System.out.print("请输入第一个整数：");
        int num1 = scanner.nextInt();

        System.out.print("请输入运算符（+ - * / %）：");
        char operator = scanner.next().charAt(0);

        System.out.print("请输入第二个整数：");
        int num2 = scanner.nextInt();

        int result = 0;
        boolean valid = true;

        switch (operator) {
            case '+':
                result = num1 + num2;
                break;
            case '-':
                result = num1 - num2;
                break;
            case '*':
                result = num1 * num2;
                break;
            case '/':
                if (num2 != 0) {
                    result = num1 / num2;
                } else {
                    System.out.println("错误：除数不能为0");
                    valid = false;
                }
                break;
            case '%':
                if (num2 != 0) {
                    result = num1 % num2;
                } else {
                    System.out.println("错误：除数不能为0");
                    valid = false;
                }
                break;
            default:
                System.out.println("错误：不支持的运算符");
                valid = false;
        }

        if (valid) {
            System.out.println(num1 + " " + operator + " " + num2 + " = " + result);
        }

        scanner.close();
    }
}
```

## 总结

本文系统讲解了Java中的各类运算符：

| 运算符类型 | 核心要点 |
|-----------|---------|
| 算术运算符 | 注意整数除法的截断和自增/自减的前置/后置区别 |
| 赋值运算符 | 复合赋值自动进行类型转换，使用便捷 |
| 关系运算符 | 返回布尔值，比较对象时使用 `equals()` |
| 逻辑运算符 | 短路运算特性，`&&` 和 `||` 的短路行为 |
| 位运算符 | 直接操作二进制位，效率最高 |
| 三元运算符 | 简化简单的 if-else，提高代码简洁性 |
| 运算符优先级 | 使用括号明确运算顺序，提高可读性 |

## 练习与思考题

1. 写出 `int i = 5; int j = ++i + i++;` 执行后 `i` 和 `j` 的值分别是多少？
2. 实现一个程序：输入一个三位整数，输出其各位数字之和（如输入123，输出6）。
3. 使用位运算符实现：交换两个整数的值，不使用临时变量。
4. 编写程序：判断输入的年份是否为闰年（能被4整除但不能被100整除，或能被400整除）。
5. 利用短路运算特性：安全地检查一个字符串是否以“Hello”开头，避免空指针异常。

## 参考资料

1. 《Java核心技术 卷I》（第11版），Cay S. Horstmann 著
2. 《Head First Java》（第2版），Kathy Sierra & Bert Bates 著
3. [Oracle Java 教程 - 运算符](https://docs.oracle.com/javase/tutorial/java/nutsandbolts/opsummary.html)
4. [Java 语言规范 - 第15章：表达式](https://docs.oracle.com/javase/specs/jls/se17/html/jls-15.html)