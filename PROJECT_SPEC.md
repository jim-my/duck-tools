# CSV Tools - Project Specification

## Project Overview

**Objective**: Create browser-based applications for joining and querying CSV/Excel files using SQL, with no server requirements and complete client-side processing.

**Scope**: Two separate implementations exploring different technical approaches:

### Implementation A: DuckDB-WASM Version (Main Branch)
- **URL**: `/index.html` (main application)
- **Focus**: CSV files with native DuckDB-WASM processing
- **Excel**: Future support when DuckDB-WASM Excel extension stabilizes
- **Philosophy**: Maximum simplicity, minimal dependencies

### Implementation B: Pyodide Version (Feature Branch)
- **URL**: `/pyodide.html` (alternative implementation)
- **Focus**: Full CSV + Excel support via pandas
- **Philosophy**: Robust file handling, Python ecosystem benefits

## Technical Requirements

### Functional Requirements
1. **File Upload & Processing**
   - Support drag & drop interface for CSV and Excel files (.xlsx/.xls)
   - Automatic table aliasing (t1, t2, t3...)
   - File validation and error handling
   - Maximum file size: 10MB per file
   - UTF-8 encoding support

2. **SQL Query Engine**
   - Full-featured SQL editor with syntax highlighting
   - Support for JOINs, aggregations, filtering, and complex queries
   - Real-time query validation
   - Error reporting with helpful messages

3. **Data Display & Export**
   - Responsive table rendering with pagination
   - Display limit: 1000 rows (full data available for export)
   - CSV export functionality
   - Results download as CSV files

4. **User Interface**
   - Responsive design (desktop, tablet, mobile)
   - Intuitive drag & drop file upload
   - Real-time feedback on operations
   - Modern, accessible interface

### Technical Constraints
- **Client-Side Only**: No server-side processing or data persistence
- **Browser Compatibility**: Modern browsers with WebAssembly support
- **Performance**: Efficient handling of files up to 10MB
- **Security**: All processing happens locally in browser
- **Accessibility**: WCAG 2.1 AA compliance

## Implementation Approacah

### Architecture Pattern: Client-Side Single Page Application (SPA)

**Core Components**:
1. **CSVTools Class**: Main application controller
2. **File Processing Module**: pandas-based CSV/Excel processing
3. **DuckDB Integration**: Database operations and query execution
4. **SQL Editor Component**: CodeMirror-based editor with syntax highlighting
5. **Results Display Component**: Table rendering with pagination
6. **Export System**: CSV generation and download

### Technology Stack

#### DuckDB-WASM Version (Implementation A)
- **DuckDB-WASM**: Native in-browser SQL database engine
- **Vanilla JavaScript**: No framework dependencies for maximum simplicity
- **Dropzone.js**: Battle-tested drag & drop file upload component
- **CodeMirror**: SQL syntax highlighting and editor
- **Modern Web APIs**: File API, Blob API for downloads
- **CSS3**: Modern styling with responsive design
- **HTML5**: Semantic markup with accessibility features

#### Pyodide Version (Implementation B)
- **Pyodide**: Python runtime in browser via WebAssembly
- **DuckDB (Python)**: SQL database engine via Pyodide
- **pandas**: Robust CSV/Excel file processing and data manipulation
- **CodeMirror**: SQL syntax highlighting and editor
- **Modern Web APIs**: File API, Drag & Drop API, Blob API for downloads
- **Python + HTML/CSS/JS**: Pyodide for data processing, web technologies for UI

### Data Flow Architecture

#### DuckDB-WASM Version
```
CSV Upload → Dropzone.js → File API → DuckDB-WASM read_csv() → Table Creation
     ↓
SQL Input → CodeMirror → DuckDB-WASM Query Execution
     ↓
Results → JavaScript Array → Display (paginated) → CSV Export
```

#### Pyodide Version
```
File Upload → Dropzone.js → pandas Processing → DuckDB Table Creation
     ↓
SQL Input → CodeMirror → DuckDB Query Execution
     ↓
Results → pandas DataFrame → Display (paginated) → Export Options
```

### 12-Factor Application Compliance

1. **Codebase**: Single repository, deployable to any static hosting
2. **Dependencies**: All dependencies loaded via CDN or included
3. **Config**: No configuration needed (client-side only)
4. **Backing Services**: DuckDB via Pyodide as embedded database
5. **Build/Release/Run**: Simple static files, no build process
6. **Processes**: Stateless - no server processes
7. **Port Binding**: Served via any static file server
8. **Concurrency**: Browser-based, single-threaded with Web Workers if needed
9. **Disposability**: Instant startup, no cleanup needed
10. **Dev/Prod Parity**: Identical in all environments (static files)
11. **Logs**: Browser console logging for debugging
12. **Admin Processes**: No admin processes needed

## Success Criteria

### Functional Acceptance Tests
1. **File Upload Test**: Successfully upload and process CSV and Excel files
2. **SQL Query Test**: Execute complex SQL queries with JOINs and aggregations
3. **Export Test**: Download query results as properly formatted CSV
4. **Responsive Test**: Application works correctly on mobile, tablet, and desktop
5. **Error Handling Test**: Graceful handling of invalid files and SQL errors
6. **Performance Test**: Handle files up to 10MB without browser crashes

