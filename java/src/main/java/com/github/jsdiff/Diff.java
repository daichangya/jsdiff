package com.github.jsdiff;

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import com.github.jsdiff.model.ChangeObject;
import com.github.jsdiff.model.DiffOptions;

/**
 * Diff 算法基础抽象类
 * 实现 Myers Diff 算法
 * 基于论文 "An O(ND) Difference Algorithm and its Variations" (Myers, 1986)
 * 
 * @param <T> Token 类型
 * @author rzy
 */
public abstract class Diff<T> {
    
    /**
     * 执行差异计算
     * 
     * @param oldValue 旧值
     * @param newValue 新值
     * @return 变化对象列表
     */
    public List<ChangeObject<String>> diff(String oldValue, String newValue) {
        return diff(oldValue, newValue, new DiffOptions());
    }

    /**
     * 执行差异计算（带选项）
     * 
     * @param oldValue 旧值
     * @param newValue 新值
     * @param options 差异选项
     * @return 变化对象列表，如果超时或超过最大编辑长度则返回 null
     */
    public List<ChangeObject<String>> diff(String oldValue, String newValue, DiffOptions options) {
        // 允许子类在运行前处理输入
        String oldString = castInput(oldValue, options);
        String newString = castInput(newValue, options);

        List<T> oldTokens = removeEmpty(tokenize(oldString, options));
        List<T> newTokens = removeEmpty(tokenize(newString, options));

        return diffWithOptions(oldTokens, newTokens, options);
    }

    /**
     * 使用选项对象执行差异计算
     */
    private List<ChangeObject<String>> diffWithOptions(List<T> oldTokens, List<T> newTokens, DiffOptions options) {
        int newLen = newTokens.size();
        int oldLen = oldTokens.size();
        int editLength = 1;
        int maxEditLength = newLen + oldLen;
        
        if (options.getMaxEditLength() != null) {
            maxEditLength = Math.min(maxEditLength, options.getMaxEditLength());
        }
        
        long abortAfterTimestamp;
        if (options.getTimeout() != null) {
            abortAfterTimestamp = System.currentTimeMillis() + options.getTimeout();
        } else {
            abortAfterTimestamp = Long.MAX_VALUE;
        }

        // 使用 HashMap 来存储路径，这样可以使用负索引（类似 JavaScript 的稀疏数组）
        Map<Integer, Path> bestPath = new HashMap<>();
        bestPath.put(0, new Path(-1, null));

        // 种子 editLength = 0，即内容以相同的值开始
        int newPos = extractCommon(bestPath.get(0), newTokens, oldTokens, 0, options);
        if (bestPath.get(0).oldPos + 1 >= oldLen && newPos + 1 >= newLen) {
            // 根据相等性和标记器的身份
            return postProcess(buildValues(bestPath.get(0).lastComponent, newTokens, oldTokens), options);
        }

        // 一旦我们在某个对角线 k 上到达编辑图的右边缘，我们肯定可以在不超过 k 次编辑的情况下到达编辑图的末尾
        int minDiagonalToConsider = Integer.MIN_VALUE;
        int maxDiagonalToConsider = Integer.MAX_VALUE;

        // 主要工作方法。检查给定编辑长度的所有排列是否被接受。
        while (editLength <= maxEditLength && System.currentTimeMillis() <= abortAfterTimestamp) {
            for (int diagonalPath = Math.max(minDiagonalToConsider, -editLength);
                 diagonalPath <= Math.min(maxDiagonalToConsider, editLength);
                 diagonalPath += 2) {
                
                Path removePath = bestPath.get(diagonalPath - 1);
                Path addPath = bestPath.get(diagonalPath + 1);
                
                if (removePath != null) {
                    bestPath.remove(diagonalPath - 1);
                }

                boolean canAdd = false;
                if (addPath != null) {
                    int addPathNewPos = addPath.oldPos - diagonalPath;
                    canAdd = addPathNewPos >= 0 && addPathNewPos < newLen;
                }

                boolean canRemove = removePath != null && removePath.oldPos + 1 < oldLen;
                
                if (!canAdd && !canRemove) {
                    bestPath.remove(diagonalPath);
                    continue;
                }

                // 选择我们想要分支的对角线
                Path basePath;
                if (!canRemove || (canAdd && removePath.oldPos < addPath.oldPos)) {
                    basePath = addToPath(addPath, true, false, 0, options);
                } else {
                    basePath = addToPath(removePath, false, true, 1, options);
                }

                newPos = extractCommon(basePath, newTokens, oldTokens, diagonalPath, options);

                if (basePath.oldPos + 1 >= oldLen && newPos + 1 >= newLen) {
                    // 如果我们已经到达两个字符串的末尾，那么我们就完成了
                    return postProcess(buildValues(basePath.lastComponent, newTokens, oldTokens), options);
                } else {
                    bestPath.put(diagonalPath, basePath);
                    if (basePath.oldPos + 1 >= oldLen) {
                        maxDiagonalToConsider = Math.min(maxDiagonalToConsider, diagonalPath - 1);
                    }
                    if (newPos + 1 >= newLen) {
                        minDiagonalToConsider = Math.max(minDiagonalToConsider, diagonalPath + 1);
                    }
                }
            }
            editLength++;
        }

        // 如果达到最大编辑长度或超时，返回 null
        return null;
    }

    private Path addToPath(Path path, boolean added, boolean removed, int oldPosInc, DiffOptions options) {
        DraftChangeObject last = path.lastComponent;
        if (last != null && !options.isOneChangePerToken() && last.added == added && last.removed == removed) {
            return new Path(
                path.oldPos + oldPosInc,
                new DraftChangeObject(last.count + 1, added, removed, last.previousComponent)
            );
        } else {
            return new Path(
                path.oldPos + oldPosInc,
                new DraftChangeObject(1, added, removed, last)
            );
        }
    }

