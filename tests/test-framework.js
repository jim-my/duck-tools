/**
 * Simple Test Framework for CSV Tools
 * Provides basic testing functionality without external dependencies
 */
class TestRunner {
    constructor() {
        this.tests = [];
        this.results = [];
        this.isRunning = false;
        this.currentTest = 0;
        this.totalTests = 0;
    }
    
    /**
     * Register a test
     * @param {string} name - Test name
     * @param {Function} testFunction - Test function (async supported)
     * @param {string} category - Test category (unit, integration)
     */
    test(name, testFunction, category = 'unit') {
        this.tests.push({
            name,
            testFunction,
            category,
            id: this.tests.length
        });
    }
    
    /**
     * Run all tests
     */
    async runAllTests() {
        await this.runTests(this.tests);
    }
    
    /**
     * Run only unit tests
     */
    async runUnitTests() {
        const unitTests = this.tests.filter(test => test.category === 'unit');
        await this.runTests(unitTests);
    }
    
    /**
     * Run only integration tests
     */
    async runIntegrationTests() {
        const integrationTests = this.tests.filter(test => test.category === 'integration');
        await this.runTests(integrationTests);
    }
    
    /**
     * Run specified tests
     * @param {Array} testsToRun - Array of test objects
     */
    async runTests(testsToRun) {
        if (this.isRunning) {
            console.log('Tests already running');
            return;
        }
        
        this.isRunning = true;
        this.results = [];
        this.currentTest = 0;
        this.totalTests = testsToRun.length;
        
        this.updateStatus('Running tests...', 'running');
        this.showProgress();
        
        console.log(`Starting test run: ${this.totalTests} tests`);
        
        for (const test of testsToRun) {
            await this.runSingleTest(test);
            this.currentTest++;
            this.updateProgress();
        }
        
        this.isRunning = false;
        this.completeTestRun();
    }
    
    /**
     * Run a single test
     * @param {Object} test - Test object
     */
    async runSingleTest(test) {
        const startTime = Date.now();
        
        try {
            console.log(`Running test: ${test.name}`);
            
            // Run the test function
            await test.testFunction();
            
            const duration = Date.now() - startTime;
            const result = {
                name: test.name,
                category: test.category,
                status: 'PASS',
                duration,
                error: null
            };
            
            this.results.push(result);
            this.displayTestResult(result);
            
            console.log(`✓ ${test.name} (${duration}ms)`);
            
        } catch (error) {
            const duration = Date.now() - startTime;
            const result = {
                name: test.name,
                category: test.category,
                status: 'FAIL',
                duration,
                error: error.message || String(error)
            };
            
            this.results.push(result);
            this.displayTestResult(result);
            
            console.error(`✗ ${test.name} (${duration}ms):`, error);
        }
    }
    
    /**
     * Update test status
     * @param {string} message - Status message
     * @param {string} type - Status type (running, completed, failed)
     */
    updateStatus(message, type) {
        const statusElement = document.getElementById('test-status');
        if (statusElement) {
            statusElement.textContent = message;
            statusElement.className = `status-${type}`;
            statusElement.style.display = 'block';
        }
    }
    
    /**
     * Show progress bar
     */
    showProgress() {
        const progressContainer = document.getElementById('progress-container');
        if (progressContainer) {
            progressContainer.style.display = 'block';
        }
        this.updateProgress();
    }
    
    /**
     * Update progress bar
     */
    updateProgress() {
        const progressFill = document.getElementById('progress-fill');
        if (progressFill && this.totalTests > 0) {
            const percentage = (this.currentTest / this.totalTests) * 100;
            progressFill.style.width = `${percentage}%`;
        }
    }
    
    /**
     * Hide progress bar
     */
    hideProgress() {
        const progressContainer = document.getElementById('progress-container');
        if (progressContainer) {
            progressContainer.style.display = 'none';
        }
    }
    
