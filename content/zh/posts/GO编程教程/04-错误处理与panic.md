+++
title = 'Go 编程教程：第四章 错误处理与 panic'
date = 2026-08-13
draft = false
tags = ["Go", "基础", "错误处理", "panic"]
categories = ["教程"]
summary = '掌握 Go 的错误处理哲学、error 接口、自定义错误、error wrapping，以及 panic/recover 机制的正确用法。'
author = "AI"
showToc = true
+++

## 引言

错误处理是现代编程的核心。不同于 Java 的异常机制，Go 采用了**显式错误返回**的哲学——即函数返回错误而不是抛出异常。

这个设计看似冗长，实际上让代码流程更清晰、更易维护。本章将详细讲解 Go 的 error 接口、错误处理最佳实践、自定义错误类型，以及何时（和如何）使用 panic 和 recover。

**学完本章，你将能够：**
- 理解 Go 的错误处理哲学
- 创建和使用 error 接口
- 进行错误链式包装（error wrapping）
- 自定义错误类型
- 正确使用 panic 和 recover
- 编写生产级别的错误处理代码

---

## 一、错误基础

### 1.1 error 接口

在 Go 中，`error` 是一个内置接口，只有一个方法：

```go
type error interface {
	Error() string
}
```

任何实现了 `Error()` 方法的类型都可以作为错误值。标准库中最常见的是 `errors.New()` 创建的简单错误：

```go
package main

import (
	"errors"
	"fmt"
)

func divide(a, b int) (int, error) {
	if b == 0 {
		return 0, errors.New("分母不能为零")
	}
	return a / b, nil
}

func main() {
	result, err := divide(10, 2)
	if err != nil {
		fmt.Println("错误:", err)
	} else {
		fmt.Println("结果:", result)  // 结果: 5
	}
	
	result, err = divide(10, 0)
	if err != nil {
		fmt.Println("错误:", err)  // 错误: 分母不能为零
	}
}
```

**关键点**：
- 按惯例，多返回值函数把 error 放在**最后一个**返回值
- 没有错误时，返回 `nil`（nil 可以代表任何接口类型的"无值"）
- 调用方必须显式检查 error，否则会忽略错误

### 1.2 fmt.Errorf 格式化错误

`fmt.Errorf()` 允许使用格式化字符串创建错误，更灵活：

```go
package main

import (
	"fmt"
	"strconv"
)

func parseAge(s string) (int, error) {
	age, err := strconv.Atoi(s)
	if err != nil {
		// 返回格式化错误
		return 0, fmt.Errorf("年龄转换失败: %v", err)
	}
	
	if age < 0 {
		return 0, fmt.Errorf("年龄不能为负数，收到: %d", age)
	}
	
	if age > 150 {
		return 0, fmt.Errorf("年龄超出合理范围: %d", age)
	}
	
	return age, nil
}

func main() {
	age, err := parseAge("abc")
	if err != nil {
		fmt.Println(err)  // 年龄转换失败: strconv.Atoi: parsing "abc": invalid syntax
	}
	
	age, err = parseAge("200")
	if err != nil {
		fmt.Println(err)  // 年龄超出合理范围: 200
	}
}
```

### 1.3 错误检查模式

Go 代码中经常看到这样的模式：

```go
package main

import (
	"fmt"
	"os"
)

func readFile(filename string) (string, error) {
	// 第一步：打开文件
	file, err := os.Open(filename)
	if err != nil {
		return "", fmt.Errorf("打开文件失败: %w", err)
	}
	defer file.Close()
	
	// 第二步：读取文件内容
	data := make([]byte, 1024)
	n, err := file.Read(data)
	if err != nil {
		return "", fmt.Errorf("读取文件失败: %w", err)
	}
	
	return string(data[:n]), nil
}

func main() {
	content, err := readFile("test.txt")
	if err != nil {
		fmt.Println("处理错误:", err)
		return
	}
	fmt.Println("文件内容:", content)
}
```

这种**尽早返回**（early return）的模式让正常逻辑一目了然。

---

## 二、自定义错误类型

### 2.1 简单的自定义错误结构体

你可以创建实现 `error` 接口的自定义类型，以便传递更多信息：

