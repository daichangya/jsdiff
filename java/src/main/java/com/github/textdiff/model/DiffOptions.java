package com.github.textdiff.model;

import java.util.Comparator;

/**
 * Diff 选项配置类
 * 
 * @author daichangya
 */
public class DiffOptions {
    /**
     * 如果为 true，返回的变化对象数组将包含每个标记一个变化对象
     */
    private boolean oneChangePerToken = false;
    
    /**
     * 如果为 true，则大写和小写形式的字符被视为相等
     */
    private boolean ignoreCase = false;
    
    /**
     * 如果为 true，则在检查两行是否相等时忽略前导和尾随的空白字符
     */
    private boolean ignoreWhitespace = false;
    
    /**
     * 如果为 true，则在执行差异之前删除所有尾随的回车符(\r)
     */
    private boolean stripTrailingCr = false;
    
    /**
     * 如果为 true，则将每行末尾的换行符视为独立的标记
     */
    private boolean newlineIsToken = false;
    
    /**
     * 如果为 true，则在将最后一行与其他行比较时忽略末尾缺少的换行符
     */
    private boolean ignoreNewlineAtEof = false;
    
    /**
     * 指定旧文本和新文本之间考虑的最大编辑距离
     */
    private Integer maxEditLength;
    
    /**
     * 差异算法在指定毫秒数后中止的时间
     */
    private Long timeout;
    
    /**
     * 自定义比较器（用于数组差异）
     */
    private Comparator<Object> comparator;

    public DiffOptions() {
    }

    public boolean isOneChangePerToken() {
        return oneChangePerToken;
    }

    public void setOneChangePerToken(boolean oneChangePerToken) {
        this.oneChangePerToken = oneChangePerToken;
    }

    public boolean isIgnoreCase() {
        return ignoreCase;
    }

    public void setIgnoreCase(boolean ignoreCase) {
        this.ignoreCase = ignoreCase;
    }

    public boolean isIgnoreWhitespace() {
        return ignoreWhitespace;
    }

    public void setIgnoreWhitespace(boolean ignoreWhitespace) {
        this.ignoreWhitespace = ignoreWhitespace;
    }

    public boolean isStripTrailingCr() {
        return stripTrailingCr;
    }

    public void setStripTrailingCr(boolean stripTrailingCr) {
        this.stripTrailingCr = stripTrailingCr;
    }

    public boolean isNewlineIsToken() {
        return newlineIsToken;
    }

    public void setNewlineIsToken(boolean newlineIsToken) {
        this.newlineIsToken = newlineIsToken;
    }

    public boolean isIgnoreNewlineAtEof() {
        return ignoreNewlineAtEof;
    }

    public void setIgnoreNewlineAtEof(boolean ignoreNewlineAtEof) {
        this.ignoreNewlineAtEof = ignoreNewlineAtEof;
    }

    public Integer getMaxEditLength() {
        return maxEditLength;
    }

    public void setMaxEditLength(Integer maxEditLength) {
        this.maxEditLength = maxEditLength;
    }

    public Long getTimeout() {
        return timeout;
    }

    public void setTimeout(Long timeout) {
        this.timeout = timeout;
    }

    public Comparator<Object> getComparator() {
        return comparator;
    }

    public void setComparator(Comparator<Object> comparator) {
        this.comparator = comparator;
    }

    /**
     * Builder 模式
     */
    public static class Builder {
        private final DiffOptions options = new DiffOptions();

        public Builder oneChangePerToken(boolean oneChangePerToken) {
            options.oneChangePerToken = oneChangePerToken;
            return this;
        }

        public Builder ignoreCase(boolean ignoreCase) {
            options.ignoreCase = ignoreCase;
            return this;
        }

        public Builder ignoreWhitespace(boolean ignoreWhitespace) {
            options.ignoreWhitespace = ignoreWhitespace;
            return this;
        }

        public Builder stripTrailingCr(boolean stripTrailingCr) {
            options.stripTrailingCr = stripTrailingCr;
            return this;
        }

        public Builder newlineIsToken(boolean newlineIsToken) {
            options.newlineIsToken = newlineIsToken;
            return this;
        }

        public Builder ignoreNewlineAtEof(boolean ignoreNewlineAtEof) {
            options.ignoreNewlineAtEof = ignoreNewlineAtEof;
            return this;
        }

        public Builder maxEditLength(Integer maxEditLength) {
            options.maxEditLength = maxEditLength;
            return this;
        }

        public Builder timeout(Long timeout) {
            options.timeout = timeout;
            return this;
        }

        public Builder comparator(Comparator<Object> comparator) {
            options.comparator = comparator;
            return this;
        }

        public DiffOptions build() {
            return options;
        }
    }

    public static Builder builder() {
        return new Builder();
    }
}

