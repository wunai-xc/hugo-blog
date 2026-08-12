+++
title = 'Stream API：函数式数据流处理'
date = 2026-08-12
draft = false
tags = ["Java", "编程语言", "Stream API", "函数式编程", "集合处理", "教程"]
categories = ["编程语言", "Java教程"]
summary = '本文是Java教程系列的第二十五篇，系统讲解Java 8引入的Stream API。文章涵盖Stream的概念与特点、Stream的创建方式、中间操作与终端操作、Collector收集器、并行流的使用，以及Stream在实际开发中的应用场景。'
author = "AI"
+++

## 引言

在上一篇文章中，我们学习了 Lambda 表达式，它让我们能够以函数式的方式编写代码。而 **Stream API** 则是 Lambda 表达式的最佳搭档，它提供了一种高效、声明式的方式来处理集合数据。

Stream API 允许开发者以 SQL 风格的查询方式操作集合，将复杂的集合操作（过滤、映射、排序、聚合等）通过链式调用组合在一起。它充分利用了 Lambda 表达式，使得代码更加简洁、可读、易于维护。

本文将系统讲解 Java 中 Stream API 的使用，从基础概念到高级操作，帮助读者掌握这一强大的数据处理工具。

## 第一章 Stream 概述

### 1.1 什么是 Stream

**Stream**（流）是 Java 8 引入的一个抽象概念，它代表一个支持顺序和并行聚合操作的元素序列。Stream 不是数据结构，它不存储数据，而是通过管道（Pipeline）操作数据源（集合、数组、I/O 资源等）。

**Stream 的核心特征**：

1. **不存储数据**：Stream 不是数据结构，它只是数据源的一个视图。
2. **函数式编程**：对 Stream 的操作会产生一个结果，但不会修改数据源。
3. **惰性求值**：中间操作（如 `filter`、`map`）是惰性的，只有在遇到终端操作时才会执行。
4. **可消费性**：Stream 只能被消费一次，一旦执行了终端操作，Stream 就关闭了。

### 1.2 集合与 Stream 的对比

| 对比维度 | 集合 | Stream |
|---------|------|--------|
| **存储** | 存储所有数据 | 不存储数据 |
| **遍历** | 可多次遍历 | 只能遍历一次 |
| **操作方式** | 外部迭代（for-each） | 内部迭代（链式调用） |
| **数据处理** | 命令式（怎么做） | 声明式（做什么） |
| **修改源数据** | 可以修改 | 不修改源数据 |

```java
// 传统集合操作（命令式）
List<String> names = Arrays.asList("Alice", "Bob", "Charlie", "David");
List<String> result = new ArrayList<>();
for (String name : names) {
    if (name.length() > 3) {
        result.add(name.toUpperCase());
    }
}
Collections.sort(result);
System.out.println(result); // [ALICE, CHARLIE, DAVID]

// Stream 操作（声明式）
List<String> names = Arrays.asList("Alice", "Bob", "Charlie", "David");
List<String> result = names.stream()
        .filter(name -> name.length() > 3)
        .map(String::toUpperCase)
        .sorted()
        .collect(Collectors.toList());
System.out.println(result); // [ALICE, CHARLIE, DAVID]
```

### 1.3 Stream 的操作分类

Stream 的操作分为两类：

1. **中间操作（Intermediate Operations）** ：返回一个新的 Stream，可以链式调用。惰性求值，只有在终端操作触发时才执行。

   - `filter()`、`map()`、`flatMap()`、`sorted()`、`distinct()`、`limit()`、`skip()` 等。

2. **终端操作（Terminal Operations）** ：触发 Stream 的执行，产生结果或副作用。一旦执行，Stream 就关闭了。

   - `forEach()`、`collect()`、`reduce()`、`count()`、`anyMatch()`、`allMatch()`、`findFirst()`、`toArray()` 等。

## 第二章 创建 Stream

### 2.1 从集合创建

