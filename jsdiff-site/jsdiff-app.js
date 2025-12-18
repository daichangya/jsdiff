(function() {
    'use strict';
    
    // Global variables
    var a, b, result;
    var currentViewMode = 'text'; // 'structured' or 'text'
    var lastJsonOldObj = null;
    var lastJsonNewObj = null;
    
    // Initialize when DOM is ready
    function init() {
        a = document.getElementById('a');
        b = document.getElementById('b');
        result = document.getElementById('result');
        
        if (!a || !b || !result) {
            console.error('Required elements not found');
            return;
        }
        
        setupResultPanel();
        setupDiffTypeHandlers();
        setupFileHandlers();
        setupInputHandlers();
        
        // Initial load
        var selectedDiffType = document.querySelector('#settings [name="diff_type"]:checked');
        console.log('selectedDiffType');
        console.log(selectedDiffType);
        if (selectedDiffType) {
            onDiffTypeChange(selectedDiffType);
            setExampleText(selectedDiffType.value);
            changed();
        }
    }
    
    // Setup result panel with copy button and view toggle
    function setupResultPanel() {
        var resultPanel = result.parentElement;
        if (!resultPanel) return;
        
        // Create toolbar
        var toolbar = document.createElement('div');
        toolbar.className = 'result-toolbar';
        toolbar.setAttribute('role', 'toolbar');
        toolbar.setAttribute('aria-label', 'Result actions');
        
        // Copy button
        var copyBtn = document.createElement('button');
        copyBtn.className = 'btn-copy-result';
        copyBtn.setAttribute('aria-label', 'Copy result');
        copyBtn.innerHTML = '📋 Copy';
        copyBtn.onclick = copyResult;
        toolbar.appendChild(copyBtn);
        
        // View toggle (only for JSON mode)
        var viewToggle = document.createElement('div');
        viewToggle.className = 'view-toggle';
        viewToggle.style.display = 'none';
        
        var structuredBtn = document.createElement('button');
        structuredBtn.className = 'btn-view-toggle';
        structuredBtn.textContent = 'Structured';
        structuredBtn.setAttribute('data-view', 'structured');
        structuredBtn.onclick = function() { switchView('structured'); };
        
        var textBtn = document.createElement('button');
        textBtn.className = 'btn-view-toggle active';
        textBtn.textContent = 'Text';
        textBtn.setAttribute('data-view', 'text');
        textBtn.onclick = function() { switchView('text'); };
        
        viewToggle.appendChild(structuredBtn);
        viewToggle.appendChild(textBtn);
        toolbar.appendChild(viewToggle);
        
        // Expand/Collapse all (only for JSON structured view)
        var expandCollapseAll = document.createElement('button');
        expandCollapseAll.className = 'btn-expand-all';
        expandCollapseAll.textContent = 'Expand All';
        expandCollapseAll.style.display = 'none';
        expandCollapseAll.onclick = toggleExpandAll;
        toolbar.appendChild(expandCollapseAll);
        
        resultPanel.insertBefore(toolbar, result);
        
        // Store references
        window.resultToolbar = toolbar;
        window.viewToggle = viewToggle;
        window.expandCollapseAll = expandCollapseAll;
    }
    
    // Copy result to clipboard
    function copyResult() {
        var textToCopy = '';
        
        if (window.diffType === 'diffJson' && currentViewMode === 'structured') {
            // For JSON structured view, copy formatted JSON
            if (lastJsonOldObj !== null && lastJsonNewObj !== null) {
                // Create a merged JSON showing the final state
                var merged = mergeJsonObjects(lastJsonOldObj, lastJsonNewObj);
                textToCopy = JSON.stringify(merged, null, 2);
            } else {
                textToCopy = result.textContent || '';
            }
        } else {
            // For text views, copy the displayed text
            textToCopy = result.textContent || '';
            
            // Clean up HTML entities if needed
            textToCopy = textToCopy.replace(/\u00A0/g, ' '); // Replace non-breaking spaces
        }
        
        if (!textToCopy.trim()) {
            showNotification('Nothing to copy', 'warning');
            return;
        }
        
        // Use Clipboard API if available
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(textToCopy).then(function() {
                showNotification('Copied to clipboard!', 'success');
            }).catch(function(err) {
                console.error('Failed to copy:', err);
                fallbackCopy(textToCopy);
            });
        } else {
            fallbackCopy(textToCopy);
        }
    }
    
    // Fallback copy method
    function fallbackCopy(text) {
        var textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        try {
            document.execCommand('copy');
            showNotification('Copied to clipboard!', 'success');
        } catch (err) {
            console.error('Fallback copy failed:', err);
            showNotification('Failed to copy. Please select and copy manually.', 'error');
        }
        document.body.removeChild(textarea);
    }
    
    // Show notification
    function showNotification(message, type) {
        var notification = document.createElement('div');
        notification.className = 'notification notification-' + (type || 'info');
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(function() {
            notification.classList.add('show');
        }, 10);
        
        setTimeout(function() {
            notification.classList.remove('show');
            setTimeout(function() {
                document.body.removeChild(notification);
            }, 300);
        }, 2000);
    }
    
    // Switch between structured and text view for JSON
    function switchView(mode) {
        if (window.diffType !== 'diffJson') return;
        if (mode === currentViewMode) return;
        
        currentViewMode = mode;
        
        // Update button states
        var buttons = window.viewToggle.querySelectorAll('.btn-view-toggle');
        buttons.forEach(function(btn) {
            if (btn.getAttribute('data-view') === mode) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
        
        // Re-render
        if (lastJsonOldObj !== null && lastJsonNewObj !== null) {
            if (mode === 'structured') {
                renderJsonStructured(lastJsonOldObj, lastJsonNewObj);
            } else {
                renderJsonText(lastJsonOldObj, lastJsonNewObj);
            }
        }
    }
    
    // Toggle expand/collapse all JSON nodes
    function toggleExpandAll() {
        if (window.diffType !== 'diffJson' || currentViewMode !== 'structured') return;
        
        var container = result.querySelector('.json-container');
        if (!container) return;
        
        var nodes = container.querySelectorAll('.json-node.json-object, .json-node.json-array');
        if (nodes.length === 0) return;
        
        // Check if all are expanded
        var allExpanded = true;
        for (var i = 0; i < nodes.length; i++) {
            if (nodes[i].classList.contains('json-collapsed')) {
                allExpanded = false;
                break;
            }
        }
        
        // Toggle all
        var shouldExpand = !allExpanded;
        nodes.forEach(function(node) {
            if (shouldExpand) {
                node.classList.remove('json-collapsed');
                var toggle = node.querySelector('.json-toggle');
                if (toggle) toggle.textContent = '▼';
            } else {
                node.classList.add('json-collapsed');
                var toggle = node.querySelector('.json-toggle');
                if (toggle) toggle.textContent = '▶';
            }
        });
        
        // Update button text
        if (window.expandCollapseAll) {
            window.expandCollapseAll.textContent = shouldExpand ? 'Collapse All' : 'Expand All';
        }
    }
    
    // Merge two JSON objects (for copy functionality)
    function mergeJsonObjects(oldObj, newObj) {
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
                    merged[key] = mergeJsonObjects(oldObj && oldObj[key], newObj[key]);
                } else if (oldObj && oldObj.hasOwnProperty(key)) {
                    // Keep old value if not in new
                    merged[key] = oldObj[key];
                }
            });
            
            return merged;
        }
        
        return newObj;
    }
    
    // Render JSON in structured (collapsible) view
    function renderJsonStructured(oldObj, newObj) {
        result.textContent = '';
        var container = renderJsonWithCollapse(oldObj, newObj);
        result.appendChild(container);
    }
    
    // Render JSON in text view
    function renderJsonText(oldObj, newObj) {
        result.textContent = '';
        
        // Create formatted JSON strings
        var oldText = JSON.stringify(oldObj, null, 2);
        var newText = JSON.stringify(newObj, null, 2);
        
        // Use diffLines to show differences
        var diff = Diff.diffLines(oldText, newText);
        var fragment = document.createDocumentFragment();
        
        diff.forEach(function(part) {
            var node;
            if (part.added) {
                node = document.createElement('ins');
                node.appendChild(document.createTextNode(part.value));
            } else if (part.removed) {
                node = document.createElement('del');
                node.appendChild(document.createTextNode(part.value));
            } else {
                node = document.createTextNode(part.value);
            }
            fragment.appendChild(node);
        });
        
        result.appendChild(fragment);
    }
    
    // JSON collapsible renderer
    function renderJsonWithCollapse(oldObj, newObj) {
        var container = document.createDocumentFragment();
        var wrapper = document.createElement('div');
        wrapper.className = 'json-container';
        wrapper.appendChild(renderJsonNode(oldObj, newObj, '', 0));
        container.appendChild(wrapper);
        return container;
    }

    function renderJsonNode(oldVal, newVal, key, depth) {
        var node = document.createElement('div');
        node.className = 'json-node';
        node.style.paddingLeft = (depth * 20) + 'px';

        // Determine if values are different
        var oldType = getValueType(oldVal);
        var newType = getValueType(newVal);
        var isDifferent = !deepEqual(oldVal, newVal);
        var isRemoved = oldVal !== undefined && newVal === undefined;
        var isAdded = oldVal === undefined && newVal !== undefined;
        var isModified = oldVal !== undefined && newVal !== undefined && isDifferent;

        // Handle different value types
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

    function formatValue(value) {
        if (value === null) return 'null';
        if (value === undefined) return 'undefined';
        if (typeof value === 'string') return JSON.stringify(value);
        if (typeof value === 'number' || typeof value === 'boolean') return String(value);
        if (Array.isArray(value)) return '[' + value.length + ' items]';
        if (typeof value === 'object') return '{' + Object.keys(value).length + ' properties}';
        return String(value);
    }

    function getValueType(value) {
        if (value === null) return 'null';
        if (value === undefined) return 'undefined';
        if (Array.isArray(value)) return 'array';
        if (typeof value === 'object') return 'object';
        return typeof value;
    }

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

    function changed() {
        var fragment = document.createDocumentFragment();
        var diff;
        
        // Update toolbar visibility based on mode
        if (window.viewToggle) {
            window.viewToggle.style.display = (window.diffType === 'diffJson') ? 'flex' : 'none';
        }
        if (window.expandCollapseAll) {
            window.expandCollapseAll.style.display = (window.diffType === 'diffJson' && currentViewMode === 'structured') ? 'inline-block' : 'none';
        }
        
        if (window.diffType === 'diffPatch') {
            // We contort the patch into a similar data structure to that returned by diffChars,
            // diffWords, etc so that the same rendering code below can work on both.
            var pastHunkHeader = false;
            diff = Diff.createTwoFilesPatch('a.txt', 'b.txt', a.value, b.value)
                .split('\n')
                .map(function(entry) {
                    const result = {
                        value: entry + '\n',
                    };
                    if (entry.startsWith('@@')) {
                        result.chunkHeader = true;
                        pastHunkHeader = true;
                    } else if (pastHunkHeader) {
                        if (entry.startsWith('-')) {
                            result.removed = true;
                        } else if (entry.startsWith('+')) {
                            result.added = true;
                        }
                    }
                    return result;
                });
        } else if (window.diffType === 'diffJson') {
            try {
                // Try to parse JSON input
                var oldObj = JSON.parse(a.value);
                var newObj = JSON.parse(b.value);
                
                // Store for view switching
                lastJsonOldObj = oldObj;
                lastJsonNewObj = newObj;
                
                // Use appropriate renderer based on view mode
                result.textContent = '';
                if (currentViewMode === 'structured') {
                    result.appendChild(renderJsonWithCollapse(oldObj, newObj));
                } else {
                    renderJsonText(oldObj, newObj);
                }
                return; // Early return, rendering is done
            } catch (e) {
                // If parsing fails, treat as text
                diff = [{value: 'Invalid JSON input: ' + e.message, added: true}];
                lastJsonOldObj = null;
                lastJsonNewObj = null;
            }
        } else {
            diff = Diff[window.diffType](a.value, b.value);
            lastJsonOldObj = null;
            lastJsonNewObj = null;
        }

        for (var i=0; i < diff.length; i++) {
            if (diff[i].added && diff[i + 1] && diff[i + 1].removed) {
                var swap = diff[i];
                diff[i] = diff[i + 1];
                diff[i + 1] = swap;
            }

            var node;
            if (diff[i].removed) {
                node = document.createElement('del');
                node.appendChild(document.createTextNode(diff[i].value));
            } else if (diff[i].added) {
                node = document.createElement('ins');
                node.appendChild(document.createTextNode(diff[i].value));
            } else if (diff[i].chunkHeader) {
                node = document.createElement('span');
                node.setAttribute('class', 'chunk-header');
                node.appendChild(document.createTextNode(diff[i].value));
            } else {
                node = document.createTextNode(diff[i].value);
            }
            fragment.appendChild(node);
        }

        result.textContent = '';
        result.appendChild(fragment);
    }

    // Helper function to check if value matches any example data
    function isExampleData(value, diffType) {
        if (!value || value.trim() === '') return false;
        
        var trimmed = value.trim();
        
        // Check against diffChars default values
        if (trimmed === 'restaurant' || trimmed === 'aura') {
            return diffType !== 'diffChars';
        }
        
        // Check against diffLines/diffPatch example
        if (trimmed === 'Line 1\nLine 2\nLine 3\nLine 4' || 
            trimmed === 'Line 1\nModified Line 2\nLine 3\nNew Line\nLine 4') {
            return diffType !== 'diffLines' && diffType !== 'diffPatch';
        }
        
        // Check against diffWords example
        if (trimmed === 'The quick brown fox jumps over the lazy dog' ||
            trimmed === 'The fast brown fox leaps over the lazy dog') {
            return diffType !== 'diffWords';
        }
        
        // Check against diffJson example (try to parse as JSON and check structure)
        if (diffType !== 'diffJson') {
            try {
                var parsed = JSON.parse(trimmed);
                // Check if it matches the JSON example structure
                if (parsed && typeof parsed === 'object') {
                    if (parsed.name === 'Product A' && 
                        (parsed.price === 100 || parsed.price === 120) &&
                        Array.isArray(parsed.features) &&
                        parsed.metadata && typeof parsed.metadata === 'object') {
                        return true; // This is JSON example data
                    }
                }
            } catch (e) {
                // Not JSON, ignore
            }
        }
        
        return false;
    }

    function setExampleText(diffType) {
        // Use global variables a and b to ensure consistency with changed() function
        if (!a || !b) {
            // If global variables not initialized, try to get them
            a = document.getElementById('a');
            b = document.getElementById('b');
            if (!a || !b) {
                return; // Elements not found
            }
        }
        
        // Check if files are already loaded - if so, don't overwrite
        var fileNameA = document.getElementById('file-a-name');
        var fileNameB = document.getElementById('file-b-name');
        var hasFileA = fileNameA && fileNameA.style.display !== 'none' && fileNameA.textContent.trim() !== '';
        var hasFileB = fileNameB && fileNameB.style.display !== 'none' && fileNameB.textContent.trim() !== '';
        
        // If files are loaded, don't overwrite
        if (hasFileA || hasFileB) {
            return;
        }
        
        // Get current values
        var valueA = a.value ? a.value.trim() : '';
        var valueB = b.value ? b.value.trim() : '';
        
        // Check if current values are example data from other modes
        var isExampleA = isExampleData(valueA, diffType);
        var isExampleB = isExampleData(valueB, diffType);
        
        // Check if textarea has default HTML values that should be replaced
        // Default HTML values are: "restaurant" and "aura" for diffChars mode
        var isDefaultValueA = valueA === 'restaurant' || valueA === 'aura';
        var isDefaultValueB = valueB === 'restaurant' || valueB === 'aura';
        
        // Check if textarea has real user-entered content (not example data from any mode)
        var hasUserContentA = valueA !== '' && !isDefaultValueA && !isExampleA;
        var hasUserContentB = valueB !== '' && !isDefaultValueB && !isExampleB;
        
        // If both textareas have real user content, don't overwrite
        if (hasUserContentA && hasUserContentB) {
            return;
        }
        
        // Define example data for each mode
        var exampleDataA, exampleDataB;
        
        if (diffType === 'diffJson') {
            exampleDataA = JSON.stringify({
                name: "Product A",
                price: 100,
                features: ["Durable", "Easy to use"],
                metadata: {
                    created: "2023-01-15",
                    rating: 4.5
                }
            }, null, 2);
            exampleDataB = JSON.stringify({
                name: "Product A",
                price: 120,
                features: ["Durable", "Easy to use", "Lightweight"],
                metadata: {
                    created: "2023-01-15",
                    rating: 4.7,
                    inStock: true
                }
            }, null, 2);
        } else if (diffType === 'diffPatch' || diffType === 'diffLines') {
            exampleDataA = "Line 1\nLine 2\nLine 3\nLine 4";
            exampleDataB = "Line 1\nModified Line 2\nLine 3\nNew Line\nLine 4";
        } else if (diffType === 'diffWords') {
            exampleDataA = "The quick brown fox jumps over the lazy dog";
            exampleDataB = "The fast brown fox leaps over the lazy dog";
        } else {
            // diffChars and default
            exampleDataA = "restaurant";
            exampleDataB = "aura";
        }
        
        // Set example data if needed
        if (!hasFileA && (!hasUserContentA || isExampleA || isDefaultValueA || valueA === '')) {
            a.value = exampleDataA;
        }
        
        if (!hasFileB && (!hasUserContentB || isExampleB || isDefaultValueB || valueB === '')) {
            b.value = exampleDataB;
        }
    }

    function setupFileHandlers() {
        var fileInputA = document.getElementById('file-a');
        var fileInputB = document.getElementById('file-b');
        var fileNameA = document.getElementById('file-a-name');
        var fileNameB = document.getElementById('file-b-name');
        var clearFileA = document.getElementById('clear-file-a');
        var clearFileB = document.getElementById('clear-file-b');
        
        if (!fileInputA || !fileInputB) return;
        
        function readFile(fileInput, textarea, fileNameElement, clearButton) {
            var file = fileInput.files[0];
            if (!file) return;
            
            // Check file size (limit to 10MB)
            var maxSize = 10 * 1024 * 1024; // 10MB
            if (file.size > maxSize) {
                alert('File is too large. Maximum file size is 10MB.');
                fileInput.value = '';
                return;
            }
            
            var reader = new FileReader();
            reader.onload = function(e) {
                textarea.value = e.target.result;
                fileNameElement.textContent = file.name;
                fileNameElement.style.display = 'inline';
                clearButton.style.display = 'inline-block';
                // Store file reference for potential reload
                fileInput._lastFile = file;
                changed(); // Trigger comparison update
            };
            reader.onerror = function() {
                alert('Error reading file. Please try again.');
                fileInput.value = '';
            };
            reader.readAsText(file);
        }
        
        // Function to reload the last file if it exists
        function reloadFile(fileInput, textarea, fileNameElement, clearButton) {
            if (fileInput._lastFile) {
                // Create a new FileList-like object to trigger change event
                var dataTransfer = new DataTransfer();
                dataTransfer.items.add(fileInput._lastFile);
                fileInput.files = dataTransfer.files;
                // Trigger change event to reload file
                var event = new Event('change', { bubbles: true });
                fileInput.dispatchEvent(event);
            }
        }
        
        function clearFile(textarea, fileNameElement, clearButton, fileInput) {
            textarea.value = '';
            fileNameElement.textContent = '';
            fileNameElement.style.display = 'none';
            clearButton.style.display = 'none';
            fileInput.value = '';
            fileInput._lastFile = null; // Clear stored file reference
            changed(); // Trigger comparison update
        }
        
        fileInputA.addEventListener('change', function() {
            readFile(fileInputA, a, fileNameA, clearFileA);
        });
        
        fileInputB.addEventListener('change', function() {
            readFile(fileInputB, b, fileNameB, clearFileB);
        });
        
        // Add click handler to file name to reload file
        if (fileNameA) {
            fileNameA.addEventListener('click', function() {
                if (fileInputA._lastFile) {
                    reloadFile(fileInputA, a, fileNameA, clearFileA);
                }
            });
            fileNameA.style.cursor = 'pointer';
            fileNameA.title = 'Click to reload file';
        }
        
        if (fileNameB) {
            fileNameB.addEventListener('click', function() {
                if (fileInputB._lastFile) {
                    reloadFile(fileInputB, b, fileNameB, clearFileB);
                }
            });
            fileNameB.style.cursor = 'pointer';
            fileNameB.title = 'Click to reload file';
        }
        
        if (clearFileA) {
            clearFileA.addEventListener('click', function() {
                clearFile(a, fileNameA, clearFileA, fileInputA);
            });
        }
        
        if (clearFileB) {
            clearFileB.addEventListener('click', function() {
                clearFile(b, fileNameB, clearFileB, fileInputB);
            });
        }
    }

    function setupInputHandlers() {
        a.onpaste = a.onchange = b.onpaste = b.onchange = changed;

        if ('oninput' in a) {
            a.oninput = b.oninput = changed;
        } else {
            a.onkeyup = b.onkeyup = changed;
        }
    }

    function onDiffTypeChange(radio) {
        window.diffType = radio.value;
        // Reset view mode to structured for JSON
        if (radio.value === 'diffJson') {
            currentViewMode = 'text';
        }
    }

    function setupDiffTypeHandlers() {
        var radio = document.getElementsByName('diff_type');
        for (var i = 0; i < radio.length; i++) {
            radio[i].onchange = function(e) {
                onDiffTypeChange(e.target);
                setExampleText(e.target.value);
                changed();
            };
        }
    }
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();

