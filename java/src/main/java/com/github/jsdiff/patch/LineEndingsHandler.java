package com.github.jsdiff.patch;

import com.github.jsdiff.model.PatchHunk;
import com.github.jsdiff.model.StructuredPatch;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

/**
 * 处理补丁中的行尾转换（Unix/Windows）
 * 
 * @author rzy
 */
public class LineEndingsHandler {
    
    /**
     * 将 Unix 行尾转换为 Windows 行尾
     */
    public static StructuredPatch unixToWin(StructuredPatch patch) {
        StructuredPatch result = copyPatch(patch);
        List<PatchHunk> newHunks = new ArrayList<>();
        
        for (PatchHunk hunk : result.getHunks()) {
            PatchHunk newHunk = new PatchHunk();
            newHunk.setOldStart(hunk.getOldStart());
            newHunk.setOldLines(hunk.getOldLines());
            newHunk.setNewStart(hunk.getNewStart());
            newHunk.setNewLines(hunk.getNewLines());
            
            List<String> newLines = new ArrayList<>();
            for (int i = 0; i < hunk.getLines().size(); i++) {
                String line = hunk.getLines().get(i);
                String nextLine = i + 1 < hunk.getLines().size() ? hunk.getLines().get(i + 1) : null;
                
                if (line.startsWith("\\") || line.endsWith("\r") || (nextLine != null && nextLine.startsWith("\\"))) {
                    newLines.add(line);
                } else {
                    newLines.add(line + "\r");
                }
            }
            newHunk.setLines(newLines);
            newHunks.add(newHunk);
        }
        
        result.setHunks(newHunks);
        return result;
    }
    
    /**
     * 将 Windows 行尾转换为 Unix 行尾
     */
    public static StructuredPatch winToUnix(StructuredPatch patch) {
        StructuredPatch result = copyPatch(patch);
        List<PatchHunk> newHunks = new ArrayList<>();
        
        for (PatchHunk hunk : result.getHunks()) {
            PatchHunk newHunk = new PatchHunk();
            newHunk.setOldStart(hunk.getOldStart());
            newHunk.setOldLines(hunk.getOldLines());
            newHunk.setNewStart(hunk.getNewStart());
            newHunk.setNewLines(hunk.getNewLines());
            
            List<String> newLines = hunk.getLines().stream()
                .map(line -> line.endsWith("\r") ? line.substring(0, line.length() - 1) : line)
                .collect(Collectors.toList());
            
            newHunk.setLines(newLines);
            newHunks.add(newHunk);
        }
        
        result.setHunks(newHunks);
        return result;
    }
    
    /**
     * 检查补丁是否使用 Unix 行尾
     */
    public static boolean isUnix(StructuredPatch patch) {
        for (PatchHunk hunk : patch.getHunks()) {
            for (String line : hunk.getLines()) {
                if (!line.startsWith("\\") && line.endsWith("\r")) {
                    return false;
                }
            }
        }
        return true;
    }
    
    /**
     * 检查补丁是否使用 Windows 行尾
     */
    public static boolean isWin(StructuredPatch patch) {
        boolean hasWinEnding = false;
        for (PatchHunk hunk : patch.getHunks()) {
            for (String line : hunk.getLines()) {
                if (line.endsWith("\r")) {
                    hasWinEnding = true;
                    break;
                }
            }
        }
        
        if (!hasWinEnding) {
            return false;
        }
        
        // 检查所有行是否一致使用 Windows 行尾
        for (PatchHunk hunk : patch.getHunks()) {
            List<String> lines = hunk.getLines();
            for (int i = 0; i < lines.size(); i++) {
                String line = lines.get(i);
                String nextLine = i + 1 < lines.size() ? lines.get(i + 1) : null;
                
                if (!line.startsWith("\\") && !line.endsWith("\r") && 
                    (nextLine == null || !nextLine.startsWith("\\"))) {
                    return false;
                }
            }
        }
        
        return true;
    }
    
    private static StructuredPatch copyPatch(StructuredPatch patch) {
        StructuredPatch copy = new StructuredPatch();
        copy.setOldFileName(patch.getOldFileName());
        copy.setNewFileName(patch.getNewFileName());
        copy.setOldHeader(patch.getOldHeader());
        copy.setNewHeader(patch.getNewHeader());
        copy.setIndex(patch.getIndex());
        copy.setHunks(new ArrayList<>(patch.getHunks()));
        return copy;
    }
}