```java
import java.util.*;
import java.util.stream.*;

public class CreateStreamDemo {
    public static void main(String[] args) {
        // 1. 从 List 创建
        List<String> list = Arrays.asList("A", "B", "C");
        Stream<String> stream1 = list.stream();

        // 2. 从 Set 创建
        Set<Integer> set = new HashSet<>(Arrays.asList(1, 2, 3));
        Stream<Integer> stream2 = set.stream();

        // 3. 从 Map 创建
        Map<String, Integer> map = new HashMap<>();
        map.put("A", 1);
        map.put("B", 2);

        Stream<String> keyStream = map.keySet().stream();
        Stream<Integer> valueStream = map.values().stream();
        Stream<Map.Entry<String, Integer>> entryStream = map.entrySet().stream();
    }
}
```

### 2.2 从数组创建

```java
public class ArrayStreamDemo {
    public static void main(String[] args) {
        // 1. 使用 Arrays.stream()
        String[] arr = {"A", "B", "C"};
        Stream<String> stream1 = Arrays.stream(arr);
        Stream<String> stream2 = Arrays.stream(arr, 1, 3); // 部分元素

        // 2. 使用 Stream.of()
        Stream<String> stream3 = Stream.of("A", "B", "C");
        Stream<Integer> stream4 = Stream.of(1, 2, 3, 4, 5);

        // 3. 基本类型数组转 Stream
        int[] intArr = {1, 2, 3, 4, 5};
        IntStream intStream = Arrays.stream(intArr);
        double[] doubleArr = {1.1, 2.2, 3.3};
        DoubleStream doubleStream = Arrays.stream(doubleArr);
    }
}
```

### 2.3 从值创建

```java
public class ValueStreamDemo {
    public static void main(String[] args) {
        // 1. Stream.of() 直接创建
        Stream<Integer> stream = Stream.of(1, 2, 3, 4, 5);

        // 2. 空 Stream
        Stream<Object> emptyStream = Stream.empty();

        // 3. 无限流（使用 limit 限制）
        // iterate：从0开始每次加1
        Stream<Integer> infinite1 = Stream.iterate(0, n -> n + 1);
        infinite1.limit(10).forEach(System.out::print); // 0123456789

        // generate：生成随机数
        Stream<Double> infinite2 = Stream.generate(Math::random);
        infinite2.limit(5).forEach(System.out::println);

        // 4. 基本类型流
        IntStream intStream = IntStream.range(1, 10);      // 1-9
        IntStream intStream2 = IntStream.rangeClosed(1, 10); // 1-10
        LongStream longStream = LongStream.range(1, 100);
        DoubleStream doubleStream = DoubleStream.of(1.1, 2.2, 3.3);
    }
}
```

## 第三章 中间操作

### 3.1 filter()：过滤

`filter()` 用于筛选满足条件的元素。

```java
import java.util.*;
import java.util.stream.*;

public class FilterDemo {
    public static void main(String[] args) {
        List<Integer> numbers = Arrays.asList(1, 2, 3, 4, 5, 6, 7, 8, 9, 10);

        // 过滤偶数
        List<Integer> evens = numbers.stream()
                .filter(n -> n % 2 == 0)
                .collect(Collectors.toList());
        System.out.println("偶数: " + evens); // [2, 4, 6, 8, 10]

        // 过滤大于5且为偶数
        List<Integer> result = numbers.stream()
                .filter(n -> n > 5)
                .filter(n -> n % 2 == 0)
                .collect(Collectors.toList());
        System.out.println("大于5的偶数: " + result); // [6, 8, 10]
    }
}
```

### 3.2 map()：映射

`map()` 用于将元素转换为另一种形式。

```java
public class MapDemo {
    public static void main(String[] args) {
        List<String> words = Arrays.asList("Hello", "World", "Java");

        // 转换为长度
        List<Integer> lengths = words.stream()
                .map(String::length)
                .collect(Collectors.toList());
        System.out.println("单词长度: " + lengths); // [5, 5, 4]

        // 转换为大写
        List<String> upper = words.stream()
                .map(String::toUpperCase)
                .collect(Collectors.toList());
        System.out.println("大写: " + upper); // [HELLO, WORLD, JAVA]

        // 基本类型转换
        List<String> numbers = Arrays.asList("1", "2", "3", "4", "5");
        int sum = numbers.stream()
                .mapToInt(Integer::parseInt)
                .sum();
        System.out.println("和: " + sum); // 15
    }
}
```

