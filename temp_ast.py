import sys
import json
from pathlib import Path
from graphify.extract import extract

code_files = [
    Path("src/App.jsx"),
    Path("src/main.jsx"),
    Path("src/components/Layout.jsx"),
    Path("src/components/Sidebar.jsx"),
    Path("src/components/SmartGuide.jsx"),
    Path("src/context/EventContext.jsx"),
    Path("src/pages/CreateEvent.jsx"),
    Path("src/pages/Dashboard.jsx"),
    Path("src/pages/Logistics.jsx"),
    Path("src/pages/Registry.jsx"),
]

result = extract(code_files)
Path("graphify-out/.graphify_ast.json").write_text(json.dumps(result, indent=2))
print(f"AST: {len(result['nodes'])} nodes, {len(result['edges'])} edges")