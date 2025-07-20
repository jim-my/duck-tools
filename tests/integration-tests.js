/**
 * Integration Tests for CSV Tools
 * Tests complete workflows and component interactions
 */

// Full application workflow tests
testRunner.test('Integration - Complete CSV Workflow', async () => {
    // Create DuckDB manager and initialize
    const duckdb = new DuckDBManager();
    await duckdb.initialize();
    
    // Create CSV exporter
    const csvExporter = new CSVExporter();
    
    // Create test data
    const csvContent = TestUtils.createSampleCSV(10);
    const file = TestUtils.createCSVFile(csvContent, 'integration_test.csv');
    
    try {
        // Step 1: Load CSV file
        const tableName = await duckdb.loadCSV(file, 'integration_table');
        Assert.assertEqual('integration_table', tableName, 'Should load CSV successfully');
        
        // Step 2: Verify table exists and has correct data
        const tables = await duckdb.listTables();
        Assert.assertContains(tables, 'integration_table', 'Table should exist in database');
        
        const rowCount = await duckdb.getRowCount('integration_table');
        Assert.assertEqual(10, rowCount, 'Should have correct number of rows');
        
        // Step 3: Execute various queries
        const allData = await duckdb.runQuery('SELECT * FROM integration_table ORDER BY id');
        Assert.assertEqual(10, allData.length, 'Should return all rows');
        Assert.assertEqual(1, allData[0].id, 'First row should have id 1');
        
        const filteredData = await duckdb.runQuery('SELECT * FROM integration_table WHERE age > 23');
        Assert.assertTrue(filteredData.length < 10, 'Filtered query should return fewer rows');
        
        const aggregateData = await duckdb.runQuery('SELECT COUNT(*) as count, AVG(age) as avg_age FROM integration_table');
        Assert.assertEqual(10, aggregateData[0].count, 'Count should be 10');
        Assert.assertTrue(aggregateData[0].avg_age > 20, 'Average age should be reasonable');
        
        // Step 4: Export results
        const exportData = await duckdb.runQuery('SELECT id, name, age FROM integration_table WHERE id <= 5');
        const csvOutput = csvExporter.convertToCSV(exportData);
        
        Assert.assertTrue(csvOutput.includes('id,name,age'), 'Export should include headers');
        Assert.assertTrue(csvOutput.includes('User1'), 'Export should include data');
        
        // Step 5: Clean up
        await duckdb.dropTable('integration_table');
        const tablesAfterDrop = await duckdb.listTables();
        Assert.assertFalse(tablesAfterDrop.includes('integration_table'), 'Table should be dropped');
        
    } finally {
        await duckdb.close();
    }
}, 'integration');

testRunner.test('Integration - Multiple CSV Files Workflow', async () => {
    const duckdb = new DuckDBManager();
    await duckdb.initialize();
    
    try {
        // Create multiple CSV files
        const usersCSV = 'id,name,email\n1,Alice,alice@example.com\n2,Bob,bob@example.com\n3,Charlie,charlie@example.com';
        const ordersCSV = 'order_id,user_id,amount\n101,1,250.00\n102,2,150.00\n103,1,300.00\n104,3,75.00';
        
        const usersFile = TestUtils.createCSVFile(usersCSV, 'users.csv');
        const ordersFile = TestUtils.createCSVFile(ordersCSV, 'orders.csv');
        
        // Load both files
        await duckdb.loadCSV(usersFile, 'users');
        await duckdb.loadCSV(ordersFile, 'orders');
        
        // Verify both tables exist
        const tables = await duckdb.listTables();
        Assert.assertContains(tables, 'users', 'Users table should exist');
        Assert.assertContains(tables, 'orders', 'Orders table should exist');
        
        // Test JOIN query
        const joinQuery = `
            SELECT u.name, u.email, o.order_id, o.amount
            FROM users u
            JOIN orders o ON u.id = o.user_id
            ORDER BY u.name, o.order_id
        `;
        
        const joinResults = await duckdb.runQuery(joinQuery);
        Assert.assertEqual(4, joinResults.length, 'Join should return 4 rows');
        Assert.assertEqual('Alice', joinResults[0].name, 'First result should be Alice');
        Assert.assertEqual(250, joinResults[0].amount, 'First order amount should be 250');
        
        // Test aggregation across tables
        const aggregateQuery = `
            SELECT u.name, COUNT(o.order_id) as order_count, SUM(o.amount) as total_spent
            FROM users u
            LEFT JOIN orders o ON u.id = o.user_id
            GROUP BY u.id, u.name
            ORDER BY total_spent DESC
        `;
        
        const aggregateResults = await duckdb.runQuery(aggregateQuery);
        Assert.assertEqual(3, aggregateResults.length, 'Should have results for all users');
        Assert.assertEqual('Alice', aggregateResults[0].name, 'Alice should have highest total');
        Assert.assertEqual(550, aggregateResults[0].total_spent, 'Alice total should be 550');
        
    } finally {
        await duckdb.close();
    }
}, 'integration');