```go
package main

import "fmt"

// 自定义错误类型
type ValidationError struct {
	Field   string
	Message string
}

// 实现 error 接口
func (e *ValidationError) Error() string {
	return fmt.Sprintf("验证错误 [%s]: %s", e.Field, e.Message)
}

func validateEmail(email string) error {
	if email == "" {
		return &ValidationError{
			Field:   "email",
			Message: "邮箱不能为空",
		}
	}
	if len(email) < 5 {
		return &ValidationError{
			Field:   "email",
			Message: "邮箱长度不足 5 个字符",
		}
	}
	return nil
}

func main() {
	err := validateEmail("")
	if err != nil {
		fmt.Println(err)  // 验证错误 [email]: 邮箱不能为空
		
		// 可以类型断言获取具体字段
		if ve, ok := err.(*ValidationError); ok {
			fmt.Printf("字段: %s, 消息: %s\n", ve.Field, ve.Message)
		}
	}
}
```

**类型断言**是访问自定义错误信息的关键技巧。

### 2.2 带有状态的错误类型

```go
package main

import "fmt"

// 带有状态的错误
type HTTPError struct {
	StatusCode int
	Message    string
	URL        string
}

func (e *HTTPError) Error() string {
	return fmt.Sprintf("HTTP %d: %s (URL: %s)", e.StatusCode, e.Message, e.URL)
}

func fetchURL(url string) error {
	// 模拟请求失败
	return &HTTPError{
		StatusCode: 404,
		Message:    "Not Found",
		URL:        url,
	}
}

func main() {
	err := fetchURL("https://example.com/api/users")
	if err != nil {
		fmt.Println(err)  // HTTP 404: Not Found (URL: https://example.com/api/users)
		
		// 可以根据状态码做不同处理
		if httpErr, ok := err.(*HTTPError); ok {
			switch httpErr.StatusCode {
			case 404:
				fmt.Println("资源不存在")
			case 500:
				fmt.Println("服务器错误，请稍后重试")
			}
		}
	}
}
```

---

## 三、错误链式包装（Error Wrapping）

### 3.1 %w 格式与 errors.Unwrap

Go 1.13+ 引入了 error wrapping 机制，允许保留原始错误信息：

```go
package main

import (
	"errors"
	"fmt"
	"os"
)

func processFile(filename string) error {
	file, err := os.Open(filename)
	if err != nil {
		// 使用 %w 包装原始错误
		return fmt.Errorf("打开文件失败: %w", err)
	}
	defer file.Close()
	return nil
}

func main() {
	err := processFile("missing.txt")
	if err != nil {
		fmt.Println("最外层错误:", err)
		// 最外层错误: 打开文件失败: open missing.txt: no such file or directory
		
		// 解包获取原始错误
		unwrappedErr := errors.Unwrap(err)
		fmt.Println("原始错误:", unwrappedErr)
		// 原始错误: open missing.txt: no such file or directory
	}
}
```

### 3.2 errors.Is 判断错误类型

在错误链中查找特定错误：

```go
package main

import (
	"errors"
	"fmt"
	"os"
)

func readConfig() error {
	// 模拟文件不存在
	_, err := os.Open("config.yaml")
	if err != nil {
		return fmt.Errorf("加载配置失败: %w", err)
	}
	return nil
}

func main() {
	err := readConfig()
	if err != nil {
		// 判断链中是否包含 os.ErrNotExist
		if errors.Is(err, os.ErrNotExist) {
			fmt.Println("配置文件不存在，使用默认配置")
		} else {
			fmt.Println("其他错误:", err)
		}
	}
}
```

### 3.3 errors.As 类型断言

在错误链中查找特定类型的错误：

```go
package main

import (
	"errors"
	"fmt"
	"os"
)

func copyFile(src, dst string) error {
	source, err := os.Open(src)
	if err != nil {
		return fmt.Errorf("打开源文件失败: %w", err)
	}
	defer source.Close()
	return nil
}

func main() {
	err := copyFile("missing.txt", "output.txt")
	if err != nil {
		// 判断链中是否包含 *os.PathError 类型
		var pathErr *os.PathError
		if errors.As(err, &pathErr) {
			fmt.Printf("路径错误: Op=%s, Path=%s\n", pathErr.Op, pathErr.Path)
			// 输出：路径错误: Op=open, Path=missing.txt
		}
	}
}
```

---

## 四、Panic 和 Recover

### 4.1 何时使用 Panic

`panic` 应该**仅在不可恢复的情况**下使用，例如：
- 程序启动时关键依赖初始化失败
- 调用方违反了函数的契约（如传递 nil）
- 编程错误（如数组越界）

**不应该**用 panic 处理普通的业务错误。那应该用 error 返回值。

