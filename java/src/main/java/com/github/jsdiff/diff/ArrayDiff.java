package com.github.jsdiff.diff;

import com.github.jsdiff.Diff;
import com.github.jsdiff.model.ChangeObject;
import com.github.jsdiff.model.DiffOptions;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

/**
 * 数组差异比较
 * 比较数组中的每个项，使用严格相等性（或自定义比较器）
 * 
 * @author rzy
 */
public class ArrayDiff<T> extends Diff<T> {
    
    /**
     * 对两个数组进行差异比较
     * 
     * @param oldArr 旧数组
     * @param newArr 新数组
     * @param <T> 数组元素类型
     * @return 变化对象列表
     */
    public static <T> List<ChangeObject<String>> diffArrays(T[] oldArr, T[] newArr) {
        return diffArrays(Arrays.asList(oldArr), Arrays.asList(newArr));
    }
    
    /**
     * 对两个列表进行差异比较
     * 
     * @param oldList 旧列表
     * @param newList 新列表
     * @param <T> 列表元素类型
     * @return 变化对象列表
     */
    public static <T> List<ChangeObject<String>> diffArrays(List<T> oldList, List<T> newList) {
        return diffArrays(oldList, newList, new DiffOptions());
    }
    
    /**
     * 对两个列表进行差异比较（带选项）
     * 
     * @param oldList 旧列表
     * @param newList 新列表
     * @param options 差异选项
     * @param <T> 列表元素类型
     * @return 变化对象列表
     */
    @SuppressWarnings("unchecked")
    public static <T> List<ChangeObject<String>> diffArrays(List<T> oldList, List<T> newList, DiffOptions options) {
        ArrayDiff<T> arrayDiff = new ArrayDiff<>();
        // 将列表转换为字符串以便使用基础 diff 方法
        // 这里我们使用一个特殊的序列化方法
        String oldStr = serializeList(oldList);
        String newStr = serializeList(newList);
        
        // 存储原始列表供 tokenize 使用
        arrayDiff.oldListCache = oldList;
        arrayDiff.newListCache = newList;
        
        return arrayDiff.diff(oldStr, newStr, options);
    }
    
    private List<T> oldListCache;
    private List<T> newListCache;
    
    private static <T> String serializeList(List<T> list) {
        // 使用特殊标记来序列化，以便在 tokenize 中恢复
        return "__LIST__:" + list.size();
    }
    
    @Override
    protected List<T> tokenize(String value, DiffOptions options) {
        // 从缓存中恢复原始列表
        if (value.startsWith("__LIST__:")) {
            int size = Integer.parseInt(value.substring(9));
            List<T> result = new ArrayList<>(size);
            
            // 确定使用哪个缓存
            List<T> sourceList = (oldListCache != null && oldListCache.size() == size) ? 
                oldListCache : newListCache;
            
            if (sourceList != null) {
                result.addAll(sourceList);
            }
            return result;
        }
        return new ArrayList<>();
    }
    
    @Override
    protected String join(List<T> tokens) {
        // ArrayDiff 不需要 join 操作，因为我们直接处理对象
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < tokens.size(); i++) {
            if (i > 0) sb.append(",");
            sb.append(tokens.get(i));
        }
        return sb.toString();
    }
    
    @Override
    protected List<T> removeEmpty(List<T> array) {
        // ArrayDiff 不移除空元素
        return array;
    }
}

