+++
title = 'Lambda表达式：函数式编程的基石'
date = 2026-08-12
draft = false
tags = ["Java", "编程语言", "Lambda", "函数式编程", "Java 8", "教程"]
categories = ["编程语言", "Java教程"]
summary = '本文是Java教程系列的第二十四篇，系统讲解Java 8引入的Lambda表达式。文章涵盖函数式接口的概念、Lambda表达式的语法与使用、方法引用与构造器引用、以及Java内置的核心函数式接口。'
author = "AI"
+++

## 引言

Java 8 是 Java 语言历史上最具革命性的版本之一，而其中最引人注目的特性就是 **Lambda 表达式**（Lambda Expression）。Lambda 表达式是 Java 迈向函数式编程的第一步，它允许将行为（函数）作为参数传递给方法，极大地简化了代码的编写。

在 Java 8 之前，如果需要将一个代码块传递给某个方法，通常需要创建一个匿名内部类。这种方式语法冗长，可读性差。Lambda 表达式的出现，使得代码更加简洁、清晰，为 Stream API、函数式接口等提供了基础。

本文将系统讲解 Java 中 Lambda 表达式的使用，帮助读者掌握这一重要特性。

## 第一章 Lambda 表达式概述

### 1.1 什么是 Lambda 表达式

**Lambda 表达式**是一种匿名函数——它没有名称，但有参数列表、函数体和返回类型。它可以作为参数传递给方法，也可以赋值给变量。

Lambda 表达式的核心思想是 **“行为参数化”** ——将代码逻辑作为参数传递给方法，让方法的行为可以根据传入的逻辑动态变化。

### 1.2 为什么要使用 Lambda 表达式

**Lambda 表达式解决的问题**：在 Java 8 之前，如果需要将一段代码传递给方法，只能使用匿名内部类。例如，排序一个字符串列表：

```java
// Java 8 之前：使用匿名内部类
List<String> list = Arrays.asList("Banana", "Apple", "Orange");
Collections.sort(list, new Comparator<String>() {
    @Override
    public int compare(String o1, String o2) {
        return o1.compareTo(o2);
    }
});

// Java 8 使用 Lambda 表达式
List<String> list = Arrays.asList("Banana", "Apple", "Orange");
Collections.sort(list, (s1, s2) -> s1.compareTo(s2));
```

**Lambda 表达式的优点**：

1. **代码更简洁**：减少了大量样板代码。
2. **更易读**：专注于业务逻辑而非语法细节。
3. **更灵活**：支持函数式编程风格。
4. **支持并行处理**：配合 Stream API 实现高效的并行计算。

## 第二章 函数式接口

### 2.1 什么是函数式接口

**函数式接口**（Functional Interface）是只有一个抽象方法的接口。Lambda 表达式可以被赋值给函数式接口类型的变量。

```java
// 函数式接口：只有一个抽象方法
@FunctionalInterface
interface MyFunction {
    int apply(int a, int b);
}

// 使用 Lambda 表达式实现函数式接口
MyFunction add = (a, b) -> a + b;
MyFunction multiply = (a, b) -> a * b;

// 调用
System.out.println(add.apply(3, 5));      // 8
System.out.println(multiply.apply(3, 5)); // 15
```

### 2.2 @FunctionalInterface 注解

`@FunctionalInterface` 注解用于标记函数式接口，编译器会检查该接口是否只有一个抽象方法。

```java
@FunctionalInterface
interface MyInterface {
    void doSomething();

    // 可以有默认方法
    default void defaultMethod() {
        System.out.println("默认方法");
    }

    // 可以有静态方法
    static void staticMethod() {
        System.out.println("静态方法");
    }

    // 错误：多个抽象方法会导致编译错误
    // void doAnother();
}
```

### 2.3 常见的函数式接口

Java 8 在 `java.util.function` 包中提供了一系列内置函数式接口：

