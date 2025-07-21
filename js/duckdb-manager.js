/**
 * DuckDB-WASM Manager
 * Handles database initialization, CSV loading, and query execution
 */
class DuckDBManager {
    constructor() {
        this.db = null;
        this.conn = null;
        this.isInitialized = false;
    }
    
    /**
     * Initialize DuckDB-WASM (Simple Mode)
     * @returns {Promise<boolean>} Success status
     */
    async initialize() {
        try {
            console.log('Initializing DuckDB-WASM...');
            
            // Use the simple CSV processing interface
            if (!window.duckdb || !window.duckdbReady) {
                throw new Error('CSV Tools not ready. Please wait for initialization to complete.');
            }
            
            // Use the simple interface directly
            this.db = window.duckdb;
            this.conn = this.db; // Simple mode doesn't need separate connection
            
            this.isInitialized = true;
            console.log('DuckDB-WASM initialized successfully');
            return true;
            
        } catch (error) {
            console.error('Failed to initialize DuckDB-WASM:', error);
            throw new Error(`DuckDB initialization failed: ${error.message}`);
        }
    }
    
    /**
     * Load CSV file into DuckDB table
     * @param {File} file - CSV file object
     * @param {string} tableName - Name for the table
     * @returns {Promise<string>} Table name
     */
    async loadCSV(file, tableName) {
        if (!this.isInitialized) {
            throw new Error('DuckDB not initialized');
        }
        
        try {
            console.log(`Loading CSV file: ${file.name} as table: ${tableName}`);
            
            // Use the simple loadCSV method
            await this.db.loadCSV(file, tableName);
            
            console.log(`Successfully loaded ${tableName}`);
            return tableName;
            
        } catch (error) {
            console.error(`Failed to load CSV file ${file.name}:`, error);
            throw new Error(`Failed to load CSV: ${error.message}`);
        }
    }
    
    /**
     * Execute SQL query
     * @param {string} sql - SQL query string
     * @returns {Promise<Array>} Query results as array of objects
     */
    async runQuery(sql) {
        if (!this.isInitialized) {
            throw new Error('DuckDB not initialized');
        }
        
        try {
            console.log(`Executing query: ${sql.substring(0, 100)}${sql.length > 100 ? '...' : ''}`);
            
            const resultArray = await this.db.runQuery(sql);
            
            console.log(`Query returned ${resultArray.length} rows`);
            return resultArray;
            
        } catch (error) {
            console.error('Query execution failed:', error);
            throw new Error(`SQL Error: ${error.message}`);
        }
    }
    
    /**
     * Get table schema information
     * @param {string} tableName - Name of the table
     * @returns {Promise<Array>} Schema information
     */
    async getTableInfo(tableName) {
        if (!this.isInitialized) {
            throw new Error('DuckDB not initialized');
        }
        
        try {
            // For simple mode, return basic column info from first row
            const table = window.csvTables.get(tableName);
            if (!table || table.length === 0) {
                return [];
            }
            
            const firstRow = table[0];
            const columns = Object.keys(firstRow).map(column => ({
                column_name: column,
                column_type: 'VARCHAR', // Simple mode treats all as text
                null: 'YES'
            }));
            
            return columns;
        } catch (error) {
            throw new Error(`Failed to get table info: ${error.message}`);
        }
    }
    
    /**
     * List all available tables
     * @returns {Promise<Array>} List of table names
     */
    async listTables() {
        if (!this.isInitialized) {
            throw new Error('DuckDB not initialized');
        }
        
        try {
            return await this.db.listTables();
        } catch (error) {
            throw new Error(`Failed to list tables: ${error.message}`);
        }
    }
    
    /**
     * Get row count for a table
     * @param {string} tableName - Name of the table
     * @returns {Promise<number>} Row count
     */
    async getRowCount(tableName) {
        if (!this.isInitialized) {
            throw new Error('DuckDB not initialized');
        }
        
        try {
            return await this.db.getRowCount(tableName);
        } catch (error) {
            throw new Error(`Failed to get row count: ${error.message}`);
        }
    }
    
    /**
     * Drop a table
     * @param {string} tableName - Name of the table to drop
     * @returns {Promise<void>}
     */
    async dropTable(tableName) {
        if (!this.isInitialized) {
            throw new Error('DuckDB not initialized');
        }
        
        try {
            await this.db.dropTable(tableName);
            console.log(`Dropped table: ${tableName}`);
        } catch (error) {
            throw new Error(`Failed to drop table: ${error.message}`);
        }
    }
    
    /**
     * Close the database connection
     */
    async close() {
        try {
            if (this.conn) {
                await this.conn.close();
                this.conn = null;
            }
            if (this.db) {
                await this.db.terminate();
                this.db = null;
            }
            this.isInitialized = false;
            console.log('DuckDB connection closed');
        } catch (error) {
            console.error('Error closing DuckDB:', error);
        }
    }
    
    /**
     * Get database statistics
     * @returns {Promise<Object>} Database statistics
     */
    async getStats() {
        if (!this.isInitialized) {
            return { tables: 0, totalRows: 0 };
        }
        
        try {
            const tables = await this.listTables();
            let totalRows = 0;
            
            for (const table of tables) {
                const count = await this.getRowCount(table);
                totalRows += count;
            }
            
            return {
                tables: tables.length,
                totalRows: totalRows,
                tableNames: tables
            };
        } catch (error) {
            console.error('Failed to get database stats:', error);
            return { tables: 0, totalRows: 0 };
        }
    }
}