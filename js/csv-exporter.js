/**
 * CSV Exporter
 * Handles exporting query results to CSV format
 */
class CSVExporter {
    constructor() {
        this.defaultFilename = 'query_results.csv';
    }
    
    /**
     * Export query results to CSV file
     * @param {Array} data - Array of result objects
     * @param {string} filename - Optional filename
     */
    exportToCSV(data, filename = this.defaultFilename) {
        try {
            if (!data || data.length === 0) {
                throw new Error('No data to export');
            }
            
            console.log(`Exporting ${data.length} rows to CSV`);
            
            // Convert data to CSV format
            const csvContent = this.convertToCSV(data);
            
            // Create and download file
            this.downloadCSV(csvContent, filename);
            
            console.log(`Successfully exported to ${filename}`);
            
        } catch (error) {
            console.error('Export failed:', error);
            throw new Error(`Export failed: ${error.message}`);
        }
    }
    
    /**
     * Convert array of objects to CSV string
     * @param {Array} data - Data to convert
     * @returns {string} CSV formatted string
     */
    convertToCSV(data) {
        if (!data || data.length === 0) {
            return '';
        }
        
        // Get column headers
        const headers = Object.keys(data[0]);
        
        // Create CSV content
        let csv = '';
        
        // Add headers
        csv += this.formatCSVRow(headers);
        csv += '\n';
        
        // Add data rows
        data.forEach(row => {
            const values = headers.map(header => {
                const value = row[header];
                return this.formatCSVValue(value);
            });
            csv += this.formatCSVRow(values);
            csv += '\n';
        });
        
        return csv;
    }
    
    /**
     * Format a single CSV row
     * @param {Array} values - Array of values for the row
     * @returns {string} Formatted CSV row
     */
    formatCSVRow(values) {
        return values.join(',');
    }
    
