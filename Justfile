default:
	just -l

test:
	wb bat g file:///Users/jimmyyan/work/duck-tools/index.html ++ console-monitor
	wb bat g file:///Users/jimmyyan/work/duck-tools/pyodide.html ++ console-monitor
