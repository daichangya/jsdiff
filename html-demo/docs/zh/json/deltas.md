# 增量格式（Delta Format）

本页旨在作为表示增量的JSON格式的参考（即`jsondiffpatch.diff`的输出）。

这种格式在可读性和低占用空间之间取得了平衡：

- 当比较两个对象时，增量将反映相同的对象结构（双方共有的部分）
- 为了表示更改的部分，使用数组和魔术数字以保持较小的占用空间（即，你不会看到像`"type": "added"`这样的冗余信息）
- 保持纯JSON可序列化

理解这种格式的一个好方法是在[在线演示](https://jsdiff.com/json)中使用"Annotated JSON"选项，尝试不同的左右示例，或者编辑左右JSON以查看带注释的增量随输入而更新。

以下是这种格式的完整参考。

## 新增（Added）

一个值被添加，即它之前是`undefined`，现在有了一个值。

```ts
delta = [newValue];
```

## 修改（Modified）

一个值被另一个值替换

```ts
delta = [oldValue, newValue];
```

## 删除（Deleted）

一个值被删除，即它之前有值，现在变为`undefined`

```ts
delta = [oldValue, 0, 0];
```

注意：在修改和删除两种情况下，当使用`omitRemovedValues: true`选项时，`oldValue`会被省略，替换为`0`。

这会使增量不可逆（不能用于撤销补丁），但如果你要通过网络发送它们且永远不需要撤销补丁，这可能是一个很好的权衡。

## 有内部变化的对象

值是一个对象，且其属性内部有嵌套变化

```ts
delta = {
  property1: innerDelta1,
  property2: innerDelta2,
  property5: innerDelta5,
};
```

> 注意：只包含有内部增量的属性

以下是一个综合示例：

```ts
delta = {
  property1: [newValue1], // obj[property1] = newValue1
  property2: [oldValue2, newValue2], // obj[property2] = newValue2（之前的值是oldValue2）
  property5: [oldValue5, 0, 0], // 删除obj[property5]（之前的值是oldValue5）
};
```

## 有内部变化的数组

值是一个数组，且其项内部有嵌套变化

```ts
delta = {
  _t: 'a',
  index1: innerDelta1,
  index2: innerDelta2,
  index5: innerDelta5,
};
```

> 注意：只包含有内部增量的索引

> 注意：\_t: 'a'表示这适用于数组，在打补丁时，如果发现是常规对象（或值类型），将会抛出错误

### 索引表示法

数组增量中的索引可以通过两种方式表示：

- 数字：指的是数组最终（右侧）状态中的索引，用于表示插入的项。
- 下划线+数字：指的是数组原始（左侧）状态中的索引，用于表示删除或移动的项。

### 数组移动（Array Moves）

一个项被移动到同一数组中的不同位置

```ts
delta = ['', destinationIndex, 3];
```

> 注意：''表示被移动项的值，默认情况下会被省略

> 注意：3是表示"数组移动"的魔术数字

## 文本差异（Text Diffs）

如果比较两个字符串且它们不同，你会看到预期的结果：

```ts
delta = ['some text', 'some text modified'];
```

但如果两个字符串都足够长，将会使用[文本差异算法](https://code.google.com/p/google-diff-match-patch/)来高效检测文本部分的变化。

你可以通过以下方式修改最小长度：

```ts
const customDiffPatch = jsondiffpatch.create({
  textDiff: {
    minLength: 60, // 默认值
  },
});
```

此时增量将如下所示：

```ts
delta = [unidiff, 0, 2];
```

> 注意：2是表示"文本差异"的魔术数字

> 注意：unidiff实际上是Unidiff格式的一种基于字符的变体，其解释见[此处](https://code.google.com/p/google-diff-match-patch/wiki/Unidiff)