    /**
     * Format a single CSV value with proper escaping
     * @param {*} value - Value to format
     * @returns {string} Formatted CSV value
     */
    formatCSVValue(value) {
        // Handle null/undefined values
        if (value === null || value === undefined) {
            return '';
        }
        
        // Convert to string
        let stringValue = String(value);
        
        // Check if value needs quoting
        const needsQuoting = stringValue.includes(',') || 
                           stringValue.includes('"') || 
                           stringValue.includes('\n') || 
                           stringValue.includes('\r');
        
        if (needsQuoting) {
            // Escape quotes by doubling them
            stringValue = stringValue.replace(/"/g, '""');
            // Wrap in quotes
            stringValue = `"${stringValue}"`;
        }
        
        return stringValue;
    }
    
    /**
     * Download CSV content as file
     * @param {string} csvContent - CSV content to download
     * @param {string} filename - Filename for download
     */
    downloadCSV(csvContent, filename) {
        // Create blob with UTF-8 BOM for Excel compatibility
        const BOM = '\uFEFF';
        const blob = new Blob([BOM + csvContent], {
            type: 'text/csv;charset=utf-8;'
        });
        
        // Create download link
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.href = url;
        link.download = filename;
        link.style.display = 'none';
        
        // Trigger download
        document.body.appendChild(link);
        link.click();
        
        // Cleanup
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }
    
    /**
     * Export with custom options
     * @param {Array} data - Data to export
     * @param {Object} options - Export options
     */
    exportWithOptions(data, options = {}) {
        const {
            filename = this.defaultFilename,
            delimiter = ',',
            includeHeaders = true,
            dateFormat = 'ISO',
            nullValue = ''
        } = options;
        
        try {
            if (!data || data.length === 0) {
                throw new Error('No data to export');
            }
            
            const csvContent = this.convertToCSVWithOptions(data, {
                delimiter,
                includeHeaders,
                dateFormat,
                nullValue
            });
            
            this.downloadCSV(csvContent, filename);
            
        } catch (error) {
            console.error('Export with options failed:', error);
            throw new Error(`Export failed: ${error.message}`);
        }
    }
    
    /**
     * Convert to CSV with custom options
     * @param {Array} data - Data to convert
     * @param {Object} options - Conversion options
     * @returns {string} CSV content
     */
    convertToCSVWithOptions(data, options) {
        const {
            delimiter = ',',
            includeHeaders = true,
            dateFormat = 'ISO',
            nullValue = ''
        } = options;
        
        if (!data || data.length === 0) {
            return '';
        }
        
        const headers = Object.keys(data[0]);
        let csv = '';
        
        // Add headers if requested
        if (includeHeaders) {
            csv += this.formatCSVRowWithDelimiter(headers, delimiter);
            csv += '\n';
        }
        
        // Add data rows
        data.forEach(row => {
            const values = headers.map(header => {
                let value = row[header];
                
                // Handle null values
                if (value === null || value === undefined) {
                    value = nullValue;
                }
                // Handle dates
                else if (value instanceof Date) {
                    value = dateFormat === 'ISO' ? value.toISOString() : value.toLocaleDateString();
                }
                
                return this.formatCSVValueWithDelimiter(value, delimiter);
            });
            csv += this.formatCSVRowWithDelimiter(values, delimiter);
            csv += '\n';
        });
        
        return csv;
    }
    
    /**
     * Format CSV row with custom delimiter
     * @param {Array} values - Row values
     * @param {string} delimiter - Field delimiter
     * @returns {string} Formatted row
     */
    formatCSVRowWithDelimiter(values, delimiter) {
        return values.join(delimiter);
    }
    
    /**
     * Format CSV value with custom delimiter
     * @param {*} value - Value to format
     * @param {string} delimiter - Field delimiter
     * @returns {string} Formatted value
     */
    formatCSVValueWithDelimiter(value, delimiter) {
        if (value === null || value === undefined) {
            return '';
        }
        
        let stringValue = String(value);
        
        // Check if value needs quoting based on delimiter
        const needsQuoting = stringValue.includes(delimiter) || 
                           stringValue.includes('"') || 
                           stringValue.includes('\n') || 
                           stringValue.includes('\r');
        
        if (needsQuoting) {
            stringValue = stringValue.replace(/"/g, '""');
            stringValue = `"${stringValue}"`;
        }
        
        return stringValue;
    }
    
    /**
     * Get export preview
     * @param {Array} data - Data to preview
     * @param {number} rows - Number of rows to preview
     * @returns {string} CSV preview
     */
    getExportPreview(data, rows = 5) {
        if (!data || data.length === 0) {
            return 'No data to preview';
        }
        
        const previewData = data.slice(0, Math.min(rows, data.length));
        return this.convertToCSV(previewData);
    }
    
    /**
     * Validate data before export
     * @param {Array} data - Data to validate
     * @returns {Object} Validation result
     */
    validateExportData(data) {
        const result = {
            valid: true,
            errors: [],
            warnings: [],
            stats: {
                rows: 0,
                columns: 0,
                estimatedSize: 0
            }
        };
        
        if (!data) {
            result.valid = false;
            result.errors.push('No data provided');
            return result;
        }
        
        if (!Array.isArray(data)) {
            result.valid = false;
            result.errors.push('Data must be an array');
            return result;
        }
        
        if (data.length === 0) {
            result.valid = false;
            result.errors.push('Data array is empty');
            return result;
        }
        
        // Calculate stats
        result.stats.rows = data.length;
        result.stats.columns = Object.keys(data[0]).length;
        
        // Estimate file size (rough calculation)
        const sampleCSV = this.convertToCSV(data.slice(0, Math.min(10, data.length)));
        const avgRowSize = sampleCSV.length / Math.min(10, data.length);
        result.stats.estimatedSize = avgRowSize * data.length;
        
        // Add warnings for large files
        if (result.stats.estimatedSize > 10 * 1024 * 1024) { // 10MB
            result.warnings.push('Large file size: Export may take some time');
        }
        
        if (result.stats.rows > 100000) {
            result.warnings.push('Large number of rows: Consider filtering data');
        }
        
        return result;
    }
    
    /**
     * Format file size for display
     * @param {number} bytes - Size in bytes
     * @returns {string} Formatted size
     */
    formatFileSize(bytes) {
        if (bytes === 0) return '0 B';
        
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }
}