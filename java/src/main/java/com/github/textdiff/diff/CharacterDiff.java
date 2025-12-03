package com.github.textdiff.diff;

import com.github.textdiff.Diff;
import com.github.textdiff.model.ChangeObject;
import com.github.textdiff.model.DiffOptions;
import com.github.textdiff.util.StringUtil;

import java.util.ArrayList;
import java.util.List;

/**
 * 字符级别差异比较
 * 将每个 Unicode 码点视为一个 token
 * 
 * @author daichangya
 */
public class CharacterDiff extends Diff<String> {
    
    private static final CharacterDiff INSTANCE = new CharacterDiff();
    
    public static CharacterDiff getInstance() {
        return INSTANCE;
    }
    
    /**
     * 对两个文本块进行字符级别的差异比较
     * 
     * @param oldStr 旧字符串
     * @param newStr 新字符串
     * @return 变化对象列表
     */
    public static List<ChangeObject<String>> diffChars(String oldStr, String newStr) {
        return INSTANCE.diff(oldStr, newStr);
    }
    
    /**
     * 对两个文本块进行字符级别的差异比较（带选项）
     * 
     * @param oldStr 旧字符串
     * @param newStr 新字符串
     * @param options 差异选项
     * @return 变化对象列表
     */
    public static List<ChangeObject<String>> diffChars(String oldStr, String newStr, DiffOptions options) {
        return INSTANCE.diff(oldStr, newStr, options);
    }
    
    @Override
    protected List<String> tokenize(String value, DiffOptions options) {
        // 将字符串转换为 Unicode 码点列表（类似 JS 的 for...of）
        List<String> tokens = new ArrayList<>();
        int[] codePoints = StringUtil.toCodePoints(value);
        for (int codePoint : codePoints) {
            tokens.add(new String(new int[]{codePoint}, 0, 1));
        }
        return tokens;
    }
}

