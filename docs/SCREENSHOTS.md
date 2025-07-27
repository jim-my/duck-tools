# 📸 Automated Screenshot Generation

This project includes automated screenshot generation for documentation using the `wb` (web browser automation) tool and `just` task runner.

## 🚀 Quick Usage

```bash
# Generate all screenshots automatically
just screenshots

# Run interactive demo with manual steps
just demo

# Clean up old screenshots
just clean
```

## 📋 Available Commands

### `just screenshots`
Fully automated screenshot generation:
1. Navigates to the app
2. Takes initial loading screenshot
3. Waits for app to fully load
4. Takes ready state screenshot
5. Uploads sample CSV file
6. Takes file uploaded screenshot
7. Runs SQL query
8. Takes query results screenshot

### `just demo`
Interactive demo workflow:
1. Opens the app
2. Prompts you to manually upload demo files
3. Runs complex JOIN query
4. Takes demo results screenshot

### `just serve`
Starts local development server on port 8000

### `just clean`
Removes all generated screenshots

## 📁 Generated Screenshots

| File | Description | Used In |
|------|-------------|---------|
| `app-loading.png` | Initial app state | Development |
| `app-ready.png` | Fully loaded app | README.md hero image |
| `file-uploaded.png` | After file upload | README.md Quick Start |
| `query-results.png` | Query execution results | README.md Quick Start |
| `demo-results.png` | Demo JOIN query results | Documentation |

## 🔧 Customizing Screenshots

### Adding New Screenshots

Edit the `screenshots` task in `Justfile`:

```bash
# Add new screenshot step
wb goto file://{{justfile_directory()}}/index.html
wb click "#some-button"
wb screenshot {{justfile_directory()}}/screenshots/new-feature.png --full-page
```

### Screenshot Options

```bash
# Full page screenshot
wb screenshot filename.png --full-page

# Element-specific screenshot  
wb screenshot filename.png --element "#selector"

# Custom viewport size
wb window-resize 1920 1080
wb screenshot filename.png
```

### Custom Queries

Modify the SQL query in the automation:

```bash
# Correct wb syntax for JavaScript evaluation
wb eval 'document.querySelector(".CodeMirror").CodeMirror.setValue("YOUR SQL HERE")'
```

### Key wb Commands Used

| MCP Command | Actual wb Command | Description |
|-------------|-------------------|-------------|
| `wb_navigate` | `wb goto` | Navigate to URL |
| `wb_screenshot` | `wb screenshot` | Take screenshot |
| `wb_file_upload` | `wb file-upload` | Upload files |
| `wb_click` | `wb click` | Click elements |
| `wb_key_press` | `wb combo` | Key combinations |
| `wb_evaluate_js` | `wb eval` | Execute JavaScript |

## 🛠️ Technical Details

### Dependencies
- `wb` - Web browser automation tool
- `just` - Command runner (Justfile)
- Modern browser with WebAssembly support

### Browser Automation
The screenshots use `wb` commands to:
- Navigate to pages
- Upload files
- Click elements
- Enter text
- Execute JavaScript
- Take screenshots

### File Paths
All paths in Justfile use `{{justfile_directory()}}` for full portability across different systems and user environments. This means:

- ✅ **Works anywhere**: Clone the repo and run `just screenshots` immediately
- ✅ **No hard-coded paths**: No need to edit paths for your system  
- ✅ **Team friendly**: Same commands work for all team members
- ✅ **CI/CD ready**: Works in automated environments without modification

```bash
wb navigate file://{{justfile_directory()}}/index.html  # ✅ Works everywhere
```

## 🔄 Automated Updates

### Git Hooks
You can set up a pre-commit hook to automatically update screenshots:

```bash
#!/bin/sh
# .git/hooks/pre-commit
just screenshots
git add screenshots/
```

### CI/CD Integration
For GitHub Actions:

```yaml
- name: Generate Screenshots
  run: |
    just screenshots
    git add screenshots/
    git commit -m "Update screenshots" || exit 0
```

## 🐛 Troubleshooting

### Common Issues

**Screenshots appear blank:**
- Increase sleep timers for app loading
- Check if app URL is correct
- Verify browser automation is working

**File upload fails:**
- Ensure file paths are absolute
- Check file permissions
- Verify input selector is correct

**JavaScript evaluation errors:**
- Check CodeMirror is loaded
- Verify element selectors
- Escape quotes properly in JS strings

### Debug Mode

Add debug output to see what's happening:

```bash
wb screenshot {{justfile_directory()}}/screenshots/debug-before.png
wb click "#element"
wb screenshot {{justfile_directory()}}/screenshots/debug-after.png
```

### Command Verification

Test individual wb commands:

```bash
# Test navigation
wb goto file://{{justfile_directory()}}/index.html

# Test JavaScript execution
wb eval 'console.log("Testing wb commands")'

# Test file upload
wb file-upload "input[type='file']" "{{justfile_directory()}}/sample_data.csv"
```

## 📝 Best Practices

1. **Consistent Timing**: Use appropriate `sleep` delays
2. **Error Handling**: Check if elements exist before interacting
3. **Clean State**: Start each screenshot session with a fresh browser
4. **File Organization**: Keep screenshots in dedicated folder
5. **Documentation**: Update this guide when adding new automation

## 🎯 Future Enhancements

- [ ] Mobile responsive screenshots
- [ ] Multiple browser testing
- [ ] Automatic README updates
- [ ] Performance benchmarking screenshots
- [ ] Dark mode screenshots
- [ ] Accessibility testing screenshots

---

This automation ensures documentation stays current with minimal manual effort!
