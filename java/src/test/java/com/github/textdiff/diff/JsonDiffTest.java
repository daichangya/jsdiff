package com.github.textdiff.diff;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.Test;

import com.github.textdiff.model.ChangeObject;

/**
 * JsonDiff 单元测试
 */
public class JsonDiffTest {
    
    @Test
    public void testSimpleObjectDiff() {
        Map<String, Object> oldObj = new HashMap<>();
        oldObj.put("a", 123);
        oldObj.put("b", 456);
        oldObj.put("c", 789);
        
        Map<String, Object> newObj = new HashMap<>();
        newObj.put("a", 123);
        newObj.put("b", 456);
        
        List<ChangeObject<String>> result = JsonDiff.diffJson(oldObj, newObj);
        
        assertThat(result).isNotEmpty();
        
        // 应该有删除的行
        boolean hasRemoved = result.stream().anyMatch(c -> c.isRemoved() && c.getValue().contains("789"));
        assertThat(hasRemoved).isTrue();
        
        // 应该有共同的部分
        boolean hasCommon = result.stream().anyMatch(c -> !c.isAdded() && !c.isRemoved());
        assertThat(hasCommon).isTrue();
    }
    
    @Test
    public void testObjectsWithDifferentKeyOrder() {
        Map<String, Object> oldObj = new HashMap<>();
        oldObj.put("a", 123);
        oldObj.put("b", 456);
        oldObj.put("c", 789);
        
        Map<String, Object> newObj = new HashMap<>();
        newObj.put("b", 456);
        newObj.put("a", 123);
        
        List<ChangeObject<String>> result = JsonDiff.diffJson(oldObj, newObj);
        
        // 键的顺序应该被规范化，所以结果应该和上一个测试类似
        assertThat(result).isNotEmpty();
        boolean hasRemoved = result.stream().anyMatch(c -> c.isRemoved() && c.getValue().contains("789"));
        assertThat(hasRemoved).isTrue();
    }
    
    @Test
    public void testNestedObjects() {
        Map<String, Object> nested1 = new HashMap<>();
        nested1.put("foo", "bar");
        
        Map<String, Object> oldObj = new HashMap<>();
        oldObj.put("a", 123);
        oldObj.put("b", nested1);
        
        Map<String, Object> nested2 = new HashMap<>();
        nested2.put("foo", "baz");
        
        Map<String, Object> newObj = new HashMap<>();
        newObj.put("a", 123);
        newObj.put("b", nested2);
        
        List<ChangeObject<String>> result = JsonDiff.diffJson(oldObj, newObj);
        
        assertThat(result).isNotEmpty();
        
        // 应该检测到嵌套值的变化
        boolean hasRemoved = result.stream().anyMatch(c -> c.isRemoved() && c.getValue().contains("bar"));
        boolean hasAdded = result.stream().anyMatch(c -> c.isAdded() && c.getValue().contains("baz"));
        
        assertThat(hasRemoved).isTrue();
        assertThat(hasAdded).isTrue();
    }
    
    @Test
    public void testNullValues() {
        Map<String, Object> oldObj = new HashMap<>();
        oldObj.put("a", 123);
        oldObj.put("b", 456);
        oldObj.put("c", null);
        
        Map<String, Object> newObj = new HashMap<>();
        newObj.put("a", 123);
        newObj.put("b", 456);
        
        List<ChangeObject<String>> result = JsonDiff.diffJson(oldObj, newObj);
        
        assertThat(result).isNotEmpty();
        
        // 应该检测到 null 值被删除
        boolean hasRemoved = result.stream().anyMatch(c -> c.isRemoved() && c.getValue().contains("null"));
        assertThat(hasRemoved).isTrue();
    }
    
    @Test
    public void testIdenticalObjects() {
        Map<String, Object> obj1 = new HashMap<>();
        obj1.put("a", 123);
        obj1.put("b", 456);
        
        Map<String, Object> obj2 = new HashMap<>();
        obj2.put("a", 123);
        obj2.put("b", 456);
        
        List<ChangeObject<String>> result = JsonDiff.diffJson(obj1, obj2);
        
        assertThat(result).isNotEmpty();
        
        // 所有变化应该都不是添加或删除
        boolean allCommon = result.stream().allMatch(c -> !c.isAdded() && !c.isRemoved());
        assertThat(allCommon).isTrue();
    }
    
    @Test
    public void testValueTypeChange() {
        Map<String, Object> oldObj = new HashMap<>();
        oldObj.put("a", "text");
        
        Map<String, Object> newObj = new HashMap<>();
        newObj.put("a", 123);
        
        List<ChangeObject<String>> result = JsonDiff.diffJson(oldObj, newObj);
        
        assertThat(result).isNotEmpty();
        
        // 应该有删除和添加
        boolean hasRemoved = result.stream().anyMatch(ChangeObject::isRemoved);
        boolean hasAdded = result.stream().anyMatch(ChangeObject::isAdded);
        
        assertThat(hasRemoved).isTrue();
        assertThat(hasAdded).isTrue();
    }
}

