# ADR-0001: Replace DuckDB-WASM with Simple CSV Processor

## Status
**Accepted** - Implemented 2025-01-21

## Context

We initially attempted to implement a CSV analysis tool using DuckDB-WASM for powerful SQL query capabilities. However, we encountered critical browser security issues that prevented the application from working in production environments.

### Problems Encountered

1. **CORS Worker Security Errors**
   ```
   SecurityError: Failed to construct 'Worker': Script at 
   'https://cdn.jsdelivr.net/npm/@duckdb/duckdb-wasm@1.28.0/dist/duckdb-browser-eh.worker.js' 
   cannot be accessed from origin 'http://localhost:8080'.
   ```

2. **Module Resolution Failures**
   ```
   Failed to resolve module specifier "apache-arrow". 
   Relative references must start with either "/", "./", or "../".
   ```

3. **API Compatibility Issues**
   ```
   Failed to process file: this.conn.query is not a function
   ```

### Browser Security Landscape

Modern browsers (especially Chrome) have increasingly strict security policies:
- **Cross-Origin Worker Restrictions**: Workers loaded from CDN domains are blocked when serving from localhost
- **Module Import Security**: ES modules with external dependencies face resolution issues
- **CSP (Content Security Policy)**: Stricter default policies block external script execution

### Technical Investigation

We attempted multiple solutions:
1. **Different CDNs**: jsdelivr.net, unpkg.com, skypack.dev - all failed
2. **Local File Hosting**: Downloaded WASM files locally, still faced worker issues
3. **Import Maps**: Tried to resolve module dependencies, failed due to browser security
4. **CORS Headers**: Cannot control CDN CORS policies for worker scripts

## Decision

**Replace DuckDB-WASM with a simple, self-contained CSV processor** that:
- Has zero external dependencies
- Runs entirely in the main thread (no workers)
- Provides basic SQL-like query capabilities
- Maintains API compatibility with existing codebase

## Implementation

### Simple CSV Processor Features
```javascript
// Core capabilities implemented
- CSV parsing with quoted field support
- Basic SQL: SELECT, FROM, LIMIT, WHERE
- Table management: CREATE, DROP, LIST
- Compatible API: loadCSV(), runQuery(), getRowCount()
```

### Architecture Changes
1. **HTML**: Inline CSV processor instead of external DuckDB scripts
2. **File Upload**: Native HTML5 drag-and-drop instead of Dropzone.js
3. **Query Engine**: Simple regex-based SQL parser for basic operations
4. **Data Storage**: In-memory JavaScript Map for table storage

### Trade-offs Made

#### What We Lost
- Advanced SQL features (JOINs, complex aggregations, window functions)
- High-performance WASM execution
- Type inference and validation
- Large dataset handling capabilities
- Columnar storage optimizations

#### What We Gained
- **Reliability**: Works in all browsers without security issues
- **Simplicity**: No external dependencies, easier to debug
- **Performance**: Instant initialization, no WASM loading time
- **Portability**: Self-contained, works offline
- **Maintainability**: Easier to modify and extend core functionality

## Consequences

### Positive
✅ **Immediate functionality**: Application works reliably across all browsers
✅ **Zero dependencies**: No CDN failures or version conflicts
✅ **Fast loading**: No WASM compilation or worker initialization delays
✅ **Easier debugging**: Pure JavaScript, standard browser dev tools work
✅ **Future-proof**: Not affected by CDN changes or browser security updates

### Negative
❌ **Limited SQL capabilities**: Only basic SELECT operations supported
❌ **Performance limitations**: JavaScript processing vs optimized WASM
❌ **Memory constraints**: Large CSV files may cause browser memory issues
❌ **No advanced analytics**: Complex data analysis requires external tools

### Migration Path (Future)
If advanced SQL capabilities become critical:
1. **Server-side processing**: Move DuckDB to backend API
2. **WebAssembly compilation**: Build custom WASM module with proper CORS setup
3. **Hybrid approach**: Simple processor for basic operations, API for complex queries

## Lessons Learned

### Browser Security is Increasingly Restrictive
- Always test with real browsers, not just development environments
- Assume CDN-based solutions will face security restrictions
- Plan for zero-dependency architectures when possible

### WASM + Workers + CDN = Complexity
The combination of:
- WebAssembly modules
- Web Workers 
- External CDN hosting
- Modern browser security

Creates a perfect storm of compatibility issues.

### Progressive Enhancement Works
Starting with a simple solution and adding complexity as needed is more reliable than starting with the most powerful solution.

### Testing Across Environments is Critical
- Development (file://) vs Production (http://) have different security models
- Different browsers have different security policies
- Test early and often with real deployment scenarios

## Recommendations for Future Projects

### When to Choose Simple Solutions
- **MVP/Prototype phase**: Get working quickly, optimize later
- **Browser compatibility critical**: Avoid bleeding-edge technologies
- **Simple use cases**: Basic data processing doesn't need heavyweight tools
- **Self-contained requirements**: Offline or low-dependency environments

### When Complex Solutions Are Worth It
- **Performance critical**: Large datasets, complex computations
- **Advanced features required**: Complex SQL, data analytics, visualizations
- **Server control**: Can host WASM files on same origin
- **Enterprise environments**: Can control browser policies and CDN access

### Architecture Decision Framework
1. **Start simple**: Can basic JavaScript solve the problem?
2. **Identify constraints**: Browser security, dependencies, performance
3. **Prototype quickly**: Test real-world deployment scenarios early
4. **Plan migration paths**: How to upgrade when requirements grow
5. **Document trade-offs**: Capture decisions for future reference

## References

- [DuckDB-WASM Documentation](https://duckdb.org/docs/api/wasm)
- [Web Worker Security](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers#content_security_policy)
- [CORS and Workers](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)
- [CSP Worker Restrictions](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/worker-src)

## Approval

- **Decided by**: Development Team
- **Date**: 2025-01-21
- **Stakeholders**: Engineering, Product
- **Review cycle**: Next architecture review (Q2 2025)