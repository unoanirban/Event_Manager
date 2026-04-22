import json
from networkx.readwrite import json_graph
from pathlib import Path

data = json.loads(Path("C:/Users/Soumen Adhikary/OneDrive/Desktop/Scripto India/TCG/Event_Manager/Event_Manager/graphify-out/graph.json").read_text())
G = json_graph.node_link_graph(data, edges="links")

print("All edges in graph:")
for u, v in G.edges():
    rel = G.edges[u, v].get("relation", "")
    conf = G.edges[u, v].get("confidence", "")
    u_label = G.nodes[u].get("label", u)
    v_label = G.nodes[v].get("label", v)
    print(f"  {u_label} --{rel}--> {v_label}")