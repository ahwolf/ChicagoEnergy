var Network = function () {

    var Node = function (network, id) {

	// make a fresh object
	var self = DsA.VisualItem(network, id);
	self.edges = {};
	self.type = 'node';
	return self;
    };

    var Edge = function (network, id, start_node, end_node) {

	// make a fresh object
	var self = DsA.VisualItem(network, id);
	self.start_node = start_node;
	self.end_node = end_node;
	self.type = 'edge';

	self.endpoint_coordinates = function () {
	    var start_node = self.start_node,
	        end_node = self.end_node,
	        start_radius = start_node.get_attr("symbol")["r"],
	        end_radius = end_node.get_attr("symbol")["r"],
	        scx = start_node.get_attr("symbol")["cx"],
	        scy = start_node.get_attr("symbol")["cy"],
	        ecx = end_node.get_attr("symbol")["cx"],
	        ecy = end_node.get_attr("symbol")["cy"],
	        dx = ecx - scx,
	        dy = ecy - scy,
	        d = Math.sqrt(dx*dx+dy*dy);
	    return {
		"x1": scx + dx * start_radius / d,
		"y1": scy + dy * start_radius / d,
		"x2": ecx - dx * end_radius / d,
		"y2": ecy - dy * end_radius / d
	    };
	};

	self.path = function () {
	    var p = self.endpoint_coordinates();
	    return "M" + p.x1 + " " + p.y1 + "L" + p.x2 + " " + p.y2;
	};

	self.update = function () {
	    self.elements["symbol"].attr({"path": self.path()}).attr(self.get_attr("edge"));
	    return self;
	};

	// a hack to get the network working quickly
	self.draw = function () {
	    self.elements["symbol"] = self.container.canvas.path();
	    self.update();
	    return false;
	};


	return self;
    };

    var Undirected = function(id, json) {

	// make a fresh object
	var self = DsA.Visual(id),
	    i;

	self.graphic_type = {
	    "symbol": 'circle',
	    "label": 'text',
	    "inner_halo": 'circle',
	    "label_background": 'text'
	};
	self.graphic_type_order = ["inner_halo","symbol","label_background","label"];

	self.set_default_attr("symbol", {
	    "r": 10,
	    "stroke": "black",
	    "stroke-width": 1,
	    "fill-opacity": 0.5,
	    "fill": "blue"
	});

	self.set_default_attr("label", {
	    "x": 50,
	    "y": 50,
	    "fill": "rgb(80,80,80)",
	    "text": "",
	    "font-size": 11
	});

	self.set_default_attr("label_background", {
	    "stroke": "white",
	    "stroke-width": 3,
	    "fill": "white",
	    "font-size": 11
	});

	self.set_default_attr("inner_halo", {
	    "stroke":"black",
	    "stroke-width":4,
	    "stroke-opacity":1.0,
	    "fill":"none"
	});

	// 	"inner_halo": {
	// 	    "cx": self.cx,
	// 	    "cy": self.cy,
	// 	    "r": self.r + 0.5 * ___stroke_width + 0.5 * ___inner_halo_thickness,
	// 	    "stroke": ___inner_halo_color,
	// 	    "stroke-width": ___inner_halo_thickness,
	// 	    "fill": null,
	// 	    "stroke-opacity": ___inner_halo_opacity
	// 	},


	self.set_default_visibility("symbol", true);
	self.set_default_tag_visibility("symbol", "H", true);
	self.set_default_tag_visibility("symbol", "H__11", true);
	self.set_default_tag_visibility("symbol", "H__1M", true);
	self.set_default_tag_visibility("symbol", "H__M1", true);
	self.set_default_tag_visibility("symbol", "H__MM", true);
	self.set_default_tag_visibility("symbol", "S", true);
	self.set_default_tag_visibility("symbol", "S__11", true);
	self.set_default_tag_visibility("symbol", "S__1M", true);
	self.set_default_tag_visibility("symbol", "S__M1", true);
	self.set_default_tag_visibility("symbol", "S__MM", true);

	self.set_default_tag_attr("symbol", "H", {});
	self.set_default_tag_attr("symbol", "H__11", {});
	self.set_default_tag_attr("symbol", "H__1M", {});
	self.set_default_tag_attr("symbol", "H__M1", {});
	self.set_default_tag_attr("symbol", "H__MM", {});
	self.set_default_tag_attr("symbol", "S", {"fill-opacity":1.0});
	self.set_default_tag_attr("symbol", "S__11", {"fill-opacity":1.0});
	self.set_default_tag_attr("symbol", "S__1M", {"fill-opacity":1.0});
	self.set_default_tag_attr("symbol", "S__M1", {"fill-opacity":1.0});
	self.set_default_tag_attr("symbol", "S__MM", {"fill-opacity":1.0});

	self.set_default_interactivity("symbol", true);

	self.set_default_visibility("label", false);
	self.set_default_tag_visibility("label", "H", true);
	self.set_default_tag_visibility("label", "H__11", true);
	self.set_default_tag_visibility("label", "H__1M", false);
	self.set_default_tag_visibility("label", "H__M1", false);
	self.set_default_tag_visibility("label", "H__MM", false);
	self.set_default_tag_visibility("label", "S", true);
	self.set_default_tag_visibility("label", "S__11", true);
	self.set_default_tag_visibility("label", "S__1M", false);
	self.set_default_tag_visibility("label", "S__M1", false);
	self.set_default_tag_visibility("label", "S__MM", false);

	self.set_default_interactivity("label", true);

	self.set_default_visibility("inner_halo", false);

	self.set_default_tag_visibility("inner_halo", "H", true);
	self.set_default_tag_visibility("inner_halo", "H__11", true);
	self.set_default_tag_visibility("inner_halo", "H__1M", true);
	self.set_default_tag_visibility("inner_halo", "H__M1", true);
	self.set_default_tag_visibility("inner_halo", "H__MM", true);
	self.set_default_tag_visibility("inner_halo", "S", false);
	self.set_default_tag_visibility("inner_halo", "S__11", false);
	self.set_default_tag_visibility("inner_halo", "S__1M", false);
	self.set_default_tag_visibility("inner_halo", "S__M1", false);
	self.set_default_tag_visibility("inner_halo", "S__MM", false);

	self.set_default_tag_attr("inner_halo", "H", {});
	self.set_default_tag_attr("inner_halo", "H__11", {});
	self.set_default_tag_attr("inner_halo", "H__1M", {});
	self.set_default_tag_attr("inner_halo", "H__M1", {});
	self.set_default_tag_attr("inner_halo", "H__MM", {});
	self.set_default_tag_attr("inner_halo", "S", {});
	self.set_default_tag_attr("inner_halo", "S__11", {});
	self.set_default_tag_attr("inner_halo", "S__1M", {});
	self.set_default_tag_attr("inner_halo", "S__M1", {});
	self.set_default_tag_attr("inner_halo", "S__MM", {});

	self.set_default_interactivity("inner_halo", false);

	self.set_default_visibility("label_background", false);

	self.set_default_tag_visibility("label_background", "H", true);
	self.set_default_tag_visibility("label_background", "H__11", true);
	self.set_default_tag_visibility("label_background", "H__1M", false);
	self.set_default_tag_visibility("label_background", "H__M1", false);
	self.set_default_tag_visibility("label_background", "H__MM", false);
	self.set_default_tag_visibility("label_background", "S", true);
	self.set_default_tag_visibility("label_background", "S__11", true);
	self.set_default_tag_visibility("label_background", "S__1M", false);
	self.set_default_tag_visibility("label_background", "S__M1", false);
	self.set_default_tag_visibility("label_background", "S__MM", false);

	self.set_default_interactivity("label_background", true);


	var nodes=json["nodes"], // [nodeA, nodeB, ...]
	    edges=json["edges"], // [[nodeA, nodeB], [nodeB, nodeQ], ...]
	    node_attrs=json["node_attrs"], // {"fill": {nodeA: fillA,
                                           //           nodeB: fillB},
                                           //  "boner": {nodeB: swB}}
	    edge_attrs=json["edge_attrs"], // {"weight": {edgekeyA: wA,
                                           //             edgekeyB: wB},
                                           //  "stroke-width": {edgekeyB: swB}}
	    node_default_attrs=json["node_default_attrs"], // {"fill": "black",
                                                           //  "boner": "maybe"}
	    edge_default_attrs=json["edge_default_attrs"], // {"weight": 1,
	                                                   //  "stroke": "red",
	                                                   //  "deansuck": true}
	    node_type=json["node_type"]; // Node

	// all other keys in data dictionary are optional, set the
	// defaults to an empty dictionary if that key is not given
	var node_attrs = node_attrs || {};
	var edge_attrs = edge_attrs || {};
	var node_default_attrs = node_default_attrs || {
	    "fill": "rgb(0,0,75)",
	    "fill-opacity": 0.5,
	    "stroke": null
	};
	var edge_default_attrs = edge_default_attrs || {
	    "stroke": "black",
	    "stroke-opacity": 0.5,
	    "stroke-width": 3
	};

	self.halo_thickness = json["halo_thickness"] || 5;
	self.halo_thickness = json["halo_thickness"] || 5;

	self.set_default_attr("edge", edge_default_attrs);

	self.item_attrs["symbol"] = node_attrs;
	self.set_default_attr("symbol", node_default_attrs);

	self.add_node = function (id, node_type) {
	    node_type = node_type || Node;
	    var node = node_type(self, id);
	    self.nodes[id] = node;
	    self.items[id] = node;
	    return node;
	};

	self.edge_order = function (start_id, end_id) {
	    var start_int = parseInt(start_id);
	    var end_int = parseInt(end_id);
	    if (isNaN(start_int) || isNaN(end_int)) {
		start_int = start_id;
		end_int = end_id;
	    };
	    if (start_int <= end_int) {
		return [start_id, end_id];
	    }
	    else {
		return [end_id, start_id];
	    };
	};

	self.edge_key = function (start_id, end_id) {
	    var ordered = self.edge_order(start_id, end_id);
	    return ordered[0] + "-" + ordered[1];
	};

	self.add_edge = function (start_id, end_id) {
	    var ordered = self.edge_order(start_id, end_id),
	        edge_id = self.edge_key(start_id, end_id),
	        start_node = self.nodes[ordered[0]],
	        end_node = self.nodes[ordered[1]],
	        edge = Edge(self, edge_id, start_node, end_node);
	    start_node.edges[end_node.id] = edge;
	    end_node.edges[start_node.id] = edge;
	    self.edges[edge_id] = edge;
	    return edge;
	};

	self.remove_edge = function (start_id, end_id) {
	    var start_node = self.nodes[start_id],
	        end_node = self.nodes[end_id],
	        edge_id = self.edge_key(start_id, end_id),
	        edge = self.edges[edge_id];
	    delete start_node.links[end_node.id];
	    delete end_node.links[start_node.id];
	    edge.elements["symbol"].remove();
	    delete self.edges[edge_id];
	};
	self.add_edges = function (edges) {
	    var i, edge;
	    for (i in edges) {
		edge = self.add_edge(edges[i][0],edges[i][1]);
	    };
	};
	self.remove_edges = function (edges) {
	    for (var i in edges) {
		self.remove_edge(edges[i][0],edges[i][1]);
	    };
	};

	self.draw = function (canvas) {
	    self.canvas = canvas;
	    var i;
	    for (i in self.edges) {
	    	self.edges[i].draw(canvas);
	    };
	    for (i in self.nodes) {
		self.nodes[i].draw(canvas);
	    };
	    return self;
	};

	self.update = function () {

	    var i, node;
	    for (i in self.nodes) {
		node = self.nodes[i];
		node.set_attr("label", {
		    "x":node.get_attr("symbol")["cx"],
		    "y":node.get_attr("symbol")["cy"] - node.get_attr("symbol")["r"] - 0.5 * node.get_attr("label")["font-size"],
		    "text":self.item_attrs["symbol"]["label"][node.id]
		});
		node.set_attr("label_background", {
		    "x":node.get_attr("symbol")["cx"],
		    "y":node.get_attr("symbol")["cy"] - node.get_attr("symbol")["r"] - 0.5 * node.get_attr("label")["font-size"],
		    "text":self.item_attrs["symbol"]["label"][node.id]
		});
		node.set_attr("inner_halo", {
			"cx":node.get_attr("symbol")["cx"],
			"cy":node.get_attr("symbol")["cy"],
			"r":(node.get_attr("symbol")["r"]+2)
		    });
		node.update();
	    };

	    var i, edge;
	    for (i in self.edges) {
		edge = self.edges[i];
		edge.update();
	    };

	    return self;
	};

	// nodes is required, throw error if not given
	var node, cx, cy, r, symbol_attrs;
	if (nodes === undefined) {
	    throw("missing required argument 'nodes' in Undirected");
	} else {
	    self.nodes = {};
	    for (i in nodes) {
		node = self.add_node(nodes[i], node_type);
	    };
	};

	self.update();

	// edges is also required, throw error if not given
	var edge;
	if (edges === undefined) {
	    throw("missing required argument 'edges' in Undirected");
	} else {
	    self.edges = {};
	    for (i in edges) {
		if (edges[i][0] == edges[i][1]) {
		    throw("Undirected assumes NO self-links");
		};
		edge = self.add_edge(edges[i][0], edges[i][1]);
	    };
	};	
	

	return self;
    };
    
    return {
	"Node": Node,
	"Edge": Edge,
	"Undirected": Undirected
    };
}();

