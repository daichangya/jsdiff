/**
 * 滚动同步模块
 * 实现A、B、结果区域之间的滚动同步功能
 * @author Auto
 */
(function() {
    'use strict';
    
    // 滚动同步变量（通过window暴露，供主文件访问）
    window.currentDiff = null; // 存储当前diff结果
    window.diffMapping = null; // 存储结果区域和A/B位置的映射
    window.lineMappingTable = null; // 快速查找表: resultLineNum -> {aLineNum, bLineNum}
    
    // 内部变量
    var isSyncing = false; // 防止循环同步的标志
    var syncSource = null; // 跟踪触发同步的元素
    var scrollSyncRafId = null; // RAF ID用于滚动节流
    
    // 存储DOM元素引用（由主文件设置）
    var a, b, result;
    var currentViewMode = 'text'; // 由主文件管理
    
    /**
     * 初始化滚动同步模块
     * @param {HTMLElement} aElement - A区域元素
     * @param {HTMLElement} bElement - B区域元素
     * @param {HTMLElement} resultElement - 结果区域元素
     * @param {Function} getCurrentViewMode - 获取当前视图模式的函数
     */
    window.initScrollSync = function(aElement, bElement, resultElement, getCurrentViewMode) {
        a = aElement;
        b = bElement;
        result = resultElement;
        if (getCurrentViewMode) {
            // 创建一个函数来获取当前视图模式
            window.getCurrentViewMode = getCurrentViewMode;
        }
        setupScrollSync();
    };
    
    /**
     * 建立结果区域和A/B文本位置之间的映射
     * @param {Array} diff - diff结果数组
     * @param {string} textA - A区域文本
     * @param {string} textB - B区域文本
     * @param {string} diffType - diff类型
     */
    window.buildDiffMapping = function(diff, textA, textB, diffType) {
        if (!diff || !Array.isArray(diff)) {
            window.diffMapping = null;
            window.lineMappingTable = null;
            return;
        }
        
        // 对于JSON结构化视图，使用百分比同步（复杂映射）
        if (window.diffType === 'diffJson' && window.getCurrentViewMode && window.getCurrentViewMode() === 'structured') {
            window.diffMapping = null;
            window.lineMappingTable = null;
            return;
        }
        
        var mapping = [];
        var aPos = 0; // A文本中的当前位置
        var bPos = 0; // B文本中的当前位置
        var resultPos = 0; // 结果中的当前位置（字符计数）
        
        // 对于diffLines模式，也跟踪行号
        var aLineNum = 0; // A中的当前行号（0-based）
        var bLineNum = 0; // B中的当前行号（0-based）
        var resultLineNum = 0; // 结果中的当前行号（0-based）
        var isLineMode = (diffType === 'diffLines' || diffType === 'diffPatch');
        
        for (var i = 0; i < diff.length; i++) {
            var part = diff[i];
            var value = part.value || '';
            var length = value.length;
            
            // 计算此部分的行数
            var linesInPart = 0;
            if (isLineMode) {
                // 在行模式下，每个部分通常代表一行
                var newlineCount = (value.match(/\n/g) || []).length;
                linesInPart = newlineCount > 0 ? newlineCount : (value.length > 0 ? 1 : 0);
            } else {
                linesInPart = (value.match(/\n/g) || []).length;
            }
            
            var aLinesInPart = 0;
            var bLinesInPart = 0;
            var resultLinesInPart = linesInPart;
            
            var mappingItem = {
                diffIndex: i,
                resultStart: resultPos,
                resultEnd: resultPos + length,
                resultLineStart: resultLineNum,
                resultLineEnd: resultLineNum + resultLinesInPart,
                type: part.removed ? 'removed' : (part.added ? 'added' : 'unchanged'),
                aStart: -1,
                aEnd: -1,
                aLineStart: -1,
                aLineEnd: -1,
                bStart: -1,
                bEnd: -1,
                bLineStart: -1,
                bLineEnd: -1
            };
            
            if (part.removed) {
                // 只存在于A
                mappingItem.aStart = aPos;
                mappingItem.aEnd = aPos + length;
                aLinesInPart = linesInPart;
                mappingItem.aLineStart = aLineNum;
                mappingItem.aLineEnd = aLineNum + aLinesInPart;
                aPos += length;
                aLineNum += aLinesInPart;
            } else if (part.added) {
                // 只存在于B
                mappingItem.bStart = bPos;
                mappingItem.bEnd = bPos + length;
                bLinesInPart = linesInPart;
                mappingItem.bLineStart = bLineNum;
                mappingItem.bLineEnd = bLineNum + bLinesInPart;
                bPos += length;
                bLineNum += bLinesInPart;
            } else {
                // 同时存在于A和B
                mappingItem.aStart = aPos;
                mappingItem.aEnd = aPos + length;
                mappingItem.bStart = bPos;
                mappingItem.bEnd = bPos + length;
                aLinesInPart = linesInPart;
                bLinesInPart = linesInPart;
                mappingItem.aLineStart = aLineNum;
                mappingItem.aLineEnd = aLineNum + aLinesInPart;
                mappingItem.bLineStart = bLineNum;
                mappingItem.bLineEnd = bLineNum + bLinesInPart;
                aPos += length;
                bPos += length;
                aLineNum += aLinesInPart;
                bLineNum += bLinesInPart;
            }
            
            resultPos += length;
            resultLineNum += resultLinesInPart;
            mapping.push(mappingItem);
        }
        
        window.diffMapping = mapping;
        
        // 建立快速查找表用于行号映射（用于diffLines模式）
        if (isLineMode && mapping.length > 0) {
            var lineTable = new Map();
            for (var m = 0; m < mapping.length; m++) {
                var item = mapping[m];
                if (item.resultLineStart >= 0 && item.resultLineEnd >= 0) {
                    for (var line = item.resultLineStart; line < item.resultLineEnd; line++) {
                        var relativeLine = line - item.resultLineStart;
                        var aLine = -1;
                        var bLine = -1;
                        
                        if (item.type === 'removed' && item.aLineStart >= 0) {
                            aLine = item.aLineStart + relativeLine;
                        } else if (item.type === 'added' && item.bLineStart >= 0) {
                            bLine = item.bLineStart + relativeLine;
                        } else if (item.type === 'unchanged') {
                            if (item.aLineStart >= 0) aLine = item.aLineStart + relativeLine;
                            if (item.bLineStart >= 0) bLine = item.bLineStart + relativeLine;
                        }
                        
                        lineTable.set(line, { aLine: aLine, bLine: bLine, type: item.type });
                    }
                }
            }
            window.lineMappingTable = lineTable;
        } else {
            window.lineMappingTable = null;
        }
    };
    
    /**
     * 获取特定像素位置对应的行号（使用Range API提高精度）
     * @param {HTMLElement} element - 目标元素
     * @param {number} pixelY - 像素Y位置
     * @returns {number} 行号
     */
    function getLineNumberAtPosition(element, pixelY) {
        if (!element || pixelY < 0) return 0;
        
        // 对于textarea元素，使用更简单的计算
        if (element.tagName === 'TEXTAREA') {
            var lineHeight = parseInt(window.getComputedStyle(element).lineHeight) || 20;
            return Math.floor(pixelY / lineHeight);
        }
        
        // 对于pre元素（结果区域），使用更精确的方法
        var textContent = element.textContent || '';
        if (!textContent) return 0;
        
        // 尝试使用Range API以获得更高精度
        try {
            var elementRect = element.getBoundingClientRect();
            var targetX = elementRect.left + 10; // 左侧边缘的小偏移
            var targetY = elementRect.top + pixelY;
            
            // 使用document.caretRangeFromPoint或document.createRange
            var range = null;
            if (document.caretRangeFromPoint) {
                range = document.caretRangeFromPoint(targetX, targetY);
            } else if (document.createRange && document.createRange().getBoundingClientRect) {
                // 对于不支持caretRangeFromPoint的浏览器的后备方案
                range = document.createRange();
            }
            
            if (range && range.commonAncestorContainer) {
                // 计算到range位置的文本节点数
                var walker = document.createTreeWalker(
                    element,
                    NodeFilter.SHOW_TEXT,
                    null,
                    false
                );
                
                var node;
                var charCount = 0;
                var foundTarget = false;
                
                while (node = walker.nextNode()) {
                    if (foundTarget) break;
                    
                    var nodeText = node.textContent || '';
                    var nodeLength = nodeText.length;
                    
                    // 检查此节点是否包含或位于目标位置之后
                    if (node === range.commonAncestorContainer || 
                        (range.commonAncestorContainer.nodeType === Node.TEXT_NODE && 
                         node === range.commonAncestorContainer)) {
                        // 我们在目标节点中，计算部分位置
                        if (range.startContainer === node) {
                            charCount += range.startOffset;
                            foundTarget = true;
                        } else {
                            charCount += nodeLength;
                        }
                    } else {
                        charCount += nodeLength;
                    }
                }
                
                // 计算到此字符位置的行数
                var textUpToPos = textContent.substring(0, charCount);
                return (textUpToPos.match(/\n/g) || []).length;
            }
        } catch (e) {
            // 回退到后备方法
        }
        
        // 后备：使用行高估算（最可靠）
        var lineHeight = parseInt(window.getComputedStyle(element).lineHeight) || 20;
        var estimatedLine = Math.floor(pixelY / lineHeight);
        
        // 限制在有效范围内
        var totalLines = (textContent.match(/\n/g) || []).length;
        return Math.max(0, Math.min(estimatedLine, totalLines));
    }
    
    /**
     * 在结果区域中查找给定滚动位置的diff元素
     * @param {HTMLElement} element - 结果元素
     * @param {number} scrollTop - 滚动位置
     * @returns {Object|null} 映射项
     */
    function findDiffElementAtPosition(element, scrollTop) {
        if (!window.diffMapping || !element || window.diffMapping.length === 0) return null;
        
        // 对于diffLines模式，使用基于行的计算以获得更高精度
        if (window.diffType === 'diffLines' || window.diffType === 'diffPatch') {
            // 计算视口中心的行号（更精确）
            var viewportCenter = scrollTop + (element.clientHeight / 2);
            var centerLine = getLineNumberAtPosition(element, viewportCenter);
            
            // 如果可用，使用快速查找表
            if (window.lineMappingTable && window.lineMappingTable.has(centerLine)) {
                var lineInfo = window.lineMappingTable.get(centerLine);
                // 查找包含此行的映射项
                for (var j = 0; j < window.diffMapping.length; j++) {
                    var item = window.diffMapping[j];
                    if (item.resultLineStart >= 0 && item.resultLineEnd >= 0) {
                        if (centerLine >= item.resultLineStart && centerLine < item.resultLineEnd) {
                            return item;
                        }
                    }
                }
            }
            
            // 后备：查找包含此行号的映射项
            for (var j = 0; j < window.diffMapping.length; j++) {
                var item = window.diffMapping[j];
                if (item.resultLineStart >= 0 && item.resultLineEnd >= 0) {
                    if (centerLine >= item.resultLineStart && centerLine < item.resultLineEnd) {
                        return item;
                    }
                }
            }
            
            // 如果没有精确匹配，查找最接近的映射项
            var closest = window.diffMapping[0];
            var minDist = Infinity;
            for (var k = 0; k < window.diffMapping.length; k++) {
                var item = window.diffMapping[k];
                if (item.resultLineStart >= 0) {
                    var dist = Math.abs(centerLine - item.resultLineStart);
                    if (item.resultLineEnd >= 0) {
                        var distToEnd = Math.abs(centerLine - item.resultLineEnd);
                        if (distToEnd < dist) dist = distToEnd;
                    }
                    if (dist < minDist) {
                        minDist = dist;
                        closest = item;
                    }
                }
            }
            return closest;
        }
        
        // 对于其他模式，使用字符位置
        var textContent = element.textContent || '';
        var totalChars = textContent.length;
        
        if (totalChars === 0) return window.diffMapping[0];
        
        var scrollHeight = element.scrollHeight - element.clientHeight;
        if (scrollHeight <= 0) return window.diffMapping[0];
        
        // 使用视口中心位置进行更精确的映射
        var viewportCenter = scrollTop + (element.clientHeight / 2);
        var scrollPercentage = viewportCenter / element.scrollHeight;
        var estimatedCharPos = Math.floor(scrollPercentage * totalChars);
        
        // 限制在有效范围内
        estimatedCharPos = Math.max(0, Math.min(estimatedCharPos, totalChars - 1));
        
        // 查找包含此位置的映射项
        for (var j = 0; j < window.diffMapping.length; j++) {
            var item = window.diffMapping[j];
            if (estimatedCharPos >= item.resultStart && estimatedCharPos <= item.resultEnd) {
                return item;
            }
        }
        
        // 后备：返回最接近的映射项
        var closest = window.diffMapping[0];
        var minDist = Math.abs(estimatedCharPos - closest.resultStart);
        for (var k = 1; k < window.diffMapping.length; k++) {
            var dist = Math.abs(estimatedCharPos - window.diffMapping[k].resultStart);
            if (dist < minDist) {
                minDist = dist;
                closest = window.diffMapping[k];
            }
        }
        return closest;
    }
    
    /**
     * 将textarea滚动到特定字符位置
     * @param {HTMLTextAreaElement} textarea - 目标textarea
     * @param {number} charPosition - 字符位置
     */
    function scrollToTextPosition(textarea, charPosition) {
        if (!textarea || charPosition < 0) return;
        
        var text = textarea.value || '';
        if (charPosition > text.length) charPosition = text.length;
        
        // 对于diffLines模式，使用基于行的计算以获得更高精度
        if (window.diffType === 'diffLines' || window.diffType === 'diffPatch') {
            // 计算到字符位置的行数
            var textBefore = text.substring(0, charPosition);
            var lines = textBefore.split('\n');
            var targetLineIndex = lines.length - 1; // 行索引（0-based）
            
            // 创建临时元素以测量精确的行位置
            var tempDiv = document.createElement('div');
            var style = window.getComputedStyle(textarea);
            tempDiv.style.position = 'absolute';
            tempDiv.style.visibility = 'hidden';
            tempDiv.style.whiteSpace = 'pre-wrap';
            tempDiv.style.font = style.font;
            tempDiv.style.fontSize = style.fontSize;
            tempDiv.style.fontFamily = style.fontFamily;
            tempDiv.style.padding = style.padding;
            tempDiv.style.border = style.border;
            tempDiv.style.width = textarea.clientWidth + 'px';
            tempDiv.style.wordWrap = 'break-word';
            document.body.appendChild(tempDiv);
            
            // 测量到目标行的高度
            var textUpToLine = lines.slice(0, targetLineIndex + 1).join('\n');
            tempDiv.textContent = textUpToLine;
            var heightUpToLine = tempDiv.scrollHeight;
            
            // 计算滚动位置以将目标行居中
            var lineHeight = parseInt(style.lineHeight) || 20;
            var scrollTop = heightUpToLine - (textarea.clientHeight / 2) - (lineHeight / 2);
            
            document.body.removeChild(tempDiv);
            
            textarea.scrollTop = Math.max(0, scrollTop);
            return;
        }
        
        // 对于其他模式，使用原始方法
        // 创建临时元素以测量行位置
        var tempDiv = document.createElement('div');
        var style = window.getComputedStyle(textarea);
        tempDiv.style.position = 'absolute';
        tempDiv.style.visibility = 'hidden';
        tempDiv.style.whiteSpace = 'pre-wrap';
        tempDiv.style.font = style.font;
        tempDiv.style.fontSize = style.fontSize;
        tempDiv.style.fontFamily = style.fontFamily;
        tempDiv.style.padding = style.padding;
        tempDiv.style.border = style.border;
        tempDiv.style.width = textarea.clientWidth + 'px';
        tempDiv.style.wordWrap = 'break-word';
        document.body.appendChild(tempDiv);
        
        // 获取到目标位置的文本
        var textBefore = text.substring(0, charPosition);
        tempDiv.textContent = textBefore;
        
        // 计算滚动位置
        var lineHeight = parseInt(style.lineHeight) || 20;
        var scrollTop = tempDiv.scrollHeight - textarea.clientHeight / 2;
        
        document.body.removeChild(tempDiv);
        
        // 设置滚动位置
        textarea.scrollTop = Math.max(0, scrollTop);
    }
    
    /**
     * 将textarea滚动到特定行号（优化，支持平滑滚动）
     * @param {HTMLTextAreaElement} textarea - 目标textarea
     * @param {number} lineNumber - 行号（0-based）
     * @param {boolean} smooth - 是否使用平滑滚动
     */
    function scrollToLineNumber(textarea, lineNumber, smooth) {
        if (!textarea || lineNumber < 0) return;
        
        var text = textarea.value || '';
        var lines = text.split('\n');
        if (lineNumber >= lines.length) lineNumber = lines.length - 1;
        
        // 创建临时元素以测量精确的行位置
        var tempDiv = document.createElement('div');
        var style = window.getComputedStyle(textarea);
        tempDiv.style.position = 'absolute';
        tempDiv.style.visibility = 'hidden';
        tempDiv.style.whiteSpace = 'pre-wrap';
        tempDiv.style.font = style.font;
        tempDiv.style.fontSize = style.fontSize;
        tempDiv.style.fontFamily = style.fontFamily;
        tempDiv.style.padding = style.padding;
        tempDiv.style.border = style.border;
        tempDiv.style.width = textarea.clientWidth + 'px';
        tempDiv.style.wordWrap = 'break-word';
        tempDiv.style.boxSizing = style.boxSizing;
        document.body.appendChild(tempDiv);
        
        // 测量到目标行的高度
        var textUpToLine = lines.slice(0, lineNumber + 1).join('\n');
        tempDiv.textContent = textUpToLine;
        var heightUpToLine = tempDiv.scrollHeight;
        
        // 计算滚动位置以将目标行在视口中居中
        var lineHeight = parseInt(style.lineHeight) || 20;
        var scrollTop = heightUpToLine - (textarea.clientHeight / 2) - (lineHeight / 2);
        scrollTop = Math.max(0, scrollTop);
        
        document.body.removeChild(tempDiv);
        
        // 如果请求，使用平滑滚动
        if (smooth && textarea.scrollTo) {
            textarea.scrollTo({ top: scrollTop, behavior: 'smooth' });
        } else {
            textarea.scrollTop = scrollTop;
        }
    }
    
    /**
     * 从结果区域同步滚动到A和B（优化，使用视口中心对齐）
     * @param {HTMLElement} resultElement - 结果元素
     */
    function syncScrollFromResult(resultElement) {
        if (!resultElement || !window.diffMapping) return;
        
        var scrollTop = resultElement.scrollTop;
        var viewportCenter = scrollTop + (resultElement.clientHeight / 2);
        
        // 对于diffLines模式，使用优化的基于行的同步
        if (window.diffType === 'diffLines' || window.diffType === 'diffPatch') {
            // 使用改进的算法获取视口中心的确切行号
            var resultLineNum = getLineNumberAtPosition(resultElement, viewportCenter);
            
            // 使用快速查找表进行即时映射
            var targetALine = -1;
            var targetBLine = -1;
            
            if (window.lineMappingTable && window.lineMappingTable.has(resultLineNum)) {
                var lineInfo = window.lineMappingTable.get(resultLineNum);
                targetALine = lineInfo.aLine;
                targetBLine = lineInfo.bLine;
            } else {
                // 后备：查找映射项并计算
                var mappingItem = findDiffElementAtPosition(resultElement, scrollTop);
                if (mappingItem) {
                    var relativeLine = resultLineNum - mappingItem.resultLineStart;
                    var totalLinesInItem = mappingItem.resultLineEnd - mappingItem.resultLineStart;
                    
                    // 将relativeLine限制在有效范围内
                    if (relativeLine < 0) relativeLine = 0;
                    if (relativeLine > totalLinesInItem && totalLinesInItem > 0) relativeLine = totalLinesInItem;
                    
                    if (mappingItem.type === 'removed' && mappingItem.aLineStart >= 0) {
                        targetALine = mappingItem.aLineStart + Math.floor(relativeLine);
                    } else if (mappingItem.type === 'added' && mappingItem.bLineStart >= 0) {
                        targetBLine = mappingItem.bLineStart + Math.floor(relativeLine);
                    } else if (mappingItem.type === 'unchanged') {
                        if (mappingItem.aLineStart >= 0) {
                            targetALine = mappingItem.aLineStart + Math.floor(relativeLine);
                        }
                        if (mappingItem.bLineStart >= 0) {
                            targetBLine = mappingItem.bLineStart + Math.floor(relativeLine);
                        }
                    }
                }
            }
            
            // 使用行号同步A（带平滑滚动）
            if (targetALine >= 0 && a && syncSource !== 'a') {
                scrollToLineNumber(a, targetALine, true);
            }
            
            // 使用行号同步B（带平滑滚动）
            if (targetBLine >= 0 && b && syncSource !== 'b') {
                scrollToLineNumber(b, targetBLine, true);
            }
            
            return;
        }
        
        // 对于其他模式，使用字符位置
        var mappingItem = findDiffElementAtPosition(resultElement, scrollTop);
        if (!mappingItem) return;
        
        // 确定A和B中的目标位置
        var targetAPos = -1;
        var targetBPos = -1;
        
        if (mappingItem.type === 'removed') {
            // 只在A中，将A滚动到删除部分的中间
            targetAPos = (mappingItem.aStart + mappingItem.aEnd) / 2;
        } else if (mappingItem.type === 'added') {
            // 只在B中，将B滚动到添加部分的中间
            targetBPos = (mappingItem.bStart + mappingItem.bEnd) / 2;
        } else {
            // 在两者中，将两者都滚动到中间
            targetAPos = (mappingItem.aStart + mappingItem.aEnd) / 2;
            targetBPos = (mappingItem.bStart + mappingItem.bEnd) / 2;
        }
        
        // 同步A
        if (targetAPos >= 0 && a && syncSource !== 'a') {
            scrollToTextPosition(a, targetAPos);
        }
        
        // 同步B
        if (targetBPos >= 0 && b && syncSource !== 'b') {
            scrollToTextPosition(b, targetBPos);
        }
    }
    
    /**
     * 从A或B同步滚动到结果区域
     * @param {HTMLElement} inputElement - 输入元素（A或B）
     * @param {boolean} isA - 是否为A区域
     */
    function syncScrollFromInput(inputElement, isA) {
        if (!inputElement || !window.diffMapping || !result) return;
        
        var scrollTop = inputElement.scrollTop;
        var text = inputElement.value || '';
        
        // 估算滚动顶部的字符位置
        var lineHeight = parseInt(window.getComputedStyle(inputElement).lineHeight) || 20;
        var estimatedLines = Math.floor(scrollTop / lineHeight);
        var lines = text.split('\n');
        
        var charPos = 0;
        for (var i = 0; i < Math.min(estimatedLines, lines.length); i++) {
            charPos += lines[i].length + 1;
        }
        
        // 查找包含此位置的映射项
        var targetMapping = null;
        for (var j = 0; j < window.diffMapping.length; j++) {
            var item = window.diffMapping[j];
            var start = isA ? item.aStart : item.bStart;
            var end = isA ? item.aEnd : item.bEnd;
            
            if (start >= 0 && end >= 0 && charPos >= start && charPos <= end) {
                targetMapping = item;
                break;
            }
        }
        
        if (!targetMapping) {
            // 查找最接近的映射
            var minDist = Infinity;
            for (var k = 0; k < window.diffMapping.length; k++) {
                var item = window.diffMapping[k];
                var start = isA ? item.aStart : item.bStart;
                if (start >= 0) {
                    var dist = Math.abs(charPos - start);
                    if (dist < minDist) {
                        minDist = dist;
                        targetMapping = item;
                    }
                }
            }
        }
        
        if (targetMapping && syncSource !== 'result') {
            // 将结果滚动到对应位置
            // 对结果区域使用基于百分比的同步
            var resultScrollHeight = result.scrollHeight - result.clientHeight;
            if (resultScrollHeight > 0) {
                var resultCharPos = (targetMapping.resultStart + targetMapping.resultEnd) / 2;
                var resultText = result.textContent || '';
                var resultLineHeight = parseInt(window.getComputedStyle(result).lineHeight) || 20;
                var resultLines = resultText.split('\n');
                
                var resultCharCount = 0;
                var targetLine = 0;
                for (var l = 0; l < resultLines.length; l++) {
                    if (resultCharCount + resultLines[l].length >= resultCharPos) {
                        targetLine = l;
                        break;
                    }
                    resultCharCount += resultLines[l].length + 1;
                }
                
                result.scrollTop = targetLine * resultLineHeight;
            }
        }
    }
    
    /**
     * 使用requestAnimationFrame创建节流的滚动处理器
     * @param {Function} handler - 处理函数
     * @returns {Function} 节流后的处理函数
     */
    function createThrottledScrollHandler(handler) {
        var rafId = null;
        return function() {
            if (rafId !== null) {
                cancelAnimationFrame(rafId);
            }
            rafId = requestAnimationFrame(function() {
                rafId = null;
                handler();
            });
        };
    }
    
    /**
     * 设置A、B和结果区域之间的滚动同步（优化）
     */
    function setupScrollSync() {
        if (!a || !b || !result) return;
        
        // 创建节流的滚动处理器以获得更好的性能
        var handleAScroll = createThrottledScrollHandler(function() {
            if (isSyncing) return;
            isSyncing = true;
            syncSource = 'a';
            
            syncScrollFromInput(a, true);
            if (window.diffType === 'diffJson' && window.getCurrentViewMode && window.getCurrentViewMode() === 'structured') {
                // 对于结构化视图，使用百分比同步
                var aScrollRange = a.scrollHeight - a.clientHeight;
                if (aScrollRange > 0) {
                    var percentage = a.scrollTop / aScrollRange;
                    if (b && syncSource !== 'b') {
                        var bScrollRange = b.scrollHeight - b.clientHeight;
                        if (bScrollRange > 0) {
                            b.scrollTop = percentage * bScrollRange;
                        }
                    }
                    if (result && syncSource !== 'result') {
                        var resultScrollRange = result.scrollHeight - result.clientHeight;
                        if (resultScrollRange > 0) {
                            result.scrollTop = percentage * resultScrollRange;
                        }
                    }
                }
            }
            
            setTimeout(function() {
                isSyncing = false;
                syncSource = null;
            }, 50);
        });
        
        var handleBScroll = createThrottledScrollHandler(function() {
            if (isSyncing) return;
            isSyncing = true;
            syncSource = 'b';
            
            syncScrollFromInput(b, false);
            if (window.diffType === 'diffJson' && window.getCurrentViewMode && window.getCurrentViewMode() === 'structured') {
                // 对于结构化视图，使用百分比同步
                var bScrollRange = b.scrollHeight - b.clientHeight;
                if (bScrollRange > 0) {
                    var percentage = b.scrollTop / bScrollRange;
                    if (a && syncSource !== 'a') {
                        var aScrollRange = a.scrollHeight - a.clientHeight;
                        if (aScrollRange > 0) {
                            a.scrollTop = percentage * aScrollRange;
                        }
                    }
                    if (result && syncSource !== 'result') {
                        var resultScrollRange = result.scrollHeight - result.clientHeight;
                        if (resultScrollRange > 0) {
                            result.scrollTop = percentage * resultScrollRange;
                        }
                    }
                }
            }
            
            setTimeout(function() {
                isSyncing = false;
                syncSource = null;
            }, 50);
        });
        
        var handleResultScroll = createThrottledScrollHandler(function() {
            if (isSyncing) return;
            isSyncing = true;
            syncSource = 'result';
            
            if (window.diffType === 'diffJson' && window.getCurrentViewMode && window.getCurrentViewMode() === 'structured') {
                // 对于结构化视图，使用百分比同步
                var resultScrollRange = result.scrollHeight - result.clientHeight;
                if (resultScrollRange > 0) {
                    var percentage = result.scrollTop / resultScrollRange;
                    if (a && syncSource !== 'a') {
                        var aScrollRange = a.scrollHeight - a.clientHeight;
                        if (aScrollRange > 0) {
                            a.scrollTop = percentage * aScrollRange;
                        }
                    }
                    if (b && syncSource !== 'b') {
                        var bScrollRange = b.scrollHeight - b.clientHeight;
                        if (bScrollRange > 0) {
                            b.scrollTop = percentage * bScrollRange;
                        }
                    }
                }
            } else {
                // 对于基于文本的视图，使用基于内容的同步
                syncScrollFromResult(result);
            }
            
            setTimeout(function() {
                isSyncing = false;
                syncSource = null;
            }, 50);
        });
        
        // 附加事件监听器
        a.addEventListener('scroll', handleAScroll);
        b.addEventListener('scroll', handleBScroll);
        result.addEventListener('scroll', handleResultScroll);
    }
})();

