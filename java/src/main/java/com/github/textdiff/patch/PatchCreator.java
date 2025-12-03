package com.github.textdiff.patch;

import java.util.ArrayList;
import java.util.List;

import com.github.textdiff.diff.LineDiff;
import com.github.textdiff.model.ChangeObject;
import com.github.textdiff.model.DiffOptions;
import com.github.textdiff.model.PatchHunk;
import com.github.textdiff.model.StructuredPatch;

/**
 * 创建补丁
 * 
 * @author daichangya
 */
public class PatchCreator {
    
    /**
     * 创建结构化补丁
     * 
     * @param oldFileName 旧文件名
     * @param newFileName 新文件名
     * @param oldStr 旧字符串
     * @param newStr 新字符串
     * @return 结构化补丁
     */
    public static StructuredPatch structuredPatch(String oldFileName, String newFileName,
                                                   String oldStr, String newStr) {
        return structuredPatch(oldFileName, newFileName, oldStr, newStr, null, null, 4);
    }
    
    /**
     * 创建结构化补丁（完整参数）
     * 
     * @param oldFileName 旧文件名
     * @param newFileName 新文件名
     * @param oldStr 旧字符串
     * @param newStr 新字符串
     * @param oldHeader 旧文件头
     * @param newHeader 新文件头
     * @param context 上下文行数
     * @return 结构化补丁
     */
    public static StructuredPatch structuredPatch(String oldFileName, String newFileName,
                                                   String oldStr, String newStr,
                                                   String oldHeader, String newHeader,
                                                   int context) {
        DiffOptions options = new DiffOptions();
        List<ChangeObject<String>> diff = LineDiff.diffLines(oldStr, newStr, options);
        
        return diffToPatch(oldFileName, newFileName, diff, oldHeader, newHeader, context);
    }
    
    /**
     * 创建两个文件的补丁（unified diff 格式）
     * 
     * @param oldFileName 旧文件名
     * @param newFileName 新文件名
     * @param oldStr 旧字符串
     * @param newStr 新字符串
     * @return unified diff 格式的补丁字符串
     */
    public static String createTwoFilesPatch(String oldFileName, String newFileName,
                                             String oldStr, String newStr) {
        return createTwoFilesPatch(oldFileName, newFileName, oldStr, newStr, null, null, 4);
    }
    
    /**
     * 创建两个文件的补丁（unified diff 格式，完整参数）
     * 
     * @param oldFileName 旧文件名
     * @param newFileName 新文件名
     * @param oldStr 旧字符串
     * @param newStr 新字符串
     * @param oldHeader 旧文件头
     * @param newHeader 新文件头
     * @param context 上下文行数
     * @return unified diff 格式的补丁字符串
     */
    public static String createTwoFilesPatch(String oldFileName, String newFileName,
                                             String oldStr, String newStr,
                                             String oldHeader, String newHeader,
                                             int context) {
        StructuredPatch patch = structuredPatch(oldFileName, newFileName, oldStr, newStr,
                                                oldHeader, newHeader, context);
        return formatPatch(patch);
    }
    
    /**
     * 创建补丁（旧文件名等于新文件名）
     * 
     * @param fileName 文件名
     * @param oldStr 旧字符串
     * @param newStr 新字符串
     * @return unified diff 格式的补丁字符串
     */
    public static String createPatch(String fileName, String oldStr, String newStr) {
        return createTwoFilesPatch(fileName, fileName, oldStr, newStr);
    }
    