### 4.2 Panic 导致程序崩溃

```go
package main

import "fmt"

func main() {
	fmt.Println("程序开始")
	
	panic("这是一个严重错误")
	
	fmt.Println("这行代码不会执行")
}
// 输出：
// 程序开始
// panic: 这是一个严重错误
// 
// goroutine 1 [running]:
// main.main()
//     /path/to/main.go:9 +0x5c
```

不捕获 panic，程序会直接终止。

### 4.3 使用 defer + Recover 捕获 Panic

`recover()` 函数可以在 defer 中捕获 panic，让程序继续运行：

```go
package main

import "fmt"

func safeDivide(a, b int) int {
	defer func() {
		if r := recover(); r != nil {
			fmt.Println("捕获到 panic:", r)
		}
	}()
	
	if b == 0 {
		panic("分母不能为零")
	}
	
	return a / b
}

func main() {
	result := safeDivide(10, 0)
	fmt.Println("结果:", result)  // 输出不会打印
	fmt.Println("程序继续运行")   // ✅ 这行会执行
}
// 输出：
// 捕获到 panic: 分母不能为零
// 程序继续运行
```

**关键点**：
- `recover()` 只能在 `defer` 函数内调用
- 它返回传给 `panic` 的值，如果没有 panic 则返回 nil
- recover 后，程序会从 defer 函数返回后的位置继续执行

### 4.4 Panic 与错误的区别

```go
package main

import "fmt"

// ❌ 错误的做法：用 panic 处理业务逻辑错误
func badValidate(age int) {
	if age < 0 {
		panic("年龄不能为负数")  // ❌ 不应该 panic
	}
	fmt.Println("年龄有效:", age)
}

// ✅ 正确的做法：返回 error
func goodValidate(age int) error {
	if age < 0 {
		return fmt.Errorf("年龄不能为负数")  // ✅ 使用 error
	}
	fmt.Println("年龄有效:", age)
	return nil
}

func main() {
	// badValidate(-5)  // ❌ 会导致程序崩溃
	
	err := goodValidate(-5)
	if err != nil {
		fmt.Println("错误:", err)  // ✅ 正常处理
	}
}
```

### 4.5 Recover 的常见模式

在处理 goroutine 时经常使用 recover 防止单个 goroutine 的 panic 导致整个程序崩溃：

```go
package main

import (
	"fmt"
	"sync"
)

func worker(id int, wg *sync.WaitGroup) {
	defer wg.Done()
	
	// 保护 goroutine
	defer func() {
		if r := recover(); r != nil {
			fmt.Printf("Worker %d 崩溃: %v\n", id, r)
		}
	}()
	
	if id == 2 {
		panic("Worker 2 出错了")
	}
	
	fmt.Printf("Worker %d 完成\n", id)
}

func main() {
	var wg sync.WaitGroup
	
	for i := 1; i <= 3; i++ {
		wg.Add(1)
		go worker(i, &wg)
	}
	
	wg.Wait()
	fmt.Println("所有 worker 完成或崩溃")
}
// 输出：
// Worker 1 完成
// Worker 3 完成
// Worker 2 崩溃: Worker 2 出错了
// 所有 worker 完成或崩溃
```

---

## 五、实践示例

### 5.1 数据库连接错误处理

```go
package main

import (
	"errors"
	"fmt"
)

// 自定义数据库错误
type DatabaseError struct {
	Code    int
	Message string
	Query   string
}

func (e *DatabaseError) Error() string {
	return fmt.Sprintf("数据库错误 [%d]: %s (Query: %s)", e.Code, e.Message, e.Query)
}

// 模拟数据库查询
func queryUser(id int) (string, error) {
	if id <= 0 {
		return "", fmt.Errorf("无效的用户 ID: %d", id)
	}
	
	if id > 1000 {
		return "", &DatabaseError{
			Code:    404,
			Message: "用户不存在",
			Query:   fmt.Sprintf("SELECT * FROM users WHERE id = %d", id),
		}
	}
	
	return fmt.Sprintf("User_%d", id), nil
}

// 获取用户信息（可能有多个错误来源）
func getUserInfo(id int) (string, error) {
	user, err := queryUser(id)
	if err != nil {
		return "", fmt.Errorf("获取用户信息失败: %w", err)
	}
	return user, nil
}

func main() {
	// 测试 1：无效 ID
	user, err := getUserInfo(-1)
	if err != nil {
		fmt.Println("错误:", err)
	}
	
	// 测试 2：用户不存在
	user, err = getUserInfo(5000)
	if err != nil {
		fmt.Println("错误:", err)
		
		// 检查是否是数据库错误
		var dbErr *DatabaseError
		if errors.As(err, &dbErr) {
			fmt.Printf("数据库错误代码: %d\n", dbErr.Code)
		}
	}
	
	// 测试 3：成功
	user, err = getUserInfo(123)
	if err != nil {
		fmt.Println("错误:", err)
	} else {
		fmt.Println("用户:", user)
	}
}
```