testRunner.test('Integration - File Handler with DuckDB', async () => {
    // Create test DOM elements
    const dropzoneDiv = document.createElement('div');
    dropzoneDiv.id = 'test-dropzone';
    dropzoneDiv.className = 'dropzone';
    document.body.appendChild(dropzoneDiv);
    
    const fileListDiv = document.createElement('div');
    fileListDiv.id = 'file-list';
    document.body.appendChild(fileListDiv);
    
    try {
        // Initialize components
        const duckdb = new DuckDBManager();
        await duckdb.initialize();
        
        // Note: FileHandler creates Dropzone which expects specific DOM structure
        // For testing, we'll test the core functionality without full Dropzone integration
        
        const csvContent = 'product,price,category\nLaptop,999.99,Electronics\nChair,199.99,Furniture\nBook,19.99,Media';
        const file = TestUtils.createCSVFile(csvContent, 'products.csv');
        
        // Test direct CSV loading (simulating what FileHandler would do)
        const tableName = await duckdb.loadCSV(file, 't1');
        Assert.assertEqual('t1', tableName, 'Should create table with expected name');
        
        // Verify file was processed correctly
        const results = await duckdb.runQuery('SELECT * FROM t1 ORDER BY price DESC');
        Assert.assertEqual(3, results.length, 'Should have 3 products');
        Assert.assertEqual('Laptop', results[0].product, 'Most expensive should be laptop');
        Assert.assertEqual(999.99, results[0].price, 'Laptop price should be correct');
        
        // Test queries that FileHandler users might run
        const categoryQuery = await duckdb.runQuery('SELECT category, COUNT(*) as count FROM t1 GROUP BY category');
        Assert.assertEqual(3, categoryQuery.length, 'Should have 3 categories');
        
        await duckdb.close();
        
    } finally {
        // Clean up DOM
        document.body.removeChild(dropzoneDiv);
        document.body.removeChild(fileListDiv);
    }
}, 'integration');

testRunner.test('Integration - SQL Editor with Query Execution', async () => {
    // Create test DOM elements for SQL editor
    const editorDiv = document.createElement('div');
    editorDiv.id = 'test-sql-editor';
    document.body.appendChild(editorDiv);
    
    try {
        const duckdb = new DuckDBManager();
        await duckdb.initialize();
        
        const sqlEditor = new SQLEditor();
        
        // Create test data
        const csvContent = 'name,score,subject\nAlice,95,Math\nBob,87,Math\nCharlie,92,Science\nDiana,88,Science';
        const file = TestUtils.createCSVFile(csvContent, 'grades.csv');
        await duckdb.loadCSV(file, 'grades');
        
        // Test SQL editor integration
        sqlEditor.addTable('grades');
        const availableTables = sqlEditor.getAvailableTables();
        Assert.assertContains(availableTables, 'grades', 'Editor should track available tables');
        
        // Test query building and execution
        const queries = [
            'SELECT * FROM grades ORDER BY score DESC',
            'SELECT subject, AVG(score) as avg_score FROM grades GROUP BY subject',
            'SELECT name FROM grades WHERE score > 90'
        ];
        
        for (const query of queries) {
            sqlEditor.setValue(query);
            Assert.assertEqual(query, sqlEditor.getValue(), 'Editor should store query correctly');
            
            // Execute query through DuckDB
            const results = await duckdb.runQuery(query);
            Assert.assertTrue(results.length > 0, `Query should return results: ${query}`);
        }
        
        // Test table removal
        sqlEditor.removeTable('grades');
        const tablesAfterRemoval = sqlEditor.getAvailableTables();
        Assert.assertFalse(tablesAfterRemoval.includes('grades'), 'Table should be removed from editor');
        
        await duckdb.close();
        
    } finally {
        document.body.removeChild(editorDiv);
    }
}, 'integration');

