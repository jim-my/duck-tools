/**
 * Unit Tests for CSV Tools Components
 * Tests individual components in isolation
 */

// DuckDB Manager Tests
testRunner.test('DuckDB Manager - Initialization', async () => {
    const manager = new DuckDBManager();
    Assert.assertFalse(manager.isInitialized, 'Manager should not be initialized initially');
    
    await manager.initialize();
    Assert.assertTrue(manager.isInitialized, 'Manager should be initialized after initialize()');
    Assert.assertNotNull(manager.db, 'Database should be created');
    Assert.assertNotNull(manager.conn, 'Connection should be established');
    
    await manager.close();
}, 'unit');

testRunner.test('DuckDB Manager - CSV Loading', async () => {
    const manager = new DuckDBManager();
    await manager.initialize();
    
    // Create test CSV file
    const csvContent = TestUtils.createSampleCSV(3);
    const file = TestUtils.createCSVFile(csvContent, 'test.csv');
    
    // Load CSV into database
    const tableName = await manager.loadCSV(file, 'test_table');
    Assert.assertEqual('test_table', tableName, 'Should return correct table name');
    
    // Verify table was created
    const tables = await manager.listTables();
    Assert.assertContains(tables, 'test_table', 'Table should be listed');
    
    // Verify row count
    const rowCount = await manager.getRowCount('test_table');
    Assert.assertEqual(3, rowCount, 'Should have 3 rows');
    
    await manager.close();
}, 'unit');

testRunner.test('DuckDB Manager - Query Execution', async () => {
    const manager = new DuckDBManager();
    await manager.initialize();
    
    // Create and load test data
    const csvContent = 'id,name,value\n1,Alice,100\n2,Bob,200\n3,Charlie,300';
    const file = TestUtils.createCSVFile(csvContent, 'query_test.csv');
    await manager.loadCSV(file, 'query_test');
    
    // Test simple select
    const results = await manager.runQuery('SELECT * FROM query_test ORDER BY id');
    Assert.assertEqual(3, results.length, 'Should return 3 rows');
    Assert.assertEqual('Alice', results[0].name, 'First row should be Alice');
    
    // Test aggregation
    const sumResult = await manager.runQuery('SELECT SUM(value) as total FROM query_test');
    Assert.assertEqual(600, sumResult[0].total, 'Sum should be 600');
    
    // Test filtering
    const filtered = await manager.runQuery('SELECT * FROM query_test WHERE value > 150');
    Assert.assertEqual(2, filtered.length, 'Should return 2 rows with value > 150');
    
    await manager.close();
}, 'unit');

testRunner.test('DuckDB Manager - Error Handling', async () => {
    const manager = new DuckDBManager();
    await manager.initialize();
    
    // Test invalid SQL
    await Assert.assertThrowsAsync(async () => {
        await manager.runQuery('INVALID SQL QUERY');
    }, 'Should throw error for invalid SQL');
    
    // Test query on non-existent table
    await Assert.assertThrowsAsync(async () => {
        await manager.runQuery('SELECT * FROM non_existent_table');
    }, 'Should throw error for non-existent table');
    
    await manager.close();
}, 'unit');

// CSV Exporter Tests
testRunner.test('CSV Exporter - Basic Export', async () => {
    const exporter = new CSVExporter();
    
    const testData = [
        { id: 1, name: 'Alice', age: 25 },
        { id: 2, name: 'Bob', age: 30 }
    ];
    
    const csvContent = exporter.convertToCSV(testData);
    
    // Check headers
    Assert.assertTrue(csvContent.includes('id,name,age'), 'Should include headers');
    
    // Check data rows
    Assert.assertTrue(csvContent.includes('1,Alice,25'), 'Should include first row');
    Assert.assertTrue(csvContent.includes('2,Bob,30'), 'Should include second row');
    
    // Check line count (header + 2 data rows + final newline)
    const lines = csvContent.split('\n');
    Assert.assertEqual(4, lines.length, 'Should have 4 lines total');
}, 'unit');

