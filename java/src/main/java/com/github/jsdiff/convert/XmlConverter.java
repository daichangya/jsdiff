package com.github.jsdiff.convert;

import com.github.jsdiff.model.ChangeObject;

import java.util.List;

/**
 * 将变化对象转换为 XML 格式
 * 
 * @author rzy
 */
public class XmlConverter {
    
    /**
     * 将变化对象列表转换为序列化的 XML 格式
     * 
     * @param changes 变化对象列表
     * @return XML 格式的字符串
     */
    public static String convertChangesToXML(List<ChangeObject<String>> changes) {
        StringBuilder result = new StringBuilder();
        
        for (ChangeObject<String> change : changes) {
            if (change.isAdded()) {
                result.append("<ins>");
            } else if (change.isRemoved()) {
                result.append("<del>");
            }
            
            result.append(escapeHTML(change.getValue()));
            
            if (change.isAdded()) {
                result.append("</ins>");
            } else if (change.isRemoved()) {
                result.append("</del>");
            }
        }
        
        return result.toString();
    }
    
    /**
     * 转义 HTML 特殊字符
     * 
     * @param s 要转义的字符串
     * @return 转义后的字符串
     */
    private static String escapeHTML(String s) {
        String result = s;
        result = result.replace("&", "&amp;");
        result = result.replace("<", "&lt;");
        result = result.replace(">", "&gt;");
        result = result.replace("\"", "&quot;");
        return result;
    }
}

