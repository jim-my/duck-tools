/**
 * CSV Tools - Main Application
 * Coordinates all components and manages application state
 */
class CSVTools {
    constructor() {
        this.duckdb = new DuckDBManager();
        this.fileHandler = null;
        this.sqlEditor = new SQLEditor();
        this.resultsTable = new ResultsTable();
        this.csvExporter = new CSVExporter();
        
        this.isInitialized = false;
        this.currentQuery = '';
        
        this.initialize();
    }
    
    /**
     * Initialize the application
     */
    async initialize() {
        try {
            console.log('Initializing CSV Tools...');
            
            // Update loading status
            this.updateLoadingStatus('Initializing DuckDB-WASM...');
            
            // Initialize DuckDB
            await this.duckdb.initialize();
            
            // Update loading status
            this.updateLoadingStatus('Setting up file handler...');
            
            // Initialize file handler with DuckDB
            this.fileHandler = new FileHandler(this.duckdb);
            
            // Update loading status
            this.updateLoadingStatus('Setting up interface...');
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Mark as initialized
            this.isInitialized = true;
            
            // Show main interface
            this.showMainInterface();
            
            console.log('CSV Tools initialized successfully');
            
        } catch (error) {
            console.error('Failed to initialize CSV Tools:', error);
            this.showError(`Failed to initialize application: ${error.message}`);
            this.showInitializationError(error);
        }
    }
    
    /**
     * Update loading status message
     * @param {string} message - Status message
     */
    updateLoadingStatus(message) {
        const statusElement = document.getElementById('loading-status');
        if (statusElement) {
            statusElement.textContent = message;
        }
    }
    
    /**
     * Show main interface and hide loading
     */
    showMainInterface() {
        // Hide loading status
        const loadingElement = document.getElementById('loading-status');
        if (loadingElement) {
            loadingElement.style.display = 'none';
        }
        
        // Show main sections
        const sections = [
            'upload-section',
            'query-section',
            'results-section'
        ];
        
        sections.forEach(sectionId => {
            const section = document.getElementById(sectionId);
            if (section) {
                section.style.display = 'block';
            }
        });
        
        // Focus on SQL editor
        setTimeout(() => {
            this.sqlEditor.focus();
        }, 100);
    }
    
    /**
     * Show initialization error
     * @param {Error} error - The error that occurred
     */
    showInitializationError(error) {
        const loadingElement = document.getElementById('loading-status');
        if (loadingElement) {
            loadingElement.innerHTML = `
                <div style="color: #e74c3c; font-weight: bold;">
                    ❌ Initialization Failed
                </div>
                <div style="margin-top: 10px; font-size: 0.9em;">
                    ${error.message}
                </div>
                <div style="margin-top: 15px;">
                    <button onclick="location.reload()" style="padding: 8px 16px; background: #3498db; color: white; border: none; border-radius: 4px; cursor: pointer;">
                        Retry
                    </button>
                </div>
            `;
        }
    }
    
    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Run query button
        const runButton = document.getElementById('run-query');
        if (runButton) {
            runButton.addEventListener('click', () => this.runQuery());
        }
        
        // Export CSV button
        const exportButton = document.getElementById('export-csv');
        if (exportButton) {
            exportButton.addEventListener('click', () => this.exportResults());
        }
        
        // Listen for SQL editor events
        window.addEventListener('executeQuery', (event) => {
            this.runQuery(event.detail.sql);
        });
        
        // Listen for file events
        window.addEventListener('fileLoaded', (event) => {
            this.onFileLoaded(event.detail);
        });
        