```java
import java.util.function.*;

public class FunctionalInterfaceDemo {
    public static void main(String[] args) {
        // 1. Predicate<T>：断言（参数 -> boolean）
        Predicate<Integer> isEven = n -> n % 2 == 0;
        System.out.println("isEven(4): " + isEven.test(4)); // true

        // 2. Consumer<T>：消费（参数 -> void）
        Consumer<String> printer = s -> System.out.println("消费: " + s);
        printer.accept("Hello");

        // 3. Supplier<T>：供应（无参数 -> 返回值）
        Supplier<Double> random = () -> Math.random();
        System.out.println("随机数: " + random.get());

        // 4. Function<T, R>：函数（参数 -> 返回值）
        Function<String, Integer> length = s -> s.length();
        System.out.println("长度: " + length.apply("Hello"));

        // 5. UnaryOperator<T>：一元运算（T -> T，继承 Function）
        UnaryOperator<Integer> square = n -> n * n;
        System.out.println("平方: " + square.apply(5));

        // 6. BinaryOperator<T>：二元运算（T, T -> T）
        BinaryOperator<Integer> sum = (a, b) -> a + b;
        System.out.println("和: " + sum.apply(3, 5));
    }
}
```

## 第三章 Lambda 表达式语法

### 3.1 基本语法

Lambda 表达式的基本语法：

```text
(参数列表) -> { 函数体 }
```

**组成部分**：

1. **参数列表**：用括号括起来，多个参数用逗号分隔。
2. **箭头符号**：`->` 分隔参数和函数体。
3. **函数体**：可以是单个表达式或代码块。

### 3.2 各种写法示例

```java
public class LambdaSyntaxDemo {
    public static void main(String[] args) {
        // 1. 无参数，单行表达式
        Runnable task = () -> System.out.println("Hello Lambda");

        // 2. 无参数，多行代码块
        Runnable task2 = () -> {
            System.out.println("多行Lambda");
            System.out.println("第二行");
        };

        // 3. 一个参数，可省略括号
        Consumer<String> print = s -> System.out.println(s);

        // 4. 多个参数
        BinaryOperator<Integer> add = (a, b) -> a + b;

        // 5. 显式指定参数类型
        BinaryOperator<Integer> add2 = (Integer a, Integer b) -> a + b;

        // 6. 函数体为代码块，需要 return
        Function<Integer, Integer> square = (x) -> {
            int result = x * x;
            return result;
        };

        // 7. 函数体为单行表达式，自动返回（无需 return）
        Function<Integer, Integer> double2 = x -> x * 2;

        // 8. 无返回值（void）
        Consumer<Integer> printNumber = x -> System.out.println(x);
    }
}
```

### 3.3 Lambda 表达式的类型推断

Java 编译器可以根据上下文推断 Lambda 表达式的参数类型和返回值类型。

```java
public class TypeInferenceDemo {
    public static void main(String[] args) {
        // 编译器可以推断参数类型
        List<String> list = Arrays.asList("A", "B", "C");

        // 编译器知道 s 是 String 类型
        list.forEach(s -> System.out.println(s));

        // 显式指定类型（通常不需要）
        list.forEach((String s) -> System.out.println(s));

        // 多个参数的类型推断
        BinaryOperator<Integer> add = (a, b) -> a + b; // a, b 自动推断为 Integer
    }
}
```

## 第四章 方法引用

**方法引用**是 Lambda 表达式的简化写法，当 Lambda 体仅仅是调用一个已存在的方法时，可以使用方法引用。

### 4.1 方法引用的四种形式

```text
1. 类名::静态方法名          // 引用静态方法
2. 对象::实例方法名          // 引用对象的实例方法
3. 类名::实例方法名          // 引用类型的实例方法（第一个参数作为调用者）
4. 类名::new                // 引用构造方法
```

### 4.2 方法引用示例

