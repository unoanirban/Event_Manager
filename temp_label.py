import json
from pathlib import Path
from graphify.build import build_from_json
from graphify.cluster import score_all
from graphify.analyze import god_nodes, surprising_connections, suggest_questions
from graphify.report import generate
from graphify.export import to_json

extraction = json.loads(Path("graphify-out/.graphify_ast.json").read_text())
analysis = json.loads(Path("graphify-out/.graphify_analysis.json").read_text())
detection = json.loads(Path("graphify-out/.graphify_detect.json").read_text())

G = build_from_json(extraction)
communities = {int(k): v for k, v in analysis["communities"].items()}
cohesion = {int(k): v for k, v in analysis["cohesion"].items()}
tokens = {"input": 0, "output": 0}

labels = {
    0: "Event State Management",
    1: "Event Creation Flow",
    2: "Event Display",
    3: "Route Navigation",
    4: "Context Access",
    5: "Event Listing",
    6: "Logistics Management",
    7: "UI Components",
    8: "Application Setup",
}

questions = suggest_questions(G, communities, labels)
gods = god_nodes(G)
surprises = surprising_connections(G, communities)

report = generate(G, communities, cohesion, labels, gods, surprises, detection, tokens, ".", suggested_questions=questions)
Path("graphify-out/GRAPH_REPORT.md").write_text(report, encoding="utf-8")
Path("graphify-out/.graphify_labels.json").write_text(json.dumps({str(k): v for k, v in labels.items()}))
print("Report updated with community labels")