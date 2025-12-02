package com.github.jsdiff.diff;

import com.github.jsdiff.model.ChangeObject;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * WordDiff 单元测试
 */
public class WordDiffTest {
    
    @Test
    public void testWordDiff() {
        String oldText = "hello world";
        String newText = "hello beautiful world";
        
        List<ChangeObject<String>> result = WordDiff.diffWords(oldText, newText);
        
        assertThat(result).hasSize(3);
        assertThat(result.get(0).getValue()).contains("hello");
        assertThat(result.get(0).isAdded()).isFalse();
        assertThat(result.get(0).isRemoved()).isFalse();
        
        assertThat(result.get(1).getValue()).contains("beautiful");
        assertThat(result.get(1).isAdded()).isTrue();
        
        assertThat(result.get(2).getValue()).contains("world");
        assertThat(result.get(2).isAdded()).isFalse();
        assertThat(result.get(2).isRemoved()).isFalse();
    }
    
    @Test
    public void testWordReplacement() {
        String oldText = "foo bar baz";
        String newText = "foo qux baz";
        
        List<ChangeObject<String>> result = WordDiff.diffWords(oldText, newText);
        
        assertThat(result).hasSize(4);
        assertThat(result.get(1).isRemoved()).isTrue();
        assertThat(result.get(2).isAdded()).isTrue();
    }
}

