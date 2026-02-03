/**
 * JSON渲染模块
 * 处理JSON的渲染、高亮和结构化显示
 * @author Auto
 */
(function() {
    'use strict';
    
    // 存储result元素引用（由主文件设置）
    var result;
    var a, b; // 用于构建映射
    
    /**
     * 初始化JSON渲染模块
     * @param {HTMLElement} resultElement - 结果区域元素
     * @param {HTMLElement} aElement - A区域元素
     * @param {HTMLElement} bElement - B区域元素
     */
    window.initJsonRenderer = function(resultElement, aElement, bElement) {
        result = resultElement;
        a = aElement;
        b = bElement;
    };
    
    /**
     * JSON语法高亮函数
     * @param {string} text - 要高亮的文本
     * @returns {string} 高亮后的HTML
     */
    window.highlightJsonContent = function(text) {
        if (!text) return '';
        
        var escapeHtml = function(str) {
            var div = document.createElement('div');
            div.textContent = str;
            return div.innerHTML;
        };
        
        var result = escapeHtml(text);
        
        // 先标记字符串，避免后续处理破坏它们
        var stringPlaceholders = [];
        result = result.replace(/"([^"\\]|\\.)*"/g, function(match) {
            var placeholder = '__STRING_' + stringPlaceholders.length + '__';
            stringPlaceholders.push(match);
            return placeholder;
        });
        
        // 高亮数字（不在字符串中）
        result = result.replace(/\b(-?\d+\.?\d*)\b/g, function(match) {
            return '<span class="json-number">' + match + '</span>';
        });
        
        // 高亮布尔值和null
        result = result.replace(/\b(true|false|null)\b/g, function(match) {
            return '<span class="json-literal">' + match + '</span>';
        });
        
        // 恢复字符串并高亮
        for (var i = 0; i < stringPlaceholders.length; i++) {
            var highlighted = '<span class="json-string">' + stringPlaceholders[i] + '</span>';
            result = result.replace('__STRING_' + i + '__', highlighted);
        }
        
        // 高亮键名（但需要避免重复高亮）
        result = result.replace(/(<span class="json-string">"([^"\\]|\\.)*"<\/span>)\s*:/g, function(match, stringPart) {
            return '<span class="json-key">' + stringPart + '</span>:';
        });
        
        return result;
    };
    
    /**
     * 合并两个JSON对象（用于复制功能）
     * @param {Object} oldObj - 旧对象
     * @param {Object} newObj - 新对象
     * @returns {Object} 合并后的对象
     */
    window.mergeJsonObjects = function(oldObj, newObj) {
        if (newObj === undefined || newObj === null) return oldObj;
        if (oldObj === undefined || oldObj === null) return newObj;
        
        if (Array.isArray(newObj)) {
            return newObj;
        }
        
        if (typeof newObj === 'object') {
            var merged = {};
            var allKeys = new Set();
            if (oldObj && typeof oldObj === 'object') {
                Object.keys(oldObj).forEach(function(k) { allKeys.add(k); });
            }
            if (newObj && typeof newObj === 'object') {
                Object.keys(newObj).forEach(function(k) { allKeys.add(k); });
            }
            
            allKeys.forEach(function(key) {
                if (newObj.hasOwnProperty(key)) {
                    merged[key] = window.mergeJsonObjects(oldObj && oldObj[key], newObj[key]);
                } else if (oldObj && oldObj.hasOwnProperty(key)) {
                    // 如果新对象中没有，保留旧值
                    merged[key] = oldObj[key];
                }
            });
            
            return merged;
        }
        
        return newObj;
    };
    
    /**
     * 在结构化（可折叠）视图中渲染JSON
     * @param {Object} oldObj - 旧对象
     * @param {Object} newObj - 新对象
     */
    window.renderJsonStructured = function(oldObj, newObj) {
        if (!result) return;
        result.textContent = '';
        var container = renderJsonWithCollapse(oldObj, newObj);
        result.appendChild(container);
    };
    
    /**
     * 在文本视图中渲染JSON
     * @param {Object} oldObj - 旧对象
     * @param {Object} newObj - 新对象
     */
    window.renderJsonText = function(oldObj, newObj) {
        if (!result) return;
        result.textContent = '';
        
        // 创建格式化的JSON字符串
        var oldText = JSON.stringify(oldObj, null, 2);
        var newText = JSON.stringify(newObj, null, 2);
        
        // 使用diffLines显示差异
        var diff = Diff.diffLines(oldText, newText);
        var fragment = document.createDocumentFragment();
        
        diff.forEach(function(part) {
            var node;
            if (part.added) {
                node = document.createElement('ins');
                var temp = document.createElement('span');
                temp.innerHTML = window.highlightJsonContent(part.value);
                while (temp.firstChild) {
                    node.appendChild(temp.firstChild);
                }
            } else if (part.removed) {
                node = document.createElement('del');
                var temp = document.createElement('span');
                temp.innerHTML = window.highlightJsonContent(part.value);
                while (temp.firstChild) {
                    node.appendChild(temp.firstChild);
                }
            } else {
                var temp = document.createElement('span');
                temp.innerHTML = window.highlightJsonContent(part.value);
                node = temp;
            }
            fragment.appendChild(node);
        });
        
        result.appendChild(fragment);
        
        // 保存diff结果用于滚动同步（JSON文本模式使用diffLines）
        window.currentDiff = diff;
        if (window.buildDiffMapping && a && b) {
            window.buildDiffMapping(diff, a.value, b.value, 'diffLines');
        }
    };
    
    /**
     * JSON可折叠渲染器
     * @param {Object} oldObj - 旧对象
     * @param {Object} newObj - 新对象
     * @returns {DocumentFragment} 渲染后的容器
     */
    function renderJsonWithCollapse(oldObj, newObj) {
        var container = document.createDocumentFragment();
        var wrapper = document.createElement('div');
        wrapper.className = 'json-container';
        wrapper.appendChild(renderJsonNode(oldObj, newObj, '', 0));
        container.appendChild(wrapper);
        return container;
    }

    /**
     * 渲染JSON节点
     * @param {*} oldVal - 旧值
     * @param {*} newVal - 新值
     * @param {string} key - 键名
     * @param {number} depth - 深度
     * @returns {HTMLElement} 渲染后的节点
     */
    function renderJsonNode(oldVal, newVal, key, depth) {
        var node = document.createElement('div');
        node.className = 'json-node';
        node.style.paddingLeft = (depth * 20) + 'px';

        // 确定值是否不同
        var oldType = getValueType(oldVal);
        var newType = getValueType(newVal);
        var isDifferent = !deepEqual(oldVal, newVal);
        var isRemoved = oldVal !== undefined && newVal === undefined;
        var isAdded = oldVal === undefined && newVal !== undefined;
        var isModified = oldVal !== undefined && newVal !== undefined && isDifferent;

        // 处理不同的值类型
        if (isRemoved) {
            return renderRemovedValue(oldVal, key, depth);
        } else if (isAdded) {
            return renderAddedValue(newVal, key, depth);
        } else if (oldType === 'object' && newType === 'object' && (typeof oldVal === 'object' && oldVal !== null && !Array.isArray(oldVal))) {
            return renderObject(oldVal, newVal, key, depth, isModified);
        } else if (oldType === 'array' && newType === 'array') {
            return renderArray(oldVal, newVal, key, depth, isModified);
        } else if (isModified) {
            return renderModifiedValue(oldVal, newVal, key, depth);
        } else {
            return renderUnchangedValue(oldVal, key, depth);
        }
    }

    /**
     * 渲染对象
     */
    function renderObject(oldObj, newObj, key, depth, isModified) {
        var node = document.createElement('div');
        node.className = 'json-node json-object';
        if (isModified) node.classList.add('json-modified');

        var indent = depth * 20;
        var line = document.createElement('div');
        line.className = 'json-line';
        line.style.paddingLeft = indent + 'px';

        // Key
        if (key) {
            var keySpan = document.createElement('span');
            keySpan.className = 'json-key';
            keySpan.textContent = JSON.stringify(key) + ': ';
            line.appendChild(keySpan);
        }

        // Toggle button
        var toggle = document.createElement('span');
        toggle.className = 'json-toggle';
        toggle.textContent = '▼';
        toggle.setAttribute('aria-label', 'Collapse/Expand');
        line.appendChild(toggle);

        // Opening brace
        var openBrace = document.createElement('span');
        openBrace.className = 'json-brace';
        openBrace.textContent = '{';
        line.appendChild(openBrace);

        // Summary (shown when collapsed)
        var summary = document.createElement('span');
        summary.className = 'json-summary';
        var keys = Object.keys(newObj || oldObj || {});
        summary.textContent = ' ' + keys.length + ' property' + (keys.length !== 1 ? 'ies' : 'y');
        line.appendChild(summary);

        // Closing brace (shown when collapsed)
        var closeBraceCollapsed = document.createElement('span');
        closeBraceCollapsed.className = 'json-brace';
        closeBraceCollapsed.textContent = ' }';
        line.appendChild(closeBraceCollapsed);

        node.appendChild(line);

        // Children container
        var children = document.createElement('div');
        children.className = 'json-children';

        // Get all keys from both objects
        var allKeys = new Set();
        if (oldObj) Object.keys(oldObj).forEach(function(k) { allKeys.add(k); });
        if (newObj) Object.keys(newObj).forEach(function(k) { allKeys.add(k); });

        var keysArray = Array.from(allKeys).sort();
        keysArray.forEach(function(k) {
            var childNode = renderJsonNode(oldObj && oldObj[k], newObj && newObj[k], k, depth + 1);
            children.appendChild(childNode);
        });

        node.appendChild(children);

        // Toggle functionality
        toggle.addEventListener('click', function(e) {
            e.stopPropagation();
            node.classList.toggle('json-collapsed');
            toggle.textContent = node.classList.contains('json-collapsed') ? '▶' : '▼';
        });

        // Also toggle on key click
        if (key) {
            var keyClickable = line.querySelector('.json-key');
            if (keyClickable) {
                keyClickable.style.cursor = 'pointer';
                keyClickable.addEventListener('click', function(e) {
                    e.stopPropagation();
                    node.classList.toggle('json-collapsed');
                    toggle.textContent = node.classList.contains('json-collapsed') ? '▶' : '▼';
                });
            }
        }

        return node;
    }

    /**
     * 渲染数组
     */
    function renderArray(oldArr, newArr, key, depth, isModified) {
        var node = document.createElement('div');
        node.className = 'json-node json-array';
        if (isModified) node.classList.add('json-modified');

        var indent = depth * 20;
        var line = document.createElement('div');
        line.className = 'json-line';
        line.style.paddingLeft = indent + 'px';

        // Key
        if (key) {
            var keySpan = document.createElement('span');
            keySpan.className = 'json-key';
            keySpan.textContent = JSON.stringify(key) + ': ';
            line.appendChild(keySpan);
        }

        // Toggle button
        var toggle = document.createElement('span');
        toggle.className = 'json-toggle';
        toggle.textContent = '▼';
        toggle.setAttribute('aria-label', 'Collapse/Expand');
        line.appendChild(toggle);

        // Opening bracket
        var openBracket = document.createElement('span');
        openBracket.className = 'json-brace';
        openBracket.textContent = '[';
        line.appendChild(openBracket);

        // Summary
        var summary = document.createElement('span');
        summary.className = 'json-summary';
        var length = Math.max((newArr && newArr.length) || 0, (oldArr && oldArr.length) || 0);
        summary.textContent = ' ' + length + ' item' + (length !== 1 ? 's' : '');
        line.appendChild(summary);

        // Closing bracket
        var closeBracketCollapsed = document.createElement('span');
        closeBracketCollapsed.className = 'json-brace';
        closeBracketCollapsed.textContent = ' ]';
        line.appendChild(closeBracketCollapsed);

        node.appendChild(line);

        // Children container
        var children = document.createElement('div');
        children.className = 'json-children';

        var maxLength = Math.max((newArr && newArr.length) || 0, (oldArr && oldArr.length) || 0);
        for (var i = 0; i < maxLength; i++) {
            var childNode = renderJsonNode(
                oldArr && oldArr[i],
                newArr && newArr[i],
                i,
                depth + 1
            );
            children.appendChild(childNode);
        }

        node.appendChild(children);

        // Toggle functionality
        toggle.addEventListener('click', function(e) {
            e.stopPropagation();
            node.classList.toggle('json-collapsed');
            toggle.textContent = node.classList.contains('json-collapsed') ? '▶' : '▼';
        });

        if (key) {
            var keyClickable = line.querySelector('.json-key');
            if (keyClickable) {
                keyClickable.style.cursor = 'pointer';
                keyClickable.addEventListener('click', function(e) {
                    e.stopPropagation();
                    node.classList.toggle('json-collapsed');
                    toggle.textContent = node.classList.contains('json-collapsed') ? '▶' : '▼';
                });
            }
        }

        return node;
    }

    /**
     * 渲染删除的值
     */
    function renderRemovedValue(value, key, depth) {
        var node = document.createElement('div');
        node.className = 'json-node json-removed';
        var line = document.createElement('div');
        line.className = 'json-line';
        line.style.paddingLeft = (depth * 20) + 'px';

        if (key !== '') {
            var keySpan = document.createElement('span');
            keySpan.className = 'json-key';
            keySpan.textContent = JSON.stringify(key) + ': ';
            line.appendChild(keySpan);
        }

        var del = document.createElement('del');
        del.textContent = formatValue(value);
        line.appendChild(del);

        node.appendChild(line);
        return node;
    }

    /**
     * 渲染添加的值
     */
    function renderAddedValue(value, key, depth) {
        var node = document.createElement('div');
        node.className = 'json-node json-added';
        var line = document.createElement('div');
        line.className = 'json-line';
        line.style.paddingLeft = (depth * 20) + 'px';

        if (key !== '') {
            var keySpan = document.createElement('span');
            keySpan.className = 'json-key';
            keySpan.textContent = JSON.stringify(key) + ': ';
            line.appendChild(keySpan);
        }

        var ins = document.createElement('ins');
        ins.textContent = formatValue(value);
        line.appendChild(ins);

        node.appendChild(line);
        return node;
    }

    /**
     * 渲染修改的值
     */
    function renderModifiedValue(oldVal, newVal, key, depth) {
        var node = document.createElement('div');
        node.className = 'json-node json-modified';
        var line = document.createElement('div');
        line.className = 'json-line';
        line.style.paddingLeft = (depth * 20) + 'px';

        if (key !== '') {
            var keySpan = document.createElement('span');
            keySpan.className = 'json-key';
            keySpan.textContent = JSON.stringify(key) + ': ';
            line.appendChild(keySpan);
        }

        var del = document.createElement('del');
        del.textContent = formatValue(oldVal);
        line.appendChild(del);

        line.appendChild(document.createTextNode(' → '));

        var ins = document.createElement('ins');
        ins.textContent = formatValue(newVal);
        line.appendChild(ins);

        node.appendChild(line);
        return node;
    }

    /**
     * 渲染未更改的值
     */
    function renderUnchangedValue(value, key, depth) {
        var node = document.createElement('div');
        node.className = 'json-node json-unchanged';
        var line = document.createElement('div');
        line.className = 'json-line';
        line.style.paddingLeft = (depth * 20) + 'px';

        if (key !== '') {
            var keySpan = document.createElement('span');
            keySpan.className = 'json-key';
            keySpan.textContent = JSON.stringify(key) + ': ';
            line.appendChild(keySpan);
        }

        line.appendChild(document.createTextNode(formatValue(value)));
        node.appendChild(line);
        return node;
    }

    /**
     * 格式化值
     */
    function formatValue(value) {
        if (value === null) return 'null';
        if (value === undefined) return 'undefined';
        if (typeof value === 'string') return JSON.stringify(value);
        if (typeof value === 'number' || typeof value === 'boolean') return String(value);
        if (Array.isArray(value)) return '[' + value.length + ' items]';
        if (typeof value === 'object') return '{' + Object.keys(value).length + ' properties}';
        return String(value);
    }

    /**
     * 获取值类型
     */
    function getValueType(value) {
        if (value === null) return 'null';
        if (value === undefined) return 'undefined';
        if (Array.isArray(value)) return 'array';
        if (typeof value === 'object') return 'object';
        return typeof value;
    }

    /**
     * 深度相等比较
     */
    function deepEqual(a, b) {
        if (a === b) return true;
        if (a === null || b === null) return a === b;
        if (a === undefined || b === undefined) return a === b;
        if (typeof a !== typeof b) return false;
        if (typeof a !== 'object') return a === b;
        if (Array.isArray(a) !== Array.isArray(b)) return false;
        
        if (Array.isArray(a)) {
            if (a.length !== b.length) return false;
            for (var i = 0; i < a.length; i++) {
                if (!deepEqual(a[i], b[i])) return false;
            }
            return true;
        }

        var keysA = Object.keys(a);
        var keysB = Object.keys(b);
        if (keysA.length !== keysB.length) return false;
        for (var i = 0; i < keysA.length; i++) {
            if (!keysB.includes(keysA[i])) return false;
            if (!deepEqual(a[keysA[i]], b[keysB[i]])) return false;
        }
        return true;
    }
})();