### 3.3 flatMap()：扁平映射

`flatMap()` 将每个元素转换为一个 Stream，然后将所有 Stream 合并为一个 Stream。

```java
public class FlatMapDemo {
    public static void main(String[] args) {
        // 示例1：将嵌套列表扁平化
        List<List<String>> nestedList = Arrays.asList(
                Arrays.asList("A", "B", "C"),
                Arrays.asList("D", "E"),
                Arrays.asList("F")
        );

        List<String> flatList = nestedList.stream()
                .flatMap(Collection::stream)
                .collect(Collectors.toList());
        System.out.println("扁平化: " + flatList); // [A, B, C, D, E, F]

        // 示例2：将字符串拆分为字符
        List<String> words = Arrays.asList("Hello", "World");
        List<String> chars = words.stream()
                .flatMap(word -> Arrays.stream(word.split("")))
                .distinct()
                .collect(Collectors.toList());
        System.out.println("字符: " + chars); // [H, e, l, o, W, r, d]

        // 示例3：处理对象嵌套
        class Student {
            String name;
            List<String> courses;

            Student(String name, List<String> courses) {
                this.name = name;
                this.courses = courses;
            }
        }

        List<Student> students = Arrays.asList(
                new Student("张三", Arrays.asList("数学", "语文")),
                new Student("李四", Arrays.asList("英语", "物理", "化学")),
                new Student("王五", Arrays.asList("生物", "数学"))
        );

        // 获取所有课程（去重）
        List<String> allCourses = students.stream()
                .flatMap(s -> s.courses.stream())
                .distinct()
                .collect(Collectors.toList());
        System.out.println("所有课程: " + allCourses);
        // [数学, 语文, 英语, 物理, 化学, 生物]
    }
}
```

### 3.4 sorted()：排序

```java
public class SortedDemo {
    public static void main(String[] args) {
        List<Integer> numbers = Arrays.asList(5, 2, 8, 1, 9, 3);

        // 自然排序
        List<Integer> sorted = numbers.stream()
                .sorted()
                .collect(Collectors.toList());
        System.out.println("升序: " + sorted); // [1, 2, 3, 5, 8, 9]

        // 降序排序
        List<Integer> reversed = numbers.stream()
                .sorted(Comparator.reverseOrder())
                .collect(Collectors.toList());
        System.out.println("降序: " + reversed); // [9, 8, 5, 3, 2, 1]

        // 自定义排序
        List<String> words = Arrays.asList("Banana", "Apple", "Grape", "Orange");
        List<String> sortedWords = words.stream()
                .sorted(Comparator.comparing(String::length))
                .collect(Collectors.toList());
        System.out.println("按长度排序: " + sortedWords); // [Apple, Grape, Banana, Orange]
    }
}
```

### 3.5 distinct()：去重

```java
public class DistinctDemo {
    public static void main(String[] args) {
        List<Integer> numbers = Arrays.asList(1, 2, 2, 3, 3, 3, 4, 4, 4, 4);

        // 去重
        List<Integer> distinct = numbers.stream()
                .distinct()
                .collect(Collectors.toList());
        System.out.println("去重后: " + distinct); // [1, 2, 3, 4]

        // 去重 + 排序
        List<String> words = Arrays.asList("B", "A", "C", "B", "A");
        List<String> result = words.stream()
                .distinct()
                .sorted()
                .collect(Collectors.toList());
        System.out.println("去重排序: " + result); // [A, B, C]
    }
}
```

### 3.6 limit() 和 skip()

`limit(n)` 限制元素个数，`skip(n)` 跳过前 n 个元素。

