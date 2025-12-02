package com.github.jsdiff.patch;

import com.github.jsdiff.model.PatchHunk;
import com.github.jsdiff.model.StructuredPatch;

import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * 解析 unified diff 格式的补丁
 * 
 * @author rzy
 */
public class PatchParser {
    
    private static final Pattern HEADER_PATTERN = Pattern.compile("^(?:Index:|diff(?: -r \\w+)+)\\s+(.+?)\\s*$");
    private static final Pattern FILE_HEADER_PATTERN = Pattern.compile("^(---|\\+\\+\\+)\\s+(.*)\\r?$");
    private static final Pattern HUNK_HEADER_PATTERN = Pattern.compile("@@ -(\\d+)(?:,(\\d+))? \\+(\\d+)(?:,(\\d+))? @@");
    
    /**
     * 将 unified diff 格式的字符串解析为结构化补丁列表
     * 
     * @param uniDiff unified diff 字符串
     * @return 结构化补丁列表
     */
    public static List<StructuredPatch> parsePatch(String uniDiff) {
        String[] lines = uniDiff.split("\n");
        List<StructuredPatch> patches = new ArrayList<>();
        int i = 0;
        
        while (i < lines.length) {
            StructuredPatch patch = new StructuredPatch();
            patches.add(patch);
            
            // 解析元数据
            while (i < lines.length) {
                String line = lines[i];
                if (line.matches("^(---|\\+\\+\\+|@@)\\s.*")) {
                    break;
                }
                
                Matcher headerMatcher = HEADER_PATTERN.matcher(line);
                if (headerMatcher.matches()) {
                    patch.setIndex(headerMatcher.group(1));
                }
                i++;
            }
            
            // 解析文件头
            i = parseFileHeader(lines, i, patch, true);
            i = parseFileHeader(lines, i, patch, false);
            
            // 解析 hunks
            List<PatchHunk> hunks = new ArrayList<>();
            while (i < lines.length) {
                String line = lines[i];
                if (line.matches("^(Index:\\s|diff\\s|---\\s|\\+\\+\\+\\s|===================================================================).*")) {
                    break;
                } else if (line.startsWith("@@")) {
                    ParseHunkResult result = parseHunk(lines, i);
                    hunks.add(result.hunk);
                    i = result.nextIndex;
                } else if (!line.isEmpty()) {
                    i++;
                } else {
                    i++;
                }
            }
            patch.setHunks(hunks);
        }
        
        return patches;
    }
    
    private static int parseFileHeader(String[] lines, int index, StructuredPatch patch, boolean isOld) {
        if (index >= lines.length) {
            return index;
        }
        
        Matcher matcher = FILE_HEADER_PATTERN.matcher(lines[index]);
        if (matcher.matches()) {
            String prefix = matcher.group(1);
            String content = matcher.group(2);
            String[] parts = content.split("\t", 2);
            String fileName = parts[0].replace("\\\\", "\\");
            String header = parts.length > 1 ? parts[1].trim() : "";
            
            if (fileName.startsWith("\"") && fileName.endsWith("\"")) {
                fileName = fileName.substring(1, fileName.length() - 1);
            }
            
            if (prefix.equals("---")) {
                patch.setOldFileName(fileName);
                patch.setOldHeader(header.isEmpty() ? null : header);
            } else {
                patch.setNewFileName(fileName);
                patch.setNewHeader(header.isEmpty() ? null : header);
            }
            
            return index + 1;
        }
        
        return index;
    }
    
    private static ParseHunkResult parseHunk(String[] lines, int index) {
        String hunkHeader = lines[index++];
        Matcher matcher = HUNK_HEADER_PATTERN.matcher(hunkHeader);
        
        if (!matcher.find()) {
            throw new RuntimeException("Invalid hunk header: " + hunkHeader);
        }
        
        PatchHunk hunk = new PatchHunk();
        hunk.setOldStart(Integer.parseInt(matcher.group(1)));
        hunk.setOldLines(matcher.group(2) != null ? Integer.parseInt(matcher.group(2)) : 1);
        hunk.setNewStart(Integer.parseInt(matcher.group(3)));
        hunk.setNewLines(matcher.group(4) != null ? Integer.parseInt(matcher.group(4)) : 1);
        
        // Unified Diff Format quirk
        if (hunk.getOldLines() == 0) {
            hunk.setOldStart(hunk.getOldStart() + 1);
        }
        if (hunk.getNewLines() == 0) {
            hunk.setNewStart(hunk.getNewStart() + 1);
        }
        
        List<String> hunkLines = new ArrayList<>();
        int addCount = 0;
        int removeCount = 0;
        
        while (index < lines.length && 
               (removeCount < hunk.getOldLines() || addCount < hunk.getNewLines() || 
                (index < lines.length && lines[index].startsWith("\\")))) {
            String line = lines[index];
            char operation = (line.isEmpty() && index != lines.length - 1) ? ' ' : line.charAt(0);
            
            if (operation == '+' || operation == '-' || operation == ' ' || operation == '\\') {
                hunkLines.add(line);
                
                if (operation == '+') {
                    addCount++;
                } else if (operation == '-') {
                    removeCount++;
                } else if (operation == ' ') {
                    addCount++;
                    removeCount++;
                }
                index++;
            } else {
                break;
            }
        }
        
        hunk.setLines(hunkLines);
        return new ParseHunkResult(hunk, index);
    }
    
    private static class ParseHunkResult {
        PatchHunk hunk;
        int nextIndex;
        
        ParseHunkResult(PatchHunk hunk, int nextIndex) {
            this.hunk = hunk;
            this.nextIndex = nextIndex;
        }
    }
}