    /**
     * Display individual test result
     * @param {Object} result - Test result object
     */
    displayTestResult(result) {
        const resultsContainer = document.getElementById('test-results');
        if (!resultsContainer) return;
        
        const resultElement = document.createElement('div');
        resultElement.className = `test-result test-${result.status.toLowerCase()}`;
        
        let html = `
            <div class="test-name">${result.name} (${result.category})</div>
            <div>Status: ${result.status} - Duration: ${result.duration}ms</div>
        `;
        
        if (result.error) {
            html += `<div class="test-error">Error: ${result.error}</div>`;
        }
        
        resultElement.innerHTML = html;
        resultsContainer.appendChild(resultElement);
        
        // Scroll to latest result
        resultElement.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
    
    /**
     * Complete test run and show summary
     */
    completeTestRun() {
        this.hideProgress();
        
        const passed = this.results.filter(r => r.status === 'PASS').length;
        const failed = this.results.filter(r => r.status === 'FAIL').length;
        const total = this.results.length;
        
        const totalTime = this.results.reduce((sum, r) => sum + r.duration, 0);
        
        // Update status
        if (failed === 0) {
            this.updateStatus(`All tests passed! (${passed}/${total})`, 'completed');
        } else {
            this.updateStatus(`Tests completed with failures (${passed}/${total} passed)`, 'failed');
        }
        
        // Show summary
        this.displaySummary(passed, failed, total, totalTime);
        
        console.log(`Test run completed: ${passed} passed, ${failed} failed, ${totalTime}ms total`);
    }
    
    /**
     * Display test summary
     * @param {number} passed - Number of passed tests
     * @param {number} failed - Number of failed tests
     * @param {number} total - Total number of tests
     * @param {number} totalTime - Total execution time
     */
    displaySummary(passed, failed, total, totalTime) {
        const summaryElement = document.getElementById('test-summary');
        if (!summaryElement) return;
        
        const passRate = total > 0 ? (passed / total * 100).toFixed(1) : 0;
        
        summaryElement.innerHTML = `
            <h3>Test Summary</h3>
            <div style="display: flex; justify-content: space-around; margin: 20px 0;">
                <div>
                    <strong>Total:</strong> ${total}
                </div>
                <div style="color: #4caf50;">
                    <strong>Passed:</strong> ${passed}
                </div>
                <div style="color: #f44336;">
                    <strong>Failed:</strong> ${failed}
                </div>
                <div>
                    <strong>Pass Rate:</strong> ${passRate}%
                </div>
                <div>
                    <strong>Time:</strong> ${totalTime}ms
                </div>
            </div>
        `;
        
        summaryElement.style.display = 'block';
    }
    
    /**
     * Clear test results
     */
    clearResults() {
        this.results = [];
        
        const resultsContainer = document.getElementById('test-results');
        if (resultsContainer) {
            resultsContainer.innerHTML = '';
        }
        
        const summaryElement = document.getElementById('test-summary');
        if (summaryElement) {
            summaryElement.style.display = 'none';
        }
        
        const statusElement = document.getElementById('test-status');
        if (statusElement) {
            statusElement.style.display = 'none';
        }
        
        this.hideProgress();
        
        console.log('Test results cleared');
    }
    
    /**
     * Get test statistics
     * @returns {Object} Test statistics
     */
    getStats() {
        const passed = this.results.filter(r => r.status === 'PASS').length;
        const failed = this.results.filter(r => r.status === 'FAIL').length;
        const total = this.results.length;
        const totalTime = this.results.reduce((sum, r) => sum + r.duration, 0);
        
        return {
            total,
            passed,
            failed,
            passRate: total > 0 ? (passed / total * 100) : 0,
            totalTime,
            averageTime: total > 0 ? (totalTime / total) : 0
        };
    }
}

/**
 * Assertion functions for tests
 */
class Assert {
    /**
     * Assert that condition is true
     * @param {boolean} condition - Condition to check
     * @param {string} message - Error message if assertion fails
     */
    static assertTrue(condition, message = 'Assertion failed') {
        if (!condition) {
            throw new Error(message);
        }
    }
    
