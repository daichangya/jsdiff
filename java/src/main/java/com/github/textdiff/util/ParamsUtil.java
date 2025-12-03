package com.github.textdiff.util;

import com.github.textdiff.model.DiffOptions;

/**
 * 参数处理工具类
 * 
 * @author daichangya
 */
public class ParamsUtil {
    /**
     * 合并选项，使用默认值填充未设置的选项
     */
    public static DiffOptions mergeOptions(DiffOptions options, DiffOptions defaults) {
        if (options == null) {
            return defaults != null ? defaults : new DiffOptions();
        }
        
        DiffOptions result = new DiffOptions();
        
        // 使用提供的选项，如果没有则使用默认值
        result.setOneChangePerToken(options.isOneChangePerToken() || 
            (defaults != null && defaults.isOneChangePerToken()));
        result.setIgnoreCase(options.isIgnoreCase() || 
            (defaults != null && defaults.isIgnoreCase()));
        result.setIgnoreWhitespace(options.isIgnoreWhitespace() || 
            (defaults != null && defaults.isIgnoreWhitespace()));
        result.setStripTrailingCr(options.isStripTrailingCr() || 
            (defaults != null && defaults.isStripTrailingCr()));
        result.setNewlineIsToken(options.isNewlineIsToken() || 
            (defaults != null && defaults.isNewlineIsToken()));
        result.setIgnoreNewlineAtEof(options.isIgnoreNewlineAtEof() || 
            (defaults != null && defaults.isIgnoreNewlineAtEof()));
        
        result.setMaxEditLength(options.getMaxEditLength() != null ? 
            options.getMaxEditLength() : 
            (defaults != null ? defaults.getMaxEditLength() : null));
        result.setTimeout(options.getTimeout() != null ? 
            options.getTimeout() : 
            (defaults != null ? defaults.getTimeout() : null));
        result.setComparator(options.getComparator() != null ? 
            options.getComparator() : 
            (defaults != null ? defaults.getComparator() : null));
        
        return result;
    }
}

