# JSDiff Java

Java 实现的文本差异比较库，基于 Myers Diff 算法。这是 [jsdiff](https://github.com/kpdecker/jsdiff) JavaScript 库的 Java 移植版本。

## 特性

- ✅ **多种差异比较模式**：字符、单词、行、句子、CSS、JSON、数组
- ✅ **Patch 功能**：创建、解析、应用和反转 unified diff 格式的补丁
- ✅ **格式转换**：支持转换为 DMP 和 XML 格式
- ✅ **Myers 算法**：基于经典的 O(ND) 差异算法
- ✅ **完整的单元测试**：确保代码质量和正确性

## 快速开始

### Maven 配置

将以下依赖添加到您的 `pom.xml`：

```xml
<dependency>
    <groupId>com.github.textdiff</groupId>
    <artifactId>textdiff</artifactId>
    <version>1.0.0</version>
</dependency>
```

### 基本用法

#### 字符级别差异比较

```java
import com.github.textdiff.diff.CharacterDiff;
import com.github.textdiff.model.ChangeObject;
import java.util.List;

List<ChangeObject<String>> changes = CharacterDiff.diffChars("beep boop", "beep boob blah");

for (ChangeObject<String> change : changes) {
    if (change.isAdded()) {
        System.out.println("+ " + change.getValue());
    } else if (change.isRemoved()) {
        System.out.println("- " + change.getValue());
    } else {
        System.out.println("  " + change.getValue());
    }
}
```

#### 行级别差异比较

```java
import com.github.textdiff.diff.LineDiff;
import com.github.textdiff.model.DiffOptions;

String oldText = "line1\nline2\nline3";
String newText = "line1\nline2 modified\nline3";

List<ChangeObject<String>> changes = LineDiff.diffLines(oldText, newText);

// 使用选项
DiffOptions options = DiffOptions.builder()
    .ignoreWhitespace(true)
    .stripTrailingCr(true)
    .build();
List<ChangeObject<String>> changes2 = LineDiff.diffLines(oldText, newText, options);
```

#### 单词级别差异比较

```java
import com.github.textdiff.diff.WordDiff;

String oldText = "hello world";
String newText = "hello beautiful world";

List<ChangeObject<String>> changes = WordDiff.diffWords(oldText, newText);
```

#### JSON 对象差异比较

```java
import com.github.textdiff.diff.JsonDiff;
import java.util.Map;

Map<String, Object> oldObj = Map.of("name", "John", "age", 30);
Map<String, Object> newObj = Map.of("name", "John", "age", 31);

List<ChangeObject<String>> changes = JsonDiff.diffJson(oldObj, newObj);
```

### Patch 功能

#### 创建补丁

```java
import com.github.textdiff.patch.PatchCreator;

String oldText = "line1\nline2\nline3";
String newText = "line1\nline2 modified\nline3";

// 创建 unified diff 格式的补丁
String patch = PatchCreator.createPatch("test.txt", oldText, newText);
System.out.println(patch);
```

#### 应用补丁

```java
import com.github.textdiff.patch.PatchApplier;

String result = PatchApplier.applyPatch(oldText, patch);
System.out.println(result);
```

#### 解析补丁

```java
import com.github.textdiff.patch.PatchParser;
import com.github.textdiff.model.StructuredPatch;
import java.util.List;

String patchStr = "--- test.txt\n+++ test.txt\n@@ -1,3 +1,3 @@\n line1\n-line2\n+line2 modified\n line3\n";
List<StructuredPatch> patches = PatchParser.parsePatch(patchStr);
```

#### 反转补丁

```java
import com.github.textdiff.patch.PatchReverser;

StructuredPatch reversed = PatchReverser.reversePatch(patch);
```

### 格式转换

#### 转换为 DMP 格式

```java
import com.github.textdiff.convert.DmpConverter;
import com.github.textdiff.convert.DmpConverter.DmpOperation;

List<ChangeObject<String>> changes = CharacterDiff.diffChars("abc", "adc");
List<DmpOperation<String>> dmpFormat = DmpConverter.convertChangesToDMP(changes);
```

#### 转换为 XML 格式

```java
import com.github.textdiff.convert.XmlConverter;

List<ChangeObject<String>> changes = CharacterDiff.diffChars("abc", "adc");
String xml = XmlConverter.convertChangesToXML(changes);
System.out.println(xml);
// 输出: a<del>b</del><ins>dc</ins>
```

## API 文档

### Diff 类

所有 diff 类都继承自 `Diff<T>` 基类，实现了 Myers Diff 算法。

- **CharacterDiff**: 字符级别差异（每个 Unicode 码点视为一个 token）
- **WordDiff**: 单词级别差异（单词和标点符号视为 token）
- **LineDiff**: 行级别差异（每行视为一个 token）
- **SentenceDiff**: 句子级别差异
- **CssDiff**: CSS 差异
- **JsonDiff**: JSON 对象差异
- **ArrayDiff**: 数组差异

### ChangeObject

表示差异中的一个变化单元：

- `getValue()`: 变化的内容
- `isAdded()`: 是否为新增
- `isRemoved()`: 是否为删除
- `getCount()`: token 数量

### DiffOptions

差异比较选项：

- `ignoreCase`: 忽略大小写
- `ignoreWhitespace`: 忽略空白字符
- `stripTrailingCr`: 移除尾随的 CR 字符
- `newlineIsToken`: 将换行符视为独立的 token
- `ignoreNewlineAtEof`: 忽略文件末尾的换行符
- `maxEditLength`: 最大编辑距离
- `timeout`: 超时时间（毫秒）

## 构建项目

```bash
cd java
mvn clean install
```

## 运行测试

```bash
mvn test
```

## 许可证

本项目采用 BSD-3-Clause 许可证，与原始 jsdiff 项目保持一致。

## 参考文献

- [An O(ND) Difference Algorithm and its Variations (Myers, 1986)](http://www.xmailserver.org/diff2.pdf)
- [jsdiff - JavaScript 原始实现](https://github.com/kpdecker/jsdiff)

## 作者

- rzy

## 贡献

欢迎提交 Issue 和 Pull Request！

