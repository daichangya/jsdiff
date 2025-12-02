package com.github.jsdiff.model;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

/**
 * 结构化补丁块
 * 
 * @author rzy
 */
public class PatchHunk {
    /**
     * 旧行起始位置
     */
    private int oldStart;
    
    /**
     * 旧行数
     */
    private int oldLines;
    
    /**
     * 新行起始位置
     */
    private int newStart;
    
    /**
     * 新行数
     */
    private int newLines;
    
    /**
     * 行内容数组
     */
    private List<String> lines;

    public PatchHunk() {
        this.lines = new ArrayList<>();
    }

    public PatchHunk(int oldStart, int oldLines, int newStart, int newLines) {
        this.oldStart = oldStart;
        this.oldLines = oldLines;
        this.newStart = newStart;
        this.newLines = newLines;
        this.lines = new ArrayList<>();
    }

    public int getOldStart() {
        return oldStart;
    }

    public void setOldStart(int oldStart) {
        this.oldStart = oldStart;
    }

    public int getOldLines() {
        return oldLines;
    }

    public void setOldLines(int oldLines) {
        this.oldLines = oldLines;
    }

    public int getNewStart() {
        return newStart;
    }

    public void setNewStart(int newStart) {
        this.newStart = newStart;
    }

    public int getNewLines() {
        return newLines;
    }

    public void setNewLines(int newLines) {
        this.newLines = newLines;
    }

    public List<String> getLines() {
        return lines;
    }

    public void setLines(List<String> lines) {
        this.lines = lines;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        PatchHunk patchHunk = (PatchHunk) o;
        return oldStart == patchHunk.oldStart &&
               oldLines == patchHunk.oldLines &&
               newStart == patchHunk.newStart &&
               newLines == patchHunk.newLines &&
               Objects.equals(lines, patchHunk.lines);
    }

    @Override
    public int hashCode() {
        return Objects.hash(oldStart, oldLines, newStart, newLines, lines);
    }

    @Override
    public String toString() {
        return "PatchHunk{" +
               "oldStart=" + oldStart +
               ", oldLines=" + oldLines +
               ", newStart=" + newStart +
               ", newLines=" + newLines +
               ", lines=" + lines +
               '}';
    }
}

