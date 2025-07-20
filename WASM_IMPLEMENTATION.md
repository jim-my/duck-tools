# DuckDB-WASM Implementation Plan

## Overview
Main branch implementation focusing on CSV processing with maximum simplicity and fast load times.

## Core Dependencies
- **DuckDB-WASM**: `@duckdb/duckdb-wasm` from CDN
- **Dropzone.js**: `dropzone@6` for file upload UX
- **CodeMirror**: SQL syntax highlighting
- **No build process**: Direct HTML/CSS/JS files

## File Structure
```
/
├── index.html              # Main entry point
├── css/
│   ├── style.css          # Main styles
│   └── dropzone.css       # Dropzone styling customizations
├── js/
│   ├── main.js            # Application controller
│   ├── duckdb-manager.js  # DuckDB-WASM integration
│   ├── file-handler.js    # CSV processing via Dropzone
│   ├── sql-editor.js      # CodeMirror integration
│   ├── results-table.js   # Results display and pagination
│   └── csv-exporter.js    # Download functionality
└── tests/
    ├── test.html          # Test runner
    └── unit-tests.js      # Core functionality tests
```

## Implementation Steps

### Week 1: Core Foundation

#### Day 1-2: Basic HTML Structure
```html
<!DOCTYPE html>
<html>
<head>
    <title>CSV Tools - DuckDB WASM</title>
    <!-- External dependencies from CDN -->
    <script src="https://cdn.jsdelivr.net/npm/@duckdb/duckdb-wasm@latest/dist/duckdb-mvp.wasm.js"></script>
    <script src="https://unpkg.com/dropzone@6/dist/dropzone-min.js"></script>
    <script src="https://unpkg.com/codemirror@5/lib/codemirror.js"></script>
    <script src="https://unpkg.com/codemirror@5/mode/sql/sql.js"></script>
    
    <link rel="stylesheet" href="https://unpkg.com/dropzone@6/dist/dropzone.css">
    <link rel="stylesheet" href="https://unpkg.com/codemirror@5/lib/codemirror.css">
    <link rel="stylesheet" href="css/style.css">
</head>
<body>
    <div id="app">
        <header>
            <h1>CSV Tools</h1>
            <p>Upload CSV files and query with SQL</p>
        </header>
        
        <div id="upload-section">
            <div id="dropzone" class="dropzone">
                <div class="dz-message">
                    Drop CSV files here or click to upload
                </div>
            </div>
            <div id="file-list"></div>
        </div>
        
        <div id="query-section">
            <div id="sql-editor"></div>
            <button id="run-query">Run Query</button>
        </div>
        
        <div id="results-section">
            <div id="results-table"></div>
            <button id="export-csv">Export Results</button>
        </div>
    </div>
    
    <script src="js/main.js"></script>
</body>
</html>
```

#### Day 3-4: DuckDB-WASM Integration
```javascript
// js/duckdb-manager.js
class DuckDBManager {
    constructor() {
        this.db = null;
        this.conn = null;
    }
    
    async initialize() {
        const JSDELIVR_BUNDLES = duckdb.getJsDelivrBundles();
        const bundle = await duckdb.selectBundle(JSDELIVR_BUNDLES);
        const worker = new Worker(bundle.mainWorker);
        const logger = new duckdb.ConsoleLogger();
        this.db = new duckdb.AsyncDuckDB(logger, worker);
        await this.db.instantiate(bundle.mainModule, bundle.pthreadWorker);
        this.conn = await this.db.connect();
    }
    
    async loadCSV(file, tableName) {
        // Read file as text
        const text = await file.text();
        
        // Use DuckDB's read_csv_auto function
        const query = `CREATE TABLE ${tableName} AS SELECT * FROM read_csv_auto($1)`;
        await this.conn.query(query, [text]);
        
        return tableName;
    }
    
    async runQuery(sql) {
        const result = await this.conn.query(sql);
        return result.toArray();
    }
    
    async getTableInfo(tableName) {
        const result = await this.conn.query(`DESCRIBE ${tableName}`);
        return result.toArray();
    }
    
    async listTables() {
        const result = await this.conn.query("SHOW TABLES");
        return result.toArray();
    }
}
```

