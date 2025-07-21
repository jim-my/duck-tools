/**
 * File Handler
 * Manages file uploads using Dropzone.js and integrates with DuckDB
 */
class FileHandler {
    constructor(duckdbManager) {
        this.duckdb = duckdbManager;
        this.uploadedFiles = new Map();
        this.tableCounter = 1;
        this.fileInput = null;
        
        this.initializeDropzone();
    }
    
    /**
     * Initialize file upload interface (native HTML5)
     */
    initializeDropzone() {
        const dropzoneElement = document.getElementById('dropzone');
        if (!dropzoneElement) {
            throw new Error('Upload area element not found');
        }
        
        // Create file input
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = '.csv';
        fileInput.multiple = true;
        fileInput.style.display = 'none';
        fileInput.addEventListener('change', (e) => this.handleFileInputChange(e));
        document.body.appendChild(fileInput);
        
        // Set up dropzone events
        dropzoneElement.addEventListener('click', () => fileInput.click());
        dropzoneElement.addEventListener('dragover', (e) => this.handleDragOver(e));
        dropzoneElement.addEventListener('drop', (e) => this.handleDrop(e));
        dropzoneElement.addEventListener('dragenter', (e) => this.handleDragEnter(e));
        dropzoneElement.addEventListener('dragleave', (e) => this.handleDragLeave(e));
        
        this.fileInput = fileInput;
        console.log('File upload interface initialized');
    }
    
    /**
     * Handle drag over event
     */
    handleDragOver(e) {
        e.preventDefault();
        e.stopPropagation();
        e.currentTarget.classList.add('dragover');
    }
    
    /**
     * Handle drag enter event
     */
    handleDragEnter(e) {
        e.preventDefault();
        e.stopPropagation();
        e.currentTarget.classList.add('dragover');
    }
    
    /**
     * Handle drag leave event
     */
    handleDragLeave(e) {
        e.preventDefault();
        e.stopPropagation();
        e.currentTarget.classList.remove('dragover');
    }
    
    /**
     * Handle drop event
     */
    handleDrop(e) {
        e.preventDefault();
        e.stopPropagation();
        e.currentTarget.classList.remove('dragover');
        
        const files = Array.from(e.dataTransfer.files);
        this.handleFiles(files);
    }
    
    /**
     * Handle file input change
     */
    handleFileInputChange(e) {
        const files = Array.from(e.target.files);
        this.handleFiles(files);
        e.target.value = ''; // Reset input
    }
    
    /**
     * Handle multiple files
     */
    handleFiles(files) {
        const csvFiles = files.filter(file => file.name.toLowerCase().endsWith('.csv'));
        
        if (csvFiles.length !== files.length) {
            console.warn('Some files were ignored (only CSV files are supported)');
        }
        
        csvFiles.forEach(file => this.handleFileAdded(file));
    }
    
    /**
     * Handle file added to dropzone
     * @param {File} file - The uploaded file
     */
    async handleFileAdded(file) {
        try {
            console.log(`File added: ${file.name} (${this.formatFileSize(file.size)})`);
            
            // Validate file
            if (!this.validateFile(file)) {
                return;
            }
            
            // Generate unique table name
            const tableName = this.generateTableName(file.name);
            
            // Show loading state
            this.updateFileStatus(file, 'Processing...');
            
            // Load file into DuckDB
            await this.duckdb.loadCSV(file, tableName);
            
            // Store file information
            this.uploadedFiles.set(file, {
                tableName: tableName,
                fileName: file.name,
                fileSize: file.size,
                uploadTime: new Date(),
                rowCount: await this.duckdb.getRowCount(tableName)
            });
            
            // Update UI
            this.updateFileStatus(file, 'Ready');
            this.updateFileList();
            this.notifyFileLoaded(tableName, file.name);
            
            console.log(`Successfully processed: ${file.name} → ${tableName}`);
            
        } catch (error) {
            console.error(`Failed to process file ${file.name}:`, error);
            this.updateFileStatus(file, 'Error');
            this.showError(`Failed to process ${file.name}: ${error.message}`);
        }
    }
    
    /**
     * Handle file removed from dropzone
     * @param {File} file - The removed file
     */
    async handleFileRemoved(file) {
        try {
            const fileInfo = this.uploadedFiles.get(file);
            if (fileInfo) {
                // Drop table from DuckDB
                await this.duckdb.dropTable(fileInfo.tableName);
                
                // Remove from our tracking
                this.uploadedFiles.delete(file);
                
                // Update UI
                this.updateFileList();
                this.notifyFileRemoved(fileInfo.tableName, fileInfo.fileName);
                
                console.log(`Removed file: ${fileInfo.fileName} (${fileInfo.tableName})`);
            }
        } catch (error) {
            console.error(`Error removing file:`, error);
            this.showError(`Error removing file: ${error.message}`);
        }
    }
    
    /**
     * Handle upload errors
     * @param {File} file - The file that caused the error
     * @param {string} errorMessage - Error message
     */
    handleUploadError(file, errorMessage) {
        console.error(`Upload error for ${file.name}:`, errorMessage);
        this.showError(`Upload error: ${errorMessage}`);
    }
    
