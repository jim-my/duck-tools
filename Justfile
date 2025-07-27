default:
	just -l

# Run tests with browser automation
test:
	wb batch goto file://{{justfile_directory()}}/index.html ++ console-monitor

# Generate fresh screenshots for documentation
screenshots:
	@echo "🔄 Generating fresh screenshots..."
	@mkdir -p {{justfile_directory()}}/screenshots
	@echo "📱 Step 1: Empty app"
	wb goto file://{{justfile_directory()}}/index.html
	sleep 8
	wb screenshot {{justfile_directory()}}/screenshots/demo-1-empty-app.png --full-page
	@echo "📁 Step 2: Upload first file (products)"
	wb file-upload "input[type='file']" "{{justfile_directory()}}/sample_data.csv"
	sleep 3
	wb screenshot {{justfile_directory()}}/screenshots/demo-2-first-file.png --full-page
	@echo "📁 Step 3: Upload second file (sales data)"
	wb file-upload "input[type='file']" "{{justfile_directory()}}/demo/sales_data.csv"
	sleep 3
	wb screenshot {{justfile_directory()}}/screenshots/demo-3-two-files.png --full-page
	@echo "🔍 Step 4: Write JOIN query"
	wb click ".CodeMirror"
	wb combo "Control+a"
	wb eval 'document.querySelector(".CodeMirror").CodeMirror.setValue("-- 🚀 JOIN TWO FILES INSTANTLY!\n-- Combine product info (t1) with sales data (t2)\n\nSELECT \n    p.name as product_name,\n    p.category,\n    p.value as price,\n    s.quarter,\n    s.sales as sales_amount,\n    s.region,\n    ROUND(s.sales / p.value, 0) as units_sold\nFROM t1 p\nJOIN t2 s ON p.id = s.product_id\nORDER BY s.sales DESC;")'
	sleep 1
	wb screenshot {{justfile_directory()}}/screenshots/demo-4-join-query.png --full-page
	@echo "⚡ Step 5: Execute JOIN and show results"
	wb click "#run-query"
	sleep 4
	wb screenshot {{justfile_directory()}}/screenshots/demo-5-join-results.png --full-page
	@echo "📸 Legacy screenshots for compatibility"
	wb screenshot {{justfile_directory()}}/screenshots/app-ready.png --full-page
	wb screenshot {{justfile_directory()}}/screenshots/file-uploaded.png --full-page
	wb screenshot {{justfile_directory()}}/screenshots/query-results.png --full-page
	@echo "✅ All screenshots updated successfully!"
	@echo "📸 Generated demo screenshots:"
	@ls -la {{justfile_directory()}}/screenshots/demo-*.png

# Serve the app locally for development
serve:
	@echo "🚀 Starting local server..."
	@echo "📖 Open http://localhost:8000 in your browser"
	cd {{justfile_directory()}} && python3 -m http.server 8000

# Clean up temporary files
clean:
	@echo "🧹 Cleaning up..."
	rm -rf {{justfile_directory()}}/screenshots/*.png
	@echo "✅ Cleanup complete"

# Demo workflow - upload files and run queries
demo:
	@echo "🎬 Starting interactive demo..."
	wb goto file://{{justfile_directory()}}/index.html
	sleep 3
	@echo "📁 Upload demo/sales_data.csv manually and press Enter to continue..."
	@read
	@echo "📁 Upload demo/customers.csv manually and press Enter to continue..."
	@read
	@echo "🔍 Running demo query..."
	wb click ".CodeMirror"
	wb combo "Control+a"
	wb eval 'document.querySelector(".CodeMirror").CodeMirror.setValue("-- Join customers with sales data\nSELECT \n    c.name,\n    c.plan,\n    SUM(s.sales) as total_sales,\n    AVG(s.sales) as avg_sales\nFROM customers c\nJOIN sales_data s ON c.customer_id = s.product_id\nGROUP BY c.name, c.plan\nORDER BY total_sales DESC;")'
	wb click "#run-query"
	sleep 2
	wb screenshot {{justfile_directory()}}/screenshots/demo-results.png --full-page
	@echo "✅ Demo completed! Check {{justfile_directory()}}/screenshots/demo-results.png"