```java
public class LimitSkipDemo {
    public static void main(String[] args) {
        List<Integer> numbers = Arrays.asList(1, 2, 3, 4, 5, 6, 7, 8, 9, 10);

        // limit：取前5个
        List<Integer> first5 = numbers.stream()
                .limit(5)
                .collect(Collectors.toList());
        System.out.println("前5个: " + first5); // [1, 2, 3, 4, 5]

        // skip：跳过前5个
        List<Integer> after5 = numbers.stream()
                .skip(5)
                .collect(Collectors.toList());
        System.out.println("跳过5个: " + after5); // [6, 7, 8, 9, 10]

        // 分页：每页3个，获取第2页
        List<Integer> page2 = numbers.stream()
                .skip(3)  // 跳过第1页（3个）
                .limit(3) // 取第2页（3个）
                .collect(Collectors.toList());
        System.out.println("第2页: " + page2); // [4, 5, 6]
    }
}
```

### 3.7 peek()：调试

`peek()` 用于查看中间状态，常用于调试。

```java
public class PeekDemo {
    public static void main(String[] args) {
        List<Integer> numbers = Arrays.asList(1, 2, 3, 4, 5);

        // 使用 peek 查看每个阶段的中间结果
        List<Integer> result = numbers.stream()
                .peek(x -> System.out.println("原始: " + x))
                .filter(x -> x % 2 == 0)
                .peek(x -> System.out.println("过滤后: " + x))
                .map(x -> x * x)
                .peek(x -> System.out.println("平方后: " + x))
                .collect(Collectors.toList());

        System.out.println("最终结果: " + result);
    }
}
```

## 第四章 终端操作

### 4.1 forEach()：遍历

```java
public class ForEachDemo {
    public static void main(String[] args) {
        List<Integer> numbers = Arrays.asList(1, 2, 3, 4, 5);

        // 普通遍历
        numbers.stream().forEach(System.out::println);

        // 并行遍历
        numbers.parallelStream().forEachOrdered(System.out::println);

        // 按条件打印
        numbers.stream()
                .filter(n -> n % 2 == 0)
                .forEach(n -> System.out.println("偶数: " + n));
    }
}
```

### 4.2 collect()：收集

`collect()` 将 Stream 转换为集合或其他数据结构。

```java
import java.util.*;
import java.util.stream.*;

public class CollectDemo {
    public static void main(String[] args) {
        List<String> names = Arrays.asList("Alice", "Bob", "Charlie", "David", "Alice");

        // 1. 转 List
        List<String> list = names.stream()
                .distinct()
                .collect(Collectors.toList());
        System.out.println("List: " + list);

        // 2. 转 Set
        Set<String> set = names.stream()
                .collect(Collectors.toSet());
        System.out.println("Set: " + set);

        // 3. 转特定集合
        TreeSet<String> treeSet = names.stream()
                .collect(Collectors.toCollection(TreeSet::new));
        System.out.println("TreeSet: " + treeSet);

        // 4. 分组（Collectors.groupingBy）
        Map<Integer, List<String>> byLength = names.stream()
                .collect(Collectors.groupingBy(String::length));
        System.out.println("按长度分组: " + byLength);
        // {3=[Bob], 4=[David], 5=[Alice, Charlie]}

        // 5. 分组计数
        Map<String, Long> countByName = names.stream()
                .collect(Collectors.groupingBy(
                        Function.identity(),
                        Collectors.counting()
                ));
        System.out.println("名称计数: " + countByName);
        // {Alice=2, Charlie=1, David=1, Bob=1}

        // 6. 拼接字符串
        String joined = names.stream()
                .distinct()
                .collect(Collectors.joining(", "));
        System.out.println("拼接: " + joined); // Alice, Bob, Charlie, David

        // 7. 汇总统计
        IntSummaryStatistics stats = names.stream()
                .collect(Collectors.summarizingInt(String::length));
        System.out.println("汇总: " + stats);
    }
}
```

### 4.3 reduce()：归约

`reduce()` 将 Stream 中的元素通过某种操作合并为一个值。

