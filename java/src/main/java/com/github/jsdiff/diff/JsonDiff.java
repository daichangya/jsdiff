package com.github.jsdiff.diff;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.github.jsdiff.Diff;
import com.github.jsdiff.model.ChangeObject;
import com.github.jsdiff.model.DiffOptions;

import java.util.List;

/**
 * JSON 对象差异比较
 * 先将对象序列化为格式化的 JSON，然后按行进行差异比较
 * 
 * @author rzy
 */
public class JsonDiff extends Diff<String> {
    
    private static final JsonDiff INSTANCE = new JsonDiff();
    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();
    
    static {
        OBJECT_MAPPER.enable(SerializationFeature.INDENT_OUTPUT);
        OBJECT_MAPPER.configure(SerializationFeature.ORDER_MAP_ENTRIES_BY_KEYS, true);
    }
    
    public static JsonDiff getInstance() {
        return INSTANCE;
    }
    
    /**
     * 对两个 JSON 对象进行差异比较
     * 
     * @param oldObj 旧对象
     * @param newObj 新对象
     * @return 变化对象列表
     */
    public static List<ChangeObject<String>> diffJson(Object oldObj, Object newObj) {
        return INSTANCE.diffObjects(oldObj, newObj);
    }
    
    /**
     * 对两个 JSON 对象进行差异比较（带选项）
     * 
     * @param oldObj 旧对象
     * @param newObj 新对象
     * @param options 差异选项
     * @return 变化对象列表
     */
    public static List<ChangeObject<String>> diffJson(Object oldObj, Object newObj, DiffOptions options) {
        return INSTANCE.diffObjects(oldObj, newObj, options);
    }
    
    /**
     * 对象差异比较
     */
    public List<ChangeObject<String>> diffObjects(Object oldObj, Object newObj) {
        return diffObjects(oldObj, newObj, new DiffOptions());
    }
    
    /**
     * 对象差异比较（带选项）
     */
    public List<ChangeObject<String>> diffObjects(Object oldObj, Object newObj, DiffOptions options) {
        String oldStr = serialize(oldObj);
        String newStr = serialize(newObj);
        return diff(oldStr, newStr, options);
    }
    
    @Override
    protected boolean useLongestToken() {
        // 区分两行漂亮打印的序列化 JSON，其中一行有尾随逗号，另一行没有
        // 包含尾随逗号会产生最好的输出
        return true;
    }
    
    @Override
    protected String castInput(String value, DiffOptions options) {
        // 如果输入已经是字符串，直接返回；否则序列化
        return value;
    }
    
    @Override
    protected boolean equals(String left, String right, DiffOptions options) {
        // 在比较时移除尾随逗号
        left = left.replaceAll(",([\r\n])", "$1");
        right = right.replaceAll(",([\r\n])", "$1");
        return super.equals(left, right, options);
    }
    
    @Override
    protected List<String> tokenize(String value, DiffOptions options) {
        // 使用 LineDiff 的标记化方法
        return LineDiff.getInstance().tokenize(value, options);
    }
    
    /**
     * 将对象序列化为格式化的 JSON 字符串
     */
    private String serialize(Object obj) {
        if (obj instanceof String) {
            return (String) obj;
        }
        try {
            return OBJECT_MAPPER.writeValueAsString(obj);
        } catch (Exception e) {
            throw new RuntimeException("Failed to serialize object to JSON", e);
        }
    }
}