#### Day 5: File Upload Integration
```javascript
// js/file-handler.js
class FileHandler {
    constructor(duckdbManager) {
        this.duckdb = duckdbManager;
        this.uploadedFiles = new Map();
        this.tableCounter = 1;
        this.initializeDropzone();
    }
    
    initializeDropzone() {
        this.dropzone = new Dropzone("#dropzone", {
            url: "/dummy", // Not used since we handle files locally
            autoProcessQueue: false,
            acceptedFiles: ".csv",
            maxFilesize: 10, // 10MB limit
            addedfile: (file) => this.handleFile(file),
            error: (file, errorMessage) => this.showError(errorMessage)
        });
    }
    
    async handleFile(file) {
        try {
            const tableName = `t${this.tableCounter++}`;
            await this.duckdb.loadCSV(file, tableName);
            
            this.uploadedFiles.set(tableName, {
                file: file,
                tableName: tableName,
                uploadTime: new Date()
            });
            
            this.updateFileList();
            this.updateSQLEditor();
        } catch (error) {
            this.showError(`Failed to process ${file.name}: ${error.message}`);
        }
    }
    
    updateFileList() {
        const fileList = document.getElementById('file-list');
        fileList.innerHTML = '';
        
        for (const [tableName, info] of this.uploadedFiles) {
            const fileItem = document.createElement('div');
            fileItem.className = 'file-item';
            fileItem.innerHTML = `
                <span class="file-name">${info.file.name}</span>
                <span class="table-alias">→ ${tableName}</span>
                <button onclick="fileHandler.removeFile('${tableName}')">Remove</button>
            `;
            fileList.appendChild(fileItem);
        }
    }
    
    updateSQLEditor() {
        // Add example query with available tables
        const tables = Array.from(this.uploadedFiles.keys());
        if (tables.length > 0) {
            const exampleQuery = `-- Available tables: ${tables.join(', ')}\nSELECT * FROM ${tables[0]} LIMIT 10;`;
            sqlEditor.setValue(exampleQuery);
        }
    }
    
    showError(message) {
        // Simple error display
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        document.getElementById('upload-section').appendChild(errorDiv);
        
        setTimeout(() => errorDiv.remove(), 5000);
    }
}
```

### Week 2: UI and Query Features

#### Day 6-7: SQL Editor with CodeMirror
```javascript
// js/sql-editor.js
class SQLEditor {
    constructor() {
        this.editor = null;
        this.initializeEditor();
    }
    
    initializeEditor() {
        this.editor = CodeMirror(document.getElementById('sql-editor'), {
            mode: 'text/x-sql',
            theme: 'default',
            lineNumbers: true,
            autoCloseBrackets: true,
            matchBrackets: true,
            indentWithTabs: false,
            indentUnit: 2,
            placeholder: 'Enter your SQL query here...'
        });
    }
    
    getValue() {
        return this.editor.getValue();
    }
    
    setValue(value) {
        this.editor.setValue(value);
    }
    
    focus() {
        this.editor.focus();
    }
}
```

#### Day 8-9: Results Display and Pagination
```javascript
// js/results-table.js
class ResultsTable {
    constructor() {
        this.currentResults = null;
        this.currentPage = 1;
        this.pageSize = 100;
    }
    
    displayResults(results) {
        this.currentResults = results;
        this.currentPage = 1;
        this.renderTable();
        this.renderPagination();
    }
    
    renderTable() {
        const container = document.getElementById('results-table');
        
        if (!this.currentResults || this.currentResults.length === 0) {
            container.innerHTML = '<p>No results to display</p>';
            return;
        }
        
        const startIndex = (this.currentPage - 1) * this.pageSize;
        const endIndex = Math.min(startIndex + this.pageSize, this.currentResults.length);
        const pageResults = this.currentResults.slice(startIndex, endIndex);
        
        const table = document.createElement('table');
        table.className = 'results-table';
        
        // Header
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        
        if (pageResults.length > 0) {
            Object.keys(pageResults[0]).forEach(column => {
                const th = document.createElement('th');
                th.textContent = column;
                headerRow.appendChild(th);
            });
        }
        
        thead.appendChild(headerRow);
        table.appendChild(thead);
        
        // Body
        const tbody = document.createElement('tbody');
        
        pageResults.forEach(row => {
            const tr = document.createElement('tr');
            Object.values(row).forEach(value => {
                const td = document.createElement('td');
                td.textContent = value !== null ? value : '';
                tr.appendChild(td);
            });
            tbody.appendChild(tr);
        });
        
        table.appendChild(tbody);
        container.innerHTML = '';
        container.appendChild(table);
    }
    
    renderPagination() {
        // Simple pagination controls
        const totalPages = Math.ceil(this.currentResults.length / this.pageSize);
        const paginationDiv = document.createElement('div');
        paginationDiv.className = 'pagination';
        
        if (totalPages > 1) {
            paginationDiv.innerHTML = `
                <button onclick="resultsTable.goToPage(${this.currentPage - 1})" ${this.currentPage === 1 ? 'disabled' : ''}>Previous</button>
                <span>Page ${this.currentPage} of ${totalPages}</span>
                <button onclick="resultsTable.goToPage(${this.currentPage + 1})" ${this.currentPage === totalPages ? 'disabled' : ''}>Next</button>
            `;
        }
        
        document.getElementById('results-table').appendChild(paginationDiv);
    }
    
    goToPage(page) {
        const totalPages = Math.ceil(this.currentResults.length / this.pageSize);
        if (page >= 1 && page <= totalPages) {
            this.currentPage = page;
            this.renderTable();
            this.renderPagination();
        }
    }
}
```

