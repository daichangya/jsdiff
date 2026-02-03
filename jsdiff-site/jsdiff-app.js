(function() {
    'use strict';
    
    // Global variables
    var a, b, result;
    var currentViewMode = 'text'; // 'structured' or 'text'
    var lastJsonOldObj = null;
    var lastJsonNewObj = null;
    
    // 滚动同步功能已移至 scroll-sync.js 模块
    
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
        
        // 初始化滚动同步模块
        if (window.initScrollSync) {
            window.initScrollSync(a, b, result, function() {
                return currentViewMode;
            });
        }
        
        // 初始化JSON渲染模块
        if (window.initJsonRenderer) {
            window.initJsonRenderer(result, a, b);
        }
        
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
                var merged = window.mergeJsonObjects ? window.mergeJsonObjects(lastJsonOldObj, lastJsonNewObj) : lastJsonNewObj;
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
                if (window.renderJsonStructured) {
                    window.renderJsonStructured(lastJsonOldObj, lastJsonNewObj);
                }
            } else {
                if (window.renderJsonText) {
                    window.renderJsonText(lastJsonOldObj, lastJsonNewObj);
                }
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
    
    // JSON渲染功能已移至 json-renderer.js 模块

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
                    if (window.renderJsonStructured) {
                        window.renderJsonStructured(oldObj, newObj);
                    }
                    // For structured view, don't build mapping (use percentage sync)
                    window.currentDiff = null;
                    window.diffMapping = null;
                } else {
                    if (window.renderJsonText) {
                        window.renderJsonText(oldObj, newObj);
                    }
                    // renderJsonText already saves diff and builds mapping
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
        
        // Save diff result and build mapping for scroll sync
        window.currentDiff = diff;
        if (window.buildDiffMapping) {
            window.buildDiffMapping(diff, a.value, b.value, window.diffType);
        }
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

