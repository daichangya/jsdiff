package com.github.jsdiff.patch;

import com.github.jsdiff.model.PatchHunk;
import com.github.jsdiff.model.StructuredPatch;
import com.github.jsdiff.util.StringUtil;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

/**
 * 应用补丁
 * 
 * @author rzy
 */
public class PatchApplier {
    
    /**
     * 应用补丁选项
     */
    public static class ApplyPatchOptions {
        private int fuzzFactor = 0;
        private boolean autoConvertLineEndings = true;
        
        public int getFuzzFactor() {
            return fuzzFactor;
        }
        
        public void setFuzzFactor(int fuzzFactor) {
            this.fuzzFactor = fuzzFactor;
        }
        
        public boolean isAutoConvertLineEndings() {
            return autoConvertLineEndings;
        }
        
        public void setAutoConvertLineEndings(boolean autoConvertLineEndings) {
            this.autoConvertLineEndings = autoConvertLineEndings;
        }
    }
    
    /**
     * 应用补丁到源文本
     * 
     * @param source 源文本
     * @param patch 补丁（字符串或结构化补丁）
     * @return 应用补丁后的文本，如果失败则返回 null
     */
    public static String applyPatch(String source, String patch) {
        List<StructuredPatch> patches = PatchParser.parsePatch(patch);
        if (patches.size() != 1) {
            throw new IllegalArgumentException("applyPatch only works with a single input.");
        }
        return applyPatch(source, patches.get(0), new ApplyPatchOptions());
    }
    
    /**
     * 应用结构化补丁到源文本
     * 
     * @param source 源文本
     * @param patch 结构化补丁
     * @return 应用补丁后的文本，如果失败则返回 null
     */
    public static String applyPatch(String source, StructuredPatch patch) {
        return applyPatch(source, patch, new ApplyPatchOptions());
    }
    
    /**
     * 应用结构化补丁到源文本（带选项）
     * 
     * @param source 源文本
     * @param patch 结构化补丁
     * @param options 应用选项
     * @return 应用补丁后的文本，如果失败则返回 null
     */
    public static String applyPatch(String source, StructuredPatch patch, ApplyPatchOptions options) {
        if (options.isAutoConvertLineEndings()) {
            if (StringUtil.hasOnlyWinLineEndings(source) && LineEndingsHandler.isUnix(patch)) {
                patch = LineEndingsHandler.unixToWin(patch);
            } else if (StringUtil.hasOnlyUnixLineEndings(source) && LineEndingsHandler.isWin(patch)) {
                patch = LineEndingsHandler.winToUnix(patch);
            }
        }
        
        List<String> lines = new ArrayList<>(Arrays.asList(source.split("\n", -1)));
        List<PatchHunk> hunks = patch.getHunks();
        
        // 特殊情况：空补丁
        if (hunks.isEmpty()) {
            return source;
        }
        
        int fuzzFactor = options.getFuzzFactor();
        if (fuzzFactor < 0) {
            throw new IllegalArgumentException("fuzzFactor must be a non-negative integer");
        }
        
        int offset = 0;
        
        for (PatchHunk hunk : hunks) {
            int toPos = hunk.getOldStart() - 1 + offset;
            ApplyHunkResult result = applyHunk(lines, hunk, toPos, fuzzFactor);
            
            if (result == null) {
                return null;  // 应用失败
            }
            
            lines = result.lines;
            offset += result.offset;
        }
        
        return String.join("\n", lines);
    }
    
    private static ApplyHunkResult applyHunk(List<String> lines, PatchHunk hunk, int toPos, int fuzzFactor) {
        List<String> hunkLines = hunk.getLines();
        
        // 提取 hunk 中的操作
        List<String> oldLines = new ArrayList<>();
        List<String> newLines = new ArrayList<>();
        
        for (String line : hunkLines) {
            if (line.startsWith("-")) {
                oldLines.add(line.substring(1));
            } else if (line.startsWith("+")) {
                newLines.add(line.substring(1));
            } else if (line.startsWith(" ")) {
                oldLines.add(line.substring(1));
                newLines.add(line.substring(1));
            }
        }
        
        // 简化的应用逻辑：直接在 toPos 位置应用
        if (toPos < 0 || toPos > lines.size()) {
            return null;
        }
        
        // 检查是否可以应用（简化的检查）
        int matchCount = 0;
        for (int i = 0; i < oldLines.size() && toPos + i < lines.size(); i++) {
            if (lines.get(toPos + i).equals(oldLines.get(i))) {
                matchCount++;
            }
        }
        
        // 如果匹配度太低，失败
        if (matchCount < oldLines.size() - fuzzFactor) {
            return null;
        }
        
        // 应用 hunk
        List<String> result = new ArrayList<>();
        result.addAll(lines.subList(0, toPos));
        result.addAll(newLines);
        if (toPos + oldLines.size() < lines.size()) {
            result.addAll(lines.subList(toPos + oldLines.size(), lines.size()));
        }
        
        int offset = newLines.size() - oldLines.size();
        return new ApplyHunkResult(result, offset);
    }
    
    private static class ApplyHunkResult {
        List<String> lines;
        int offset;
        
        ApplyHunkResult(List<String> lines, int offset) {
            this.lines = lines;
            this.offset = offset;
        }
    }
}

