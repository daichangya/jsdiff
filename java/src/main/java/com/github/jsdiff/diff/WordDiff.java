package com.github.jsdiff.diff;

import com.github.jsdiff.Diff;
import com.github.jsdiff.model.ChangeObject;
import com.github.jsdiff.model.DiffOptions;

import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * 单词级别差异比较
 * 将每个单词和标点符号视为一个 token，忽略空白
 * 
 * @author rzy
 */
public class WordDiff extends Diff<String> {
    
    private static final WordDiff INSTANCE = new WordDiff();
    
    // 扩展的单词字符（包括拉丁字符）
    private static final String EXTENDED_WORD_CHARS = 
        "a-zA-Z0-9_\\u00C0-\\u00FF\\u00D8-\\u00F6\\u00F8-\\u02C6\\u02C8-\\u02D7\\u02DE-\\u02FF\\u1E00-\\u1EFF";
    
    // 标记化模式：单词、空白或标点
    private static final Pattern TOKENIZE_PATTERN = 
        Pattern.compile("[" + EXTENDED_WORD_CHARS + "]+|\\s+|[^" + EXTENDED_WORD_CHARS + "]");
    
    public static WordDiff getInstance() {
        return INSTANCE;
    }
    
    /**
     * 对两个文本块进行单词级别的差异比较
     * 
     * @param oldStr 旧字符串
     * @param newStr 新字符串
     * @return 变化对象列表
     */
    public static List<ChangeObject<String>> diffWords(String oldStr, String newStr) {
        return INSTANCE.diff(oldStr, newStr);
    }
    
    /**
     * 对两个文本块进行单词级别的差异比较（带选项）
     * 
     * @param oldStr 旧字符串
     * @param newStr 新字符串
     * @param options 差异选项
     * @return 变化对象列表
     */
    public static List<ChangeObject<String>> diffWords(String oldStr, String newStr, DiffOptions options) {
        return INSTANCE.diff(oldStr, newStr, options);
    }
    
    @Override
    protected boolean equals(String left, String right, DiffOptions options) {
        if (options.isIgnoreCase()) {
            left = left.toLowerCase();
            right = right.toLowerCase();
        }
        return left.trim().equals(right.trim());
    }
    
    @Override
    protected List<String> tokenize(String value, DiffOptions options) {
        Matcher matcher = TOKENIZE_PATTERN.matcher(value);
        List<String> parts = new ArrayList<>();
        while (matcher.find()) {
            parts.add(matcher.group());
        }
        
        List<String> tokens = new ArrayList<>();
        String prevPart = null;
        
        for (String part : parts) {
            if (part.trim().isEmpty()) {  // 空白
                if (prevPart == null) {
                    tokens.add(part);
                } else {
                    // 将空白附加到前一个标记
                    int lastIndex = tokens.size() - 1;
                    tokens.set(lastIndex, tokens.get(lastIndex) + part);
                }
            } else if (prevPart != null && prevPart.trim().isEmpty()) {
                // 前一个是空白
                if (!tokens.isEmpty() && tokens.get(tokens.size() - 1).equals(prevPart)) {
                    int lastIndex = tokens.size() - 1;
                    tokens.set(lastIndex, tokens.get(lastIndex) + part);
                } else {
                    tokens.add(prevPart + part);
                }
            } else {
                tokens.add(part);
            }
            prevPart = part;
        }
        
        return tokens;
    }
    
    @Override
    protected String join(List<String> tokens) {
        // 连接时移除除第一个标记外所有标记的前导空白
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < tokens.size(); i++) {
            String token = tokens.get(i);
            if (i == 0) {
                sb.append(token);
            } else {
                sb.append(token.replaceFirst("^\\s+", ""));
            }
        }
        return sb.toString();
    }
}

