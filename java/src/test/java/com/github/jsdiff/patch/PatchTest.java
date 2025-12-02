package com.github.jsdiff.patch;

import com.github.jsdiff.model.StructuredPatch;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Patch 功能单元测试
 */
public class PatchTest {
    
    @Test
    public void testCreatePatch() {
        String oldText = "line1\nline2\nline3";
        String newText = "line1\nline2 modified\nline3";
        
        String patch = PatchCreator.createPatch("test.txt", oldText, newText);
        
        assertThat(patch).contains("--- test.txt");
        assertThat(patch).contains("+++ test.txt");
        assertThat(patch).contains("@@");
        assertThat(patch).contains("-line2");
        assertThat(patch).contains("+line2 modified");
    }
    
    @Test
    public void testParsePatch() {
        String patchStr = "--- test.txt\n" +
                         "+++ test.txt\n" +
                         "@@ -1,3 +1,3 @@\n" +
                         " line1\n" +
                         "-line2\n" +
                         "+line2 modified\n" +
                         " line3\n";
        
        List<StructuredPatch> patches = PatchParser.parsePatch(patchStr);
        
        assertThat(patches).hasSize(1);
        StructuredPatch patch = patches.get(0);
        assertThat(patch.getOldFileName()).isEqualTo("test.txt");
        assertThat(patch.getNewFileName()).isEqualTo("test.txt");
        assertThat(patch.getHunks()).hasSize(1);
    }
    
    @Test
    public void testApplyPatch() {
        String oldText = "line1\nline2\nline3";
        String newText = "line1\nline2 modified\nline3";
        
        String patch = PatchCreator.createPatch("test.txt", oldText, newText);
        String result = PatchApplier.applyPatch(oldText, patch);
        
        assertThat(result).isEqualTo(newText);
    }
    
    @Test
    public void testReversePatch() {
        String oldText = "line1\nline2\nline3";
        String newText = "line1\nline2 modified\nline3";
        
        StructuredPatch patch = PatchCreator.structuredPatch("test.txt", "test.txt", 
                                                             oldText, newText);
        StructuredPatch reversed = PatchReverser.reversePatch(patch);
        
        assertThat(reversed.getOldFileName()).isEqualTo(patch.getNewFileName());
        assertThat(reversed.getNewFileName()).isEqualTo(patch.getOldFileName());
    }
}