```java
import java.util.*;
import java.util.function.*;

public class MethodReferenceDemo {
    public static void main(String[] args) {
        // 1. 类名::静态方法名
        // Lambda: (x) -> Math.abs(x)
        Function<Integer, Integer> abs = Math::abs;
        System.out.println(abs.apply(-5)); // 5

        // 2. 对象::实例方法名
        // Lambda: (s) -> s.toUpperCase()
        String str = "hello";
        Supplier<String> upper = str::toUpperCase;
        System.out.println(upper.get()); // HELLO

        // 3. 类名::实例方法名（第一个参数作为调用者）
        // Lambda: (s1, s2) -> s1.compareTo(s2)
        Comparator<String> comparator = String::compareTo;
        List<String> list = Arrays.asList("Banana", "Apple", "Orange");
        list.sort(comparator);
        System.out.println(list); // [Apple, Banana, Orange]

        // 4. 类名::new（构造方法引用）
        // Lambda: () -> new ArrayList<>()
        Supplier<List<String>> listSupplier = ArrayList::new;
        List<String> newList = listSupplier.get();

        // 带参数的构造方法引用
        Function<String, Integer> parseInt = Integer::new; // 等价于 s -> new Integer(s)
        // 注意：Java 9+ 已弃用 Integer(String)，这里仅做演示语法
    }
}
```

### 4.3 方法引用与 Lambda 的对比

| Lambda 写法 | 方法引用写法 | 说明 |
|------------|-------------|------|
| `s -> System.out.println(s)` | `System.out::println` | 对象实例方法 |
| `x -> Math.abs(x)` | `Math::abs` | 静态方法 |
| `(s1, s2) -> s1.compareTo(s2)` | `String::compareTo` | 类的实例方法 |
| `() -> new ArrayList<>()` | `ArrayList::new` | 构造方法 |

## 第五章 内置函数式接口详解

### 5.1 Predicate（断言）

`Predicate<T>` 接收一个参数，返回 `boolean`。

```java
import java.util.*;
import java.util.function.*;

public class PredicateDemo {
    public static void main(String[] args) {
        List<Integer> numbers = Arrays.asList(1, 2, 3, 4, 5, 6, 7, 8, 9, 10);

        // Predicate 基础用法
        Predicate<Integer> isEven = n -> n % 2 == 0;
        Predicate<Integer> isGreaterThan5 = n -> n > 5;

        // 组合 Predicate
        Predicate<Integer> isEvenAndGreaterThan5 = isEven.and(isGreaterThan5);
        Predicate<Integer> isEvenOrGreaterThan5 = isEven.or(isGreaterThan5);
        Predicate<Integer> isNotEven = isEven.negate();

        // 过滤
        numbers.stream()
               .filter(isEvenAndGreaterThan5)
               .forEach(n -> System.out.print(n + " "));
        System.out.println();

        // test 方法
        System.out.println("6 is even and > 5: " + isEvenAndGreaterThan5.test(6)); // true
        System.out.println("4 is even and > 5: " + isEvenAndGreaterThan5.test(4)); // false
    }
}
```

### 5.2 Consumer（消费者）

`Consumer<T>` 接收一个参数，无返回值。

```java
import java.util.*;
import java.util.function.*;

public class ConsumerDemo {
    public static void main(String[] args) {
        List<String> names = Arrays.asList("Alice", "Bob", "Charlie");

        // 基本用法
        Consumer<String> print = s -> System.out.println("Hello, " + s);
        names.forEach(print);

        // 组合 Consumer
        Consumer<String> printUpper = s -> System.out.println(s.toUpperCase());
        Consumer<String> printLength = s -> System.out.println("长度: " + s.length());

        Consumer<String> combined = printUpper.andThen(printLength);
        names.forEach(combined);

        // 简单示例
        List<Integer> numbers = new ArrayList<>();
        Consumer<Integer> addToList = numbers::add;
        addToList.accept(10);
        addToList.accept(20);
        System.out.println("添加后的列表: " + numbers); // [10, 20]
    }
}
```

### 5.3 Supplier（供应者）

`Supplier<T>` 无参数，返回一个值。

```java
import java.util.*;
import java.util.function.*;

public class SupplierDemo {
    public static void main(String[] args) {
        // 生成随机数
        Supplier<Double> random = Math::random;
        System.out.println("随机数: " + random.get());

        // 生成 UUID
        Supplier<String> uuid = () -> UUID.randomUUID().toString();
        System.out.println("UUID: " + uuid.get());

        // 生成新的列表
        Supplier<List<String>> listSupplier = ArrayList::new;
        List<String> list = listSupplier.get();
        list.add("A");
        list.add("B");
        System.out.println("列表: " + list);
    }
}
```

### 5.4 Function（函数）

`Function<T, R>` 接收一个参数，返回一个值。