```java
public class ReduceDemo {
    public static void main(String[] args) {
        List<Integer> numbers = Arrays.asList(1, 2, 3, 4, 5);

        // 1. 求和（带初始值）
        int sum = numbers.stream()
                .reduce(0, Integer::sum);
        System.out.println("和: " + sum); // 15

        // 2. 求和（不带初始值，返回 Optional）
        Optional<Integer> sumOpt = numbers.stream()
                .reduce(Integer::sum);
        sumOpt.ifPresent(s -> System.out.println("和(Opt): " + s)); // 15

        // 3. 求乘积
        int product = numbers.stream()
                .reduce(1, (a, b) -> a * b);
        System.out.println("乘积: " + product); // 120

        // 4. 求最大值
        Optional<Integer> max = numbers.stream()
                .reduce(Integer::max);
        max.ifPresent(m -> System.out.println("最大值: " + m)); // 5

        // 5. 字符串拼接
        List<String> words = Arrays.asList("Hello", "World", "Java");
        String result = words.stream()
                .reduce("", (a, b) -> a + " " + b);
        System.out.println("拼接: " + result); //  Hello World Java
    }
}
```

### 4.4 匹配与查找

```java
public class MatchFindDemo {
    public static void main(String[] args) {
        List<Integer> numbers = Arrays.asList(1, 2, 3, 4, 5, 6);

        // anyMatch：任何一个匹配
        boolean anyEven = numbers.stream().anyMatch(n -> n % 2 == 0);
        System.out.println("有偶数: " + anyEven); // true

        // allMatch：全部匹配
        boolean allEven = numbers.stream().allMatch(n -> n % 2 == 0);
        System.out.println("全部是偶数: " + allEven); // false

        // noneMatch：全部不匹配
        boolean noneGreaterThan10 = numbers.stream().noneMatch(n -> n > 10);
        System.out.println("没有大于10的: " + noneGreaterThan10); // true

        // findFirst：返回第一个元素
        Optional<Integer> first = numbers.stream().findFirst();
        first.ifPresent(f -> System.out.println("第一个: " + f)); // 1

        // findAny：返回任意一个（并行流中效率更高）
        Optional<Integer> any = numbers.parallelStream().findAny();
        any.ifPresent(a -> System.out.println("任意一个: " + a));

        // count：计数
        long count = numbers.stream().filter(n -> n % 2 == 0).count();
        System.out.println("偶数个数: " + count); // 3
    }
}
```

### 4.5 toArray()：转为数组

```java
public class ToArrayDemo {
    public static void main(String[] args) {
        List<Integer> numbers = Arrays.asList(1, 2, 3, 4, 5);

        // 转为 Object 数组
        Object[] array1 = numbers.stream().toArray();

        // 转为指定类型数组
        Integer[] array2 = numbers.stream().toArray(Integer[]::new);

        // 过滤后转数组
        Integer[] array3 = numbers.stream()
                .filter(n -> n % 2 == 0)
                .toArray(Integer[]::new);
        System.out.println("偶数数组: " + Arrays.toString(array3)); // [2, 4]
    }
}
```

## 第五章 高级收集器

### 5.1 groupingBy() 分组

```java
import java.util.*;
import java.util.stream.*;

public class GroupingByDemo {
    static class Person {
        String name;
        int age;
        String city;

        Person(String name, int age, String city) {
            this.name = name;
            this.age = age;
            this.city = city;
        }

        @Override
        public String toString() {
            return name + "(" + age + ")";
        }
    }

    public static void main(String[] args) {
        List<Person> people = Arrays.asList(
            new Person("张三", 25, "北京"),
            new Person("李四", 30, "上海"),
            new Person("王五", 25, "北京"),
            new Person("赵六", 30, "广州"),
            new Person("孙七", 25, "上海")
        );

        // 1. 按城市分组
        Map<String, List<Person>> byCity = people.stream()
                .collect(Collectors.groupingBy(p -> p.city));
        byCity.forEach((city, persons) -> {
            System.out.println(city + ": " + persons);
        });

        // 2. 按城市分组，并统计人数
        Map<String, Long> countByCity = people.stream()
                .collect(Collectors.groupingBy(p -> p.city, Collectors.counting()));
        System.out.println("城市人数: " + countByCity);

        // 3. 按城市分组，求平均年龄
        Map<String, Double> avgAgeByCity = people.stream()
                .collect(Collectors.groupingBy(p -> p.city, Collectors.averagingInt(p -> p.age)));
        System.out.println("城市平均年龄: " + avgAgeByCity);

        // 4. 多级分组：先按城市，再按年龄
        Map<String, Map<Integer, List<Person>>> multiGroup = people.stream()
                .collect(Collectors.groupingBy(p -> p.city, Collectors.groupingBy(p -> p.age)));
        System.out.println("多级分组: " + multiGroup);
    }
}
```

