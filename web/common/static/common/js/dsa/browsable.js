var Network = function () {

    function type_of(value) {
	var s = typeof value;
	if (s === 'object') {
	    if (value) {
		if (typeof value.length === 'number' &&
                    !(value.propertyIsEnumerable('length')) &&
                    typeof value.splice === 'function') {
		    s = 'array';
		}
	    } else {
		s = 'null';
	    }
	}
	return s;
    };

    // -------------------------------------------------------------------- Node
    function Node(network, id) {
	this.network = network;
	this.id = id;
	this.links = {};
    };
    Node.prototype.attr = function () {
	return this.network.attr("node", this.id, arguments);
    };
    Node.prototype.halo_thickness = function () {
	// return Math.log(this.attr("r")) + 1;
	return 3;
    };
    Node.prototype.label_xy = function () {
	return {
	    "x": this.attr("cx"),
	    "y": this.attr("cy") - this.attr("r") - 2*this.halo_thickness() - this.label_size/2};
    };
    Node.prototype.searchlight_halo = function () {
	if (this.search_halo === undefined) {
	    var halo_thickness = this.halo_thickness();
	    this.search_halo = this.network.canvas.circle(
	        this.attr("cx"),
		this.attr("cy"),
		this.attr("r") + 0.5 * halo_thickness 
	    ).attr({
	        "fill": null,
		"stroke": this.network.searchlight_color,
		"stroke-width": halo_thickness,
		"stroke-opacity": this.network.searchlight_opacity
  	    }).insertAfter(this.network.background);
	} else {
	    // this.search_halo.show();
	    // this.search_halo.attr("stroke-opacity", 0.3);
	    this.search_halo.animate({"stroke-opacity":this.network.searchlight_opacity},this.network.fadein_time);
	};
    };
    Node.prototype.searchlight = function (halo) {
	if (halo===undefined || halo===true) {
	    this.searchlight_halo();
	};
	this.show_label();
    };
    Node.prototype.unsearchlight = function () {
	// this.search_halo.hide();
	if (this.search_halo!==undefined) {
	    this.search_halo.animate({"stroke-opacity":0.0},this.network.fadeout_time);
	};
	if (this.network.selected_node !== this.id) { 
	    if (this.network.selected_edge === null) {
		this.hide_label();
	    } else if (this.network.edges[this.network.selected_edge].start_node.id !== this.id &&
		       this.network.edges[this.network.selected_edge].end_node.id !== this.id) {
		this.hide_label();
	    };
	};
    };
    Node.prototype.mouseover = function () {
	this.searchlight();
	return false;
    };
    Node.prototype.mouseout = function () {
	this.unsearchlight();
	return false;
    };
    Node.prototype.spotlight_halo = function () {
	if (this.spot_halo === undefined) {
	    var halo_thickness = this.halo_thickness();
	    this.spot_halo = this.network.canvas.circle(
	        this.attr("cx"),
		this.attr("cy"),
		this.attr("r") + 1.5 * halo_thickness
	    ).attr({
	        "fill": null,
		"stroke": this.network.spotlight_color,
		"stroke-width": halo_thickness,
		"stroke-opacity": this.network.spotlight_opacity
	    }).insertAfter(this.network.background);
	} else {
	    // this.spot_halo.show();
	    // this.spot_halo.attr("stroke-opacity", 0.3);
	    this.spot_halo.animate({"stroke-opacity":this.network.spotlight_opacity},this.network.fadein_time);
	};
    };
    Node.prototype.spotlight = function (halo) {
	if (halo===undefined || halo===true) {
	    this.spotlight_halo();
	};
	this.show_label();
    };
    Node.prototype.unspotlight = function () {
	// this.spot_halo.hide();
	if (this.spot_halo!==undefined) {
	    this.spot_halo.animate({"stroke-opacity":0.0},this.network.fadeout_time);
	};
	this.hide_label();
	this.network.selected_node = null;
    };
    Node.prototype.mousedown = function () {
	// remove the current selection if this is not the current selection
	if (this.network.selected_node !== null && this.id !== this.network.selected_node) {
	    this.network.nodes[this.network.selected_node].unspotlight();
	};
	return false;
    };
    Node.prototype.click = function () {	
	// can only select one element at a time
	if (this.network.selected_edge !== null) { 
	    this.network.edges[this.network.selected_edge].unspotlight();
	};
	if (this.network.selected_node !== this.id) {
	    if (this.network.selected_node !== null) {
		this.network.nodes[this.network.selected_node].unspotlight();
	    };
	    this.network.ego_layout(this.id, 500, ">");
	    // this.spotlight();
	    this.network.selected_node = this.id;
	};
	return false;
    };
    // Node.prototype.create_label = function (raphael, text, label_size) {
    Node.prototype.create_label = function (raphael, label_size, text) {

	this.label_size = label_size || 14;
	var label_xy = this.label_xy();
	var cx = label_xy["x"];
	var cy = label_xy["y"];
	this.label = raphael.set();
	this.label_set = raphael.set();
	this.label_set.push(this.label);
	var tmp = text || this.attr("label");
	var txtBack = raphael.text(cx, cy, tmp);
	txtBack.attr({
	    "font-size":this.label_size,
	    "font-family":"arial",
	    "fill": this.network.background_color,
	    "stroke": this.network.background_color,
	    "stroke-width": 3
	});
	var txt = raphael.text(cx, cy, tmp);
	txt.attr({
	    "font-size":this.label_size,
	    "font-family":"arial",
	    "fill": this.network.label_color
	});
	this.fore_label = txt;
	this.back_label = txtBack;
	this.label.push(txtBack);
	this.label.push(txt);
	this.label.attr("opacity",0.0);
	this.label_set.insertBefore(this.network.background);
    };
    Node.prototype.hide_label = function () {
	// var bkg = this.network.background;
	// this.label_set.animate({"opacity":0.0},this.network.fadeout_time, function () { this.insertBefore(bkg);
	//     });
	this.label_set.insertBefore(this.network.background);
	this.label_set.animate({"opacity":0.0},this.network.fadeout_time);
    };
    Node.prototype.show_label = function () {
	this.label.attr(this.label_xy());
	this.label_set.insertAfter(this.element);
	this.label_set.animate({"opacity":1.0},this.network.fadein_time);
    };
    Node.prototype.getBBox = function () {

	// get bbox of node and deal with stroke width
	var bbox1 = this.element.getBBox();
	var sw = this.element.attr("stroke-width");
	bbox1.x -= 0.5*sw;
	bbox1.y -= 0.5*sw;
	bbox1.width += sw;
	bbox1.height += sw;
	
	// deal with halo
	var ht = this.halo_thickness();
	bbox1.width = bbox1.width + 4*ht;
	bbox1.height = bbox1.height + 4*ht;
	bbox1.x = bbox1.x - 2*ht;
	bbox1.y = bbox1.y - 2*ht;

	// now deal with label 
	//
	// XXXX THIS IS A HACK THAT TAKES ADVANTAGE OF KNOWN LABEL
	// PLACEMENT ABOVE
	var bbox2 = this.label.getBBox();
	sw = this.back_label.attr("stroke-width");
	bbox2.x -= 0.5*sw;
	bbox2.y -= 0.5*sw;
	bbox2.width += sw;
	bbox2.height += sw;
	if (bbox1.width>bbox2.width) {
	    var x = bbox1.x,
		w = bbox1.width;
	} else {
	    var x = bbox2.x,
		w = bbox2.width;
	};
	var y = bbox2.y,
	h = bbox1.y - bbox2.y + bbox1.height;

	return {"x":x,"y":y,"width":w,"height":h};
    };
    Undirected.prototype.twopi = function (ego_node_id) {
	
	var distance = {};
	var parent = {};
	var children = {};
	var angle = {};
	var size = {};
	var unvisited = [];
	var visited = [];
	var node_id, neighbor_id, i, j;
	
	distance[ego_node_id] = 0;
	unvisited.push(ego_node_id);
	
	// depth feirst search
	var max_distance = 0;
	while (unvisited.length) {
	    node_id = unvisited.shift();
	    visited.push(node_id);
	    for (neighbor_id in this.nodes[node_id].links) {
		if (!(neighbor_id in distance)) {
		    distance[neighbor_id] = distance[node_id] + 1;
		    parent[neighbor_id] = node_id;
		    unvisited.push(neighbor_id);
		    if (distance[neighbor_id] > max_distance) {
			max_distance = distance[neighbor_id];
		    };
		};
	    };
	};

	for (edge_id in this.edges) {
	    this.edges[edge_id].element.attr("stroke-opacity", 0.0);
	};

	for (node_id in this.nodes) {
	    if (distance[node_id] <= 2) {
		for (neighbor_id in this.nodes[node_id].links) {
		    if (distance[neighbor_id] <= 2) {
			this.nodes[node_id].links[neighbor_id].element.attr("stroke-opacity", 0.1);
		    };
		};
	    };
	};

	for (node_id in parent) {
	    this.nodes[node_id].links[parent[node_id]].element.attr("stroke-opacity", 0.9);
	};
	
	// for (var i in this.edges) {
	//     // this.edges[i].attr("stroke-opacity", 0,1);
	//     this.edges[i].element.attr("stroke-opacity", 0.1);
	// };

	
	for (node_id in parent) {
	    this.nodes[node_id].links[parent[node_id]].element.attr("stroke-opacity", 0.9);
	};
		
	// create the spanning tree
	for (child_id in parent) {
	    if (parent[child_id] in children) {
		children[parent[child_id]].push(child_id);
	    } else {
		children[parent[child_id]] = [child_id];
	    };
	};
	
	// count the number of leaves in each subtree
	function count_leaves (node_id) {
	    if (!(node_id in children)) {
		size[node_id] = 1;
		return 1;
	    } else {
		size[node_id] = 0;
		for (var i in children[node_id]) {
		    size[node_id] += count_leaves(children[node_id][i]);
		};
		return size[node_id];
	    };
	};
	count_leaves(ego_node_id);
	
	angle[ego_node_id] = 2 * Math.PI;
	for (j in visited) {
	    node_id = visited[j];
	    i = parent[node_id];
	    if (i != undefined) {
		angle[node_id] = angle[i] * size[node_id] / size[i];
	    };
	};
	
	var theta = {};
	var big_theta;
	theta[ego_node_id] = Math.PI;
	for (j in visited) {
	    node_id = visited[j];
	    if (node_id == ego_node_id) {
		big_theta = 0;
	    } else {
		big_theta = theta[node_id] - 0.5 * angle[node_id];
	    };
	    for (i in children[node_id]) {
		child_id = children[node_id][i];
		theta[child_id] = big_theta + 0.5 * angle[child_id];
		big_theta += angle[child_id];
	    };
	};
	var x = {};
	var y = {};
	for (i in visited) {
	    node_id = visited[i];
	    	// x[node_id] = theta[node_id];
	    	// y[node_id] = distance[node_id];
	    // x[node_id] = Math.pow(distance[node_id], 0.33) * Math.cos(theta[node_id]);
	    // y[node_id] = Math.pow(distance[node_id], 0.33) * Math.sin(theta[node_id]);
	    x[node_id] = distance[node_id] * Math.cos(theta[node_id]);
	    y[node_id] = distance[node_id] * Math.sin(theta[node_id]);
	    // 	x[node_id] = 0.5*Math.pow(distance[node_id], 0.5) * Math.cos(theta[node_id]);
	    // 	y[node_id] = 0.5*Math.pow(distance[node_id], 0.5) * Math.sin(theta[node_id]);
	    // 	x[node_id] = 0.15*distance[node_id] * Math.cos(theta[node_id]);
	    // 	y[node_id] = 0.15*distance[node_id] * Math.sin(theta[node_id]);
	};
	//     print_object("x", x);
	//     print_object("y", y);
	
	//     return distance;
	return [x, y, distance, max_distance];
    }
    Undirected.prototype.ego_layout = function (ego_node_id, anim_speed, anim_type)
    {
	//     var distance = this.twopi(ego_node_id);
	var z = this.twopi(ego_node_id);
	var xs = z[0];
	var ys = z[1];
	var d = z[2];
	var md = z[3];
	var node_id, theta=0, dtheta, cx=300, cy=300, r=135, x, y, edge_id, edge;
	dtheta = 2*Math.PI / this.n_nodes();

	for (node_id in this.nodes) {
	    x = cx + r * xs[node_id];
	    y = cy + r * ys[node_id];
	    // if (d[node_id] > 2) {
	    // 	this.nodes[node_id].attr("fill", "rgb(255,75,0)");
	    // };
	    
	    // 	x = cx + r * xs[node_id] - 200;
	    // 	y = cy + 0.2 * r * ys[node_id] - 200;
	    this.nodes[node_id].attr("cx", x);
	    this.nodes[node_id].attr("cy", y);
	    if (anim_speed) {
		this.nodes[node_id].element.animate({"cx":x,"cy":y,"x":x,"y":y},
						    anim_speed, anim_type);
	    } else {
		this.nodes[node_id].element.attr({"cx":x,"cy":y,"x":x,"y":y});
	    };
	    theta += dtheta;
	    this.nodes[node_id].show_label();
	};

	for (edge_id in this.edges) {
	    edge = this.edges[edge_id];
	    if (anim_speed) {
		edge.element.animate({"path": edge.path()},
				     anim_speed, anim_type);
	    } else {
		edge.element.attr({"path": edge.path()});
	    };
	};
	return [r, md];
    };
    Node.prototype.draw = function (raphael)
    {
	// draw the circle and set attributes
	this.element = raphael.circle(this.attr("cx"),
				      this.attr("cy"),
				      this.attr("r")).attr(this.attr());

	// add label, if it exists
	this.create_label(raphael, 8);

	// // mouseover
	// this.element.mouseover(function (node) {
	//     return function (event) {
	// 	return node.mouseover();
	//     };
	// }(this));

	// // mouseout
	// this.element.mouseout(function (node) {
	//     return function (event) {
	// 	return node.mouseout();
	//     };
	// }(this));

	// // mousedown
	// this.element.mousedown(function (node) {
	//     return function (event) {
	// 	return node.mousedown();
	//     };
	// }(this));

	// click
	this.element.click(function (node) {
	    return function (event) {
		return node.click();
	    };
	}(this));
	
	return this.element;
    };

    // -------------------------------------------------------------------- Edge
    function Edge(id, start_node, end_node) {
	this.id = id;
	this.start_node = start_node;
	this.end_node = end_node;
	this.network = this.start_node.network;
    };
    Edge.prototype.toString = function () {
	return this.id;
    };
    Edge.prototype.attr = function () {
	return this.start_node.network.attr("edge", this.id, arguments);
    };
    Edge.prototype.halo_thickness = function () {
	// if (this.element.attr("stroke-width")) {
	//     return Math.log(this.element.attr("stroke-width")) + 1;
	// } else {
	//     return 1;
	// };
	return 3;
    };
    Edge.prototype.searchlight_halo = function () {
	var t = this.halo_thickness(),
	r1 = this.start_node.attr("r")+0.5*t,
	r2 = this.end_node.attr("r")+0.5*t,
	p = this.halo_path(0.5*t, r1, r2);
	if (this.search_halo === undefined) {
	    this.search_halo = this.network.canvas.path(p);
	    this.search_halo.insertAfter(this.network.background);
	    this.search_halo.attr({
  		    "stroke": this.network.searchlight_color,
		    "stroke-opacity": this.network.searchlight_opacity,
		    "stroke-width": t
			});
	} else {
	    this.search_halo.attr({"path":p});
	    this.search_halo.animate({"stroke-opacity":this.network.searchlight_opacity},this.network.fadein_time);
	};
    };
    Edge.prototype.unsearchlight_halo = function () {
	this.search_halo.animate({"stroke-opacity":0.0},this.network.fadeout_time);
    };
    Edge.prototype.searchlight = function () {
	this.searchlight_halo();
	this.start_node.searchlight(false);
	this.end_node.searchlight(false);
    };
    Edge.prototype.unsearchlight = function () {
	this.unsearchlight_halo();
	this.start_node.unsearchlight();
	this.end_node.unsearchlight();
    };
    Edge.prototype.mouseover = function () {
	this.searchlight();
	return false;
    };
    Edge.prototype.mouseout = function () {
	this.unsearchlight();
	return false;
    };
    Edge.prototype.spotlight_halo = function () {
	var t = this.halo_thickness(),
	r1 = this.start_node.attr("r")+1.5*t,
	r2 = this.end_node.attr("r")+1.5*t,
	p = this.halo_path(1.5*t, r1, r2);
	if (this.spot_halo === undefined) {
	    this.spot_halo = this.network.canvas.path(p);
	    this.spot_halo.insertAfter(this.network.background);
	    this.spot_halo.attr({
  		    "stroke": this.network.spotlight_color,
		    "stroke-opacity": this.network.spotlight_opacity,
		    "stroke-width": t
			});
	} else {
	    this.spot_halo.attr({"path":p});
	    this.spot_halo.animate({"stroke-opacity":this.network.spotlight_opacity},this.network.fadein_time);
	};
    };
    Edge.prototype.unspotlight_halo = function () {
	this.spot_halo.animate({"stroke-opacity":0},this.network.fadeout_time);
    };
    Edge.prototype.spotlight = function () {
	this.spotlight_halo();
	this.start_node.spotlight(false);
	this.end_node.spotlight(false);
	// this.start_node.show_label();
	// this.end_node.show_label();
    };
    Edge.prototype.unspotlight = function () {
	// this.spot_halo.hide();
	this.unspotlight_halo();
	this.start_node.unspotlight();
	this.end_node.unspotlight();
	// this.start_node.hide_label();
	// this.end_node.hide_label();
	this.network.selected_edge = null;
    };
    Edge.prototype.mousedown = function () {
	// remove the current selection if this is not the current selection
	if (this.network.selected_edge !== null && this.id !== this.network.selected_edge) {
	    this.network.edges[this.network.selected_edge].unspotlight();
	};
	return false;
    };
    Edge.prototype.click = function () {
	// can only select one element at a time
	if (this.network.selected_node !== null) { 
	    this.network.nodes[this.network.selected_node].unspotlight();
	};
	if (this.network.selected_edge !== this.id) {
	    if (this.network.selected_edge !== null) {
		this.network.edges[this.network.selected_edge].unspotlight();
	    };
	    this.spotlight();
	    this.network.selected_edge = this.id;
	};
	return false;
    };
    Edge.prototype.endpoint_coordinates = function (start_radius, end_radius) {
	start_radius = start_radius || this.start_node.attr("r");
	end_radius = end_radius || this.end_node.attr("r");
	var dx = this.end_node.attr("cx") - this.start_node.attr("cx");
	var dy = this.end_node.attr("cy") - this.start_node.attr("cy");
	var d = Math.sqrt(dx*dx+dy*dy);
	var x1 = this.start_node.attr("cx") + dx * start_radius / d;
	var y1 = this.start_node.attr("cy") + dy * start_radius / d;
	var x2 = this.end_node.attr("cx") - dx * end_radius / d;
	var y2 = this.end_node.attr("cy") - dy * end_radius / d;
	return {"x1": x1, "y1": y1, "x2": x2, "y2": y2};
    };
    Edge.prototype.halo_coordinates_helper = function (t, start_radius, end_radius) {
	start_radius = start_radius || this.start_node.attr("r");
	end_radius = end_radius || this.end_node.attr("r");
	var p = this.endpoint_coordinates(start_radius, end_radius);
	if (p.y2!==p.y1) {
	    var mprime = - (p.x2 - p.x1)/(p.y2 - p.y1),
		dx = Math.sqrt(t*t/(1+mprime*mprime)),
		x1p = p.x1 + dx,
		x1n = p.x1 - dx,
		x2p = p.x2 + dx,
		x2n = p.x2 - dx;
    	    return {
	        1: {
		    "x1":x1p,
		    "y1":p.y1+mprime*(x1p-p.x1),
		    "x2":x2p,
		    "y2":p.y2+mprime*(x2p-p.x2),
		},
	        2:{
		    "x1":x1n,
		    "y1":p.y1+mprime*(x1n-p.x1),
		    "x2":x2n,
		    "y2":p.y2+mprime*(x2n-p.x2),
	        }
	    };
	} else {
	    var dx = t,
		x1p = p.x1,
		x1n = p.x1,
		x2p = p.x2,
		x2n = p.x2;
    	    return {
	        1: {
		    "x1":x1p,
		    "y1":p.y1+dx,
		    "x2":x2p,
		    "y2":p.y2+dx,
		},
	        2:{
		    "x1":x1n,
		    "y1":p.y1-dx,
		    "x2":x2n,
		    "y2":p.y2-dx,
	        }
	    };
	};
    };
    Edge.prototype.halo_coordinates = function (t, start_radius, end_radius) {
	start_radius = start_radius || this.start_node.attr("r");
	end_radius = end_radius || this.end_node.attr("r");
	var rs = {1:start_radius, 2:end_radius},
	us = {1:this.start_node.attr("cx"),2:this.end_node.attr("cx")},
	vs = {1:this.start_node.attr("cy"),2:this.end_node.attr("cy")},
	tt = t+0.5*this.element.attr("stroke-width"),
	p = this.halo_coordinates_helper(tt,
					 start_radius,end_radius);
	var i, j, r, x, y, x1, y1, x2, y2, dx, dy, dr, D, delta, 
	result={1:{},2:{},"r1":start_radius,"r2":end_radius},pp={};
	for (i=1;i<=2;i++) {

	    // translate to (0,0) centered circle
	    for (j=1;j<=2;j++) {
		r = rs[j];
		pp["x1"] = p[i].x1-us[j];
		pp["y1"] = p[i].y1-vs[j];
		pp["x2"] = p[i].x2-us[j];
		pp["y2"] = p[i].y2-vs[j];
		
		// see http://mathworld.wolfram.com/Circle-LineIntersection.html
		dx = pp.x2 - pp.x1;
		dy = pp.y2 - pp.y1;
		dr = Math.sqrt(dx*dx+dy*dy);
		D = pp.x1*pp.y2 - pp.x2*pp.y1;
		delta = r*r*dr*dr - D*D;
		if (delta<0) {
		    r = tt;
		    result["r"+j] = r;
		    result[i]["x"+j] = D*dy/(dr*dr) + us[j];
		    result[i]["y"+j] = -D*dx/(dr*dr) + vs[j];
		} else if (delta===0){
		    result[i]["x"+j] = D*dy/(dr*dr) + us[j];
		    result[i]["y"+j] = -D*dx/(dr*dr) + vs[j];
		} else {
		    var sgn=1,xs={},ys={}, k, d, kmin, ddx, ddy,
					       dmin=Number.POSITIVE_INFINITY;
		    if(dy<0) {
			sgn = -1;
		    };
		    for(k=1;k<=2;k++) {
			xs[k] = (D*dy + sgn*Math.pow(-1,k)*dx*Math.sqrt(delta))/(dr*dr);
			ys[k] = (-D*dx + Math.pow(-1,k)*Math.abs(dy)*Math.sqrt(delta))/(dr*dr);
			ddx = xs[k] - pp["x"+j];
			ddy = ys[k] - pp["y"+j];
			d = Math.sqrt(ddx*ddx+ddy*ddy);
			if (d<dmin) {
			    dmin = d;
			    kmin = k;
			};
		    };
		    result[i]["x"+j] = xs[kmin] + us[j];
		    result[i]["y"+j] = ys[kmin] + vs[j];
		};
	    };
	};
	return result;
    };
    Edge.prototype.halo_path = function (t, r1, r2) {
	var p = this.halo_coordinates(t, r1, r2);
	// determine whether to rotate clockwise or counter-clockwise
	var u=[p[1].x2-p[1].x1, p[1].y2-p[1].y1],
	    v=[p[2].x1-p[1].x1, p[2].y1-p[1].y1],
	    cross = u[0]*v[1] - v[0]*u[1],
	    sweep_flag=cross>0?"1":"0";
	return "M"+p[1].x1+" "+p[1].y1+"L"+p[1].x2+" "+p[1].y2+
               "A"+p.r2+" "+p.r2+" 0 1 "+sweep_flag+" "+p[2].x2+" "+p[2].y2+
	       "L"+p[2].x1+" "+p[2].y1+
 	       "A"+p.r1+" "+p.r1+" 0 1 "+sweep_flag+" "+p[1].x1+" "+p[1].y1+"Z";
    };
    Edge.prototype.path = function (start_radius, end_radius) {
	var p = this.endpoint_coordinates(start_radius, end_radius);
	return "M" + p.x1 + " " + p.y1 + "L" + p.x2 + " " + p.y2;
    };
    Edge.prototype.update_draw = function () {
	this.element.attr("path", this.path());
    };
    Edge.prototype.draw = function (raphael) {
	this.element = raphael.path(this.path());
	this.element.attr(this.attr());

	// // mouseover
	// this.element.mouseover(function (edge) {
	//     return function (event) {
	// 	return edge.mouseover();
	//     };
	// }(this));

	// // mouseout
	// this.element.mouseout(function (edge) {
	//     return function (event) {
	// 	return edge.mouseout();
	//     };
	// }(this));

	// // mousedown
	// this.element.mousedown(function (edge) {
	//     return function (event) {
	// 	return edge.mousedown();
	//     };
	// }(this));

	// // click
	// this.element.click(function (edge) {
	//     return function (event) {
	// 	return edge.click();
	//     };
	// }(this));

	return this.element;
    };

    // ------------------------------------------------------------- Undirected
    function Undirected(data) {

	var i,
	    nodes=data["nodes"], // [nodeA, nodeB, ...]
	    edges=data["edges"], // [[nodeA, nodeB], [nodeB, nodeQ], ...]
	    node_attrs=data["node_attrs"], // {"fill": {nodeA: fillA,
                                           //           nodeB: fillB},
                                           //  "boner": {nodeB: swB}}
	    edge_attrs=data["edge_attrs"], // {"weight": {edgekeyA: wA,
                                           //             edgekeyB: wB},
                                           //  "stroke-width": {edgekeyB: swB}}
	    node_default_attrs=data["node_default_attrs"], // {"fill": "black",
                                                           //  "boner": "maybe"}
	    edge_default_attrs=data["edge_default_attrs"]; // {"weight": 1,
	                                                   //  "stroke": "red",
	                                                   //  "deansuck": true}

	this.selected_node = null;
	this.selected_edge = null;
	this.searchlight_color = data["searchlight_color"] || "rgb(255,75,0)";
	this.searchlight_opacity = data["searchlight_opacity"] || 0.3;
	this.spotlight_color = data["spotlight_color"] || "rgb(0,75,255)";
	this.spotlight_opacity = data["spotlight_opacity"] || 0.3;
	this.label_color = data["label_color"] || "black";
	this.background_color = data["background_color"] || "white";
	// this.show_labels = false;
	this.fadein_time = 100; // ms
	this.fadeout_time = 500; // ms
	// this.dim_animation = ">";

	// nodes is required, throw error if not given
	if (nodes === undefined) {
	    throw("missing required argument 'nodes' in Undirected");
	} else {
	    this.nodes = {};
	    for (i in nodes) {
		this.add_node(nodes[i]);
	    };
	};

	// edges is also required, throw error if not given
	if (edges === undefined) {
	    throw("missing required argument 'edges' in Undirected");
	} else {
	    this.edges = {};
	    for (i in edges) {
		this.add_edge(edges[i][0], edges[i][1]);
	    };
	};	
	
	// all other keys in data dictionary are optional, set the
	// defaults to an empty dictionary if that key is not given
	this.node_attrs = node_attrs || {};
	this.edge_attrs = edge_attrs || {};
	this.node_default_attrs = node_default_attrs || {
	    "fill": "rgb(0,0,75)",
	    "fill-opacity": 0.5,
	    "stroke": null
	};
	this.edge_default_attrs = edge_default_attrs || {
	    "stroke": "black",
	    "stroke-opacity": 0.1,
	    "stroke-width": 1
	};
    };
    Undirected.prototype.unspotlight = function () {
	if (this.selected_node !== null) {
	    this.nodes[this.selected_node].unspotlight();
	    this.selected_node = null;
	};
	if (this.selected_edge !== null) {
	    this.edges[this.selected_edge].unspotlight();
	    this.selected_edge = null;
	};
    };
    Undirected.prototype.add_node = function (id)
    {
	var node = new Node(this, id);
	this.nodes[id] = node;
	return node;
    };
    Undirected.prototype.show_labels = function ()
    {
	var i;
	for (i in this.nodes) {
	    this.nodes[i].show_label();
	};
    };
    Undirected.prototype.remove_node = function (id) 
    {
	var i, edge, node = this.nodes[id];

	// remove all links incident on this node
	for (i in this.edges) {
	    edge = this.edges[i];
	    this.remove_edge(edge.start_node.id, edge.end_node.id);
	};
	
	// remove the node
	node.element.remove();
	delete this.nodes[id];
    }
    Undirected.prototype.node_attr_bounds = function (attr) 
    {
	// find min and max attr
	var i, x, xmin=Number.POSITIVE_INFINITY, xmax=Number.NEGATIVE_INFINITY, node;
	for (i in this.nodes) {
	    node = this.nodes[i];
	    x = node.attr(attr);
	    if (x<xmin) {
		xmin = x;
	    };
	    if (x>xmax) {
		xmax = x;
	    };
	};
	return {"min": xmin, "max": xmax};
    };
    Undirected.prototype.node_sizes_by = function (attr, rmin, rmax, xmin, xmax) 
    {
	var i, edge, node, x, r;
	if (xmin==undefined || xmax==undefined) {
	    var bounds = this.node_attr_bounds(attr);
	    xmin = bounds["min"];
	    xmax = bounds["max"];
	};

	// set radius of each node
	for (i in this.nodes) {
	    node = this.nodes[i];
	    x = node.attr(attr);
	    r = Math.sqrt(rmin*rmin + (rmax*rmax-rmin*rmin)*(x-xmin)/(xmax-xmin));
 	    node.element.attr("r", r);
	    node.attr("r", r);
	};

	// reset edge locations
	for (i in this.edges) {
	    edge = this.edges[i];
	    edge.update_draw();
	};
    };
    Undirected.prototype.edge_order = function (start_id, end_id)
    {
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
    Undirected.prototype.edge_key = function (start_id, end_id)
    {
	var ordered = this.edge_order(start_id, end_id);
	return ordered[0] + "-" + ordered[1];
    };
    Undirected.prototype.has_edge = function (start_id, end_id) 
    {
	var key = this.edge_key(start_id, end_id);
	if ( key in this.edges ) {
	    return true;
	};
	return false;
    };
    Undirected.prototype.add_edge = function (start_id, end_id)
    {
	var ordered = this.edge_order(start_id, end_id);
	var edge_id = this.edge_key(start_id, end_id);
	var start_node = this.nodes[ordered[0]] || this.add_node(ordered[0]);
	var end_node = this.nodes[ordered[1]] || this.add_node(ordered[1]);
	var edge = new Edge(edge_id, start_node, end_node);
	start_node.links[end_node.id] = edge;
	end_node.links[start_node.id] = edge;
	this.edges[edge_id] = edge;
	return edge;
    };
    Undirected.prototype.remove_edge = function (start_id, end_id) {
	var start_node = this.nodes[start_id];
	var end_node = this.nodes[end_id];
	var edge_id = this.edge_key(start_id, end_id);
	var edge = this.edges[edge_id];
	delete start_node.links[end_node.id];
	delete end_node.links[start_node.id];
	edge.element.remove();
	delete this.edges[edge_id];
    };
    Undirected.prototype.edge_attr_bounds = function (attr) 
    {
	// find min and max attr
	var i, x, xmin=Number.POSITIVE_INFINITY, xmax=Number.NEGATIVE_INFINITY, edge;
	for (i in this.edges) {
	    edge = this.edges[i];
	    x = edge.attr(attr);
	    if (x<xmin) {
		xmin = x;
	    };
	    if (x>xmax) {
		xmax = x;
	    };
	};
	return {"min": xmin, "max": xmax};
    };
    Undirected.prototype.edge_stroke_widths_by = function (attr, wmin, wmax, xmin, xmax) 
    {
	// find min and max attr
	var i, x, w, edge;
	if (xmin==undefined || xmax==undefined) {
	    var bounds = this.edge_attr_bounds(attr);
	    xmin = bounds["min"];
	    xmax = bounds["max"];
	};

	// set stroke widths
	for (i in this.edges) {
	    edge = this.edges[i];
	    x = edge.attr(attr);
	    w = wmin + (wmax-wmin)*(x-xmin)/(xmax-xmin);
 	    edge.element.attr("stroke-width", w);
	};
    };
    Undirected.prototype.edge_stroke_opacities_by = function (attr, omin, omax, xmin, xmax) 
    {
	// find min and max attr
	var i, x, o, edge;
	if (xmin==undefined || xmax==undefined) {
	    var bounds = this.edge_attr_bounds(attr);
	    xmin = bounds["min"];
	    xmax = bounds["max"];
	};

	// set stroke widths
	for (i in this.edges) {
	    edge = this.edges[i];
	    x = edge.attr(attr);
	    o = omin + (omax-omin)*(x-xmin)/(xmax-xmin);
 	    edge.element.attr("stroke-opacity", o);
	    edge.attr("stroke-opacity", o);
	};
    };
    Undirected.prototype.toString = function () {
	return "network with " + this.n_nodes() + " nodes.";
    };
    Undirected.prototype.n_nodes = function ()
    {
	var node_id, result = 0;
	for (node_id in this.nodes) {
	    result++;
	};
	return result;
    };
    Undirected.prototype.updizzle = function (data) {
	var node_id;
	for (node_id in data["cx"]) {
	    this.nodes[node_id].attr("cx", data["cx"][node_id]);
	    this.nodes[node_id].element.attr("cx", data["cx"][node_id]);
	};
	for (node_id in data["cy"]) {
	    this.nodes[node_id].attr("cy", data["cy"][node_id]);
	    this.nodes[node_id].element.attr("cy", data["cy"][node_id]);
	};
	for (edge_id in this.edges) {
	    this.edges[edge_id].element.attr("path",
					     this.edges[edge_id].path());
	};
    };
    Undirected.prototype.updizzle_animate = function (data) {
	var node_id;
	var anim_speed=1500;
	var anim_type="elastic";
	for (node_id in data["cx"]) {
	    this.nodes[node_id].attr("cx", data["cx"][node_id]);
	    this.nodes[node_id].attr("cy", data["cy"][node_id]);
	    this.nodes[node_id].element.animate({
		    "cx":data["cx"][node_id],
		    "cy":data["cy"][node_id]
		    }, anim_speed, anim_type);
	    this.nodes[node_id].show_label();
	};
	for (edge_id in this.edges) {
	    this.edges[edge_id].element.animate({
		    "path":this.edges[edge_id].path()
		    }, anim_speed, anim_type);
	};
    };
    Undirected.prototype.spring_layout = function () {
	var nodes=[], edges=[];
	for (node_id in this.nodes) {
	    nodes.push(node_id);
	};
	for (edge_id in this.edges) {
	    edges.push(edge_id);
	};
	var send={"nodes":nodes.join(","),"edges":edges.join(",")};
// 	send = {"a": 5};
	$.ajax({
		"url":"/demo/trsi/spring_layout",
		    "data": send,
		    "success":this.updizzle_animate,
		    "dataType": "json",
		    "context": this,
	    });		
    };
    Undirected.prototype.reposition = function (bbox) {
	var id, node, node_bbox, 
	  node_bboxes = {},
	  data = {"cx":{},"cy":{}},
  	  xmin = Number.POSITIVE_INFINITY,
	  xmax = Number.NEGATIVE_INFINITY,
	  ymin = Number.POSITIVE_INFINITY,
	  ymax = Number.NEGATIVE_INFINITY;

	// find bounds of all objects in network
	for (id in this.nodes) {
	    node_bbox = this.nodes[id].getBBox();
	    node_bboxes[id] = node_bbox;
	    xmin = Math.min(node_bbox.x, xmin);
	    xmax = Math.max(node_bbox.x+node_bbox.width, xmax);
	    ymin = Math.min(node_bbox.y, ymin);
	    ymax = Math.max(node_bbox.y+node_bbox.height, ymax);
	};

	// rescale node placement to fit inside bbox
	for (id in this.nodes) {
	    node = this.nodes[id];
	    data["cx"][id] = (node.attr("cx")-xmin)/(xmax-xmin)*bbox.width+bbox.x;
	    data["cy"][id] = (node.attr("cy")-ymin)/(ymax-ymin)*bbox.height+bbox.y;
	};

	// replace nodes/edges
	this.updizzle(data);
    };
    Undirected.prototype.draw = function (raphael)
    {
	var element;
	
// 	create background element
	this.background = raphael.rect(
	    raphael.x, raphael.y,
	    raphael.width, raphael.height
	).attr({
            "fill": this.background_color,
	    "fill-opacity": 0.0,
	    "stroke": null
	    });
	// }).click(function (network) {
	//     return function (event) {
	// 	network.unspotlight();
	//     };
	// }(this));

	this.element = raphael.set();
	
	for (var i in this.edges) {
	    element = this.edges[i].draw(raphael);
	    this.element.push(element);
	};
	for (var i in this.nodes) {
	    element = this.nodes[i].draw(raphael);
	    this.element.push(element);
	};

	this.canvas = raphael;

	return this.element;
    };
    Undirected.prototype.attr = function (element_type, element_id, args) {

	// element_type is either "node" or "edge"

	var attr,
            length="length",
	    has="hasOwnProperty",
	    attrs = this[element_type + "_attrs"],
            default_attrs = this[element_type + "_default_attrs"];

	// no arguments, get attribute dictionary for this element
	if (args[length] == 0) {

	    // will return a dictionary with attrs, values
	    var result = {};

	    // THIS DOES NOT RETURN ELEMENT ATTRIBUTES THAT ARE SPECIFIED
	    // AS DEFAULT -- UNCOMMENT THE FOLLOWING LOOP TO DO SO

	    // for default values, fill these
	    for (var attr in default_attrs) {
		if (default_attrs[has](attr)) {
		    result[attr] = default_attrs[attr];
                };
	    };

	    // over-ride defaults with element-specific values
	    for (var attr in attrs) {
		if (attrs[has](attr)) {
		    if (attrs[attr][has](element_id)) {
			result[attr] = attrs[attr][element_id];
		    };
                };
	    };

	    // return the filled dictionary
	    return result;
	};
	
	// one string argument, get value of attribute
	if (args[length] == 1 && type_of(args[0], "string")) {

	    // first get the element-specific value
	    var result = attrs[args[0]];

	    // if there is no element-specific value, get the default value
	    if (result === undefined) {
		result = default_attrs[args[0]];
	    } else {
		result = result[element_id];
	    };

	    // if there is no element-specific value or default value,
	    // this will be undefined, otherwise it will contain the
	    // value of that attribute
	    return result;
	};

	// one array argument, get node attribute dictionary for those keys
	if (args[length] == 1 && type_of(args[0], "array")) {

	    var i,
                result={},
                value;

	    for (i = 0; i < args[0][length]; i++) {

		// first get the element-specific value
		value = attrs[args[0][i]][element_id];
		
		// if there is no element-specific value, get the default value
		if (value === undefined) {
		    value = default_attrs[args[0][i]];
		};
		
		// set the key, value pair
		result[args[0][i]] = value;
	    };

	    // return a dictionary with specified attrs, values
	    return result;
	};

	// one object argument, set attributes with keys / values
	if (args[length] == 1 && type_of(args[0], "object")) {

	    // set element_attr values
	    for (var i in args[0]) {
		if (args[0][has](i)) {
                    attrs[i][element_id] = args[0][i];
                };
	    };

	    // return the element so that cascading is possible
	    return this;
	};

	// two args, key and value, set single attribute
	if (args[length] == 2) {

	    // set attr value
	    if (attrs[args[0]] === undefined) {
		attrs[args[0]] = {};
	    };
	    attrs[args[0]][element_id] = args[1];

	    // return the element so that cascading is possible
	    return this;
	};
	
	// args were not valid if it gets here
	throw(element_type + ".attr received bad arguments");

    };

    // these are public
    return {
	"Node": Node,
	"Edge": Edge,
	"Undirected": Undirected
    };
}();