### 5.2 配置初始化错误处理

```go
package main

import (
	"fmt"
	"os"
)

// 启动时发现关键配置缺失，使用 panic 是合理的
func initConfig() {
	dbHost := os.Getenv("DB_HOST")
	if dbHost == "" {
		panic("环境变量 DB_HOST 未设置，无法启动应用")
	}
	
	dbPort := os.Getenv("DB_PORT")
	if dbPort == "" {
		panic("环境变量 DB_PORT 未设置，无法启动应用")
	}
	
	fmt.Printf("数据库配置: %s:%s\n", dbHost, dbPort)
}

func main() {
	// 模拟设置环境变量
	os.Setenv("DB_HOST", "localhost")
	os.Setenv("DB_PORT", "5432")
	
	initConfig()
	fmt.Println("应用启动成功")
}
```

---

## 六、错误处理最佳实践

### 6.1 不要忽视错误

```go
// ❌ 错误：忽略返回值
file, _ := os.Open("data.txt")
defer file.Close()  // nil panic！

// ✅ 正确：检查错误
file, err := os.Open("data.txt")
if err != nil {
	fmt.Println("打开文件失败:", err)
	return
}
defer file.Close()
```

### 6.2 错误消息要有上下文

```go
// ❌ 不好：消息不清晰
return fmt.Errorf("错误")

// ✅ 好：提供有用的上下文
return fmt.Errorf("更新用户 ID %d 失败: %w", userID, err)
```

### 6.3 使用错误链式包装

```go
// ❌ 不好：错误信息丢失
if err != nil {
	return fmt.Errorf("某个操作失败")
}

// ✅ 好：保留原始错误
if err != nil {
	return fmt.Errorf("某个操作失败: %w", err)
}
```

### 6.4 区分错误类型

```go
// ✅ 根据错误类型采取不同行动
if errors.Is(err, os.ErrNotExist) {
	// 文件不存在，创建新文件
} else if errors.Is(err, os.ErrPermission) {
	// 权限不足，报告给管理员
} else {
	// 其他错误，记录日志
}
```

---

## 七、常见坑点

| 坑 | 表现 | 解决 |
|:--:|------|------|
| **忽视 error** | 程序行为异常 | 每个返回 error 的调用都要检查 |
| **panic 用于业务逻辑** | 程序意外崩溃 | panic 仅用于不可恢复的情况 |
| **recover 无效** | panic 仍然导致崩溃 | recover 必须在 defer 函数内调用 |
| **错误信息链丢失** | 无法追踪问题根源 | 使用 %w 保留原始错误 |
| **nil error 判断错误** | 业务逻辑混乱 | 显式检查 `err != nil`，不要依赖其他条件 |
| **类型断言失败** | panic 或逻辑错误 | 总是检查类型断言的第二返回值（ok） |

---

## 总结

本章你学了：

✅ **error 接口**和基础错误处理  
✅ **fmt.Errorf** 和错误格式化  
✅ **自定义错误类型**（结构体实现 error 接口）  
✅ **error wrapping**（%w、errors.Unwrap、errors.Is、errors.As）  
✅ **Panic 和 Recover** 的正确用法  
✅ **何时使用 panic**（仅限不可恢复的情况）  
✅ **错误处理最佳实践**和常见坑点  
✅ **生产级别的错误处理**模式  

下一章，我们将学习 **指针、结构体与方法**——Go 的面向对象编程基础、结构体定义、接收者方法、指针接收者等内容。

---

## 参考资料

1. [Go 官方文档 - error](https://golang.org/ref/spec#Types)
2. [Go 官方博客 - error 处理](https://golang.org/blog/error-handling-and-go)
3. [Go 1.13 Release Notes - error wrapping](https://golang.org/doc/go1.13#error_wrapping)
4. [errors 标准库文档](https://golang.org/pkg/errors/)
5. [Effective Go - defer, panic, recover](https://golang.org/doc/effective_go#defer)
