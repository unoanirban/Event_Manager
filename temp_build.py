import sys
import json
from graphify.build import build_from_json
from graphify.cluster import cluster, score_all
from graphify.analyze import god_nodes, surprising_connections, suggest_questions
from graphify.report import generate
from graphify.export import to_json
from pathlib import Path

extraction = json.loads(Path("graphify-out/.graphify_ast.json").read_text())

detection = {
    "total_files": 22,
    "total_words": 9460,
    "needs_graph": True,
    "warning": None,
    "files": {
        "code": ["src/App.jsx", "src/main.jsx", "src/components/Layout.jsx", "src/components/Sidebar.jsx", "src/components/SmartGuide.jsx", "src/context/EventContext.jsx", "src/pages/CreateEvent.jsx", "src/pages/Dashboard.jsx", "src/pages/Logistics.jsx", "src/pages/Registry.jsx"],
        "document": ["AGENTS.md", "index.html", "README.md", "graphify-out/GRAPH_REPORT.md"],
        "paper": [],
        "image": ["public/favicon.svg", "public/icons.svg", "src/assets/hero.png", "src/assets/react.svg", "src/assets/vite.svg"],
        "video": []
    }
}

G = build_from_json(extraction)
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

analysis = {
    "communities": {str(k): v for k, v in communities.items()},
    "cohesion": {str(k): v for k, v in cohesion.items()},
    "gods": gods,
    "surprises": surprises,
    "questions": questions,
}
Path("graphify-out/.graphify_analysis.json").write_text(json.dumps(analysis, indent=2))
Path("graphify-out/.graphify_detect.json").write_text(json.dumps(detection))

print(f"Graph: {G.number_of_nodes()} nodes, {G.number_of_edges()} edges, {len(communities)} communities")
print(f"Gods: {gods}")