    /**
     * Validate uploaded file
     * @param {File} file - File to validate
     * @returns {boolean} Is valid
     */
    validateFile(file) {
        // Check file type
        if (!file.name.toLowerCase().endsWith('.csv')) {
            this.showError(`Invalid file type: ${file.name}. Only CSV files are supported.`);
            return false;
        }
        
        // Check file size (10MB limit)
        if (file.size > 10 * 1024 * 1024) {
            this.showError(`File too large: ${file.name}. Maximum size is 10MB.`);
            return false;
        }
        
        // Check if file name already exists
        const existingFile = Array.from(this.uploadedFiles.values())
            .find(info => info.fileName === file.name);
        if (existingFile) {
            this.showError(`File already uploaded: ${file.name}`);
            return false;
        }
        
        return true;
    }
    
    /**
     * Generate unique table name
     * @param {string} fileName - Original file name
     * @returns {string} Table name
     */
    generateTableName(fileName) {
        // Simple table naming: t1, t2, t3, etc.
        return `t${this.tableCounter++}`;
    }
    
    /**
     * Update file status display
     * @param {File} file - File object
     * @param {string} status - Status message
     */
    updateFileStatus(file, status) {
        // For now, just log the status - the file list will show the current state
        console.log(`File ${file.name}: ${status}`);
    }
    
    /**
     * Update the file list display
     */
    updateFileList() {
        const fileListContainer = document.getElementById('file-list');
        if (!fileListContainer) return;
        
        // Clear existing content
        fileListContainer.innerHTML = '';
        
        if (this.uploadedFiles.size === 0) {
            fileListContainer.innerHTML = '<p class="no-files">No files uploaded yet</p>';
            return;
        }
        
        // Create file list
        const fileList = document.createElement('div');
        fileList.className = 'uploaded-files';
        
        for (const [file, info] of this.uploadedFiles) {
            const fileItem = document.createElement('div');
            fileItem.className = 'file-item';
            
            fileItem.innerHTML = `
                <div class="file-info">
                    <span class="file-name">${info.fileName}</span>
                    <span class="table-alias">→ ${info.tableName}</span>
                </div>
                <div class="file-stats">
                    ${this.formatFileSize(info.fileSize)} • ${info.rowCount.toLocaleString()} rows
                </div>
                <div class="file-actions">
                    <button onclick="fileHandler.removeFile('${info.tableName}')" class="remove-btn">
                        Remove
                    </button>
                </div>
            `;
            
            fileList.appendChild(fileItem);
        }
        
        fileListContainer.appendChild(fileList);
    }
    
    /**
     * Remove file by table name
     * @param {string} tableName - Table name to remove
     */
    async removeFile(tableName) {
        try {
            // Find the file by table name
            let fileToRemove = null;
            for (const [file, info] of this.uploadedFiles) {
                if (info.tableName === tableName) {
                    fileToRemove = file;
                    break;
                }
            }
            
            if (fileToRemove) {
                // Remove the file manually
                await this.handleFileRemoved(fileToRemove);
            }
        } catch (error) {
            console.error('Error removing file:', error);
            this.showError(`Error removing file: ${error.message}`);
        }
    }
    
    /**
     * Get list of uploaded table names
     * @returns {Array<string>} List of table names
     */
    getTableNames() {
        return Array.from(this.uploadedFiles.values()).map(info => info.tableName);
    }
    
    /**
     * Get file info by table name
     * @param {string} tableName - Table name
     * @returns {Object|null} File info
     */
    getFileInfo(tableName) {
        for (const info of this.uploadedFiles.values()) {
            if (info.tableName === tableName) {
                return info;
            }
        }
        return null;
    }
    
    /**
     * Format file size for display
     * @param {number} bytes - File size in bytes
     * @returns {string} Formatted size
     */
    formatFileSize(bytes) {
        if (bytes === 0) return '0 B';
        
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }
    
    /**
     * Notify that a file was loaded (for integration with other components)
     * @param {string} tableName - Table name
     * @param {string} fileName - File name
     */
    notifyFileLoaded(tableName, fileName) {
        // Dispatch custom event
        window.dispatchEvent(new CustomEvent('fileLoaded', {
            detail: { tableName, fileName }
        }));
    }
    
    /**
     * Notify that a file was removed
     * @param {string} tableName - Table name
     * @param {string} fileName - File name
     */
    notifyFileRemoved(tableName, fileName) {
        // Dispatch custom event
        window.dispatchEvent(new CustomEvent('fileRemoved', {
            detail: { tableName, fileName }
        }));
    }
    
    /**
     * Show error message
     * @param {string} message - Error message
     */
    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-notification';
        errorDiv.textContent = message;
        document.body.appendChild(errorDiv);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.parentNode.removeChild(errorDiv);
            }
        }, 5000);
    }
    
    /**
     * Clear all uploaded files
     */
    async clearAllFiles() {
        try {
            // Remove all files manually
            const filesToRemove = Array.from(this.uploadedFiles.keys());
            for (const file of filesToRemove) {
                await this.handleFileRemoved(file);
            }
            
            // Clear the file list UI
            this.updateFileList();
            
            // Reset counter
            this.tableCounter = 1;
            
            console.log('All files cleared');
        } catch (error) {
            console.error('Error clearing files:', error);
            this.showError(`Error clearing files: ${error.message}`);
        }
    }
}