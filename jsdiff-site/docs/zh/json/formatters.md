# 格式化器（Formatters）

包含了一些格式化器，可以将JSON增量转换为其他格式，你可以在[在线演示](https://jsdiff.com/json)中看到其中一些的使用。

## Html

将`build/formatters.js`和`src/formatters/html.css`添加到你的页面，然后：

```ts
const delta = jsondiffpatch.diff(left, right);
// left是可选的，如果指定，未更改的值也将可见
document.getElementBy('the-diff').innerHTML =
  jsondiffpatch.formatters.html.format(delta, left);

// 你也可以动态显示/隐藏未更改的值
jsondiffpatch.formatters.html.showUnchanged();
jsondiffpatch.formatters.html.hideUnchanged();
// 这些方法也会调整数组移动箭头（SVG），这在某些操作改变html布局时很有用
```

同样可以在服务器端生成Html，只需记住在渲染时包含（或嵌入）`/src/formatters/html.css`。

关于在react中使用的帮助，请查看[在react中使用](./react.md)文档。

## 带注释的JSON（Annotated JSON）

这将在html中渲染原始的JSON增量，并在旁边附带注释解释每个部分的含义。这试图让JSON增量格式自我解释。

将`build/formatters.js`和`src/formatters/annotated.css`添加到你的页面，然后：

```ts
const delta = jsondiffpatch.diff(left, right);
document.getElementBy('the-diff').innerHTML =
  jsondiffpatch.formatters.annotated.format(delta);
```

同样可以在服务器端生成Html，只需记住在渲染时包含（或嵌入）`/src/formatters/annotated.css`。

## 控制台（Console）

带颜色的文本输出到控制台日志，CLI（命令行界面）使用了这个格式化器：

![console_demo!](../docs/demo/consoledemo.png)

但你也可以通过编程方式使用它：

```ts
const delta = jsondiffpatch.diff(left, right);
const output = jsondiffpatch.formatters.console.format(delta);
console.log(output);

// 或者更简单
jsondiffpatch.console.log(delta);
```

## JSON PATCH（RFC 6902）

```ts
const delta = jsondiffpatch.diff(left, right);
const patch = jsondiffpatch.formatters.jsonpatch.format(delta);
console.log(patch);
```

_不要与`textDiff`一起使用，因为它不支持_

还提供了patch方法的实现：

```ts
const target = jsondiffpatch.clone(left);
const patched = jsondiffpatch.formatters.jsonpatch.patch(target, patch);

// target现在等于right
assert(JSON.stringify(patched), JSON.stringify(right));
```

注意：这个patch方法是原子性的，如[RFC 6902](https://datatracker.ietf.org/doc/html/rfc6902#section-5)所规定。如果在打补丁过程中发生任何错误，`target`对象将回滚到其原始状态。

## 创建自定义格式化器

当然，创建格式化器的第一步是理解[增量格式](deltas.md)。

为了简化新格式化器的创建，你可以基于所包含的`BaseFormatter`来构建。所有内置的格式化器都是这样做的，查看[formatters](../packages/jsondiffpatch/src/formatters/)文件夹来开始。