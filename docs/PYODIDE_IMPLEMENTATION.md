# Pyodide Implementation Plan

## Overview
Feature branch implementation focusing on robust CSV + Excel processing using Python ecosystem.

## Core Dependencies
- **Pyodide**: Python runtime in browser
- **DuckDB**: Python package via Pyodide
- **pandas**: CSV/Excel file processing
- **Dropzone.js**: File upload UX (shared with WASM version)
- **CodeMirror**: SQL syntax highlighting (shared with WASM version)

## File Structure
```
/
├── pyodide.html           # Pyodide entry point
├── css/
│   ├── pyodide-style.css  # Pyodide-specific styles
│   └── shared.css         # Shared styles with WASM version
├── js/
│   ├── pyodide-main.js    # Pyodide application controller
│   ├── python-bridge.js   # JavaScript-Python communication
│   └── shared/            # Shared components with WASM version
│       ├── sql-editor.js  # CodeMirror integration
│       └── ui-utils.js    # Common UI utilities
├── python/
│   ├── duckdb_manager.py  # DuckDB operations in Python
│   ├── file_processor.py  # pandas-based file processing
│   └── csv_exporter.py    # Export functionality
└── tests/
    ├── pyodide-test.html  # Pyodide test runner
    └── python-tests.py    # Python unit tests
```

## Implementation Steps

### Week 3: Pyodide Foundation

#### Day 1-2: Pyodide Runtime Setup
```html
<!DOCTYPE html>
<html>
<head>
    <title>CSV Tools - Pyodide</title>
    <!-- Pyodide from CDN -->
    <script src="https://cdn.jsdelivr.net/pyodide/v0.24.1/full/pyodide.js"></script>
    
    <!-- Shared dependencies -->
    <script src="https://unpkg.com/dropzone@6/dist/dropzone-min.js"></script>
    <script src="https://unpkg.com/codemirror@5/lib/codemirror.js"></script>
    <script src="https://unpkg.com/codemirror@5/mode/sql/sql.js"></script>
    
    <link rel="stylesheet" href="https://unpkg.com/dropzone@6/dist/dropzone.css">
    <link rel="stylesheet" href="https://unpkg.com/codemirror@5/lib/codemirror.css">
    <link rel="stylesheet" href="css/pyodide-style.css">
</head>
<body>
    <div id="app">
        <header>
            <h1>CSV Tools - Pyodide</h1>
            <p>Upload CSV/Excel files and query with SQL (Python backend)</p>
            <div id="loading-status">Initializing Python runtime...</div>
        </header>
        
        <div id="upload-section" style="display: none;">
            <div id="dropzone" class="dropzone">
                <div class="dz-message">
                    Drop CSV or Excel files here or click to upload
                </div>
            </div>
            <div id="file-list"></div>
        </div>
        
        <div id="query-section" style="display: none;">
            <div id="sql-editor"></div>
            <button id="run-query">Run Query</button>
        </div>
        
        <div id="results-section" style="display: none;">
            <div id="results-table"></div>
            <button id="export-csv">Export Results</button>
        </div>
    </div>
    
    <script src="js/python-bridge.js"></script>
    <script src="js/pyodide-main.js"></script>
</body>
</html>
```