    private int extractCommon(Path basePath, List<T> newTokens, List<T> oldTokens, 
                             int diagonalPath, DiffOptions options) {
        int newLen = newTokens.size();
        int oldLen = oldTokens.size();
        int oldPos = basePath.oldPos;
        int newPos = oldPos - diagonalPath;
        int commonCount = 0;

        while (newPos + 1 < newLen && oldPos + 1 < oldLen && 
               equals(oldTokens.get(oldPos + 1), newTokens.get(newPos + 1), options)) {
            newPos++;
            oldPos++;
            commonCount++;
            if (options.isOneChangePerToken()) {
                basePath.lastComponent = new DraftChangeObject(1, basePath.lastComponent, false, false);
            }
        }

        if (commonCount > 0 && !options.isOneChangePerToken()) {
            basePath.lastComponent = new DraftChangeObject(commonCount, basePath.lastComponent, false, false);
        }

        basePath.oldPos = oldPos;
        return newPos;
    }

    /**
     * 比较两个 token 是否相等
     */
    protected boolean equals(T left, T right, DiffOptions options) {
        if (options.getComparator() != null) {
            return options.getComparator().compare(left, right) == 0;
        } else {
            if (left == null) {
                return right == null;
            }
            if (options.isIgnoreCase() && left instanceof String && right instanceof String) {
                return ((String) left).equalsIgnoreCase((String) right);
            }
            return left.equals(right);
        }
    }

    /**
     * 移除数组中的空元素
     */
    protected List<T> removeEmpty(List<T> array) {
        List<T> ret = new ArrayList<>();
        for (T item : array) {
            if (item != null && (!(item instanceof String) || !((String) item).isEmpty())) {
                ret.add(item);
            }
        }
        return ret;
    }

    /**
     * 允许子类在运行前处理输入
     */
    protected String castInput(String value, DiffOptions options) {
        return value;
    }

    /**
     * 将值标记化为 token 数组
     */
    protected abstract List<T> tokenize(String value, DiffOptions options);

    /**
     * 将 token 数组连接成字符串
     */
    protected String join(List<T> tokens) {
        StringBuilder sb = new StringBuilder();
        for (T token : tokens) {
            sb.append(token);
        }
        return sb.toString();
    }

    /**
     * 后处理变化对象
     */
    protected List<ChangeObject<String>> postProcess(List<ChangeObject<String>> changeObjects, DiffOptions options) {
        return changeObjects;
    }

    /**
     * 是否使用最长的 token
     */
    protected boolean useLongestToken() {
        return false;
    }

    /**
     * 从链表构建最终的变化对象数组
     */
    private List<ChangeObject<String>> buildValues(DraftChangeObject lastComponent, 
                                                    List<T> newTokens, List<T> oldTokens) {
        // 首先将反向顺序的组件链表转换为正确顺序的数组
        List<DraftChangeObject> components = new ArrayList<>();
        DraftChangeObject nextComponent;
        while (lastComponent != null) {
            components.add(lastComponent);
            nextComponent = lastComponent.previousComponent;
            lastComponent.previousComponent = null;
            lastComponent = nextComponent;
        }
        Collections.reverse(components);

        int componentLen = components.size();
        int componentPos = 0;
        int newPos = 0;
        int oldPos = 0;

        for (; componentPos < componentLen; componentPos++) {
            DraftChangeObject component = components.get(componentPos);
            if (!component.removed) {
                if (!component.added && useLongestToken()) {
                    List<T> value = new ArrayList<>();
                    for (int i = 0; i < component.count; i++) {
                        T newToken = newTokens.get(newPos + i);
                        T oldToken = oldTokens.get(oldPos + i);
                        if (oldToken.toString().length() > newToken.toString().length()) {
                            value.add(oldToken);
                        } else {
                            value.add(newToken);
                        }
                    }
                    component.value = join(value);
                } else {
                    component.value = join(newTokens.subList(newPos, newPos + component.count));
                }
                newPos += component.count;

                if (!component.added) {
                    oldPos += component.count;
                }
            } else {
                component.value = join(oldTokens.subList(oldPos, oldPos + component.count));
                oldPos += component.count;
            }
        }

        // 转换为 ChangeObject 列表
        List<ChangeObject<String>> result = new ArrayList<>();
        for (DraftChangeObject component : components) {
            result.add(new ChangeObject<>(component.value, component.added, component.removed, component.count));
        }
        return result;
    }

    /**
     * 路径类（用于 Myers 算法）
     */
    private static class Path {
        int oldPos;
        DraftChangeObject lastComponent;

        Path(int oldPos, DraftChangeObject lastComponent) {
            this.oldPos = oldPos;
            this.lastComponent = lastComponent;
        }
    }

    /**
     * 草稿变化对象（内部使用的链表节点）
     */
    private static class DraftChangeObject {
        boolean added;
        boolean removed;
        int count;
        DraftChangeObject previousComponent;
        String value;

        DraftChangeObject(int count, boolean added, boolean removed, DraftChangeObject previousComponent) {
            this.count = count;
            this.added = added;
            this.removed = removed;
            this.previousComponent = previousComponent;
        }

        DraftChangeObject(int count, DraftChangeObject previousComponent, boolean added, boolean removed) {
            this.count = count;
            this.previousComponent = previousComponent;
            this.added = added;
            this.removed = removed;
        }
    }
}