    /**
     * 将结构化补丁格式化为 unified diff 字符串
     * 
     * @param patch 结构化补丁
     * @return unified diff 格式的字符串
     */
    public static String formatPatch(StructuredPatch patch) {
        StringBuilder result = new StringBuilder();
        
        if (patch.getOldFileName().equals(patch.getNewFileName())) {
            result.append("Index: ").append(patch.getOldFileName()).append("\n");
            result.append("===================================================================\n");
        }
        
        result.append("--- ").append(patch.getOldFileName());
        if (patch.getOldHeader() != null) {
            result.append("\t").append(patch.getOldHeader());
        }
        result.append("\n");
        
        result.append("+++ ").append(patch.getNewFileName());
        if (patch.getNewHeader() != null) {
            result.append("\t").append(patch.getNewHeader());
        }
        result.append("\n");
        
        for (PatchHunk hunk : patch.getHunks()) {
            result.append("@@ -").append(hunk.getOldStart()).append(",").append(hunk.getOldLines())
                  .append(" +").append(hunk.getNewStart()).append(",").append(hunk.getNewLines())
                  .append(" @@\n");
            
            for (String line : hunk.getLines()) {
                result.append(line);
                // 只有在行不以换行符结尾时才添加换行符
                if (!line.endsWith("\n")) {
                    result.append("\n");
                }
            }
        }
        
        return result.toString();
    }
    
    private static StructuredPatch diffToPatch(String oldFileName, String newFileName,
                                                List<ChangeObject<String>> diff,
                                                String oldHeader, String newHeader,
                                                int context) {
        StructuredPatch patch = new StructuredPatch(oldFileName, newFileName);
        patch.setOldHeader(oldHeader);
        patch.setNewHeader(newHeader);
        
        List<PatchHunk> hunks = new ArrayList<>();
        int oldLine = 1;
        int newLine = 1;
        List<String> curRange = new ArrayList<>();
        int oldRangeStart = 0;
        int newRangeStart = 0;
        
        // 添加一个空的 change 以简化处理
        List<ChangeObject<String>> extendedDiff = new ArrayList<>(diff);
        extendedDiff.add(new ChangeObject<>("", false, false, 0));
        
        for (int i = 0; i < extendedDiff.size(); i++) {
            ChangeObject<String> current = extendedDiff.get(i);
            String[] lines = splitLines(current.getValue());
            
            if (current.isAdded() || current.isRemoved()) {
                if (oldRangeStart == 0) {
                    oldRangeStart = oldLine;
                    newRangeStart = newLine;
                    
                    if (i > 0) {
                        ChangeObject<String> prev = extendedDiff.get(i - 1);
                        String[] prevLines = splitLines(prev.getValue());
                        int startContext = Math.max(0, prevLines.length - context);
                        for (int j = startContext; j < prevLines.length; j++) {
                            curRange.add(" " + prevLines[j]);
                        }
                        oldRangeStart -= (prevLines.length - startContext);
                        newRangeStart -= (prevLines.length - startContext);
                    }
                }
                
                for (String line : lines) {
                    curRange.add((current.isAdded() ? "+" : "-") + line);
                }
                
                if (current.isAdded()) {
                    newLine += lines.length;
                } else {
                    oldLine += lines.length;
                }
            } else {
                if (oldRangeStart != 0) {
                    // 添加上下文
                    for (int j = 0; j < Math.min(context, lines.length); j++) {
                        curRange.add(" " + lines[j]);
                    }
                    
                    // 创建 hunk
                    PatchHunk hunk = new PatchHunk();
                    hunk.setOldStart(oldRangeStart);
                    hunk.setNewStart(newRangeStart);
                    hunk.setOldLines((int) curRange.stream().filter(l -> l.startsWith(" ") || l.startsWith("-")).count());
                    hunk.setNewLines((int) curRange.stream().filter(l -> l.startsWith(" ") || l.startsWith("+")).count());
                    hunk.setLines(new ArrayList<>(curRange));
                    hunks.add(hunk);
                    
                    oldRangeStart = 0;
                    newRangeStart = 0;
                    curRange.clear();
                }
                
                oldLine += lines.length;
                newLine += lines.length;
            }
        }
        
        patch.setHunks(hunks);
        return patch;
    }
    
    private static String[] splitLines(String value) {
        if (value == null || value.isEmpty()) {
            return new String[0];
        }
        // 如果值以换行符结尾，先移除它，因为 LineDiff 的 token 已经包含了换行符
        if (value.endsWith("\n")) {
            value = value.substring(0, value.length() - 1);
            // 分割后再给每一行加回换行符
            String[] lines = value.split("\n", -1);
            for (int i = 0; i < lines.length; i++) {
                lines[i] = lines[i] + "\n";
            }
            return lines;
        } else {
            return value.split("\n", -1);
        }
    }
}