testRunner.test('CSV Exporter - Special Characters', async () => {
    const exporter = new CSVExporter();
    
    const testData = [
        { text: 'Text with, comma', quote: 'Text with "quote"' },
        { text: 'Text with\nnewline', quote: 'Normal text' }
    ];
    
    const csvContent = exporter.convertToCSV(testData);
    
    // Check that values with commas are quoted
    Assert.assertTrue(csvContent.includes('"Text with, comma"'), 'Should quote comma-containing text');
    
    // Check that quotes are escaped
    Assert.assertTrue(csvContent.includes('"Text with ""quote"""'), 'Should escape quotes');
    
    // Check that newlines are quoted
    Assert.assertTrue(csvContent.includes('"Text with\nnewline"'), 'Should quote newline-containing text');
}, 'unit');

testRunner.test('CSV Exporter - Null Values', async () => {
    const exporter = new CSVExporter();
    
    const testData = [
        { id: 1, name: 'Alice', optional: null },
        { id: 2, name: null, optional: 'value' },
        { id: 3, name: undefined, optional: undefined }
    ];
    
    const csvContent = exporter.convertToCSV(testData);
    
    // Check that null/undefined values become empty strings
    const lines = csvContent.split('\n');
    Assert.assertTrue(lines[1].includes('1,Alice,'), 'Null should become empty');
    Assert.assertTrue(lines[2].includes('2,,value'), 'Null name should become empty');
    Assert.assertTrue(lines[3].includes('3,,'), 'Undefined values should become empty');
}, 'unit');

testRunner.test('CSV Exporter - Data Validation', async () => {
    const exporter = new CSVExporter();
    
    // Test empty data
    const emptyValidation = exporter.validateExportData([]);
    Assert.assertFalse(emptyValidation.valid, 'Empty data should be invalid');
    
    // Test null data
    const nullValidation = exporter.validateExportData(null);
    Assert.assertFalse(nullValidation.valid, 'Null data should be invalid');
    
    // Test valid data
    const validData = [{ id: 1, name: 'test' }];
    const validValidation = exporter.validateExportData(validData);
    Assert.assertTrue(validValidation.valid, 'Valid data should pass validation');
    Assert.assertEqual(1, validValidation.stats.rows, 'Should report correct row count');
    Assert.assertEqual(2, validValidation.stats.columns, 'Should report correct column count');
}, 'unit');

// SQL Editor Tests
testRunner.test('SQL Editor - Initialization', async () => {
    // Create a temporary container for the editor
    const container = document.createElement('div');
    container.id = 'test-sql-editor';
    document.body.appendChild(container);
    
    const editor = new SQLEditor();
    Assert.assertNotNull(editor.editor, 'Editor should be initialized');
    
    // Test basic functionality
    editor.setValue('SELECT * FROM test');
    Assert.assertEqual('SELECT * FROM test', editor.getValue(), 'Should set and get value correctly');
    
    // Clean up
    document.body.removeChild(container);
}, 'unit');

testRunner.test('SQL Editor - Table Management', async () => {
    const container = document.createElement('div');
    container.id = 'test-sql-editor';
    document.body.appendChild(container);
    
    const editor = new SQLEditor();
    
    // Test adding tables
    editor.addTable('table1');
    editor.addTable('table2');
    
    const tables = editor.getAvailableTables();
    Assert.assertLength(tables, 2, 'Should have 2 tables');
    Assert.assertContains(tables, 'table1', 'Should contain table1');
    Assert.assertContains(tables, 'table2', 'Should contain table2');
    
    // Test removing tables
    editor.removeTable('table1');
    const remainingTables = editor.getAvailableTables();
    Assert.assertLength(remainingTables, 1, 'Should have 1 table after removal');
    Assert.assertContains(remainingTables, 'table2', 'Should still contain table2');
    
    // Test duplicate addition
    editor.addTable('table2');
    Assert.assertLength(editor.getAvailableTables(), 1, 'Should not add duplicate tables');
    
    document.body.removeChild(container);
}, 'unit');

