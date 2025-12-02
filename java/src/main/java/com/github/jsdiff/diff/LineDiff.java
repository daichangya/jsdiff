package com.github.jsdiff.diff;

import com.github.jsdiff.Diff;
import com.github.jsdiff.model.ChangeObject;
import com.github.jsdiff.model.DiffOptions;

import java.util.ArrayList;
import java.util.List;
import java.util.regex.Pattern;

/**
 * 行级别差异比较
 * 将每行视为一个 token
 * 
 * @author rzy
 */
public class LineDiff extends Diff<String> {
    
    private static final LineDiff INSTANCE = new LineDiff();
    private static final Pattern LINE_SPLIT_PATTERN = Pattern.compile("(\n|\r\n)");
    private static final Pattern NEWLINE_PATTERN = Pattern.compile("\n|\r\n");
    
    public static LineDiff getInstance() {
        return INSTANCE;
    }
    
    /**
     * 对两个文本块进行行级别的差异比较
     * 
     * @param oldStr 旧字符串
     * @param newStr 新字符串
     * @return 变化对象列表
     */
    public static List<ChangeObject<String>> diffLines(String oldStr, String newStr) {
        return INSTANCE.diff(oldStr, newStr);
    }
    
    /**
     * 对两个文本块进行行级别的差异比较（带选项）
     * 
     * @param oldStr 旧字符串
     * @param newStr 新字符串
     * @param options 差异选项
     * @return 变化对象列表
     */
    public static List<ChangeObject<String>> diffLines(String oldStr, String newStr, DiffOptions options) {
        return INSTANCE.diff(oldStr, newStr, options);
    }
    
    /**
     * 对两个文本块进行行级别的差异比较（忽略空白）
     * 
     * @param oldStr 旧字符串
     * @param newStr 新字符串
     * @return 变化对象列表
     */
    public static List<ChangeObject<String>> diffTrimmedLines(String oldStr, String newStr) {
        DiffOptions options = new DiffOptions();
        options.setIgnoreWhitespace(true);
        return INSTANCE.diff(oldStr, newStr, options);
    }
    
    @Override
    protected boolean equals(String left, String right, DiffOptions options) {
        // 如果我们忽略空白，我们需要通过去除空白来规范化行
        if (options.isIgnoreWhitespace()) {
            if (!options.isNewlineIsToken() || !left.contains("\n")) {
                left = left.trim();
            }
            if (!options.isNewlineIsToken() || !right.contains("\n")) {
                right = right.trim();
            }
        } else if (options.isIgnoreNewlineAtEof() && !options.isNewlineIsToken()) {
            if (left.endsWith("\n")) {
                left = left.substring(0, left.length() - 1);
            }
            if (right.endsWith("\n")) {
                right = right.substring(0, right.length() - 1);
            }
        }
        return super.equals(left, right, options);
    }
    
    @Override
    protected List<String> tokenize(String value, DiffOptions options) {
        if (options.isStripTrailingCr()) {
            // 移除 \n 之前的一个 \r 以匹配 GNU diff 的 --strip-trailing-cr 行为
            value = value.replace("\r\n", "\n");
        }

        // 手动分割以保留分隔符（类似 JavaScript 的 split(/(\n|\r\n)/)）
        List<String> linesAndNewlines = new ArrayList<>();
        int start = 0;
        java.util.regex.Matcher matcher = NEWLINE_PATTERN.matcher(value);
        
        while (matcher.find()) {
            // 添加分隔符之前的内容
            linesAndNewlines.add(value.substring(start, matcher.start()));
            // 添加分隔符本身
            linesAndNewlines.add(matcher.group());
            start = matcher.end();
        }
        // 添加最后剩余的内容
        linesAndNewlines.add(value.substring(start));

        // 如果字符串以换行符结尾，则忽略最后的空标记
        int size = linesAndNewlines.size();
        if (size > 0 && linesAndNewlines.get(size - 1).isEmpty()) {
            linesAndNewlines.remove(size - 1);
        }

        List<String> retLines = new ArrayList<>();
        // 将内容和行分隔符合并为单个标记
        for (int i = 0; i < linesAndNewlines.size(); i++) {
            String line = linesAndNewlines.get(i);

            if (i % 2 == 1 && !options.isNewlineIsToken()) {
                // 这是一个换行符，合并到前一行
                if (!retLines.isEmpty()) {
                    int lastIndex = retLines.size() - 1;
                    retLines.set(lastIndex, retLines.get(lastIndex) + line);
                }
            } else {
                retLines.add(line);
            }
        }

        return retLines;
    }
}

