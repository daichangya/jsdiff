package com.github.textdiff.diff;

import com.github.textdiff.Diff;
import com.github.textdiff.model.ChangeObject;
import com.github.textdiff.model.DiffOptions;

import java.util.ArrayList;
import java.util.List;

/**
 * 句子级别差异比较
 * 将每个句子及其之间的空白视为 token
 * 
 * @author daichangya
 */
public class SentenceDiff extends Diff<String> {
    
    private static final SentenceDiff INSTANCE = new SentenceDiff();
    
    public static SentenceDiff getInstance() {
        return INSTANCE;
    }
    
    /**
     * 对两个文本块进行句子级别的差异比较
     * 
     * @param oldStr 旧字符串
     * @param newStr 新字符串
     * @return 变化对象列表
     */
    public static List<ChangeObject<String>> diffSentences(String oldStr, String newStr) {
        return INSTANCE.diff(oldStr, newStr);
    }
    
    /**
     * 对两个文本块进行句子级别的差异比较（带选项）
     * 
     * @param oldStr 旧字符串
     * @param newStr 新字符串
     * @param options 差异选项
     * @return 变化对象列表
     */
    public static List<ChangeObject<String>> diffSentences(String oldStr, String newStr, DiffOptions options) {
        return INSTANCE.diff(oldStr, newStr, options);
    }
    
    private boolean isSentenceEndPunct(char c) {
        return c == '.' || c == '!' || c == '?';
    }
    
    @Override
    protected List<String> tokenize(String value, DiffOptions options) {
        List<String> result = new ArrayList<>();
        int tokenStartI = 0;
        
        for (int i = 0; i < value.length(); i++) {
            if (i == value.length() - 1) {
                result.add(value.substring(tokenStartI));
                break;
            }

            if (isSentenceEndPunct(value.charAt(i)) && 
                i + 1 < value.length() && Character.isWhitespace(value.charAt(i + 1))) {
                // 我们遇到了句子分隔 - 即标点符号后跟空白
                // 我们现在想要向结果推送两个标记：
                // 1. 句子
                result.add(value.substring(tokenStartI, i + 1));

                // 2. 空白
                tokenStartI = i + 1;
                while (i + 1 < value.length() && Character.isWhitespace(value.charAt(i + 1))) {
                    i++;
                }
                result.add(value.substring(tokenStartI, i + 1));

                // 然后下一个标记（句子）从空白后的字符开始
                tokenStartI = i + 1;
            }
        }

        return result;
    }
}