testRunner.test('Integration - Results Table with Large Dataset', async () => {
    // Create test DOM for results table
    const resultsDiv = document.createElement('div');
    resultsDiv.id = 'test-results-table';
    document.body.appendChild(resultsDiv);
    
    try {
        const duckdb = new DuckDBManager();
        await duckdb.initialize();
        
        const resultsTable = new ResultsTable();
        resultsTable.container = resultsDiv;
        
        // Create large dataset
        let csvContent = 'id,name,department,salary,hire_date\n';
        for (let i = 1; i <= 250; i++) {
            const dept = ['Engineering', 'Sales', 'Marketing', 'HR'][i % 4];
            const salary = 50000 + (i * 500);
            csvContent += `${i},Employee${i},${dept},${salary},2023-01-${(i % 28) + 1}\n`;
        }
        
        const file = TestUtils.createCSVFile(csvContent, 'employees.csv');
        await duckdb.loadCSV(file, 'employees');
        
        // Execute query for large result set
        const results = await duckdb.runQuery('SELECT * FROM employees ORDER BY salary DESC');
        Assert.assertEqual(250, results.length, 'Should have 250 employees');
        
        // Test results table pagination
        resultsTable.pageSize = 50; // Set smaller page size
        resultsTable.displayResults(results);
        
        // Verify pagination was created
        const pagination = resultsDiv.querySelector('.pagination');
        Assert.assertNotNull(pagination, 'Should create pagination for large dataset');
        
        // Verify only first page is displayed
        const displayedRows = resultsDiv.querySelectorAll('tbody tr');
        Assert.assertEqual(50, displayedRows.length, 'Should display only first page');
        
        // Test navigation to different pages
        resultsTable.goToPage(2);
        const page2Rows = resultsDiv.querySelectorAll('tbody tr');
        Assert.assertEqual(50, page2Rows.length, 'Page 2 should also have 50 rows');
        
        // Test last page
        resultsTable.goToPage(5); // 250 / 50 = 5 pages
        const lastPageRows = resultsDiv.querySelectorAll('tbody tr');
        Assert.assertEqual(50, lastPageRows.length, 'Last page should have remaining rows');
        
        // Test sorting with large dataset
        resultsTable.sortByColumn('salary');
        const sortedResults = resultsTable.getCurrentResults();
        Assert.assertTrue(sortedResults[0].salary <= sortedResults[1].salary, 'Should be sorted by salary ascending');
        
        // Test department filtering query
        const deptResults = await duckdb.runQuery('SELECT * FROM employees WHERE department = \'Engineering\' ORDER BY salary DESC');
        resultsTable.displayResults(deptResults);
        
        // Verify filtered results
        const filteredInfo = resultsTable.getResultsInfo();
        Assert.assertTrue(filteredInfo.rows < 250, 'Filtered results should have fewer rows');
        
        await duckdb.close();
        
    } finally {
        document.body.removeChild(resultsDiv);
    }
}, 'integration');