#### Day 3-4: Python-JavaScript Bridge
```javascript
// js/python-bridge.js
class PythonBridge {
    constructor() {
        this.pyodide = null;
        this.isReady = false;
    }
    
    async initialize() {
        try {
            // Load Pyodide
            this.pyodide = await loadPyodide();
            
            // Install required packages
            await this.pyodide.loadPackage(['pandas', 'openpyxl']);
            
            // Install DuckDB
            await this.pyodide.runPython(`
                import micropip
                await micropip.install('duckdb')
            `);
            
            // Load our Python modules
            await this.loadPythonModules();
            
            this.isReady = true;
            return true;
        } catch (error) {
            console.error('Failed to initialize Pyodide:', error);
            throw error;
        }
    }
    
    async loadPythonModules() {
        // Load Python code into Pyodide
        const duckdbManagerCode = await this.fetchPythonModule('python/duckdb_manager.py');
        const fileProcessorCode = await this.fetchPythonModule('python/file_processor.py');
        const csvExporterCode = await this.fetchPythonModule('python/csv_exporter.py');
        
        this.pyodide.runPython(duckdbManagerCode);
        this.pyodide.runPython(fileProcessorCode);
        this.pyodide.runPython(csvExporterCode);
        
        // Initialize Python objects
        this.pyodide.runPython(`
            duckdb_manager = DuckDBManager()
            file_processor = FileProcessor()
            csv_exporter = CSVExporter()
        `);
    }
    
    async fetchPythonModule(path) {
        const response = await fetch(path);
        return await response.text();
    }
    
    async runPython(code) {
        if (!this.isReady) {
            throw new Error('Pyodide not ready');
        }
        return this.pyodide.runPython(code);
    }
    
    async callPythonFunction(functionName, ...args) {
        if (!this.isReady) {
            throw new Error('Pyodide not ready');
        }
        
        // Convert JavaScript arguments to Python
        const pyArgs = args.map(arg => this.pyodide.toPy(arg));
        
        // Call Python function
        const result = this.pyodide.globals.get(functionName)(...pyArgs);
        
        // Convert result back to JavaScript
        return result.toJs();
    }
    
    getProgress() {
        // For showing initialization progress
        return this.pyodide ? this.pyodide.progress : 0;
    }
}
```

#### Day 5: Python Backend Modules
```python
# python/duckdb_manager.py
import duckdb
import pandas as pd
from typing import List, Dict, Any

class DuckDBManager:
    def __init__(self):
        self.conn = duckdb.connect()
        
    def load_dataframe(self, df: pd.DataFrame, table_name: str) -> str:
        """Load pandas DataFrame into DuckDB table"""
        self.conn.register(table_name, df)
        return table_name
    
    def run_query(self, sql: str) -> List[Dict[str, Any]]:
        """Execute SQL query and return results as list of dictionaries"""
        try:
            result = self.conn.execute(sql).fetchdf()
            return result.to_dict('records')
        except Exception as e:
            raise Exception(f"SQL Error: {str(e)}")
    
    def get_table_info(self, table_name: str) -> List[Dict[str, Any]]:
        """Get table schema information"""
        result = self.conn.execute(f"DESCRIBE {table_name}").fetchdf()
        return result.to_dict('records')
    
    def list_tables(self) -> List[str]:
        """List all available tables"""
        result = self.conn.execute("SHOW TABLES").fetchdf()
        return result['name'].tolist() if 'name' in result.columns else []
    
    def close(self):
        """Close the connection"""
        self.conn.close()
```