#### Day 10: CSV Export and Main App Controller
```javascript
// js/main.js
class CSVTools {
    constructor() {
        this.duckdb = new DuckDBManager();
        this.fileHandler = null;
        this.sqlEditor = new SQLEditor();
        this.resultsTable = new ResultsTable();
        this.csvExporter = new CSVExporter();
        
        this.initialize();
    }
    
    async initialize() {
        try {
            await this.duckdb.initialize();
            this.fileHandler = new FileHandler(this.duckdb);
            this.setupEventListeners();
            console.log('CSV Tools initialized successfully');
        } catch (error) {
            console.error('Failed to initialize CSV Tools:', error);
            this.showError('Failed to initialize application');
        }
    }
    
    setupEventListeners() {
        document.getElementById('run-query').addEventListener('click', () => this.runQuery());
        document.getElementById('export-csv').addEventListener('click', () => this.exportResults());
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault();
                this.runQuery();
            }
        });
    }
    
    async runQuery() {
        try {
            const sql = this.sqlEditor.getValue().trim();
            if (!sql) {
                this.showError('Please enter a SQL query');
                return;
            }
            
            const results = await this.duckdb.runQuery(sql);
            this.resultsTable.displayResults(results);
            
        } catch (error) {
            this.showError(`Query error: ${error.message}`);
        }
    }
    
    exportResults() {
        if (this.resultsTable.currentResults) {
            this.csvExporter.exportToCSV(this.resultsTable.currentResults, 'query_results.csv');
        } else {
            this.showError('No results to export');
        }
    }
    
    showError(message) {
        // Simple error notification
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-notification';
        errorDiv.textContent = message;
        document.body.appendChild(errorDiv);
        
        setTimeout(() => errorDiv.remove(), 5000);
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.csvTools = new CSVTools();
});
```

## Testing Strategy

### Unit Tests Structure
```javascript
// tests/unit-tests.js
class TestRunner {
    constructor() {
        this.tests = [];
        this.results = [];
    }
    
    test(name, testFunction) {
        this.tests.push({ name, testFunction });
    }
    
    async runAll() {
        for (const test of this.tests) {
            try {
                await test.testFunction();
                this.results.push({ name: test.name, status: 'PASS' });
            } catch (error) {
                this.results.push({ name: test.name, status: 'FAIL', error: error.message });
            }
        }
        this.displayResults();
    }
    
    displayResults() {
        const resultsDiv = document.getElementById('test-results');
        resultsDiv.innerHTML = this.results.map(result => 
            `<div class="${result.status.toLowerCase()}">${result.name}: ${result.status}${result.error ? ` - ${result.error}` : ''}</div>`
        ).join('');
    }
}

// Test cases
const testRunner = new TestRunner();

testRunner.test('DuckDB Manager Initialization', async () => {
    const manager = new DuckDBManager();
    await manager.initialize();
    assert(manager.db !== null, 'DuckDB should be initialized');
    assert(manager.conn !== null, 'Connection should be established');
});

testRunner.test('CSV File Processing', async () => {
    const manager = new DuckDBManager();
    await manager.initialize();
    
    const csvContent = 'name,age\\nJohn,25\\nJane,30';
    const file = new File([csvContent], 'test.csv', { type: 'text/csv' });
    
    await manager.loadCSV(file, 'test_table');
    const results = await manager.runQuery('SELECT COUNT(*) as count FROM test_table');
    
    assert(results[0].count === 2, 'Should load 2 rows from CSV');
});

// Simple assertion function
function assert(condition, message) {
    if (!condition) {
        throw new Error(message);
    }
}
```

## Success Criteria
- ✅ Load CSV files via drag & drop
- ✅ Execute SQL queries on uploaded data
- ✅ Display paginated results
- ✅ Export results as CSV
- ✅ Handle errors gracefully
- ✅ Responsive design
- ✅ Test coverage > 85%

This implementation prioritizes simplicity and focuses on rock-solid CSV processing while maintaining clean, testable code structure.