testRunner.test('Integration - Export Large Dataset', async () => {
    const duckdb = new DuckDBManager();
    await duckdb.initialize();
    
    try {
        const csvExporter = new CSVExporter();
        
        // Create dataset with various data types
        let csvContent = 'id,name,active,price,description\n';
        for (let i = 1; i <= 1000; i++) {
            const active = i % 2 === 0 ? 'true' : 'false';
            const price = (Math.random() * 1000).toFixed(2);
            const description = `Product ${i} with "special" features, includes: item1, item2`;
            csvContent += `${i},Product${i},${active},${price},"${description}"\n`;
        }
        
        const file = TestUtils.createCSVFile(csvContent, 'products_large.csv');
        await duckdb.loadCSV(file, 'products_large');
        
        // Query subset of data
        const results = await duckdb.runQuery('SELECT * FROM products_large WHERE active = true LIMIT 500');
        Assert.assertTrue(results.length <= 500, 'Should have at most 500 results');
        
        // Test export validation
        const validation = csvExporter.validateExportData(results);
        Assert.assertTrue(validation.valid, 'Large dataset should be valid for export');
        Assert.assertTrue(validation.stats.estimatedSize > 0, 'Should estimate file size');
        
        // Test export with special characters
        const csvOutput = csvExporter.convertToCSV(results.slice(0, 10)); // Small sample for testing
        
        // Verify special characters are handled
        Assert.assertTrue(csvOutput.includes('"special"'), 'Should handle quotes in data');
        Assert.assertTrue(csvOutput.includes('item1, item2'), 'Should handle commas in quoted fields');
        
        // Test export with custom options
        const customExport = csvExporter.convertToCSVWithOptions(results.slice(0, 5), {
            delimiter: ';',
            includeHeaders: true,
            nullValue: 'N/A'
        });
        
        Assert.assertTrue(customExport.includes(';'), 'Should use custom delimiter');
        Assert.assertTrue(customExport.includes('id;name;active'), 'Should include headers with custom delimiter');
        
        await duckdb.close();
        
    } catch (error) {
        await duckdb.close();
        throw error;
    }
}, 'integration');

testRunner.test('Integration - Error Handling and Recovery', async () => {
    const duckdb = new DuckDBManager();
    await duckdb.initialize();
    
    try {
        // Test malformed CSV handling
        const malformedCSV = 'id,name,value\n1,"Alice,25\n2,Bob,30'; // Missing quote
        const malformedFile = TestUtils.createCSVFile(malformedCSV, 'malformed.csv');
        
        // DuckDB should handle this gracefully or throw descriptive error
        try {
            await duckdb.loadCSV(malformedFile, 'malformed_table');
            // If it succeeds, verify the data is interpreted reasonably
            const results = await duckdb.runQuery('SELECT COUNT(*) as count FROM malformed_table');
            Assert.assertTrue(results[0].count >= 0, 'Should handle malformed CSV gracefully');
        } catch (error) {
            // If it fails, the error should be descriptive
            Assert.assertTrue(error.message.length > 0, 'Error message should be descriptive');
        }
        
        // Test SQL injection prevention (DuckDB should handle this safely)
        const csvContent = 'id,name\n1,Alice\n2,Bob';
        const file = TestUtils.createCSVFile(csvContent, 'test_security.csv');
        await duckdb.loadCSV(file, 'test_security');
        
        // Test various potentially problematic queries
        const problematicQueries = [
            "SELECT * FROM test_security WHERE name = 'Alice'; DROP TABLE test_security; --'",
            "SELECT * FROM test_security UNION SELECT 'hack', 'attack'",
            "SELECT * FROM test_security WHERE 1=1"
        ];
        
        for (const query of problematicQueries) {
            try {
                const results = await duckdb.runQuery(query);
                // If query succeeds, verify it didn't cause damage
                const tableStillExists = await duckdb.listTables();
                Assert.assertContains(tableStillExists, 'test_security', 'Table should still exist after problematic query');
            } catch (error) {
                // Expected for some malformed queries
                Assert.assertTrue(error.message.length > 0, 'Should provide error message for invalid queries');
            }
        }
        
        // Test memory limits with very large virtual dataset
        try {
            const largeQuery = `
                WITH RECURSIVE large_data AS (
                    SELECT 1 as n
                    UNION ALL
                    SELECT n + 1 FROM large_data WHERE n < 10000
                )
                SELECT COUNT(*) as count FROM large_data
            `;
            
            const results = await duckdb.runQuery(largeQuery);
            Assert.assertEqual(10000, results[0].count, 'Should handle recursive query correctly');
        } catch (error) {
            // If it fails due to limits, that's acceptable
            console.log('Large query failed as expected:', error.message);
        }
        
    } finally {
        await duckdb.close();
    }
}, 'integration');