```python
# python/file_processor.py
import pandas as pd
import io
from typing import Tuple, Optional

class FileProcessor:
    def __init__(self):
        self.supported_extensions = ['.csv', '.xlsx', '.xls']
    
    def process_file(self, file_content: bytes, filename: str, encoding: str = 'utf-8') -> Tuple[pd.DataFrame, str]:
        """Process uploaded file and return DataFrame"""
        try:
            file_ext = self._get_file_extension(filename).lower()
            
            if file_ext == '.csv':
                return self._process_csv(file_content, encoding), 'CSV'
            elif file_ext in ['.xlsx', '.xls']:
                return self._process_excel(file_content), 'Excel'
            else:
                raise ValueError(f"Unsupported file type: {file_ext}")
                
        except Exception as e:
            raise Exception(f"Failed to process {filename}: {str(e)}")
    
    def _process_csv(self, content: bytes, encoding: str) -> pd.DataFrame:
        """Process CSV file with robust error handling"""
        text_content = content.decode(encoding)
        
        # Try different CSV parsing strategies
        strategies = [
            # Standard CSV
            {'sep': ',', 'encoding': encoding},
            # Tab-separated
            {'sep': '\\t', 'encoding': encoding},
            # Semicolon-separated (European)
            {'sep': ';', 'encoding': encoding},
            # Auto-detect separator
            {'sep': None, 'encoding': encoding}
        ]
        
        for strategy in strategies:
            try:
                df = pd.read_csv(io.StringIO(text_content), **{k: v for k, v in strategy.items() if v is not None})
                if not df.empty and len(df.columns) > 1:
                    return df
            except Exception:
                continue
        
        # Fallback: treat as single-column data
        return pd.read_csv(io.StringIO(text_content), header=None, names=['data'])
    
    def _process_excel(self, content: bytes) -> pd.DataFrame:
        """Process Excel file"""
        # Use first sheet by default
        df = pd.read_excel(io.BytesIO(content), engine='openpyxl')
        
        if df.empty:
            raise ValueError("Excel file appears to be empty")
        
        return df
    
    def _get_file_extension(self, filename: str) -> str:
        """Extract file extension"""
        return '.' + filename.split('.')[-1] if '.' in filename else ''
    
    def validate_dataframe(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Validate and return DataFrame info"""
        return {
            'rows': len(df),
            'columns': len(df.columns),
            'column_names': df.columns.tolist(),
            'dtypes': df.dtypes.astype(str).to_dict(),
            'memory_usage': df.memory_usage(deep=True).sum()
        }
```

### Week 4: Excel Support and Feature Parity

#### Day 6-7: Advanced File Processing
```python
# python/csv_exporter.py
import pandas as pd
import io
from typing import List, Dict, Any

class CSVExporter:
    def __init__(self):
        pass
    
    def export_to_csv(self, data: List[Dict[str, Any]], filename: str = 'export.csv') -> str:
        """Convert query results to CSV format"""
        if not data:
            return ""
        
        # Convert to DataFrame for better CSV handling
        df = pd.DataFrame(data)
        
        # Export to CSV string
        csv_buffer = io.StringIO()
        df.to_csv(csv_buffer, index=False, encoding='utf-8')
        
        return csv_buffer.getvalue()
    
    def export_to_excel(self, data: List[Dict[str, Any]], filename: str = 'export.xlsx') -> bytes:
        """Convert query results to Excel format"""
        if not data:
            return b""
        
        df = pd.DataFrame(data)
        
        # Export to Excel bytes
        excel_buffer = io.BytesIO()
        df.to_excel(excel_buffer, index=False, engine='openpyxl')
        
        return excel_buffer.getvalue()
    
    def get_export_info(self, data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Get information about export data"""
        if not data:
            return {'rows': 0, 'columns': 0, 'size_estimate': 0}
        
        df = pd.DataFrame(data)
        return {
            'rows': len(df),
            'columns': len(df.columns),
            'size_estimate': df.memory_usage(deep=True).sum()
        }
```

