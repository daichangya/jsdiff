package com.github.jsdiff.convert;

import com.github.jsdiff.model.ChangeObject;

import java.util.ArrayList;
import java.util.List;

/**
 * 将变化对象转换为 Google diff-match-patch 库的格式
 * 
 * @author rzy
 */
public class DmpConverter {
    
    /**
     * DMP 操作类型
     */
    public static class DmpOperation<T> {
        /**
         * 操作类型：1 表示插入，0 表示相等，-1 表示删除
         */
        private final int operation;
        
        /**
         * 操作的值
         */
        private final T value;
        
        public DmpOperation(int operation, T value) {
            this.operation = operation;
            this.value = value;
        }
        
        public int getOperation() {
            return operation;
        }
        
        public T getValue() {
            return value;
        }
        
        @Override
        public String toString() {
            return "[" + operation + ", \"" + value + "\"]";
        }
    }
    
    /**
     * 将变化对象列表转换为 DMP 格式
     * 
     * @param changes 变化对象列表
     * @param <T> 值类型
     * @return DMP 格式的操作列表
     */
    public static <T> List<DmpOperation<T>> convertChangesToDMP(List<ChangeObject<T>> changes) {
        List<DmpOperation<T>> result = new ArrayList<>();
        
        for (ChangeObject<T> change : changes) {
            int operation;
            if (change.isAdded()) {
                operation = 1;
            } else if (change.isRemoved()) {
                operation = -1;
            } else {
                operation = 0;
            }
            
            result.add(new DmpOperation<>(operation, change.getValue()));
        }
        
        return result;
    }
}

