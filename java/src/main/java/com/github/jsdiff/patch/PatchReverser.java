package com.github.jsdiff.patch;

import com.github.jsdiff.model.PatchHunk;
import com.github.jsdiff.model.StructuredPatch;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

/**
 * 反转补丁
 * 
 * @author rzy
 */
public class PatchReverser {
    
    /**
     * 反转单个结构化补丁
     * 
     * @param patch 要反转的补丁
     * @return 反转后的补丁
     */
    public static StructuredPatch reversePatch(StructuredPatch patch) {
        StructuredPatch reversed = new StructuredPatch();
        
        // 交换文件名和头部
        reversed.setOldFileName(patch.getNewFileName());
        reversed.setNewFileName(patch.getOldFileName());
        reversed.setOldHeader(patch.getNewHeader());
        reversed.setNewHeader(patch.getOldHeader());
        reversed.setIndex(patch.getIndex());
        
        // 反转每个 hunk
        List<PatchHunk> reversedHunks = new ArrayList<>();
        for (PatchHunk hunk : patch.getHunks()) {
            PatchHunk reversedHunk = new PatchHunk();
            reversedHunk.setOldLines(hunk.getNewLines());
            reversedHunk.setOldStart(hunk.getNewStart());
            reversedHunk.setNewLines(hunk.getOldLines());
            reversedHunk.setNewStart(hunk.getOldStart());
            
            // 反转行：+ 变 -，- 变 +
            List<String> reversedLines = hunk.getLines().stream()
                .map(line -> {
                    if (line.startsWith("-")) {
                        return "+" + line.substring(1);
                    } else if (line.startsWith("+")) {
                        return "-" + line.substring(1);
                    }
                    return line;
                })
                .collect(Collectors.toList());
            
            reversedHunk.setLines(reversedLines);
            reversedHunks.add(reversedHunk);
        }
        
        reversed.setHunks(reversedHunks);
        return reversed;
    }
    
    /**
     * 反转补丁列表
     * 
     * @param patches 要反转的补丁列表
     * @return 反转后的补丁列表（顺序也会反转）
     */
    public static List<StructuredPatch> reversePatch(List<StructuredPatch> patches) {
        List<StructuredPatch> reversed = patches.stream()
            .map(PatchReverser::reversePatch)
            .collect(Collectors.toList());
        Collections.reverse(reversed);
        return reversed;
    }
}

