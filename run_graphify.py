import json
from pathlib import Path
from graphify.build import build_from_json
from graphify.cluster import cluster, score_all
from graphify.analyze import god_nodes, surprising_connections, suggest_questions
from graphify.extract import extract as ast_extract
from graphify.export import to_json
from graphify.report import generate

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

result = ast_extract(code_files)
print(f"AST: {len(result['nodes'])} nodes, {len(result['edges'])} edges")

detection = {
    "total_files": 22,
    "total_words": 9460,
    "needs_graph": True,
    "warning": None,
    "files": {
        "code": ["src/App.jsx", "src/main.jsx", "src/components/Layout.jsx", "src/components/Sidebar.jsx", "src/components/SmartGuide.jsx", "src/context/EventContext.jsx", "src/pages/CreateEvent.jsx", "src/pages/Dashboard.jsx", "src/pages/Logistics.jsx", "src/pages/Registry.jsx"],
        "document": ["AGENTS.md", "index.html", "README.md"],
        "paper": [],
        "image": [],
        "video": []
    }
}

G = build_from_json(result)
communities = cluster(G)
cohesion = score_all(G, communities)
gods = god_nodes(G)
surprises = surprising_connections(G, communities)
labels = {cid: f"Community {cid}" for cid in communities}
questions = suggest_questions(G, communities, labels)
tokens = {"input": 0, "output": 0}

report = generate(G, communities, cohesion, labels, gods, surprises, detection, tokens, ".", suggested_questions=questions)
Path("graphify-out/GRAPH_REPORT.md").write_text(report, encoding="utf-8")
to_json(G, communities, "graphify-out/graph.json")

print(f"Graph: {G.number_of_nodes()} nodes, {G.number_of_edges()} edges, {len(communities)} communities")
print("God nodes:", [g["label"] for g in gods[:5]])