#### Day 8-9: Pyodide Main Application
```javascript
// js/pyodide-main.js
class PyodideCSVTools {
    constructor() {
        this.pythonBridge = new PythonBridge();
        this.sqlEditor = null;
        this.dropzone = null;
        this.uploadedFiles = new Map();
        this.tableCounter = 1;
        this.currentResults = null;
        
        this.initialize();
    }
    
    async initialize() {
        try {
            this.updateLoadingStatus('Loading Python runtime...');
            await this.pythonBridge.initialize();
            
            this.updateLoadingStatus('Setting up interface...');
            this.initializeUI();
            
            this.updateLoadingStatus('Ready!');
            this.showMainInterface();
            
        } catch (error) {
            console.error('Initialization failed:', error);
            this.showError('Failed to initialize application: ' + error.message);
        }
    }
    
    updateLoadingStatus(message) {
        const statusDiv = document.getElementById('loading-status');
        if (statusDiv) {
            statusDiv.textContent = message;
        }
    }
    
    showMainInterface() {
        document.getElementById('loading-status').style.display = 'none';
        document.getElementById('upload-section').style.display = 'block';
        document.getElementById('query-section').style.display = 'block';
        document.getElementById('results-section').style.display = 'block';
    }
    
    initializeUI() {
        // Initialize SQL Editor
        this.sqlEditor = CodeMirror(document.getElementById('sql-editor'), {
            mode: 'text/x-sql',
            theme: 'default',
            lineNumbers: true,
            placeholder: 'Enter your SQL query here...'
        });
        
        // Initialize Dropzone
        this.dropzone = new Dropzone("#dropzone", {
            url: "/dummy",
            autoProcessQueue: false,
            acceptedFiles: ".csv,.xlsx,.xls",
            maxFilesize: 10,
            addedfile: (file) => this.handleFile(file),
            error: (file, error) => this.showError(`Upload error: ${error}`)
        });
        
        // Event listeners
        document.getElementById('run-query').addEventListener('click', () => this.runQuery());
        document.getElementById('export-csv').addEventListener('click', () => this.exportResults());
    }
    
    async handleFile(file) {
        try {
            this.updateLoadingStatus(`Processing ${file.name}...`);
            
            // Read file as ArrayBuffer
            const arrayBuffer = await file.arrayBuffer();
            const uint8Array = new Uint8Array(arrayBuffer);
            
            // Process file in Python
            const processResult = await this.pythonBridge.runPython(`
                # Convert JavaScript Uint8Array to Python bytes
                import js
                file_content = bytes(js.uint8Array)
                
                # Process the file
                df, file_type = file_processor.process_file(file_content, "${file.name}")
                
                # Get table name and load into DuckDB
                table_name = f"t{${this.tableCounter}}"
                duckdb_manager.load_dataframe(df, table_name)
                
                # Return info
                info = file_processor.validate_dataframe(df)
                info['table_name'] = table_name
                info['file_type'] = file_type
                info
            `);
            
            // Store file info
            this.uploadedFiles.set(processResult.table_name, {
                file: file,
                info: processResult,
                uploadTime: new Date()
            });
            
            this.tableCounter++;
            this.updateFileList();
            this.updateSQLEditor();
            
            this.updateLoadingStatus('Ready!');
            
        } catch (error) {
            this.showError(`Failed to process ${file.name}: ${error.message}`);
            this.updateLoadingStatus('Ready!');
        }
    }
    
    updateFileList() {
        const fileList = document.getElementById('file-list');
        fileList.innerHTML = '';
        
        for (const [tableName, data] of this.uploadedFiles) {
            const fileItem = document.createElement('div');
            fileItem.className = 'file-item';
            fileItem.innerHTML = `
                <div class="file-info">
                    <span class="file-name">${data.file.name}</span>
                    <span class="file-type">(${data.info.file_type})</span>
                    <span class="table-alias">→ ${tableName}</span>
                </div>
                <div class="file-stats">
                    ${data.info.rows} rows, ${data.info.columns} columns
                </div>
                <button onclick="pyodideCSVTools.removeFile('${tableName}')">Remove</button>
            `;
            fileList.appendChild(fileItem);
        }
    }
    
    updateSQLEditor() {
        const tables = Array.from(this.uploadedFiles.keys());
        if (tables.length > 0) {
            const exampleQuery = `-- Available tables: ${tables.join(', ')}\\nSELECT * FROM ${tables[0]} LIMIT 10;`;
            this.sqlEditor.setValue(exampleQuery);
        }
    }
    
    async runQuery() {
        try {
            const sql = this.sqlEditor.getValue().trim();
            if (!sql) {
                this.showError('Please enter a SQL query');
                return;
            }
            
            this.updateLoadingStatus('Running query...');
            
            const results = await this.pythonBridge.runPython(`
                result = duckdb_manager.run_query("""${sql}""")
                result
            `);
            
            this.currentResults = results;
            this.displayResults(results);
            this.updateLoadingStatus('Ready!');
            
        } catch (error) {
            this.showError(`Query error: ${error.message}`);
            this.updateLoadingStatus('Ready!');
        }
    }
    
    displayResults(results) {
        const container = document.getElementById('results-table');
        
        if (!results || results.length === 0) {
            container.innerHTML = '<p>No results to display</p>';
            return;
        }
        
        // Simple table display (can be enhanced with pagination)
        const table = document.createElement('table');
        table.className = 'results-table';
        
        // Header
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        Object.keys(results[0]).forEach(column => {
            const th = document.createElement('th');
            th.textContent = column;
            headerRow.appendChild(th);
        });
        thead.appendChild(headerRow);
        table.appendChild(thead);
        
        // Body (limit display to first 1000 rows)
        const tbody = document.createElement('tbody');
        const displayResults = results.slice(0, 1000);
        
        displayResults.forEach(row => {
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
        
        // Add info about result count
        if (results.length > 1000) {
            const info = document.createElement('p');
            info.textContent = `Showing first 1000 of ${results.length} results. All data available for export.`;
            container.appendChild(info);
        }
    }
    
    async exportResults() {
        if (!this.currentResults) {
            this.showError('No results to export');
            return;
        }
        
        try {
            const csvContent = await this.pythonBridge.runPython(`
                csv_exporter.export_to_csv(js.currentResults.to_py())
            `);
            
            // Download CSV
            const blob = new Blob([csvContent], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'query_results.csv';
            a.click();
            URL.revokeObjectURL(url);
            
        } catch (error) {
            this.showError(`Export failed: ${error.message}`);
        }
    }
    
    removeFile(tableName) {
        this.uploadedFiles.delete(tableName);
        this.updateFileList();
        this.updateSQLEditor();
    }
    
    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-notification';
        errorDiv.textContent = message;
        document.body.appendChild(errorDiv);
        setTimeout(() => errorDiv.remove(), 5000);
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.pyodideCSVTools = new PyodideCSVTools();
});
```