### 5.2 partitioningBy() 分区

`partitioningBy` 根据条件分为 true 和 false 两组。

```java
public class PartitioningByDemo {
    public static void main(String[] args) {
        List<Integer> numbers = Arrays.asList(1, 2, 3, 4, 5, 6, 7, 8, 9, 10);

        // 分区为奇数和偶数
        Map<Boolean, List<Integer>> partition = numbers.stream()
                .collect(Collectors.partitioningBy(n -> n % 2 == 0));
        System.out.println("偶数: " + partition.get(true));  // [2, 4, 6, 8, 10]
        System.out.println("奇数: " + partition.get(false)); // [1, 3, 5, 7, 9]

        // 分区并统计
        Map<Boolean, Long> countPartition = numbers.stream()
                .collect(Collectors.partitioningBy(n -> n % 2 == 0, Collectors.counting()));
        System.out.println("偶数个数: " + countPartition.get(true));   // 5
        System.out.println("奇数个数: " + countPartition.get(false));  // 5
    }
}
```

### 5.3 toMap() 转 Map

```java
public class ToMapDemo {
    static class Person {
        String id;
        String name;

        Person(String id, String name) {
            this.id = id;
            this.name = name;
        }
    }

    public static void main(String[] args) {
        List<Person> people = Arrays.asList(
            new Person("P001", "张三"),
            new Person("P002", "李四"),
            new Person("P003", "王五")
        );

        // 转 Map（id -> name）
        Map<String, String> idToName = people.stream()
                .collect(Collectors.toMap(p -> p.id, p -> p.name));
        System.out.println("id->name: " + idToName);

        // 转 Map（id -> Person 对象）
        Map<String, Person> idToPerson = people.stream()
                .collect(Collectors.toMap(p -> p.id, Function.identity()));
        System.out.println("id->person: " + idToPerson);
    }
}
```

## 第六章 并行流

### 6.1 创建并行流

```java
public class ParallelStreamDemo {
    public static void main(String[] args) {
        // 1. 从集合创建并行流
        List<Integer> list = Arrays.asList(1, 2, 3, 4, 5, 6, 7, 8, 9, 10);
        list.parallelStream().forEach(System.out::println);

        // 2. 从串行流转并行
        list.stream().parallel().forEach(System.out::println);

        // 3. 并行流转串行
        list.parallelStream().sequential().forEach(System.out::println);
    }
}
```

### 6.2 并行流性能测试

```java
import java.util.*;
import java.util.stream.*;

public class ParallelPerformanceDemo {
    public static void main(String[] args) {
        // 生成大量数据
        List<Integer> numbers = IntStream.rangeClosed(1, 10_000_000)
                .boxed()
                .collect(Collectors.toList());

        // 串行流
        long start = System.currentTimeMillis();
        long sum1 = numbers.stream()
                .mapToLong(i -> i * i)
                .sum();
        long end = System.currentTimeMillis();
        System.out.println("串行流耗时: " + (end - start) + "ms");

        // 并行流
        start = System.currentTimeMillis();
        long sum2 = numbers.parallelStream()
                .mapToLong(i -> i * i)
                .sum();
        end = System.currentTimeMillis();
        System.out.println("并行流耗时: " + (end - start) + "ms");
    }
}
```

### 6.3 并行流的注意事项