// Results Table Tests
testRunner.test('Results Table - Display Results', async () => {
    // Create a temporary container for the results table
    const container = document.createElement('div');
    container.id = 'test-results-table';
    document.body.appendChild(container);
    
    const resultsTable = new ResultsTable();
    resultsTable.container = container;
    
    const testResults = [
        { id: 1, name: 'Alice', score: 95 },
        { id: 2, name: 'Bob', score: 87 },
        { id: 3, name: 'Charlie', score: 92 }
    ];
    
    resultsTable.displayResults(testResults);
    
    // Check that table was created
    const table = container.querySelector('.results-table');
    Assert.assertNotNull(table, 'Should create results table');
    
    // Check headers
    const headers = table.querySelectorAll('th');
    Assert.assertEqual(3, headers.length, 'Should have 3 headers');
    
    // Check data rows
    const dataRows = table.querySelectorAll('tbody tr');
    Assert.assertEqual(3, dataRows.length, 'Should have 3 data rows');
    
    // Verify current results are stored
    Assert.assertEqual(testResults, resultsTable.getCurrentResults(), 'Should store current results');
    
    document.body.removeChild(container);
}, 'unit');

testRunner.test('Results Table - Pagination', async () => {
    const container = document.createElement('div');
    container.id = 'test-results-table';
    document.body.appendChild(container);
    
    const resultsTable = new ResultsTable();
    resultsTable.container = container;
    resultsTable.pageSize = 2; // Small page size for testing
    
    // Create test data with more rows than page size
    const testResults = [];
    for (let i = 1; i <= 5; i++) {
        testResults.push({ id: i, name: `User${i}`, value: i * 10 });
    }
    
    resultsTable.displayResults(testResults);
    
    // Check that only page size rows are displayed
    const dataRows = container.querySelectorAll('tbody tr');
    Assert.assertEqual(2, dataRows.length, 'Should display only page size rows');
    
    // Check pagination controls exist
    const pagination = container.querySelector('.pagination');
    Assert.assertNotNull(pagination, 'Should create pagination controls');
    
    // Test page navigation
    resultsTable.goToPage(2);
    const page2Rows = container.querySelectorAll('tbody tr');
    Assert.assertEqual(2, page2Rows.length, 'Should display page 2 rows');
    
    // Test going to last page
    resultsTable.goToPage(3);
    const page3Rows = container.querySelectorAll('tbody tr');
    Assert.assertEqual(1, page3Rows.length, 'Should display remaining row on last page');
    
    document.body.removeChild(container);
}, 'unit');

testRunner.test('Results Table - Sorting', async () => {
    const container = document.createElement('div');
    container.id = 'test-results-table';
    document.body.appendChild(container);
    
    const resultsTable = new ResultsTable();
    resultsTable.container = container;
    
    const testResults = [
        { id: 3, name: 'Charlie', score: 85 },
        { id: 1, name: 'Alice', score: 95 },
        { id: 2, name: 'Bob', score: 87 }
    ];
    
    resultsTable.displayResults(testResults);
    
    // Test sorting by ID
    resultsTable.sortByColumn('id');
    const currentResults = resultsTable.getCurrentResults();
    Assert.assertEqual(1, currentResults[0].id, 'First row should have id 1 after sorting');
    Assert.assertEqual(2, currentResults[1].id, 'Second row should have id 2 after sorting');
    Assert.assertEqual(3, currentResults[2].id, 'Third row should have id 3 after sorting');
    
    // Test reverse sorting
    resultsTable.sortByColumn('id'); // Click again to reverse
    Assert.assertEqual(3, currentResults[0].id, 'First row should have id 3 after reverse sorting');
    
    document.body.removeChild(container);
}, 'unit');

// Test empty/null data handling
testRunner.test('Results Table - Empty Data', async () => {
    const container = document.createElement('div');
    container.id = 'test-results-table';
    document.body.appendChild(container);
    
    const resultsTable = new ResultsTable();
    resultsTable.container = container;
    
    // Test empty array
    resultsTable.displayResults([]);
    Assert.assertTrue(container.textContent.includes('No results'), 'Should show no results message for empty array');
    
    // Test null data
    resultsTable.displayResults(null);
    Assert.assertTrue(container.textContent.includes('No results'), 'Should show no results message for null data');
    
    document.body.removeChild(container);
}, 'unit');