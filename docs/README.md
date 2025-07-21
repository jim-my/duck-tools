# CSV Tools Documentation

## Architecture Decision Records (ADRs)

This directory contains architectural decisions made during the development of CSV Tools.

### Current ADRs

- [ADR-0001: Replace DuckDB-WASM with Simple CSV Processor](./adr/0001-replace-duckdb-wasm-with-simple-csv-processor.md)

## Quick Reference

### When to Use Simple vs Complex Solutions

| Factor | Simple CSV Processor | DuckDB-WASM |
|--------|---------------------|--------------|
| **Browser Compatibility** | ✅ Works everywhere | ❌ CORS/Security issues |
| **Setup Complexity** | ✅ Zero dependencies | ❌ Complex WASM setup |
| **Basic SQL (SELECT)** | ✅ Supported | ✅ Supported |
| **Advanced SQL (JOINs)** | ❌ Not supported | ✅ Full SQL support |
| **Large Datasets** | ❌ Memory limited | ✅ Optimized performance |
| **Offline Usage** | ✅ Fully self-contained | ❌ Requires CDN access |

### Recommended Architecture Pattern

```
Start Simple → Validate → Scale Up

Phase 1: Native JavaScript (current)
- Prove user needs and basic functionality
- Get to market quickly
- Learn user patterns

Phase 2: Hybrid Approach (future)
- Simple processor for basic operations
- API backend for complex operations
- Best of both worlds

Phase 3: Full Backend (if needed)
- Move all processing server-side
- Support enterprise datasets
- Advanced analytics capabilities
```