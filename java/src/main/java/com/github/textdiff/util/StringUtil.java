package com.github.textdiff.util;

import java.util.regex.Pattern;

/**
 * 字符串工具类
 * 
 * @author daichangya
 */
public class StringUtil {
    private static final Pattern WHITESPACE_PATTERN = Pattern.compile("\\s");
    private static final Pattern LEADING_WS_PATTERN = Pattern.compile("^\\s*");

    /**
     * 查找两个字符串的最长公共前缀
     */
    public static String longestCommonPrefix(String str1, String str2) {
        int i;
        int minLen = Math.min(str1.length(), str2.length());
        for (i = 0; i < minLen; i++) {
            if (str1.charAt(i) != str2.charAt(i)) {
                return str1.substring(0, i);
            }
        }
        return str1.substring(0, i);
    }

    /**
     * 查找两个字符串的最长公共后缀
     */
    public static String longestCommonSuffix(String str1, String str2) {
        if (str1 == null || str2 == null || str1.isEmpty() || str2.isEmpty() ||
            str1.charAt(str1.length() - 1) != str2.charAt(str2.length() - 1)) {
            return "";
        }

        int i;
        int minLen = Math.min(str1.length(), str2.length());
        for (i = 0; i < minLen; i++) {
            if (str1.charAt(str1.length() - (i + 1)) != str2.charAt(str2.length() - (i + 1))) {
                return str1.substring(str1.length() - i);
            }
        }
        return str1.substring(str1.length() - i);
    }

    /**
     * 替换字符串前缀
     */
    public static String replacePrefix(String string, String oldPrefix, String newPrefix) {
        if (!string.startsWith(oldPrefix)) {
            throw new IllegalArgumentException(
                String.format("string \"%s\" doesn't start with prefix \"%s\"; this is a bug", string, oldPrefix));
        }
        return newPrefix + string.substring(oldPrefix.length());
    }

    /**
     * 替换字符串后缀
     */
    public static String replaceSuffix(String string, String oldSuffix, String newSuffix) {
        if (oldSuffix.isEmpty()) {
            return string + newSuffix;
        }

        if (!string.endsWith(oldSuffix)) {
            throw new IllegalArgumentException(
                String.format("string \"%s\" doesn't end with suffix \"%s\"; this is a bug", string, oldSuffix));
        }
        return string.substring(0, string.length() - oldSuffix.length()) + newSuffix;
    }

    /**
     * 移除字符串前缀
     */
    public static String removePrefix(String string, String oldPrefix) {
        return replacePrefix(string, oldPrefix, "");
    }

    /**
     * 移除字符串后缀
     */
    public static String removeSuffix(String string, String oldSuffix) {
        return replaceSuffix(string, oldSuffix, "");
    }

    /**
     * 计算两个字符串的最大重叠
     */
    public static String maximumOverlap(String string1, String string2) {
        return string2.substring(0, overlapCount(string1, string2));
    }

    /**
     * 计算两个字符串的重叠数量（使用 KMP 算法）
     */
    private static int overlapCount(String a, String b) {
        int startA = 0;
        if (a.length() > b.length()) {
            startA = a.length() - b.length();
        }
        int endB = b.length();
        if (a.length() < b.length()) {
            endB = a.length();
        }

        int[] map = new int[endB];
        int k = 0;
        map[0] = 0;
        for (int j = 1; j < endB; j++) {
            if (b.charAt(j) == b.charAt(k)) {
                map[j] = map[k];
            } else {
                map[j] = k;
            }
            while (k > 0 && b.charAt(j) != b.charAt(k)) {
                k = map[k];
            }
            if (b.charAt(j) == b.charAt(k)) {
                k++;
            }
        }

        k = 0;
        for (int i = startA; i < a.length(); i++) {
            while (k > 0 && a.charAt(i) != b.charAt(k)) {
                k = map[k];
            }
            if (a.charAt(i) == b.charAt(k)) {
                k++;
            }
        }
        return k;
    }

    /**
     * 检查字符串是否只使用 Windows 行尾（\r\n）
     */
    public static boolean hasOnlyWinLineEndings(String string) {
        return string.contains("\r\n") && !string.startsWith("\n") && !string.matches("[^\r]\n");
    }

    /**
     * 检查字符串是否只使用 Unix 行尾（\n）
     */
    public static boolean hasOnlyUnixLineEndings(String string) {
        return !string.contains("\r\n") && string.contains("\n");
    }

    /**
     * 获取字符串末尾的空白字符
     */
    public static String trailingWs(String string) {
        int i;
        for (i = string.length() - 1; i >= 0; i--) {
            if (!WHITESPACE_PATTERN.matcher(String.valueOf(string.charAt(i))).matches()) {
                break;
            }
        }
        return string.substring(i + 1);
    }

    /**
     * 获取字符串开头的空白字符
     */
    public static String leadingWs(String string) {
        java.util.regex.Matcher matcher = LEADING_WS_PATTERN.matcher(string);
        return matcher.find() ? matcher.group() : "";
    }

    /**
     * 将字符串转换为 Unicode 码点数组（类似 JS 的 for...of）
     */
    public static int[] toCodePoints(String str) {
        return str.codePoints().toArray();
    }

    /**
     * 将 Unicode 码点数组转换为字符串
     */
    public static String fromCodePoints(int[] codePoints) {
        return new String(codePoints, 0, codePoints.length);
    }
}

