package com.github.jsdiff.diff;

import com.github.jsdiff.Diff;
import com.github.jsdiff.model.ChangeObject;
import com.github.jsdiff.model.DiffOptions;

import java.util.ArrayList;
import java.util.List;
import java.util.regex.Pattern;

/**
 * CSS 差异比较
 * 比较 CSS tokens
 * 
 * @author rzy
 */
public class CssDiff extends Diff<String> {
    
    private static final CssDiff INSTANCE = new CssDiff();
    private static final Pattern CSS_TOKEN_PATTERN = Pattern.compile("([{}:;,]|\\s+)");
    
    public static CssDiff getInstance() {
        return INSTANCE;
    }
    
    /**
     * 对两个 CSS 文本块进行差异比较
     * 
     * @param oldStr 旧字符串
     * @param newStr 新字符串
     * @return 变化对象列表
     */
    public static List<ChangeObject<String>> diffCss(String oldStr, String newStr) {
        return INSTANCE.diff(oldStr, newStr);
    }
    
    /**
     * 对两个 CSS 文本块进行差异比较（带选项）
     * 
     * @param oldStr 旧字符串
     * @param newStr 新字符串
     * @param options 差异选项
     * @return 变化对象列表
     */
    public static List<ChangeObject<String>> diffCss(String oldStr, String newStr, DiffOptions options) {
        return INSTANCE.diff(oldStr, newStr, options);
    }
    
    @Override
    protected List<String> tokenize(String value, DiffOptions options) {
        String[] parts = CSS_TOKEN_PATTERN.split(value, -1);
        List<String> tokens = new ArrayList<>();
        for (String part : parts) {
            if (!part.isEmpty()) {
                tokens.add(part);
            }
        }
        return tokens;
    }
}

