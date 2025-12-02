package com.github.jsdiff.diff;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;

import org.junit.jupiter.api.Test;

import com.github.jsdiff.model.ChangeObject;

/**
 * LineDiff 单元测试
 */
public class LineDiffTest {
    
    @Test
    public void testLineDiff() {
        String oldText = "line1\nline2\nline3";
        String newText = "line1\nline2 modified\nline3";
        
        List<ChangeObject<String>> result = LineDiff.diffLines(oldText, newText);
        
        assertThat(result).hasSize(4);
        assertThat(result.get(0).getValue()).isEqualTo("line1\n");
        assertThat(result.get(0).isAdded()).isFalse();
        assertThat(result.get(0).isRemoved()).isFalse();
        
        assertThat(result.get(1).getValue()).isEqualTo("line2\n");
        assertThat(result.get(1).isRemoved()).isTrue();
        
        assertThat(result.get(2).getValue()).isEqualTo("line2 modified\n");
        assertThat(result.get(2).isAdded()).isTrue();
        
        assertThat(result.get(3).getValue()).isEqualTo("line3");
        assertThat(result.get(3).isAdded()).isFalse();
        assertThat(result.get(3).isRemoved()).isFalse();
    }
    
    @Test
    public void testAddLine() {
        String oldText = "line1\nline2";
        String newText = "line1\nline2\nline3";
        
        List<ChangeObject<String>> result = LineDiff.diffLines(oldText, newText);
        
        assertThat(result).isNotEmpty();
        // 应该有添加的行
        boolean foundAdded = false;
        for (ChangeObject<String> change : result) {
            if (change.isAdded() && change.getValue().contains("line3")) {
                foundAdded = true;
                break;
            }
        }
        assertThat(foundAdded).isTrue();
    }
    
    @Test
    public void testRemoveLine() {
        String oldText = "line1\nline2\nline3";
        String newText = "line1\nline3";
        
        List<ChangeObject<String>> result = LineDiff.diffLines(oldText, newText);
        
        assertThat(result).isNotEmpty();
        // 找到被删除的行
        boolean foundRemoved = false;
        for (ChangeObject<String> change : result) {
            if (change.isRemoved() && change.getValue().equals("line2\n")) {
                foundRemoved = true;
                break;
            }
        }
        assertThat(foundRemoved).isTrue();
    }
}