### Quality Metrics
- **Test Coverage**: Minimum 85% line coverage
- **Performance**: File processing under 5 seconds for 10MB files
- **Accessibility**: WCAG 2.1 AA compliance score
- **Browser Support**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **Error Rate**: Less than 1% unhandled errors in production

### User Experience Criteria
- **Load Time**: Application ready in under 2 seconds
- **Intuitive Interface**: Users can complete basic workflow without documentation
- **Responsive Design**: Usable on screens from 320px to 2560px wide
- **Error Messages**: Clear, actionable error messages for all failure cases

## Development Timeline

### Phase 1: DuckDB-WASM Implementation (Weeks 1-2)
**Main Branch - Priority Implementation**
- Week 1: Core DuckDB-WASM integration and CSV processing
- Week 2: SQL editor, results display, and basic UI

### Phase 2: Pyodide Implementation (Weeks 3-4)
**Feature Branch - Alternative Implementation**
- Week 3: Pyodide runtime and pandas integration
- Week 4: Excel support and feature parity with WASM version

### Phase 3: Polish & Testing (Week 5)
- Responsive design for both implementations
- Cross-browser testing
- Performance optimization
- Documentation

## Testing Strategy

### Test-Driven Development (TDD)
- **Red → Green → Refactor** cycle for all new features
- Unit tests for all core functions
- Integration tests for SQL query workflows
- End-to-end tests for complete user journeys

### Testing Hierarchy
1. **Unit Tests**: Individual functions and classes
   - File parsing and validation
   - SQL query processing
   - Data transformation functions
   - Export functionality

2. **Integration Tests**: Component interactions
   - File upload → DuckDB integration
   - SQL editor → Query execution
   - Results display → Export workflow

3. **Browser Tests**: Cross-browser compatibility
   - Chrome, Firefox, Safari, Edge
   - Mobile and desktop viewports
   - WebAssembly support verification

4. **Performance Tests**: Load and stress testing
   - Large file processing (up to 10MB)
   - Complex query execution
   - Memory usage monitoring

### Testing Tools
- **Test Runner**: Custom HTML test runner with Pyodide support
- **Assertion Library**: Python unittest or pytest within Pyodide
- **Mocking**: Python unittest.mock for DuckDB and pandas operations
- **Coverage**: Python coverage.py for backend logic tracking

## Security Considerations

### Client-Side Security
- **Data Privacy**: All data processing happens locally, no data transmitted
- **XSS Prevention**: Proper HTML escaping in results display
- **File Validation**: Strict file type and size validation
- **Memory Management**: Proper cleanup of large data objects

### Input Validation
- **File Type Validation**: Whitelist of allowed file extensions
- **SQL Injection Prevention**: Parameterized queries where applicable
- **Size Limits**: Enforce 10MB file size limit
- **Content Validation**: Verify file contents match declared type

## Deployment & Operations

### Hosting Requirements
- **Static File Hosting**: Any CDN or static file server
- **HTTPS Required**: For modern Web API access
- **No Server Requirements**: Pure client-side application

### Monitoring & Analytics
- **Error Tracking**: Browser console error monitoring
- **Performance Monitoring**: Page load and query execution times
- **Usage Analytics**: Optional privacy-respecting analytics

### Maintenance
- **Dependency Updates**: Regular updates to Pyodide, DuckDB-Python, and pandas
- **Browser Compatibility**: Testing with new browser versions and WebAssembly features
- **Security Updates**: Monitor for security advisories in Python ecosystem dependencies

## Risk Assessment

### Technical Risks
- **Browser Compatibility**: WebAssembly support variations
  - Mitigation: Comprehensive browser testing, graceful degradation
- **Performance**: Large file processing limitations
  - Mitigation: Streaming processing, progress indicators
- **Memory Usage**: Browser memory constraints
  - Mitigation: Efficient data structures, cleanup procedures

### User Experience Risks
- **Learning Curve**: SQL knowledge requirement
  - Mitigation: Examples, documentation, helpful error messages
- **File Format Support**: Limited Excel feature support
  - Mitigation: Clear documentation of limitations

### Business Risks
- **Dependency Updates**: Breaking changes in Pyodide or DuckDB-Python
  - Mitigation: Version pinning, regular testing
- **WebAssembly Evolution**: Changes in WASM standards
  - Mitigation: Follow Pyodide stable releases, fallback strategies

## Success Metrics

### Technical Metrics
- **Uptime**: 99.9% availability (static hosting dependent)
- **Performance**: Sub-5-second query execution for typical workloads
- **Error Rate**: Less than 1% unhandled exceptions
- **Test Coverage**: Minimum 85% line coverage maintained

### User Metrics
- **Task Completion**: 95% success rate for basic SQL queries
- **User Satisfaction**: Positive feedback on ease of use
- **Browser Support**: Functional on 95%+ of target browsers
- **Accessibility**: WCAG 2.1 AA compliance verification

This specification ensures the CSV Tools project follows 12-factor principles, maintains high quality standards, and provides a robust foundation for development while being fully traceable and testable by any staff engineer.
