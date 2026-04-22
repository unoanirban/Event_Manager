import json
from pathlib import Path
from networkx.readwrite import json_graph
import networkx as nx

data = json.loads(Path("graphify-out/graph.json").read_text())
G = json_graph.node_link_graph(data, edges="links")

print("=== Event State Flow Trace ===\n")

print("1. CREATE event:")
src = "createevent_createevent"
for neighbor in G.neighbors(src):
    rel = G.edges[src, neighbor].get("relation", "")
    label = G.nodes[neighbor].get("label", "")
    print(f"   CreateEvent() --{rel}--> {label}")

print("\n2. STORE in context:")
src = "eventcontext_useevents"
for neighbor in G.neighbors(src):
    rel = G.edges[src, neighbor].get("relation", "")
    label = G.nodes[neighbor].get("label", "")
    print(f"   useEvents() --{rel}--> {label}")

print("\n3. RETRIEVE for logistics:")
src = "logistics_logistics"
for neighbor in G.neighbors(src):
    rel = G.edges[src, neighbor].get("relation", "")
    label = G.nodes[neighbor].get("label", "")
    print(f"   {label} --{rel}--> Logistics()")

print("\n=== Full Path ===")
try:
    path = nx.shortest_path(G, "createevent_createevent", "logistics_logistics")
    for i, nid in enumerate(path):
        if i < len(path) - 1:
            rel = G.edges[nid, path[i+1]].get("relation", "")
            print(f"{G.nodes[nid].get('label')} --{rel}-->")
        else:
            print(G.nodes[nid].get("label"))
except nx.NetworkXNoPath:
    print("No path found")

print("\n=== What This Means ===")
print("- User fills CreateEvent form -> adds to useEvents() context")
print("- User navigates to /registry -> views events via useEvents()")
print("- User clicks event -> navigates to /registry/:id (Logistics)")
print("- Logistics reads event details from useEvents() context")