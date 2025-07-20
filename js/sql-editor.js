/**
 * SQL Editor
 * Manages CodeMirror SQL editor with syntax highlighting and auto-completion
 */
class SQLEditor {
    constructor() {
        this.editor = null;
        this.availableTables = [];
        this.initializeEditor();
        this.setupEventListeners();
    }
    
    /**
     * Initialize CodeMirror editor
     */
    initializeEditor() {
        const editorElement = document.getElementById('sql-editor');
        if (!editorElement) {
            console.error('SQL editor element not found');
            return;
        }
        
        this.editor = CodeMirror(editorElement, {
            mode: 'text/x-sql',
            theme: 'default',
            lineNumbers: true,
            autoCloseBrackets: true,
            matchBrackets: true,
            indentWithTabs: false,
            indentUnit: 2,
            tabSize: 2,
            lineWrapping: true,
            placeholder: 'Enter your SQL query here...',
            
            // Additional options for better user experience
            extraKeys: {
                'Ctrl-Enter': () => this.executeQuery(),
                'Cmd-Enter': () => this.executeQuery(),
                'Ctrl-Space': 'autocomplete',
                'Tab': (cm) => {
                    if (cm.somethingSelected()) {
                        cm.indentSelection('add');
                    } else {
                        cm.replaceSelection('  '); // 2 spaces
                    }
                }
            }
        });
        
        // Set initial query example
        this.setInitialQuery();
        
        console.log('SQL Editor initialized');
    }
    
    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // Listen for file uploads to update available tables
        window.addEventListener('fileLoaded', (event) => {
            this.addTable(event.detail.tableName);
            this.updateQueryExample();
        });
        
