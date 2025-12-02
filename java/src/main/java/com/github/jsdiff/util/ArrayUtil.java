package com.github.jsdiff.util;

import java.util.List;

/**
 * 数组工具类
 * 
 * @author rzy
 */
public class ArrayUtil {
    /**
     * 检查两个数组是否相等
     */
    public static <T> boolean arrayEqual(List<T> a, List<T> b) {
        if (a.size() != b.size()) {
            return false;
        }
        return arrayStartsWith(a, b);
    }

    /**
     * 检查数组是否以指定的子数组开头
     */
    public static <T> boolean arrayStartsWith(List<T> array, List<T> start) {
        if (start.size() > array.size()) {
            return false;
        }

        for (int i = 0; i < start.size(); i++) {
            T startItem = start.get(i);
            T arrayItem = array.get(i);
            if (startItem == null ? arrayItem != null : !startItem.equals(arrayItem)) {
                return false;
            }
        }

        return true;
    }
}

