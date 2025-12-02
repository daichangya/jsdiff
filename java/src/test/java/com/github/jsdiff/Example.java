package com.github.jsdiff;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import com.github.jsdiff.convert.DmpConverter;
import com.github.jsdiff.convert.XmlConverter;
import com.github.jsdiff.diff.CharacterDiff;
import com.github.jsdiff.diff.JsonDiff;
import com.github.jsdiff.diff.LineDiff;
import com.github.jsdiff.diff.WordDiff;
import com.github.jsdiff.model.ChangeObject;
import com.github.jsdiff.patch.PatchApplier;
import com.github.jsdiff.patch.PatchCreator;

/**
 * JSDiff Java 使用示例
 * 
 * @author rzy
 */
public class Example {
    
    public static void main(String[] args) {
        System.out.println("=== JSDiff Java 示例 ===\n");
        
        // 示例 1: 字符级别差异比较
        exampleCharacterDiff();
        
        // 示例 2: 单词级别差异比较
        exampleWordDiff();
        
        // 示例 3: 行级别差异比较
        exampleLineDiff();
        
        // 示例 4: JSON 对象差异比较
        exampleJsonDiff();
        
        // 示例 5: 创建和应用补丁
        examplePatch();
        
        // 示例 6: 格式转换
        exampleConvert();
    }
    
    private static void printSeparator() {
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < 50; i++) {
            sb.append("-");
        }
        System.out.println(sb.toString());
    }
    
    private static void exampleCharacterDiff() {
        System.out.println("1. 字符级别差异比较:");
        printSeparator();
        
        String oldStr = "beep boop";
        String newStr = "beep boob blah";
        
        List<ChangeObject<String>> changes = CharacterDiff.diffChars(oldStr, newStr);
        
        System.out.println("旧文本: " + oldStr);
        System.out.println("新文本: " + newStr);
        System.out.println("\n差异:");
        
        for (ChangeObject<String> change : changes) {
            String prefix = change.isAdded() ? "+ " : (change.isRemoved() ? "- " : "  ");
            System.out.println(prefix + change.getValue().replace("\n", "\\n"));
        }
        System.out.println("\n");
    }
    
    private static void exampleWordDiff() {
        System.out.println("2. 单词级别差异比较:");
        printSeparator();
        
        String oldStr = "hello world";
        String newStr = "hello beautiful world";
        
        List<ChangeObject<String>> changes = WordDiff.diffWords(oldStr, newStr);
        
        System.out.println("旧文本: " + oldStr);
        System.out.println("新文本: " + newStr);
        System.out.println("\n差异:");
        
        for (ChangeObject<String> change : changes) {
            String prefix = change.isAdded() ? "+ " : (change.isRemoved() ? "- " : "  ");
            System.out.println(prefix + change.getValue().trim());
        }
        System.out.println("\n");
    }
    
    private static void exampleLineDiff() {
        System.out.println("3. 行级别差异比较:");
        printSeparator();
        
        String oldText = "line1\nline2\nline3";
        String newText = "line1\nline2 modified\nline3\nline4";
        
        List<ChangeObject<String>> changes = LineDiff.diffLines(oldText, newText);
        
        System.out.println("旧文本:");
        System.out.println(oldText);
        System.out.println("\n新文本:");
        System.out.println(newText);
        System.out.println("\n差异:");
        
        for (ChangeObject<String> change : changes) {
            String[] lines = change.getValue().split("\n", -1);
            for (String line : lines) {
                if (!line.isEmpty()) {
                    String prefix = change.isAdded() ? "+ " : (change.isRemoved() ? "- " : "  ");
                    System.out.println(prefix + line);
                }
            }
        }
        System.out.println("\n");
    }
    
    private static void exampleJsonDiff() {
        System.out.println("4. JSON 对象差异比较:");
        printSeparator();
        
        Map<String, Object> oldObj = new HashMap<>();
        oldObj.put("name", "Alice");
        oldObj.put("age", 25);
        oldObj.put("city", "Beijing");
        
        Map<String, Object> newObj = new HashMap<>();
        newObj.put("name", "Alice");
        newObj.put("age", 26);
        newObj.put("city", "Shanghai");
        
        List<ChangeObject<String>> changes = JsonDiff.diffJson(oldObj, newObj);
        
        System.out.println("旧对象: {name: \"Alice\", age: 25, city: \"Beijing\"}");
        System.out.println("新对象: {name: \"Alice\", age: 26, city: \"Shanghai\"}");
        System.out.println("\n差异:");
        
        for (ChangeObject<String> change : changes) {
            if (change.isAdded()) {
                System.out.println("+ " + change.getValue().trim());
            } else if (change.isRemoved()) {
                System.out.println("- " + change.getValue().trim());
            } else {
                // 只打印非空的公共行
                String value = change.getValue().trim();
                System.out.println("  " + value);
            }
        }
        System.out.println("\n");
    }
    
    private static void examplePatch() {
        System.out.println("5. 创建和应用补丁:");
        printSeparator();
        
        String oldText = "line1\nline2\nline3";
        String newText = "line1\nline2 modified\nline3";
        
        // 创建补丁
        String patch = PatchCreator.createPatch("test.txt", oldText, newText);
        System.out.println("创建的补丁:");
        System.out.println(patch);
        
        // 应用补丁
        String result = PatchApplier.applyPatch(oldText, patch);
        System.out.println("应用补丁后的结果:");
        System.out.println(result);
        System.out.println("\n结果是否正确: " + result.equals(newText));
        System.out.println("\n");
    }
    
    private static void exampleConvert() {
        System.out.println("6. 格式转换:");
        printSeparator();
        
        String oldStr = "abc";
        String newStr = "adc";
        
        List<ChangeObject<String>> changes = CharacterDiff.diffChars(oldStr, newStr);
        
        // 转换为 XML
        String xml = XmlConverter.convertChangesToXML(changes);
        System.out.println("XML 格式:");
        System.out.println(xml);
        
        // 转换为 DMP
        List<DmpConverter.DmpOperation<String>> dmp = DmpConverter.convertChangesToDMP(changes);
        System.out.println("\nDMP 格式:");
        for (DmpConverter.DmpOperation<String> op : dmp) {
            System.out.println(op);
        }
        System.out.println();
    }
}

