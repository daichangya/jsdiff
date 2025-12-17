# 插件（Plugins）

`diff()`、`patch()`和`reverse()`函数采用管道与过滤器模式实现，通过添加或替换过滤器，可对这些函数进行高度定制。

通过编写自定义过滤器，你可以实现以下功能示例：

- 比较特殊的自定义对象（例如，DOM节点、原生对象、函数、正则表达式、Node.js流等）
- 使用任何自定义规则（类型、路径、标志）忽略对象图的部分内容
- 在对象图的特定部分更改比较策略，例如，依赖Knockout.js跟踪对象的变更跟踪信息
- 实现自定义的差异比较机制，如相对数值增量
- 更多惊喜功能！

查看`/src/filters`文件夹可获取过滤器示例。

## 插件示例

以下示例用于在增量中提供数字差异（当左右值均为数字时）。通过这种方式，比较两个数字时，不会得到`[oldValue, newValue]`，而是会保存两个值之间的差值。这对于在多个客户端应用中同时递增的计数器非常有用（两个递增某个值的补丁可以合并，而不会因冲突失败）。

```ts
/*
插件化一个新的差异过滤器
*/

var diffpatcher = jsondiffpatch.create();
var NUMERIC_DIFFERENCE = -8;

var numericDiffFilter = function (context) {
  if (typeof context.left === 'number' && typeof context.right === 'number') {
    context
      .setResult([0, context.right - context.left, NUMERIC_DIFFERENCE])
      .exit();
  }
};
// 过滤器名称很有用，便于在其他过滤器之前/之后插入当前过滤器
numericDiffFilter.filterName = 'numeric';

// 要确定插入过滤器的位置，可查看管道的过滤器列表
assertSame(diffpatcher.processor.pipes.diff.list(), [
  'collectChildren',
  'trivial',
  'dates',
  'texts',
  'objects',
  'arrays',
]);

// 在trivial过滤器之前插入新过滤器
diffpatcher.processor.pipes.diff.before('trivial', numericDiffFilter);

// 调试时，可记录每个过滤器
diffpatcher.processor.pipes.diff.debug = true;

// 尝试使用
var delta = diffpatcher.diff({ population: 400 }, { population: 403 });
assertSame(delta, [0, 3, NUMERIC_DIFFERENCE]);

/*
下面创建对应的补丁过滤器，用于处理新的增量类型
*/

var numericPatchFilter = function (context) {
  if (
    context.delta &&
    Array.isArray(context.delta) &&
    context.delta[2] === NUMERIC_DIFFERENCE
  ) {
    context.setResult(context.left + context.delta[1]).exit();
  }
};
numericPatchFilter.filterName = 'numeric';
diffpatcher.processor.pipes.patch.before('trivial', numericPatchFilter);

// 尝试使用
var right = diffpatcher.patch({ population: 400 }, delta);
assertSame(right, { population: 403 });

// 应用两次补丁！
diffpatcher.patch(right, delta);
assertSame(right, { population: 406 });

/*
为了完善插件，添加反向过滤器，使数字增量可以被反向处理
（这对于撤销补丁也是必需的）
*/

var numericReverseFilter = function (context) {
  if (context.nested) {
    return;
  }
  if (
    context.delta &&
    Array.isArray(context.delta) &&
    context.delta[2] === NUMERIC_DIFFERENCE
  ) {
    context.setResult([0, -context.delta[1], NUMERIC_DIFFERENCE]).exit();
  }
};
numericReverseFilter.filterName = 'numeric';
diffpatcher.processor.pipes.reverse.after('trivial', numericReverseFilter);

// 尝试使用
var reverseDelta = diffpatcher.reverse(delta);
assertSame(reverseDelta, [0, -3, NUMERIC_DIFFERENCE]);

// 撤销两次补丁！
diffpatcher.unpatch(right, delta);
assertSame(right, { population: 403 });
diffpatcher.unpatch(right, delta);
assertSame(right, { population: 400 });
```

## 管道API（Pipe API）

提供以下方法用于操作管道中的过滤器：

- `append(filter1, filter2, ...)` - 在现有列表末尾追加一个或多个过滤器
- `prepend(filter1, filter2, ...)` - 在现有列表开头前置一个或多个过滤器
- `after(filterName, filter1, filter2, ...)` - 在指定过滤器之后添加一个或多个过滤器
- `before(filterName, filter1, filter2, ...)` - 在指定过滤器之前添加一个或多个过滤器
- `replace(filterName, filter1, filter2, ...)` - 用一个或多个过滤器替换指定的过滤器
- `remove(filterName)` - 移除具有指定名称的过滤器
- `clear()` - 移除管道中的所有过滤器
- `list()` - 返回当前管道中有序的过滤器名称数组