```java
public class ParallelStreamCaution {
    public static void main(String[] args) {
        // 1. 线程安全问题
        // 错误示例：非线程安全的集合
        List<Integer> result = new ArrayList<>();
        IntStream.range(1, 1000)
                .parallel()
                .forEach(result::add); // 可能造成数据丢失或异常

        // 正确方式：使用线程安全的集合
        List<Integer> safeResult = Collections.synchronizedList(new ArrayList<>());
        IntStream.range(1, 1000)
                .parallel()
                .forEach(safeResult::add);

        // 更好方式：使用 collect
        List<Integer> betterResult = IntStream.range(1, 1000)
                .parallel()
                .boxed()
                .collect(Collectors.toList());

        // 2. 使用并行流的条件：
        // - 数据量足够大（通常 > 10000 元素）
        // - 操作是 CPU 密集型的
        // - 操作是无状态的、无副作用的

        // 3. 避免在并行流中使用 synchronized
        // 并行流本身就是为了提高性能，使用 synchronized 会抵消并行优势
    }
}
```

## 第七章 综合示例

```java
import java.util.*;
import java.util.stream.*;

/**
 * 员工数据分析系统 - 综合运用 Stream API
 */
public class EmployeeAnalysis {
    static class Employee {
        String name;
        String department;
        int age;
        double salary;
        String gender;
        LocalDate joinDate;

        Employee(String name, String department, int age, double salary, String gender, String joinDate) {
            this.name = name;
            this.department = department;
            this.age = age;
            this.salary = salary;
            this.gender = gender;
            this.joinDate = LocalDate.parse(joinDate);
        }

        @Override
        public String toString() {
            return String.format("%s(%s,%d,%.0f)", name, department, age, salary);
        }
    }

    public static void main(String[] args) {
        List<Employee> employees = Arrays.asList(
            new Employee("张三", "IT", 25, 8000, "男", "2020-01-15"),
            new Employee("李四", "IT", 30, 12000, "男", "2018-06-01"),
            new Employee("王五", "市场", 28, 9000, "女", "2019-03-10"),
            new Employee("赵六", "IT", 35, 15000, "女", "2015-08-20"),
            new Employee("孙七", "市场", 22, 6000, "男", "2021-11-01"),
            new Employee("周八", "财务", 40, 18000, "男", "2010-02-01"),
            new Employee("吴九", "市场", 26, 8500, "女", "2021-04-15"),
            new Employee("郑十", "IT", 32, 11000, "男", "2017-09-01")
        );

        System.out.println("=== 员工分析系统 ===\n");

        // 1. 部门统计
        System.out.println("--- 各部门人数 ---");
        Map<String, Long> deptCount = employees.stream()
                .collect(Collectors.groupingBy(e -> e.department, Collectors.counting()));
        deptCount.forEach((dept, count) -> System.out.println(dept + ": " + count));

        // 2. 平均工资
        System.out.println("\n--- 各部门平均工资 ---");
        Map<String, Double> avgSalary = employees.stream()
                .collect(Collectors.groupingBy(e -> e.department, 
                        Collectors.averagingDouble(e -> e.salary)));
        avgSalary.forEach((dept, avg) -> System.out.printf("%s: %.2f\n", dept, avg));

        // 3. 工资分析
        System.out.println("\n--- 工资统计 ---");
        DoubleSummaryStatistics salaryStats = employees.stream()
                .mapToDouble(e -> e.salary)
                .summaryStatistics();
        System.out.printf("最高: %.0f, 最低: %.0f, 平均: %.2f\n",
                salaryStats.getMax(), salaryStats.getMin(), salaryStats.getAverage());

        // 4. 年龄分析
        System.out.println("\n--- 年龄分析 ---");
        IntSummaryStatistics ageStats = employees.stream()
                .mapToInt(e -> e.age)
                .summaryStatistics();
        System.out.println("平均年龄: " + ageStats.getAverage());

        // 5. 薪资排名（前3名）
        System.out.println("\n--- 薪资Top3 ---");
        employees.stream()
                .sorted(Comparator.comparing(e -> -e.salary))
                .limit(3)
                .forEach(System.out::println);

        // 6. 性别统计
        System.out.println("\n--- 性别统计 ---");
        Map<String, Long> genderCount = employees.stream()
                .collect(Collectors.groupingBy(e -> e.gender, Collectors.counting()));
        genderCount.forEach((gender, count) -> System.out.println(gender + ": " + count));

        // 7. 按部门分组统计年龄和薪资
        System.out.println("\n--- 按部门统计 ---");
        Map<String, Map<String, Double>> deptStats = employees.stream()
                .collect(Collectors.groupingBy(e -> e.department,
                        Collectors.teeing(
                                Collectors.averagingInt(e -> e.age),
                                Collectors.averagingDouble(e -> e.salary),
                                (avgAge, avgSal) -> Map.of("avgAge", avgAge, "avgSal", avgSal)
                        )));
        deptStats.forEach((dept, stats) -> {
            System.out.printf("%s: 平均年龄=%.1f, 平均薪资=%.0f\n",
                    dept, stats.get("avgAge"), stats.get("avgSal"));
        });

        // 8. 薪资超过10000的员工
        System.out.println("\n--- 高薪员工（>10000） ---");
        employees.stream()
                .filter(e -> e.salary > 10000)
                .sorted(Comparator.comparing(e -> -e.salary))
                .forEach(System.out::println);

        // 9. 工龄分析
        System.out.println("\n--- 工龄分析 ---");
        LocalDate now = LocalDate.now();
        employees.stream()
                .map(e -> {
                    long years = ChronoUnit.YEARS.between(e.joinDate, now);
                    return new AbstractMap.SimpleEntry<>(e.name, years);
                })
                .sorted(Map.Entry.comparingByValue(Comparator.reverseOrder()))
                .forEach(entry -> System.out.println(entry.getKey() + ": " + entry.getValue() + "年"));

        // 10. 汇总报告
        System.out.println("\n--- 汇总报告 ---");
        String report = employees.stream()
                .collect(Collectors.collectingAndThen(
                        Collectors.groupingBy(e -> e.department,
                                Collectors.summarizingDouble(e -> e.salary)),
                        map -> {
                            StringJoiner sj = new StringJoiner("\n");
                            map.forEach((dept, stats) -> 
                                sj.add(dept + ": 人数=" + stats.getCount() + 
                                      ", 总薪资=" + stats.getSum() +
                                      ", 平均=" + String.format("%.2f", stats.getAverage()))
                            );
                            return sj.toString();
                        }
                ));
        System.out.println(report);
    }
}
```

