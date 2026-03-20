/**
 * JSDiff History - Save and restore recent comparisons
 * Stores data in localStorage for privacy
 */

(function() {
    'use strict';

    const STORAGE_KEY = 'jsdiff_history';
    const MAX_HISTORY = 10;

    // Save current comparison to history
    function saveComparison() {
        const textA = document.getElementById('a')?.value || '';
        const textB = document.getElementById('b')?.value || '';
        
        if (!textA && !textB) return;

        const history = getHistory();
        const item = {
            id: Date.now(),
            timestamp: new Date().toISOString(),
            previewA: textA.substring(0, 100),
            previewB: textB.substring(0, 100),
            fullA: textA,
            fullB: textB
        };

        // Remove duplicates
        const filtered = history.filter(h => 
            h.previewA !== item.previewA || h.previewB !== item.previewB
        );

        // Add new item at beginning
        filtered.unshift(item);

        // Keep only MAX_HISTORY items
        const trimmed = filtered.slice(0, MAX_HISTORY);

        // Save to localStorage
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
        } catch (e) {
            console.warn('Failed to save history:', e);
        }
    }

    // Get history from localStorage
    function getHistory() {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            return stored ? JSON.parse(stored) : [];
        } catch (e) {
            return [];
        }
    }

    // Load a specific comparison
    function loadComparison(id) {
        const history = getHistory();
        const item = history.find(h => h.id === id);
        
        if (item && document.getElementById('a') && document.getElementById('b')) {
            document.getElementById('a').value = item.fullA;
            document.getElementById('b').value = item.fullB;
            
            // Trigger comparison
            if (window.diffType) {
                window.compare();
            }
        }
    }

    // Delete a specific comparison
    function deleteComparison(id) {
        const history = getHistory().filter(h => h.id !== id);
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
        } catch (e) {
            console.warn('Failed to delete history:', e);
        }
    }

    // Clear all history
    function clearHistory() {
        try {
            localStorage.removeItem(STORAGE_KEY);
        } catch (e) {
            console.warn('Failed to clear history:', e);
        }
    }

    // Render history list
    function renderHistoryList() {
        const container = document.getElementById('history-list');
        if (!container) return;

        const history = getHistory();
        
        if (history.length === 0) {
            container.innerHTML = '<p style="color: #666; text-align: center; padding: 20px;">No recent comparisons</p>';
            return;
        }

        container.innerHTML = history.map(item => {
            const date = new Date(item.timestamp);
            const timeStr = date.toLocaleString();
            const previewA = item.previewA.replace(/\n/g, ' ').substring(0, 50) + '...';
            const previewB = item.previewB.replace(/\n/g, ' ').substring(0, 50) + '...';
            
            return `
                <div style="background: white; padding: 15px; border-radius: 8px; margin-bottom: 10px; border: 1px solid var(--border-color);">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                        <span style="color: #666; font-size: 12px;">${timeStr}</span>
                        <button onclick="JSDiffHistory.delete(${item.id})" style="background: #e53935; color: white; border: none; border-radius: 4px; padding: 4px 8px; cursor: pointer; font-size: 12px;">Delete</button>
                    </div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 12px; color: #666; margin-bottom: 10px;">
                        <div><strong>Original:</strong> ${previewA}</div>
                        <div><strong>Modified:</strong> ${previewB}</div>
                    </div>
                    <button onclick="JSDiffHistory.load(${item.id})" style="background: var(--primary-color); color: white; border: none; border-radius: 4px; padding: 8px 16px; cursor: pointer; width: 100%;">Load Comparison</button>
                </div>
            `;
        }).join('');
    }

    // Auto-save on comparison
    function initAutoSave() {
        const resultPanel = document.getElementById('result');
        if (resultPanel) {
            const observer = new MutationObserver(function(mutations) {
                saveComparison();
            });
            observer.observe(resultPanel, { childList: true, subtree: true });
        }
    }

    // Expose API
    window.JSDiffHistory = {
        save: saveComparison,
        get: getHistory,
        load: loadComparison,
        delete: deleteComparison,
        clear: clearHistory,
        render: renderHistoryList,
        init: initAutoSave
    };

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAutoSave);
    } else {
        initAutoSave();
    }
})();