    /**
     * Assert that condition is false
     * @param {boolean} condition - Condition to check
     * @param {string} message - Error message if assertion fails
     */
    static assertFalse(condition, message = 'Assertion failed') {
        if (condition) {
            throw new Error(message);
        }
    }
    
    /**
     * Assert that two values are equal
     * @param {*} expected - Expected value
     * @param {*} actual - Actual value
     * @param {string} message - Error message if assertion fails
     */
    static assertEqual(expected, actual, message) {
        if (expected !== actual) {
            const msg = message || `Expected ${expected}, but got ${actual}`;
            throw new Error(msg);
        }
    }
    
    /**
     * Assert that two values are not equal
     * @param {*} expected - Expected value
     * @param {*} actual - Actual value
     * @param {string} message - Error message if assertion fails
     */
    static assertNotEqual(expected, actual, message) {
        if (expected === actual) {
            const msg = message || `Expected values to be different, but both were ${actual}`;
            throw new Error(msg);
        }
    }
    
    /**
     * Assert that value is null
     * @param {*} value - Value to check
     * @param {string} message - Error message if assertion fails
     */
    static assertNull(value, message = 'Expected null') {
        if (value !== null) {
            throw new Error(message);
        }
    }
    
    /**
     * Assert that value is not null
     * @param {*} value - Value to check
     * @param {string} message - Error message if assertion fails
     */
    static assertNotNull(value, message = 'Expected non-null value') {
        if (value === null || value === undefined) {
            throw new Error(message);
        }
    }
    
    /**
     * Assert that function throws an error
     * @param {Function} fn - Function that should throw
     * @param {string} message - Error message if assertion fails
     */
    static assertThrows(fn, message = 'Expected function to throw') {
        let threw = false;
        try {
            fn();
        } catch (error) {
            threw = true;
        }
        
        if (!threw) {
            throw new Error(message);
        }
    }
    
    /**
     * Assert that async function throws an error
     * @param {Function} fn - Async function that should throw
     * @param {string} message - Error message if assertion fails
     */
    static async assertThrowsAsync(fn, message = 'Expected async function to throw') {
        let threw = false;
        try {
            await fn();
        } catch (error) {
            threw = true;
        }
        
        if (!threw) {
            throw new Error(message);
        }
    }
    
    /**
     * Assert that array contains value
     * @param {Array} array - Array to check
     * @param {*} value - Value to find
     * @param {string} message - Error message if assertion fails
     */
    static assertContains(array, value, message) {
        if (!Array.isArray(array) || !array.includes(value)) {
            const msg = message || `Array does not contain ${value}`;
            throw new Error(msg);
        }
    }
    
    /**
     * Assert that array has specific length
     * @param {Array} array - Array to check
     * @param {number} length - Expected length
     * @param {string} message - Error message if assertion fails
     */
    static assertLength(array, length, message) {
        if (!Array.isArray(array) || array.length !== length) {
            const msg = message || `Expected array length ${length}, but got ${array ? array.length : 'non-array'}`;
            throw new Error(msg);
        }
    }
}

// Helper functions for creating test data
class TestUtils {
    /**
     * Create a test CSV file
     * @param {string} content - CSV content
     * @param {string} filename - File name
     * @returns {File} File object
     */
    static createCSVFile(content, filename = 'test.csv') {
        return new File([content], filename, { type: 'text/csv' });
    }
    
    /**
     * Create sample CSV content
     * @param {number} rows - Number of data rows
     * @returns {string} CSV content
     */
    static createSampleCSV(rows = 5) {
        let csv = 'id,name,age,city\n';
        for (let i = 1; i <= rows; i++) {
            csv += `${i},User${i},${20 + i},City${i}\n`;
        }
        return csv;
    }
    
    /**
     * Wait for specified time
     * @param {number} ms - Milliseconds to wait
     * @returns {Promise} Promise that resolves after wait
     */
    static wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    /**
     * Generate random string
     * @param {number} length - String length
     * @returns {string} Random string
     */
    static randomString(length = 10) {
        const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }
}