## 总结

本文系统讲解了 Java Stream API 的使用：

| 知识点 | 核心要点 |
|--------|---------|
| **Stream** | 数据流，声明式处理集合 |
| **创建 Stream** | 从集合、数组、值、无限流创建 |
| **filter** | 过滤元素 |
| **map** | 转换元素 |
| **flatMap** | 扁平化映射 |
| **sorted** | 排序 |
| **distinct** | 去重 |
| **limit/skip** | 截取和跳过 |
| **forEach** | 遍历 |
| **collect** | 收集为集合 |
| **reduce** | 归约合并 |
| **matching** | anyMatch/allMatch/noneMatch |
| **groupingBy** | 分组 |
| **partitioningBy** | 分区 |
| **并行流** | 多线程并行处理 |

## 练习与思考题

1. 使用 Stream 实现：将一个整数列表中的偶数平方后求和。
2. 使用 `groupingBy` 按字符串长度分组，统计每组有多少个元素。
3. 使用 `flatMap` 将多个列表合并为一个列表。
4. 实现一个方法，使用 Stream 查找集合中的最大值和最小值。
5. 使用 `Collectors.joining` 将字符串列表按指定分隔符合并。
6. 比较串行流和并行流在数据量不同时的性能差异。

## 参考资料

1. 《Java核心技术 卷II》（第11版），Cay S. Horstmann 著
2. [Oracle Java 教程 - 聚合操作](https://docs.oracle.com/javase/tutorial/collections/streams/index.html)
3. [Stream API 文档](https://docs.oracle.com/javase/17/docs/api/java/util/stream/package-summary.html)
4. [Collectors API 文档](https://docs.oracle.com/javase/17/docs/api/java/util/stream/Collectors.html)