package com.github.jsdiff.model;

import java.util.Objects;

/**
 * 表示文本差异中的一个变化单元对象
 * 
 * @param <T> 变化值的类型
 * @author rzy
 */
public class ChangeObject<T> {
    /**
     * 该变化对象所代表的所有标记(token)的连接内容 - 通常是作为单个字符串的添加、删除或公共文本。
     * 在标记被认为是公共的但不完全相同的情况下（例如因为使用了 ignoreCase 选项或自定义比较器），
     * 这里将提供新字符串中的值。
     */
    private T value;
    
    /**
     * 如果该值是插入到新字符串中则为 true，否则为 false
     */
    private boolean added;
    
    /**
     * 如果该值是从旧字符串中删除则为 true，否则为 false
     */
    private boolean removed;
    
    /**
     * 该变化对象中的值由多少个标记组成（例如对于 diffChars 是字符数，对于 diffLines 是行数）
     */
    private int count;

    public ChangeObject() {
    }

    public ChangeObject(T value, boolean added, boolean removed, int count) {
        this.value = value;
        this.added = added;
        this.removed = removed;
        this.count = count;
    }

    public T getValue() {
        return value;
    }

    public void setValue(T value) {
        this.value = value;
    }

    public boolean isAdded() {
        return added;
    }

    public void setAdded(boolean added) {
        this.added = added;
    }

    public boolean isRemoved() {
        return removed;
    }

    public void setRemoved(boolean removed) {
        this.removed = removed;
    }

    public int getCount() {
        return count;
    }

    public void setCount(int count) {
        this.count = count;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        ChangeObject<?> that = (ChangeObject<?>) o;
        return added == that.added &&
               removed == that.removed &&
               count == that.count &&
               Objects.equals(value, that.value);
    }

    @Override
    public int hashCode() {
        return Objects.hash(value, added, removed, count);
    }

    @Override
    public String toString() {
        return "ChangeObject{" +
               "value=" + value +
               ", added=" + added +
               ", removed=" + removed +
               ", count=" + count +
               '}';
    }
}

