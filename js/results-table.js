/**
 * Results Table
 * Manages display of query results with pagination and sorting
 */
class ResultsTable {
    constructor() {
        this.currentResults = null;
        this.currentPage = 1;
        this.pageSize = 100;
        this.sortColumn = null;
        this.sortDirection = 'asc';
        this.container = document.getElementById('results-table');
    }
    
    /**
     * Display query results
     * @param {Array} results - Array of result objects
     */
    displayResults(results) {
        this.currentResults = results;
        this.currentPage = 1;
        this.sortColumn = null;
        this.sortDirection = 'asc';
        
        if (!this.container) {
            console.error('Results table container not found');
            return;
        }
        
        this.render();
    }
    
    /**
     * Render the complete results view
     */
    render() {
        this.container.innerHTML = '';
        
        if (!this.currentResults || this.currentResults.length === 0) {
            this.container.innerHTML = '<p class="no-results">No results to display. Run a query to see results here.</p>';
            return;
        }
        
        // Create results info
        this.renderResultsInfo();
        
        // Create table
        this.renderTable();
        
        // Create pagination
        this.renderPagination();
    }
    
    /**
     * Render results information
     */
    renderResultsInfo() {
        const totalRows = this.currentResults.length;
        const columns = totalRows > 0 ? Object.keys(this.currentResults[0]).length : 0;
        
        const infoDiv = document.createElement('div');
        infoDiv.className = 'results-info';
        infoDiv.innerHTML = `
            <span class="results-count">${totalRows.toLocaleString()} rows, ${columns} columns</span>
            ${totalRows > this.pageSize ? `<span class="pagination-info">Showing ${this.pageSize} per page</span>` : ''}
        `;
        
        this.container.appendChild(infoDiv);
    }
    
    /**
     * Render the data table
     */
    renderTable() {
        const startIndex = (this.currentPage - 1) * this.pageSize;
        const endIndex = Math.min(startIndex + this.pageSize, this.currentResults.length);
        const pageResults = this.currentResults.slice(startIndex, endIndex);
        
        if (pageResults.length === 0) {
            return;
        }
        
        const table = document.createElement('table');
        table.className = 'results-table';
        
        // Create header
        const thead = this.createTableHeader(pageResults[0]);
        table.appendChild(thead);
        
        // Create body
        const tbody = this.createTableBody(pageResults);
        table.appendChild(tbody);
        
        this.container.appendChild(table);
    }
    
    /**
     * Create table header with sorting capabilities
     * @param {Object} sampleRow - Sample row to get column names
     * @returns {HTMLElement} Table header element
     */
    createTableHeader(sampleRow) {
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        
        Object.keys(sampleRow).forEach(column => {
            const th = document.createElement('th');
            th.textContent = column;
            th.className = 'sortable';
            th.dataset.column = column;
            
            // Add sort indicator
            if (this.sortColumn === column) {
                th.classList.add('sorted');
                th.classList.add(this.sortDirection);
                
                const indicator = document.createElement('span');
                indicator.className = 'sort-indicator';
                indicator.textContent = this.sortDirection === 'asc' ? ' ↑' : ' ↓';
                th.appendChild(indicator);
            }
            
            // Add click handler for sorting
            th.addEventListener('click', () => this.sortByColumn(column));
            
            headerRow.appendChild(th);
        });
        
        thead.appendChild(headerRow);
        return thead;
    }
    
    /**
     * Create table body
     * @param {Array} rows - Data rows to display
     * @returns {HTMLElement} Table body element
     */
    createTableBody(rows) {
        const tbody = document.createElement('tbody');
        
        rows.forEach((row, index) => {
            const tr = document.createElement('tr');
            tr.className = index % 2 === 0 ? 'even' : 'odd';
            
            Object.values(row).forEach(value => {
                const td = document.createElement('td');
                
                // Format cell value
                if (value === null || value === undefined) {
                    td.className = 'null-value';
                    td.textContent = 'NULL';
                } else if (typeof value === 'number') {
                    td.className = 'number-value';
                    td.textContent = value.toLocaleString();
                } else if (typeof value === 'boolean') {
                    td.className = 'boolean-value';
                    td.textContent = value.toString();
                } else {
                    td.textContent = String(value);
                }
                
                tr.appendChild(td);
            });
            
            tbody.appendChild(tr);
        });
        
        return tbody;
    }
    