#### Day 10: Testing and Polish
```python
# tests/python-tests.py
import unittest
import pandas as pd
import io

class TestFileProcessor(unittest.TestCase):
    def setUp(self):
        self.processor = FileProcessor()
    
    def test_csv_processing(self):
        csv_content = b"name,age\\nJohn,25\\nJane,30"
        df, file_type = self.processor.process_file(csv_content, "test.csv")
        
        self.assertEqual(file_type, "CSV")
        self.assertEqual(len(df), 2)
        self.assertEqual(list(df.columns), ["name", "age"])
    
    def test_excel_processing(self):
        # Create a simple Excel file in memory
        df_original = pd.DataFrame({"A": [1, 2, 3], "B": ["x", "y", "z"]})
        excel_buffer = io.BytesIO()
        df_original.to_excel(excel_buffer, index=False, engine='openpyxl')
        excel_content = excel_buffer.getvalue()
        
        df, file_type = self.processor.process_file(excel_content, "test.xlsx")
        
        self.assertEqual(file_type, "Excel")
        self.assertEqual(len(df), 3)
        self.assertEqual(list(df.columns), ["A", "B"])

class TestDuckDBManager(unittest.TestCase):
    def setUp(self):
        self.manager = DuckDBManager()
    
    def test_dataframe_loading(self):
        df = pd.DataFrame({"x": [1, 2, 3], "y": [4, 5, 6]})
        table_name = self.manager.load_dataframe(df, "test_table")
        
        self.assertEqual(table_name, "test_table")
        
        # Test query
        results = self.manager.run_query("SELECT COUNT(*) as count FROM test_table")
        self.assertEqual(results[0]["count"], 3)

if __name__ == "__main__":
    unittest.main()
```

## Success Criteria for Pyodide Version
- ✅ Handle both CSV and Excel files reliably
- ✅ Robust file processing with pandas
- ✅ Same SQL interface as WASM version
- ✅ Export to CSV and Excel formats
- ✅ Progress indicators for Python initialization
- ✅ Error handling for malformed files
- ✅ Memory management for large files
- ✅ Test coverage > 85%

This implementation leverages Python's mature data processing ecosystem while maintaining the same user experience as the WASM version.