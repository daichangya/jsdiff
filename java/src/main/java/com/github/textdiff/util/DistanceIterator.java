package com.github.textdiff.util;

import java.util.Iterator;
import java.util.NoSuchElementException;

/**
 * 距离迭代器 - 从给定的起始位置按距离遍历范围 [min, max]
 * 例如，对于 [0, 4]，起始位置为 2，将迭代：2, 3, 1, 4, 0
 * 
 * @author daichangya
 */
public class DistanceIterator implements Iterator<Integer> {
    private final int start;
    private final int minLine;
    private final int maxLine;
    
    private boolean wantForward = true;
    private boolean backwardExhausted = false;
    private boolean forwardExhausted = false;
    private int localOffset = 1;
    private Integer next = null;

    public DistanceIterator(int start, int minLine, int maxLine) {
        this.start = start;
        this.minLine = minLine;
        this.maxLine = maxLine;
        // 预计算第一个值
        computeNext();
    }

    @Override
    public boolean hasNext() {
        return next != null;
    }

    @Override
    public Integer next() {
        if (next == null) {
            throw new NoSuchElementException();
        }
        Integer result = next;
        computeNext();
        return result;
    }

    private void computeNext() {
        next = iterator();
    }

    private Integer iterator() {
        if (wantForward && !forwardExhausted) {
            if (backwardExhausted) {
                localOffset++;
            } else {
                wantForward = false;
            }

            // 检查是否超出文本长度，如果没有，检查它是否在偏移位置之后（或第一次迭代的期望位置）
            if (start + localOffset <= maxLine) {
                return start + localOffset;
            }

            forwardExhausted = true;
        }

        if (!backwardExhausted) {
            if (!forwardExhausted) {
                wantForward = true;
            }

            // 检查是否超出文本开头，如果没有，检查它是否在偏移位置之前
            if (minLine <= start - localOffset) {
                return start - localOffset++;
            }

            backwardExhausted = true;
            return iterator();
        }

        // 我们尝试在文本开头之前和文本长度之后适配 hunk，那么 hunk 无法适配到文本上。返回 null
        return null;
    }

    /**
     * 创建一个新的距离迭代器
     */
    public static DistanceIterator create(int start, int minLine, int maxLine) {
        return new DistanceIterator(start, minLine, maxLine);
    }
}

