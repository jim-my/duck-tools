# Troubleshooting Guide

## Common Browser Security Issues

### Problem: "Failed to construct 'Worker'" CORS Error

**Symptoms:**
```
SecurityError: Failed to construct 'Worker': Script at 'https://cdn.example.com/worker.js' 
cannot be accessed from origin 'http://localhost:8080'.
```

**Root Cause:** Modern browsers block cross-origin workers for security reasons.

**Solutions:**
1. ✅ **Use same-origin workers** (host worker files locally)
2. ✅ **Eliminate workers entirely** (move to main thread)
3. ❌ **CORS headers** (won't work for workers)
4. ❌ **Different CDN** (still cross-origin)

### Problem: Module Resolution Failures

**Symptoms:**
```
Failed to resolve module specifier "apache-arrow". 
Relative references must start with either "/", "./", or "../".
```

**Root Cause:** ES modules with external dependencies don't resolve properly in browsers.

**Solutions:**
1. ✅ **Bundle dependencies** (webpack, rollup, etc.)
2. ✅ **Use import maps** (limited browser support)
3. ✅ **Inline dependencies** (copy code directly)

### Problem: CDN Loading Issues

**Symptoms:**
- Files return 404 errors
- MIME type mismatches
- Random loading failures

**Solutions:**
1. ✅ **Self-host critical dependencies**
2. ✅ **Implement fallbacks**
3. ✅ **Use multiple CDN sources**

## Development vs Production Differences

| Environment | Security Model | Common Issues |
|-------------|---------------|---------------|
| **file://** | Very permissive | Works with most external resources |
| **http://localhost** | Moderate restrictions | CORS issues with workers/modules |
| **https://production** | Strict security | CSP, HTTPS mixed content, CORS |

## Testing Strategy

### 1. Test Early Across Environments
```bash
# Development
file:///path/to/index.html

# Local server
http://localhost:8080

# Production-like
https://staging.example.com
```

### 2. Test Multiple Browsers
- Chrome: Strictest security policies
- Firefox: Moderate security
- Safari: Different CORS behavior
- Mobile browsers: Additional constraints

### 3. Test Offline Scenarios
- Disable network
- Block specific CDNs
- Simulate slow connections

## Quick Fixes for Common Patterns

### Replace Web Workers with Main Thread
```javascript
// Before: Worker-based
const worker = new Worker('external-script.js');

// After: Main thread
function processInMainThread(data) {
  // Process synchronously or with setTimeout for chunking
}
```

### Replace CDN Dependencies with Local
```html
<!-- Before: CDN -->
<script src="https://cdn.example.com/library.js"></script>

<!-- After: Local -->
<script src="./lib/library.js"></script>
```

### Replace Complex Libraries with Simple Implementations
```javascript
// Before: Heavy library
import { complexLibrary } from 'external-dependency';

// After: Simple implementation
function simpleImplementation(input) {
  // Basic functionality only
}
```