```java
import java.util.*;
import java.util.function.*;

public class FunctionDemo {
    public static void main(String[] args) {
        // 基本用法
        Function<String, Integer> stringLength = String::length;
        System.out.println("长度: " + stringLength.apply("Hello World"));

        // 组合 Function（andThen）
        Function<Integer, Integer> square = x -> x * x;
        Function<Integer, Integer> addOne = x -> x + 1;

        // 先平方，再加1
        Function<Integer, Integer> squareThenAddOne = square.andThen(addOne);
        System.out.println("5² + 1 = " + squareThenAddOne.apply(5)); // 26

        // 先加1，再平方
        Function<Integer, Integer> addOneThenSquare = square.compose(addOne);
        System.out.println("(5+1)² = " + addOneThenSquare.apply(5)); // 36

        // identity：返回自身
        Function<String, String> identity = Function.identity();
        System.out.println(identity.apply("Hello")); // Hello
    }
}
```

### 5.5 UnaryOperator 与 BinaryOperator

`UnaryOperator<T>` 是 `Function<T, T>` 的特化，输入输出类型相同。

`BinaryOperator<T>` 是 `BiFunction<T, T, T>` 的特化，两个参数和返回值类型相同。

```java
import java.util.*;
import java.util.function.*;

public class OperatorDemo {
    public static void main(String[] args) {
        // UnaryOperator：一元运算
        UnaryOperator<Integer> square = x -> x * x;
        System.out.println("平方: " + square.apply(5)); // 25

        UnaryOperator<String> toUpper = String::toUpperCase;
        System.out.println(toUpper.apply("hello")); // HELLO

        // BinaryOperator：二元运算
        BinaryOperator<Integer> sum = Integer::sum;
        System.out.println("和: " + sum.apply(3, 5)); // 8

        BinaryOperator<Integer> max = BinaryOperator.maxBy(Integer::compareTo);
        System.out.println("最大值: " + max.apply(3, 5)); // 5

        BinaryOperator<Integer> min = BinaryOperator.minBy(Integer::compareTo);
        System.out.println("最小值: " + min.apply(3, 5)); // 3
    }
}
```

## 第六章 实战示例

### 6.1 集合排序

```java
import java.util.*;

public class LambdaSortDemo {
    public static void main(String[] args) {
        List<Person> people = Arrays.asList(
            new Person("Alice", 25),
            new Person("Bob", 30),
            new Person("Charlie", 22)
        );

        // 按年龄排序
        people.sort((p1, p2) -> p1.age - p2.age);
        System.out.println("按年龄排序: " + people);

        // 按姓名排序
        people.sort(Comparator.comparing(p -> p.name));
        System.out.println("按姓名排序: " + people);

        // 按姓名降序
        people.sort(Comparator.comparing(p -> p.name, String::compareTo).reversed());
        System.out.println("按姓名降序: " + people);

        // 组合排序：先按年龄，再按姓名
        people.sort(Comparator.comparingInt((Person p) -> p.age)
                              .thenComparing(p -> p.name));
        System.out.println("组合排序: " + people);
    }

    static class Person {
        String name;
        int age;

        Person(String name, int age) {
            this.name = name;
            this.age = age;
        }

        @Override
        public String toString() {
            return "Person{name='" + name + "', age=" + age + "}";
        }
    }
}
```

### 6.2 自定义函数式接口

```java
/**
 * 自定义函数式接口：计算器
 */
@FunctionalInterface
interface Calculator {
    double calculate(double a, double b);
}

public class CustomFunctionalInterfaceDemo {
    public static void main(String[] args) {
        // 使用 Lambda 实现不同运算
        Calculator add = (a, b) -> a + b;
        Calculator subtract = (a, b) -> a - b;
        Calculator multiply = (a, b) -> a * b;
        Calculator divide = (a, b) -> a / b;

        double x = 10, y = 3;

        System.out.println(x + " + " + y + " = " + add.calculate(x, y));
        System.out.println(x + " - " + y + " = " + subtract.calculate(x, y));
        System.out.println(x + " * " + y + " = " + multiply.calculate(x, y));
        System.out.println(x + " / " + y + " = " + divide.calculate(x, y));

        // 作为参数传递
        process(5, 3, (a, b) -> a * a + b * b);
    }

    public static void process(double a, double b, Calculator calc) {
        System.out.println("计算结果: " + calc.calculate(a, b));
    }
}
```