        window.addEventListener('fileRemoved', (event) => {
            this.onFileRemoved(event.detail);
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Ctrl+Enter or Cmd+Enter to run query
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault();
                this.runQuery();
            }
            
            // Ctrl+E or Cmd+E to export (if results available)
            if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
                e.preventDefault();
                if (this.resultsTable.getCurrentResults()) {
                    this.exportResults();
                }
            }
        });
        
        // Handle window beforeunload
        window.addEventListener('beforeunload', () => {
            this.cleanup();
        });
    }
    
    /**
     * Execute SQL query
     * @param {string} sql - Optional SQL query (uses editor content if not provided)
     */
    async runQuery(sql = null) {
        if (!this.isInitialized) {
            this.showError('Application not fully initialized');
            return;
        }
        
        try {
            // Get SQL from editor if not provided
            const querySQL = sql || this.sqlEditor.getValue().trim();
            
            if (!querySQL) {
                this.showError('Please enter a SQL query');
                return;
            }
            
            // Store current query
            this.currentQuery = querySQL;
            
            // Update UI state
            this.setQueryRunning(true);
            
            console.log('Executing query:', querySQL);
            
            // Execute query
            const results = await this.duckdb.runQuery(querySQL);
            
            // Display results
            this.resultsTable.displayResults(results);
            
            // Update UI state
            this.setQueryRunning(false);
            
            // Log success
            console.log(`Query completed: ${results.length} rows returned`);
            
            // Show success message for large result sets
            if (results.length > 1000) {
                this.showInfo(`Query returned ${results.length.toLocaleString()} rows`);
            }
            
        } catch (error) {
            console.error('Query execution failed:', error);
            this.setQueryRunning(false);
            this.resultsTable.clear();
            this.showError(`Query failed: ${error.message}`);
        }
    }
    
    /**
     * Export current results to CSV
     */
    async exportResults() {
        try {
            const results = this.resultsTable.getCurrentResults();
            
            if (!results || results.length === 0) {
                this.showError('No results to export');
                return;
            }
            
            // Validate export data
            const validation = this.csvExporter.validateExportData(results);
            
            if (!validation.valid) {
                this.showError(`Export validation failed: ${validation.errors.join(', ')}`);
                return;
            }
            
            // Show warnings if any
            if (validation.warnings.length > 0) {
                validation.warnings.forEach(warning => this.showInfo(warning));
            }
            
            // Generate filename with timestamp
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
            const filename = `csv_tools_results_${timestamp}.csv`;
            
            // Export data
            this.csvExporter.exportToCSV(results, filename);
            
            // Show success message
            const stats = validation.stats;
            this.showSuccess(`Exported ${stats.rows.toLocaleString()} rows to ${filename}`);
            
            console.log(`Export completed: ${filename}`);
            
        } catch (error) {
            console.error('Export failed:', error);
            this.showError(`Export failed: ${error.message}`);
        }
    }
    
    /**
     * Handle file loaded event
     * @param {Object} detail - Event detail with tableName and fileName
     */
    onFileLoaded(detail) {
        const { tableName, fileName } = detail;
        console.log(`File loaded: ${fileName} → ${tableName}`);
        
        // Update export button state
        this.updateExportButton();
        
        // Show success message
        this.showSuccess(`Loaded ${fileName} as table ${tableName}`);
    }
    
    /**
     * Handle file removed event
     * @param {Object} detail - Event detail with tableName and fileName
     */
    onFileRemoved(detail) {
        const { tableName, fileName } = detail;
        console.log(`File removed: ${fileName} (${tableName})`);
        
        // Clear results if they were from the removed table
        if (this.currentQuery.includes(tableName)) {
            this.resultsTable.clear();
        }
        
        // Update export button state
        this.updateExportButton();
        
        // Show info message
        this.showInfo(`Removed ${fileName} (${tableName})`);
    }
    
    /**
     * Set query running state
     * @param {boolean} running - Whether query is running
     */
    setQueryRunning(running) {
        const runButton = document.getElementById('run-query');
        if (runButton) {
            runButton.disabled = running;
            runButton.textContent = running ? 'Running...' : 'Run Query';
        }
        
        // Disable SQL editor while running
        this.sqlEditor.setEnabled(!running);
    }
    
    /**
     * Update export button state
     */
    updateExportButton() {
        const exportButton = document.getElementById('export-csv');
        if (exportButton) {
            const hasResults = this.resultsTable.getCurrentResults();
            exportButton.disabled = !hasResults;
        }
    }
    
    /**
     * Show error message
     * @param {string} message - Error message
     */
    showError(message) {
        this.showNotification(message, 'error');
    }
    
    /**
     * Show success message
     * @param {string} message - Success message
     */
    showSuccess(message) {
        this.showNotification(message, 'success');
    }
    
    /**
     * Show info message
     * @param {string} message - Info message
     */
    showInfo(message) {
        this.showNotification(message, 'info');
    }
    
    /**
     * Show notification
     * @param {string} message - Message to show
     * @param {string} type - Notification type (error, success, info)
     */
    showNotification(message, type = 'info') {
        // Remove existing notifications of the same type
        const existing = document.querySelectorAll(`.notification.${type}`);
        existing.forEach(el => el.remove());
        
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        
        // Set appropriate styling based on type
        const styles = {
            error: { backgroundColor: '#e74c3c', color: 'white' },
            success: { backgroundColor: '#27ae60', color: 'white' },
            info: { backgroundColor: '#3498db', color: 'white' }
        };
        
        Object.assign(notification.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '15px 20px',
            borderRadius: '6px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            zIndex: '1000',
            maxWidth: '400px',
            wordWrap: 'break-word',
            ...styles[type]
        });
        
        notification.textContent = message;
        
        // Add to page
        document.body.appendChild(notification);
        
        // Auto-remove based on type
        const timeout = type === 'error' ? 8000 : type === 'success' ? 4000 : 6000;
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, timeout);
    }
    
    /**
     * Get application statistics
     * @returns {Object} Application statistics
     */
    async getStats() {
        if (!this.isInitialized) {
            return { initialized: false };
        }
        
        try {
            const dbStats = await this.duckdb.getStats();
            const resultsInfo = this.resultsTable.getResultsInfo();
            const tableNames = this.fileHandler.getTableNames();
            
            return {
                initialized: true,
                database: dbStats,
                results: resultsInfo,
                uploadedFiles: tableNames.length,
                tableNames: tableNames
            };
        } catch (error) {
            console.error('Failed to get stats:', error);
            return { initialized: true, error: error.message };
        }
    }
    
    /**
     * Cleanup resources
     */
    async cleanup() {
        try {
            if (this.duckdb) {
                await this.duckdb.close();
            }
            console.log('CSV Tools cleanup completed');
        } catch (error) {
            console.error('Cleanup error:', error);
        }
    }
    
    /**
     * Reset application state
     */
    async reset() {
        try {
            // Clear file handler
            if (this.fileHandler) {
                await this.fileHandler.clearAllFiles();
            }
            
            // Clear results
            this.resultsTable.clear();
            
            // Reset SQL editor
            this.sqlEditor.clear();
            
            // Reset query state
            this.currentQuery = '';
            
            // Update UI
            this.updateExportButton();
            
            this.showInfo('Application reset successfully');
            
        } catch (error) {
            console.error('Reset failed:', error);
            this.showError(`Reset failed: ${error.message}`);
        }
    }
}

// Initialize application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing CSV Tools...');
    window.csvTools = new CSVTools();
    
    // Expose fileHandler for button callbacks
    window.fileHandler = null;
    
    // Wait for initialization to complete
    const checkInitialization = setInterval(() => {
        if (window.csvTools.isInitialized && window.csvTools.fileHandler) {
            window.fileHandler = window.csvTools.fileHandler;
            clearInterval(checkInitialization);
        }
    }, 100);
});