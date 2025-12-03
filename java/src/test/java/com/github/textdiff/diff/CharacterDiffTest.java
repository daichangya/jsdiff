package com.github.textdiff.diff;

import com.github.textdiff.model.ChangeObject;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * CharacterDiff 单元测试
 */
public class CharacterDiffTest {
    
    @Test
    public void testSimpleDiff() {
        List<ChangeObject<String>> result = CharacterDiff.diffChars("beep boop", "beep boob blah");
        
        assertThat(result).hasSize(3);
        assertThat(result.get(0).getValue()).isEqualTo("beep boo");
        assertThat(result.get(0).isAdded()).isFalse();
        assertThat(result.get(0).isRemoved()).isFalse();
        
        assertThat(result.get(1).getValue()).isEqualTo("p");
        assertThat(result.get(1).isRemoved()).isTrue();
        
        assertThat(result.get(2).getValue()).isEqualTo("b blah");
        assertThat(result.get(2).isAdded()).isTrue();
    }
    
    @Test
    public void testIdenticalStrings() {
        List<ChangeObject<String>> result = CharacterDiff.diffChars("hello", "hello");
        
        assertThat(result).hasSize(1);
        assertThat(result.get(0).getValue()).isEqualTo("hello");
        assertThat(result.get(0).isAdded()).isFalse();
        assertThat(result.get(0).isRemoved()).isFalse();
    }
    
    @Test
    public void testCompletelyDifferent() {
        List<ChangeObject<String>> result = CharacterDiff.diffChars("abc", "xyz");
        
        assertThat(result).hasSize(2);
        assertThat(result.get(0).isRemoved()).isTrue();
        assertThat(result.get(1).isAdded()).isTrue();
    }
}