        window.addEventListener('fileRemoved', (event) => {
            this.removeTable(event.detail.tableName);
            this.updateQueryExample();
        });
    }
    
    /**
     * Set initial query example
     */
    setInitialQuery() {
        const initialQuery = `-- Welcome to CSV Tools!
-- 1. Upload CSV files using the dropzone above
-- 2. Files will be automatically assigned table aliases (t1, t2, t3...)
-- 3. Write SQL queries using these table names
-- 4. Press Ctrl+Enter to execute

-- Example queries:
-- SELECT * FROM t1 LIMIT 10;
-- SELECT COUNT(*) FROM t1;
-- SELECT column1, column2 FROM t1 WHERE column1 > 100;

-- Upload a CSV file to get started!`;
        
        this.setValue(initialQuery);
    }
    
    /**
     * Update query example when tables change
     */
    updateQueryExample() {
        if (this.availableTables.length === 0) {
            this.setInitialQuery();
            return;
        }
        
        const tables = this.availableTables.join(', ');
        const firstTable = this.availableTables[0];
        
        let exampleQuery = `-- Available tables: ${tables}\n\n`;
        
        if (this.availableTables.length === 1) {
            exampleQuery += `-- Explore your data
SELECT * FROM ${firstTable} LIMIT 10;

-- Get row count
SELECT COUNT(*) as total_rows FROM ${firstTable};

-- Get column information
DESCRIBE ${firstTable};`;
        } else {
            const secondTable = this.availableTables[1];
            exampleQuery += `-- Explore individual tables
SELECT * FROM ${firstTable} LIMIT 5;
SELECT * FROM ${secondTable} LIMIT 5;

-- Join tables (adjust column names as needed)
SELECT *
FROM ${firstTable} a
JOIN ${secondTable} b ON a.id = b.id;

-- Aggregate data
SELECT COUNT(*) as total_rows
FROM ${firstTable}
UNION ALL
SELECT COUNT(*) as total_rows
FROM ${secondTable};`;
        }
        
        // Only update if editor is empty or has the welcome message
        const currentValue = this.getValue().trim();
        if (!currentValue || currentValue.includes('Upload a CSV file to get started!')) {
            this.setValue(exampleQuery);
        }
    }
    
    /**
     * Get current editor value
     * @returns {string} SQL query
     */
    getValue() {
        return this.editor ? this.editor.getValue() : '';
    }
    
    /**
     * Set editor value
     * @param {string} value - SQL query to set
     */
    setValue(value) {
        if (this.editor) {
            this.editor.setValue(value);
        }
    }
    
    /**
     * Focus the editor
     */
    focus() {
        if (this.editor) {
            this.editor.focus();
        }
    }
    
    /**
     * Add table to available tables list
     * @param {string} tableName - Table name to add
     */
    addTable(tableName) {
        if (!this.availableTables.includes(tableName)) {
            this.availableTables.push(tableName);
            this.availableTables.sort(); // Keep sorted for consistency
            console.log(`Added table to SQL editor: ${tableName}`);
        }
    }
    
    /**
     * Remove table from available tables list
     * @param {string} tableName - Table name to remove
     */
    removeTable(tableName) {
        const index = this.availableTables.indexOf(tableName);
        if (index > -1) {
            this.availableTables.splice(index, 1);
            console.log(`Removed table from SQL editor: ${tableName}`);
        }
    }
    
    /**
     * Get list of available tables
     * @returns {Array<string>} Available table names
     */
    getAvailableTables() {
        return [...this.availableTables];
    }
    
    /**
     * Execute current query (trigger external handler)
     */
    executeQuery() {
        // Dispatch custom event for the main app to handle
        window.dispatchEvent(new CustomEvent('executeQuery', {
            detail: { sql: this.getValue() }
        }));
    }
    
    /**
     * Insert text at cursor position
     * @param {string} text - Text to insert
     */
    insertText(text) {
        if (this.editor) {
            const cursor = this.editor.getCursor();
            this.editor.replaceRange(text, cursor);
            this.editor.focus();
        }
    }
    
    /**
     * Get selected text
     * @returns {string} Selected text
     */
    getSelectedText() {
        return this.editor ? this.editor.getSelection() : '';
    }
    
    /**
     * Replace selected text
     * @param {string} text - Replacement text
     */
    replaceSelectedText(text) {
        if (this.editor) {
            this.editor.replaceSelection(text);
        }
    }
    
    /**
     * Format SQL query (basic formatting)
     */
    formatQuery() {
        if (!this.editor) return;
        
        let sql = this.getValue();
        if (!sql.trim()) return;
        
        // Basic SQL formatting
        sql = sql
            .replace(/\s+/g, ' ') // Normalize whitespace
            .replace(/\b(SELECT|FROM|WHERE|JOIN|LEFT JOIN|RIGHT JOIN|INNER JOIN|GROUP BY|ORDER BY|HAVING|UNION|INSERT|UPDATE|DELETE)\b/gi, '\n$1')
            .replace(/,/g, ',\n  ') // Add newlines after commas
            .replace(/\n\s*\n/g, '\n') // Remove empty lines
            .trim();
        
        // Fix indentation
        const lines = sql.split('\n');
        let indentLevel = 0;
        const formatted = lines.map(line => {
            line = line.trim();
            if (line.match(/\b(SELECT|FROM|WHERE|JOIN|LEFT JOIN|RIGHT JOIN|INNER JOIN|GROUP BY|ORDER BY|HAVING|UNION|INSERT|UPDATE|DELETE)\b/i)) {
                return line;
            } else if (line.length > 0) {
                return '  ' + line;
            }
            return line;
        }).join('\n');
        
        this.setValue(formatted);
    }
    
    /**
     * Clear editor content
     */
    clear() {
        this.setValue('');
    }
    
    /**
     * Get editor statistics
     * @returns {Object} Editor statistics
     */
    getStats() {
        if (!this.editor) return { lines: 0, characters: 0, words: 0 };
        
        const content = this.getValue();
        return {
            lines: this.editor.lineCount(),
            characters: content.length,
            words: content.trim() ? content.trim().split(/\s+/).length : 0
        };
    }
    
    /**
     * Set editor theme
     * @param {string} theme - Theme name
     */
    setTheme(theme) {
        if (this.editor) {
            this.editor.setOption('theme', theme);
        }
    }
    
    /**
     * Enable/disable editor
     * @param {boolean} enabled - Whether editor should be enabled
     */
    setEnabled(enabled) {
        if (this.editor) {
            this.editor.setOption('readOnly', !enabled);
            this.editor.setOption('cursorBlinkRate', enabled ? 530 : -1);
        }
    }
    
    /**
     * Resize editor to fit content
     */
    refresh() {
        if (this.editor) {
            this.editor.refresh();
        }
    }
}