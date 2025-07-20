# CSV Tools

A browser-based application for joining and querying CSV/Excel files using SQL.
No server required - everything runs locally in your browser using DuckDB-WASM.


## Features

- **Drag & Drop File Upload**: Upload CSV and Excel files (.xlsx/.xls)
- **Automatic Table Aliasing**: Files are automatically assigned aliases (t1, t2, t3...)
- **SQL Query Editor**: Full-featured SQL editor with syntax highlighting
- **Powerful Queries**: Support for JOINs, aggregations, filtering, and more
- **Export Results**: Download query results as CSV files
- **Real-time Validation**: Immediate feedback on file uploads and queries
- **Responsive Design**: Works on desktop, tablet, and mobile devices

## Quick Start

1. Open `index.html` in your web browser
2. Drag and drop CSV or Excel files into the upload area
3. Write SQL queries using the assigned table aliases (t1, t2, etc.)
4. Click "Run Query" to execute and view results
5. Export results using the "Export CSV" button

## Example Usage

```sql
-- Join user data with orders
SELECT u.name, o.product, o.amount
FROM t1 u
JOIN t2 o ON u.id = o.user_id
WHERE o.amount > 100
```

## Technology Stack

- **DuckDB-WASM**: In-browser SQL database engine
- **SheetJS**: Excel file processing
- **CodeMirror**: SQL syntax highlighting
- **Modern Web APIs**: File handling, drag & drop, downloads

## File Support

- **CSV Files**: Standard comma-separated values
- **Excel Files**: .xlsx and .xls formats (first sheet used)
- **File Size**: Up to 10MB per file
- **Encoding**: UTF-8 text encoding

### Testing

Comprehensive test suite available in the `tests/` directory:

```bash
# Open test version with integrated runner
open test.html

# Or run manual tests
open tests/manual-test.html

# Or use the full test suite
open tests/test-runner.html
```

See [tests/README.md](tests/README.md) for detailed testing instructions.

### Development Workflow

1. Make changes to core files (`main.js`, `style.css`, `index.html`)
2. Test using `test.html` or the test suite
3. Commit changes following conventional commit messages
4. All functionality is self-contained - no build process required

## Architecture

### Core Components

- **CSVTools Class**: Main application controller
- **File Processing**: Handles CSV/Excel upload and validation
- **DuckDB Integration**: Database operations and query execution
- **SQL Editor**: CodeMirror-based editor with syntax highlighting
- **Results Display**: Table rendering with pagination
- **Export System**: CSV generation and download

### Data Flow

1. File Upload → Validation → DuckDB Table Creation
2. SQL Input → Syntax Highlighting → Query Execution
3. Results → Display → Export Options

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes and add tests
4. Ensure all tests pass
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

- Check the [tests/manual-test.html](tests/manual-test.html) for troubleshooting
- Review browser console for detailed error messages
- Ensure files are valid CSV/Excel format
- Verify browser supports WebAssembly

## Limitations

- 10MB file size limit per file
- Excel files use first sheet only
- Results display limited to 1000 rows (full data available for export)
- Requires modern browser with WebAssembly support
- No server-side processing or data persistence
