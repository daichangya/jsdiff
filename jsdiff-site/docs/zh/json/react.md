# 如何在React中渲染

这是一个常见问题，因此我们专门添加了一个章节来介绍不同的实现方法。

## 1. 使用React包装组件

[jsondiffpatch-react](https://github.com/bluepeter/jsondiffpatch-react)

这个包实现了一个可直接在React应用中使用的组件，它以jsondiffpatch作为依赖。

## 2. 自定义实现

如果你希望获得更多控制权或选择特定版本的jsondiffpatch，以下是一个JSX代码示例：

```tsx
import { create } from 'jsondiffpatch';
import { format } from 'jsondiffpatch/formatters/html';
import 'jsondiffpatch/formatters/styles/html.css';

export const JsonDiffPatch = ({
  left,
  right,
  diffOptions,
  hideUnchangedValues,
}: {
  left: unknown;
  right: unknown;
  diffOptions?: Parameters<typeof create>[0];
  hideUnchangedValues?: boolean;
}) => {
  // 注意：这里你可能需要使用useMemo（尤其是当这些是不可变对象时）
  const jsondiffpatch = create(diffOptions || {});
  const delta = jsondiffpatch.diff(left, right);
  const htmlDiff = format(delta, left);
  return (
    <div
      className={`json-diff-container ${
        hideUnchangedValues ? 'jsondiffpatch-unchanged-hidden' : ''
      }`}
    >
      <div
        dangerouslySetInnerHTML={{ __html: htmlDiff || '' } as { __html: TrustedHTML }}
      ></div>
    </div>
  );
};

export default JsonDiffPatch;
```