    /**
     * Render pagination controls
     */
    renderPagination() {
        if (this.currentResults.length <= this.pageSize) {
            return; // No pagination needed
        }
        
        const totalPages = Math.ceil(this.currentResults.length / this.pageSize);
        
        const paginationDiv = document.createElement('div');
        paginationDiv.className = 'pagination';
        
        // Previous button
        const prevButton = document.createElement('button');
        prevButton.textContent = 'Previous';
        prevButton.disabled = this.currentPage === 1;
        prevButton.addEventListener('click', () => this.goToPage(this.currentPage - 1));
        paginationDiv.appendChild(prevButton);
        
        // Page info
        const pageInfo = document.createElement('span');
        pageInfo.className = 'page-info';
        pageInfo.textContent = `Page ${this.currentPage} of ${totalPages}`;
        paginationDiv.appendChild(pageInfo);
        
        // Next button
        const nextButton = document.createElement('button');
        nextButton.textContent = 'Next';
        nextButton.disabled = this.currentPage === totalPages;
        nextButton.addEventListener('click', () => this.goToPage(this.currentPage + 1));
        paginationDiv.appendChild(nextButton);
        
        // Page size selector
        const pageSizeSelect = this.createPageSizeSelector();
        paginationDiv.appendChild(pageSizeSelect);
        
        this.container.appendChild(paginationDiv);
    }
    
    /**
     * Create page size selector
     * @returns {HTMLElement} Page size selector
     */
    createPageSizeSelector() {
        const selectorDiv = document.createElement('div');
        selectorDiv.className = 'page-size-selector';
        
        const label = document.createElement('label');
        label.textContent = 'Rows per page: ';
        
        const select = document.createElement('select');
        select.className = 'page-size-select';
        
        const sizes = [50, 100, 250, 500];
        sizes.forEach(size => {
            const option = document.createElement('option');
            option.value = size;
            option.textContent = size;
            option.selected = size === this.pageSize;
            select.appendChild(option);
        });
        
        select.addEventListener('change', (e) => {
            this.pageSize = parseInt(e.target.value);
            this.currentPage = 1;
            this.render();
        });
        
        selectorDiv.appendChild(label);
        selectorDiv.appendChild(select);
        
        return selectorDiv;
    }
    
    /**
     * Navigate to specific page
     * @param {number} page - Page number to navigate to
     */
    goToPage(page) {
        const totalPages = Math.ceil(this.currentResults.length / this.pageSize);
        
        if (page >= 1 && page <= totalPages) {
            this.currentPage = page;
            this.render();
        }
    }
    
    /**
     * Sort results by column
     * @param {string} column - Column name to sort by
     */
    sortByColumn(column) {
        if (!this.currentResults || this.currentResults.length === 0) {
            return;
        }
        
        // Toggle sort direction if same column
        if (this.sortColumn === column) {
            this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            this.sortColumn = column;
            this.sortDirection = 'asc';
        }
        
        // Sort the results
        this.currentResults.sort((a, b) => {
            let valueA = a[column];
            let valueB = b[column];
            
            // Handle null values
            if (valueA === null || valueA === undefined) valueA = '';
            if (valueB === null || valueB === undefined) valueB = '';
            
            // Convert to strings for comparison
            valueA = String(valueA);
            valueB = String(valueB);
            
            // Try to parse as numbers if possible
            const numA = parseFloat(valueA);
            const numB = parseFloat(valueB);
            
            if (!isNaN(numA) && !isNaN(numB)) {
                // Numeric comparison
                return this.sortDirection === 'asc' ? numA - numB : numB - numA;
            } else {
                // String comparison
                return this.sortDirection === 'asc' 
                    ? valueA.localeCompare(valueB)
                    : valueB.localeCompare(valueA);
            }
        });
        
        // Reset to first page and re-render
        this.currentPage = 1;
        this.render();
    }
    
    /**
     * Clear results display
     */
    clear() {
        this.currentResults = null;
        this.currentPage = 1;
        this.sortColumn = null;
        this.sortDirection = 'asc';
        
        if (this.container) {
            this.container.innerHTML = '<p class="no-results">No results to display. Run a query to see results here.</p>';
        }
    }
    
    /**
     * Get current results for export
     * @returns {Array} Current results
     */
    getCurrentResults() {
        return this.currentResults;
    }
    
    /**
     * Get formatted results info
     * @returns {Object} Results statistics
     */
    getResultsInfo() {
        if (!this.currentResults) {
            return { rows: 0, columns: 0, pages: 0 };
        }
        
        const rows = this.currentResults.length;
        const columns = rows > 0 ? Object.keys(this.currentResults[0]).length : 0;
        const pages = Math.ceil(rows / this.pageSize);
        
        return { rows, columns, pages };
    }
    
    /**
     * Refresh the display (useful after external changes)
     */
    refresh() {
        if (this.currentResults) {
            this.render();
        }
    }
}