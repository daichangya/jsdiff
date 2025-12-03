package com.github.textdiff.model;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

/**
 * 结构化补丁
 * 
 * @author daichangya
 */
public class StructuredPatch {
    /**
     * 旧文件名
     */
    private String oldFileName;
    
    /**
     * 新文件名
     */
    private String newFileName;
    
    /**
     * 旧文件头
     */
    private String oldHeader;
    
    /**
     * 新文件头
     */
    private String newHeader;
    
    /**
     * 补丁块数组
     */
    private List<PatchHunk> hunks;
    
    /**
     * 索引信息（可选）
     */
    private String index;

    public StructuredPatch() {
        this.hunks = new ArrayList<>();
    }

    public StructuredPatch(String oldFileName, String newFileName) {
        this.oldFileName = oldFileName;
        this.newFileName = newFileName;
        this.hunks = new ArrayList<>();
    }

    public String getOldFileName() {
        return oldFileName;
    }

    public void setOldFileName(String oldFileName) {
        this.oldFileName = oldFileName;
    }

    public String getNewFileName() {
        return newFileName;
    }

    public void setNewFileName(String newFileName) {
        this.newFileName = newFileName;
    }

    public String getOldHeader() {
        return oldHeader;
    }

    public void setOldHeader(String oldHeader) {
        this.oldHeader = oldHeader;
    }

    public String getNewHeader() {
        return newHeader;
    }

    public void setNewHeader(String newHeader) {
        this.newHeader = newHeader;
    }

    public List<PatchHunk> getHunks() {
        return hunks;
    }

    public void setHunks(List<PatchHunk> hunks) {
        this.hunks = hunks;
    }

    public String getIndex() {
        return index;
    }

    public void setIndex(String index) {
        this.index = index;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        StructuredPatch that = (StructuredPatch) o;
        return Objects.equals(oldFileName, that.oldFileName) &&
               Objects.equals(newFileName, that.newFileName) &&
               Objects.equals(oldHeader, that.oldHeader) &&
               Objects.equals(newHeader, that.newHeader) &&
               Objects.equals(hunks, that.hunks) &&
               Objects.equals(index, that.index);
    }

    @Override
    public int hashCode() {
        return Objects.hash(oldFileName, newFileName, oldHeader, newHeader, hunks, index);
    }

    @Override
    public String toString() {
        return "StructuredPatch{" +
               "oldFileName='" + oldFileName + '\'' +
               ", newFileName='" + newFileName + '\'' +
               ", oldHeader='" + oldHeader + '\'' +
               ", newHeader='" + newHeader + '\'' +
               ", hunks=" + hunks +
               ", index='" + index + '\'' +
               '}';
    }
}