### 6.3 综合练习：数据处理

```java
import java.util.*;
import java.util.function.*;
import java.util.stream.*;

public class LambdaDataProcessing {
    public static void main(String[] args) {
        List<Employee> employees = Arrays.asList(
            new Employee("张三", 25, 8000, "IT"),
            new Employee("李四", 30, 12000, "IT"),
            new Employee("王五", 28, 9000, "市场"),
            new Employee("赵六", 35, 15000, "IT"),
            new Employee("孙七", 22, 6000, "市场"),
            new Employee("周八", 40, 18000, "财务")
        );

        // 1. 过滤 IT 部门
        Predicate<Employee> isIT = e -> "IT".equals(e.department);
        System.out.println("IT 部门:");
        employees.stream()
                .filter(isIT)
                .forEach(System.out::println);

        // 2. 计算 IT 部门平均工资
        double avgSalary = employees.stream()
                .filter(isIT)
                .mapToDouble(e -> e.salary)
                .average()
                .orElse(0);
        System.out.println("IT 部门平均工资: " + avgSalary);

        // 3. 按部门分组统计
        Map<String, Long> countByDept = employees.stream()
                .collect(Collectors.groupingBy(e -> e.department, Collectors.counting()));
        System.out.println("各部门人数: " + countByDept);

        // 4. 获取工资最高的员工
        Employee highest = employees.stream()
                .max(Comparator.comparing(e -> e.salary))
                .orElse(null);
        System.out.println("工资最高: " + highest);

        // 5. 按年龄排序
        System.out.println("按年龄排序:");
        employees.stream()
                .sorted(Comparator.comparing(e -> e.age))
                .forEach(System.out::println);
    }

    static class Employee {
        String name;
        int age;
        double salary;
        String department;

        Employee(String name, int age, double salary, String department) {
            this.name = name;
            this.age = age;
            this.salary = salary;
            this.department = department;
        }

        @Override
        public String toString() {
            return String.format("Employee{name='%s', age=%d, salary=%.0f, dept='%s'}",
                    name, age, salary, department);
        }
    }
}
```

## 总结

本文系统讲解了 Java 中的 Lambda 表达式：

| 知识点 | 核心要点 |
|--------|---------|
| **Lambda 表达式** | 匿名函数，行为参数化的核心 |
| **函数式接口** | 只有一个抽象方法的接口 |
| **@FunctionalInterface** | 标记函数式接口，编译检查 |
| **Predicate<T>** | 断言：T → boolean |
| **Consumer<T>** | 消费者：T → void |
| **Supplier<T>** | 供应者：() → T |
| **Function<T,R>** | 函数：T → R |
| **UnaryOperator<T>** | 一元运算：T → T |
| **BinaryOperator<T>** | 二元运算：(T,T) → T |
| **方法引用** | 类名::方法名、对象::方法名、类名::new |

## 练习与思考题

1. 使用 Lambda 表达式实现一个 `Comparator`，对字符串按长度排序。
2. 使用 `Predicate` 组合过滤出集合中既是偶数又大于 10 的元素。
3. 使用 `Function` 组合，将字符串先转大写再取长度。
4. 编写一个自定义函数式接口，实现两个字符串的拼接。
5. 使用方法引用简化 Lambda：`s -> System.out.println(s)`、`x -> Math.sqrt(x)`。
6. 列举 Java 8 中 `java.util.function` 包下的主要函数式接口及其用途。

## 参考资料

1. 《Java核心技术 卷I》（第11版），Cay S. Horstmann 著
2. [Oracle Java 教程 - Lambda 表达式](https://docs.oracle.com/javase/tutorial/java/javaOO/lambdaexpressions.html)
3. [Oracle Java 教程 - 方法引用](https://docs.oracle.com/javase/tutorial/java/javaOO/methodreferences.html)
4. [Java 函数式接口包文档](https://docs.oracle.com/javase/17/docs/api/java/util/function/package-summary.html)