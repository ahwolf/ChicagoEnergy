// ------------UTILITIY FUNCTIONS
function complement(a, b) {
    "use strict";
    var i, j, k, atemp; 
    var c = [], hash = {};

    if (a.length < b.length) {
	atemp = a;
	a = b;
	b = atemp;
    }
    for (i = 0; i < a.length; ++i){
	hash[a[i]]=1;
    }

    for (j = 0; j < b.length; ++j){
	delete hash[b[j]];
    }

    for (k in hash){
	if (hash.hasOwnProperty(k)){
	    c.push(parseInt(k));
	}
    }
    return c;
}

function make_object(array){
    "use strict";
    var i, obj = {};
    for (i in array){
	if (array.hasOwnProperty(i)){
	    obj[array[i]] = array[i];
	}
    }
    return obj;
}

// this should be added in after network_lite
var NetworkVisualization = (function () { // Module
    "use strict";
    var __new__ = {};
    
    __new__.Node = function () {
	var self = NetworkLite.__new__.Node();

	var super__init__ = self.__init__;
	self.__init__ = function (args) {
	    super__init__.call(this, args);
	    var id = args.id;
	    var attrs = args.attrs;
	    this.x = attrs.cx[id] || undefined;
	    this.y = attrs.cy[id] || undefined;
	    this.label = attrs.label[id] || undefined;
	    this.radius = attrs.r[id] || undefined;	    
	    this.label_offset = 5;
	};

	self.get_label_xy = function (specified_radius) {
	    var radius = specified_radius || this.radius;
	    var offset = radius + this.label_offset;
	    return [this.x, this.y - offset];
	};

	self.draw = function (canvas ,default_r) {

	    // draw the node itself
	    var radius = default_r || this.radius;
	    this.element = canvas.circle(
		this.x,
		this.y,
		radius
	    );

	    // Raphael canvas.sets: also created when we draw the
	    // elements
	    this.element.outgoing_nodes_set = canvas.set();
	    this.element.incoming_nodes_set = canvas.set();
	    this.element.complement_nodes_set = canvas.set();
	    this.element.outgoing_links_set = canvas.set();
	    this.element.incoming_links_set = canvas.set();
	    this.element.complement_links_set = canvas.set();
	    this.element.parentset = canvas.set();
	    this.element.all_labels = canvas.set();

	    // draw the label and its backer
	    var label_xy = this.get_label_xy(default_r);
	    this.element.own_label = canvas.set();
	    this.element.label_backer = canvas.text(label_xy[0],
						    label_xy[1],
						    this.label.toUpperCase()
						   );
	    
	    this.element.label = canvas.text(label_xy[0],
					     label_xy[1],
					     this.label.toUpperCase()
					    ).toFront();

	    // note: the order in which we push the elements matter!
	    this.element.own_label.push(this.element.label_backer, 
					this.element.label);

	    // if x coordinate of node is too extreme left or right,
	    // anchor its label accordingly so that it won't be cut
	    // off at the border of the canvas
	    var width = $('#network').width();
	    var factor = 0.15;

	    if (this.x < width*factor) {
		this.element.own_label.attr({"text-anchor": "start"});
	    }
	    else if (this.x > width*(1-factor)) {	    
		this.element.own_label.attr({"text-anchor": "end"});
	    }

	    this.element.own_label.hide();

	    return this.element;
	};

	self.animate_element = function (canvas, element, t) {
	    // animate from a previous element (that's passed in as an
	    // argument)

	    // reuse the element
	    this.element = element;

	    // reset these sets
	    this.element.outgoing_nodes_set = canvas.set();
	    this.element.incoming_nodes_set = canvas.set();
	    this.element.complement_nodes_set = canvas.set();
	    this.element.outgoing_links_set = canvas.set();
	    this.element.incoming_links_set = canvas.set();
	    this.element.complement_links_set = canvas.set();
	    this.element.parentset = canvas.set();
	    this.element.all_labels = canvas.set();

	    // animate node to new positions
	    this.element.animate({cx: this.x,
				  cy: this.y},
				 t);

	    // animate label wtih node
	    var label_xy = this.get_label_xy();
	    this.element.own_label.animateWith(this.element,
	    				       {"x": label_xy[0],
	    					"y": label_xy[1]},
	    				       t).hide();

	    // label anchor direction
	    var width = $('#network').width();
	    var factor = 0.15;

	    if (this.x < width*factor) {
		this.element.own_label.attr({"text-anchor": "start"});
	    }
	    else if (this.x > width*(1-factor)) {	    
		this.element.own_label.attr({"text-anchor": "end"});
	    }
	    else{
		this.element.own_label.attr({"text-anchor": "middle"})
	    }
	    
	    return this.element;
	};

	return self;
    };

    var Node = function (args) {
	var self = __new__.Node();
	self.__init__(args);
	return self;
    };



    __new__.FlowNode = function(){
	var self = NetworkLite.__new__.Node();

	var super__init__ = self.__init__;
	self.__init__ = function (args) {
	    super__init__.call(this, args);
	    var id = args.id;
	    var attrs = args.attrs;
	    this.label = attrs.label[id] || undefined;
	    this.node_order = attrs.node_order || undefined;
	    this.outgoing_total = attrs.node_outgoing_weights[id] || 0;
	    this.incoming_total = attrs.node_incoming_weights[id] || 0;
	};

	self.draw_left = function(canvas, startx, starty, width, height){
	    // draws bar on the left 
	    this.left_element = canvas.rect(startx, 
				       starty, 
				       width, 
				       height);	

	    this.left_element.coords = [starty,starty+height];
	    this.left_element.linkset = canvas.set();

	    return this.left_element;

	};

	self.draw_right = function(canvas, startx, starty, width, height){
	    // draws bar on the right
	    this.right_element = canvas.rect(startx, 
					     starty, 
					     width, 
					     height);

	    this.right_element.coords = [starty, starty+height];
	    this.right_element.linkset = canvas.set();

	    return this.right_element;
	};

	return self;
    };

    var FlowNode = function (args) {
	var self = __new__.FlowNode();
	self.__init__(args);
	return self;
    };


    __new__.Link = function(){
	// inherit from weighted link
	var self = NetworkLite.__new__.Link();

	var super__init__ = self.__init__;
	self.__init__ = function(args){
	    super__init__.call(this, args);

	};

	self.get_start_end_xys = function () {
	    var startx = this.start_node.x;
	    var starty = this.start_node.y;
	    var endx = this.end_node.x;
	    var endy = this.end_node.y;
	    return [startx, starty, endx, endy];
	};

	// draw a straight line
	self.straight_line = function(){
	    var xys = this.get_start_end_xys();
	    // reversed start and end coordinates so that arrows will
	    // animate in the right direction
	    var pathstring = "M"+xys[2]+" "+xys[3]+"L"+xys[0]+" "+xys[1];

	    return pathstring;
	};

	self.straight_line_to_edge_of_circle = function (r1, r2) {
	    var xys = this.get_start_end_xys();

	    var x1 = xys[0];
	    var y1 = xys[1];
	    var x2 = xys[2];
	    var y2 = xys[3];
	    var r1 = r1 || this.start_node.radius;
	    var r2 = r2 || this.end_node.radius;

	    var dx = x2 - x1;
	    var dy = y2 - y1;
	    var angle = Math.atan2(dy, dx);

	    // calculate point of intersection of straight line (between
	    // two circles) and circumference of circle. 
	    var ix1 = x1 + r1*(Math.cos(angle)); 
	    var iy1 = y1 + r1*(Math.sin(angle)); 
	    var ix2 = x2 - r2*(Math.cos(angle));
	    var iy2 = y2 - r2*(Math.sin(angle)); 

	    // reversed start and end coordinates so that arrows will
	    // animate in the right direction
	    
	    var pathstring = "M"+ix2+" "+iy2+"L"+ix1+" "+iy1;

	    return pathstring;

	};
	
	// draw a half arrow
	self.half_arrow = function (r1, r2) {
	    // weight attribute should not be set here!
	    var size = 10*this.weight || 5;
	    size = Math.min(Math.max(1,size),10);
	    var xys = this.get_start_end_xys();
	    var x1 = xys[0];
	    var y1 = xys[1];
	    var x2 = xys[2];
	    var y2 = xys[3];
	    var r1 = r1 || this.start_node.radius;
	    var r2 = r2 || this.end_node.radius;

	    var dx = x2 - x1;
	    var dy = y2 - y1;
	    var angle = Math.atan2(dy, dx);
	    var dist = Math.sqrt(dx*dx + dy*dy);
	    
	    // calculate point of intersection of straight line (between
	    // two circles) and circumference of circle. 
	    var ix1 = x1 + r1*(Math.cos(angle)); 
	    var iy1 = y1 + r1*(Math.sin(angle)); 
	    var ix2 = x2 - r2*(Math.cos(angle));
	    var iy2 = y2 - r2*(Math.sin(angle)); 
	    var idx = ix2 - ix1;	  
	    var idy = iy2 - iy1; 
	    var idist = Math.sqrt(idx*idx + idy*idy);
	    
	    var small_angle = Math.PI/6;
	    var adj = (2*size)/Math.tan(small_angle);

	
	    // going backwards - weird way of getting things to work
	    var tx3 = ix1 - size*Math.cos(Math.PI/2+angle);
	    var ty3 = iy1 - size*Math.sin(Math.PI/2+angle);
	    
	    var tx2 = tx3 + (idist-adj)*Math.cos(angle);
	    var ty2 = ty3 + (idist-adj)*Math.sin(angle);
	    
	    var tx1 = tx2 - size*Math.cos(Math.PI/2+angle);
	    var ty1 = ty2 - size*Math.sin(Math.PI/2+angle);

	    var pathstring = "M" + ix1 + " " + iy1 + " L" + ix2 + " " + iy2 +" L"+tx1 + " " + ty1 +" L"+ tx2 + " " + ty2 + " L"+ tx3 + " " + ty3 + " Z";
	
	    return pathstring;
	};

	// draw a bezier curve
	self.bezier_curve = function () {
	};

	self.flow = function(x1, y1, x2, y2, cx1, cy1, cx2, cy2, dy){
	    // x1,y1 are coords of starting point
	    // x2,y2 are coords of ending point
	    // dy is the height offset
	    // (cx1, cy1), (cx2, cy2) are the control points

	    var ww = y1+dy;
	    var xx = cy1+dy;
	    var yy = cy2+dy;
	    var zz = y2+dy;

	    // wooooo bezier curve!
	    var pathstring = "M" + x1 + " " + y1 + " C" + cx1 + " " + cy1 +" "+cx2 + " " + cy2 + " "+ x2 + " " + y2 +" " +"L"+ x2 + " " + zz + " C" + cx2 + " " + yy +" "+cx1 + " " + xx + " " + x1 + " " + ww + " Z";	    

	    return pathstring;

	};

	self.drawflow = function(canvas, x1, y1, x2, y2, cx1, cy1, cx2, cy2, dy){
	    var pathstring = this.flow(x1, y1, x2, y2, cx1, cy1, cx2, cy2, dy);
	    this.element = canvas.path(pathstring);
	    this.element.start_bar = this.start_node.left_element;
	    this.element.end_bar = this.end_node.right_element;
	    
	    return this.element;
	};

	self.drawpath = function(canvas, pathstring){
	    this.element = canvas.path(pathstring);

	    return this.element;
	};

	
	self.animate_element = function(canvas, element, default_r, t) {
	    // where element is the prev element we want to animate from
	    this.element = element;
	    this.element.oldpath = this.straight_line_to_edge_of_circle(default_r, default_r);
	    this.element.newpath = this.half_arrow(default_r, default_r);

	    this.element.animate({"path": this.element.oldpath}, t);

	    return this.element;
	};

	// self.animate_flow_element = function (canvas, element, x1, y1, x2, y2, cx1, cy1, cx2, cy2, dy, t) {
	//     this.element = element;
	//     var pathstring = this.flow(canvas, x1, y1, x2, y2, cx1, cy1, cx2, cy2, dy);
	//     this.element.animate({"path": pathstring}, t);

	//     return this.element;
	// };

	return self;
    };

    var Link = function(args){
	var self = __new__.Link();
	self.__init__(args);
	return self;
    };

    __new__.WeightedLink = function () {
	
	var self = __new__.Link();
	// var other = NetworkLite.__new__.WeightedLink();

	// if NetworkLite.__new__.WeightedLink has other methods
	// associated with it (currently there are none), we will have
	// to do some fanciness here

	var super__init__ = self.__init__;
	// var other_super__init__ = other.__init__;

	self.__init__ = function(args) {
	    super__init__.call(this, args);

	    // we don't want add_link to be called twice on every link
	    // when we __init__ twice from Link and
	    // NetworkLite.WeightedLink, so we'll just add in weight
	    // manually which is all that other_super__init__ was
	    // going to do anyway
	    this.weight = args.weight;  
	};
	
	return self;
    };

    var WeightedLink = function (args){
	var self = __new__.WeightedLink();
	self.__init__(args);
	return self;
    };

    __new__.WeightedDirectedSpring = function () {
	var self = NetworkLite.__new__.WeightedDirected();

	// override this method with the Visualization.Node class
        self.add_node = function (id, json) {
            var node = Node({"id": id, "attrs":json.node_attrs});
            this.nodes[id] = node;
            return node;
        };

	// override this method with the Visualization.WeightedLink class
        self.add_link = function (start_id, end_id, json) {
            var id = this.create_link_id(start_id, end_id);
            var start_node = this.nodes[start_id];
            var end_node = this.nodes[end_id];
            var link = WeightedLink({
		"id": id, 
		"start_node":start_node, 
		"end_node":end_node,
		"weight": json.edge_attrs.weight[id]
	    });
            this.links[id] = link;
	    return link;
        };
	

	var super__init__ = self.__init__;
	self.__init__ = function (json) {
	    super__init__.call(this, json);
	    // any variables?

	};

	var width = $('#network').width();
	var height = $('#network').height();

	self.draw_legend = function (canvas) {
	    // quick and dirty legend
	    this.legend = canvas.set();

	    var half_arrow = function(x1, y1, x2, y2, r1, r2, size) {
		var dx = x2 - x1;
		var dy = y2 - y1;
		var angle = Math.atan2(dy, dx);
		var dist = Math.sqrt(dx*dx + dy*dy);
		
		// calculate point of intersection of straight line (between
		// two circles) and circumference of circle. 
		var ix1 = x1 + r1*(Math.cos(angle)); 
		var iy1 = y1 + r1*(Math.sin(angle)); 
		var ix2 = x2 - r2*(Math.cos(angle));
		var iy2 = y2 - r2*(Math.sin(angle)); 
		var idx = ix2 - ix1;	  
		var idy = iy2 - iy1; 
		var idist = Math.sqrt(idx*idx + idy*idy);
	    
		var small_angle = Math.PI/6;
		var adj = (2*size)/Math.tan(small_angle);
		var hyp = (2*size)/Math.sin(small_angle);
		
		// going backwards - weird way of getting things to work
		var tx3 = ix1 - size*Math.cos(Math.PI/2+angle);
		var ty3 = iy1 - size*Math.sin(Math.PI/2+angle);
		
		var tx2 = tx3 + (idist-adj)*Math.cos(angle);
		var ty2 = ty3 + (idist-adj)*Math.sin(angle);
	    
		var tx1 = tx2 - size*Math.cos(Math.PI/2+angle);
		var ty1 = ty2 - size*Math.sin(Math.PI/2+angle);
		
		var pathstring = "M" + ix1 + " " + iy1 + " L" + ix2 + " " + iy2 +" L"+tx1 + " " + ty1 +" L"+ tx2 + " " + ty2 + " L"+ tx3 + " " + ty3 + " Z";

		return pathstring;
	    };


	    var legend_w = 170;
	    var legend_h = 80;
	    var startx = width-200;
	    var starty = 20;
	    var default_r = 8;

	    var x1 = startx+0.15*legend_w;
	    var y1 = starty+0.4*legend_h;
	    var x2 = startx+0.4*legend_w; 
	    var y2 = starty+0.75*legend_h;
	    var yhalf = starty+ 0.55*legend_h;

	    // var bg = canvas.rect(startx,
	    // 			 starty,
	    // 			 legend_w,
	    // 			 legend_h,
	    // 			 5).attr({"fill": "whitesmoke",
	    // 				  "stroke": "none"});

	    // var title = canvas.text(startx+5, 
	    // 			    starty+10, 
	    // 			    "LEGEND").attr({
	    // 				"font-family": "Comfortaa, sans-serif",
	    // 				"font-size": 12,
	    // 				"font-weight": "bold",
	    // 				"text-anchor": "start"}).toFront();

	    // // var incoming_color = "rgb(215,48,39)";
	    // // var outgoing_color = "rgb(69,117,180)";

	    // var incoming_color = "#993333";
	    // var outgoing_color = "#333399";

	    // var link1 = canvas.path(half_arrow(x1,
	    // 				       yhalf, 
	    // 				       x2,
	    // 				       y1, 
	    // 				       default_r,
	    // 				       default_r, 
	    // 				       3)).attr({"fill": outgoing_color,
	    // 						"stroke": "none"});

	    // var link2 = canvas.path(half_arrow(x2,
	    // 				       y2, 
	    // 				       x1,
	    // 				       yhalf, 
	    // 				       default_r,
	    // 				       default_r, 
	    // 				       3)).attr({"fill": incoming_color,
	    // 						"stroke": "none"});
	    
	    // var node1 = canvas.circle(x1,
	    // 			      yhalf,
	    // 			      default_r).attr({"fill": "orange",
	    // 					       "stroke": "none"}
	    // 					     );
	    
	    // var node2 = canvas.circle(x2,
	    // 			      y1,
	    // 			      default_r).attr({"fill": outgoing_color,
	    // 					       "stroke": "none"}
	    // 					     );
	    
	    // var node3 = canvas.circle(x2,
	    // 			      y2,
	    // 			      default_r).attr({"fill": incoming_color,
	    // 					       "stroke": "none"}
	    // 					     );
	    

	    // var caption1 = canvas.text(startx+0.7*legend_w,
	    // 			       y1,
	    // 			       "outgoing link").attr({
	    // 				   "font-family": "Comfortaa, sans-serif",
	    // 				   "font-size": 10});

	    // var caption2 = canvas.text(startx+0.7*legend_w,
	    // 			       y2,
	    // 			       "incoming link").attr({
	    // 				   "font-family": "Comfortaa, sans-serif",
	    // 				   "font-size": 10});


	    // // links
	    // this.legend.push(bg, node1, node2, node3, 
	    // 		     link1, link2, title, 
	    // 		     caption1,caption2);
	    // this.legend.hide();

	    return this.legend;

	};


	self.draw = function (canvas, old_nodes_set, old_links_set, bg, legend) {
	    // when you have the time, move this somewhere else cos
	    // this is a messsss

	    // remove the legend and background from the previous
	    // network, otherwise it's going to get drawn over and
	    // over again
	    if (bg !== undefined){
		bg.remove();
	    }
	    if (legend !== undefined){
		legend.remove();
	    }

	    // attributes of the network; all node_elements and all link_elements
	    // make empty sets at the beginning
	    this.node_elements = canvas.set();
	    this.link_elements = canvas.set();

	    // where to set these variables?
	    var default_r = 10;
	    var label_size = 10;
	    var font_family = "Comfortaa, sans-serif";

	    // contains same info as old_nodes_set and old_links_set,
	    // except they're now objects referrable by the element id
	    var old_node_elements = {};
	    var old_link_elements = {};

	    var i, j, k, m;

	    for (i in old_nodes_set.items){
		if (old_nodes_set.items.hasOwnProperty(i)) {
		old_node_elements[old_nodes_set.items[i].id] = old_nodes_set.items[i];
		}
	    }
	    for (j in old_links_set.items){
		if (old_links_set.items.hasOwnProperty(j)){
		old_link_elements[old_links_set.items[j].id] = old_links_set.items[j];
		}
	    }
	    
	    // structural stuff to compare between the previous and
	    // current network and figure out what to draw and what to
	    // animate
	    // -------------------------------links

	    var prev_links = [];
	    var current_links = [];
	    for (k in old_links_set.items) {
		if (old_links_set.items.hasOwnProperty(k) && 
		    old_links_set.items[k].id !== undefined) {
		    prev_links.push(old_links_set.items[k].id);
		}
	    }

	    for (m in this.links) {
		if (this.links.hasOwnProperty(m)){
		    current_links.push(this.links[m].id);
		}
	    }
	    
	    prev_links = make_object(prev_links);
	    current_links = make_object(current_links);

	    var animate_these_links = {};
	    var draw_these_links = {};
	    var delete_these_links = {};

	    for (i in current_links){
		if (current_links.hasOwnProperty(i) &&
		    current_links[i] in prev_links) {
		    animate_these_links[current_links[i]] = current_links[i];
		}
		else {
		    draw_these_links[current_links[i]] = current_links[i];
		}
	    }

	    for (i in prev_links){
		if (prev_links.hasOwnProperty(i) &&
		    !(prev_links[i] in current_links)){
		    delete_these_links[prev_links[i]] = prev_links[i];
		}
	    }

	    // -------------------- nodes	
	    var prev_nodes = [];
	    var current_nodes = [];

	    for (i in old_nodes_set.items) {
		if (old_nodes_set.items.hasOwnProperty(i) && 
		    old_nodes_set.items[i].id !== undefined) {
		    prev_nodes.push(old_nodes_set.items[i].id);
		}
	    }
	    
	    for (i in this.nodes) {
		if (this.nodes.hasOwnProperty(i)){
		    current_nodes.push(this.nodes[i].id);
		}
	    }

	    // these are objects where keys = values; this is just so
	    // we can look up if something is in an object by its key
	    var draw_these = {};
	    var animate_these = {};
	    var delete_these = {};

	    if (prev_nodes.length > current_nodes.length) {
		animate_these = make_object(current_nodes);
		var delete_these_array = complement(prev_nodes, current_nodes);
		delete_these = make_object(delete_these_array);
		
	    }
	    else if (prev_nodes.length < current_nodes.length) {
		if (prev_nodes.length === 0){
		    draw_these = make_object(current_nodes);
		}
		else {
		    animate_these = make_object(prev_nodes);
		    var draw_these_array = complement(prev_nodes, current_nodes);
		    draw_these = make_object(draw_these_array);
		}
	    }
	    else {
		animate_these = make_object(current_nodes);
	    }

	    // ---------------------- draw, animate or delete links!

	    for (i in this.links) {
		if (this.links.hasOwnProperty(i)) {
		    // animate these
		    if (this.links[i].id in animate_these_links) {
			this.links[i].animate_element(canvas,
						      old_link_elements[this.links[i].id],
						      default_r,
						      200);
			this.links[i].element.parentset = this.link_elements;
			this.link_elements.push(this.links[i].element);
			
		    }
		    // draw these links
		    else if (this.links[i].id in draw_these_links) {
			
			var oldpath = this.links[i].straight_line_to_edge_of_circle(default_r, default_r);
			var newpath = this.links[i].half_arrow(default_r, default_r);
			
			this.links[i].drawpath(canvas, oldpath).attr({"stroke": "grey",
								      "stroke-width": 1.2,
								      "stroke-opacity": 0.8});
			
			this.links[i].element.oldpath = oldpath;
			this.links[i].element.newpath = newpath;
			this.links[i].element.id = this.links[i].id;
			this.link_elements.push(this.links[i].element);
		    }
		}
	    }
		
		// delete links
	    for (j in delete_these_links){
		if (delete_these_links.hasOwnProperty(j)) {
		    old_link_elements[delete_these_links[j]].remove();
		}
	    }

	    // ---------------------- draw, animate or delete nodes!
	    for (i in this.nodes) {
		if (this.nodes.hasOwnProperty(i)) {
		    // these are to be animated. save new positions
		    if (this.nodes[i].id in animate_these) {
			this.nodes[i].animate_element(canvas,
						      old_node_elements[this.nodes[i].id],
						      200).toFront();
			this.nodes[i].element.parentset = this.node_elements;
			this.node_elements.push(this.nodes[i].element);
			
		    }
		    // draw these nodes and style them
		    else if (this.nodes[i].id in draw_these) {
			this.nodes[i].draw(canvas, default_r).attr(
			    {"fill": "#660066",
			     "fill-opacity": 1.0,
			     "stroke": "white",
			     "stroke-opacity": 0}).toFront();
			
			this.nodes[i].element.id = this.nodes[i].id;
			
			this.nodes[i].element.label_backer.attr(
			    {'font-size': label_size,
			     'font-weight': "bold",
			     'font-family': font_family,
			     'fill': 'black',
			     'stroke': 'white',
			     'stroke-width': 2.5});
			
			this.nodes[i].element.label.attr({'font-size': label_size,
							  'font-weight': "bold",
							  'font-family': font_family,
							  'fill': '#666',
							  'stroke': '#666',
							  'stroke-width': 0.2});
		    
			this.nodes[i].element.parentset = this.node_elements;
			
			this.node_elements.push(this.nodes[i].element);
			
		    }
		}
	    }

	    // always default to false
	    this.reset = false;

	    // delete nodes
	    for (j in delete_these){
		if (delete_these.hasOwnProperty(j)) {
		    if (old_node_elements[delete_these[j]].selected === 1) {
			// if we are deleting a node (that was selected in
			// the prev network), this.reset changes to true
			this.reset = true;
		    }
		    // remove svg elements from canvas
		    old_node_elements[delete_these[j]].label.remove();
		    old_node_elements[delete_these[j]].label_backer.remove();
		    old_node_elements[delete_these[j]].remove();
		}
	    }

	    // draw background
	    this.background = canvas.rect(0, 
					  0, 
					  width, 
					  height).attr({"fill": 'white',
							"fill-opacity": 0,
							"stroke": "white",
							"stroke-opacity": 0}
						      ).toBack();
	    
	    // draw legend
	    this.draw_legend(canvas);
	    
	    // ------------ adding elements to Raphael sets

	    for (i in this.nodes) {
		if (this.nodes.hasOwnProperty(i)) {
		    var x, y, z;
		    var node = this.nodes[i];		    
		    // making copies instead of making references
		    var nodes_copy = $.extend({}, this.nodes);
		    var links_copy = $.extend({}, this.links);
		    
		    // delete itself
		    delete nodes_copy[node.id];

		    // outgoing nodes set
		    for (x in node.outgoing_nodes) {
			if (node.outgoing_nodes.hasOwnProperty(x)) {
			    delete nodes_copy[node.outgoing_nodes[x].id];
			    node.element.all_labels.push(node.outgoing_nodes[x].element.own_label);
			    node.element.outgoing_nodes_set.push(
				node.outgoing_nodes[x].element);
			}
		    }
		    
		    // incoming nodes set
		    for (y in node.incoming_nodes) {
			if (node.incoming_nodes.hasOwnProperty(y)) {
			    delete nodes_copy[node.incoming_nodes[y].id];
			    node.element.all_labels.push(node.incoming_nodes[y].element.own_label);
			    node.element.incoming_nodes_set.push(
				node.incoming_nodes[y].element);
			}
		    }
		    
		    // complement nodes set
		    // NOTE: must put after the first two
		    for (z in nodes_copy) {	
			if (nodes_copy.hasOwnProperty(z)) {
			    node.element.complement_nodes_set.push(
				nodes_copy[z].element);
			}
		    }
		    // outgoing links set (or just links)
		    for (x in node.links) {
			if (node.links.hasOwnProperty(x)){
			delete links_copy[node.links[x].id];
			    node.element.outgoing_links_set.push(
				node.links[x].element);
			}	
		    }
		    // incoming links set 
		    for (y in node.incoming_links) {
			if (node.incoming_links.hasOwnProperty(y)){
			    delete links_copy[node.incoming_links[y].id];
			    node.element.incoming_links_set.push(
				node.incoming_links[y].element);
			}
		    }
		    // complement links set
		    for (z in links_copy) {
			if (links_copy.hasOwnProperty(z)){
			    node.element.complement_links_set.push(
				links_copy[z].element);
			}
		    }
		}
	    }
	}; // end of self.draw


	self.interactive = function (){
	    // all interactive functions are now attributes of
	    // self.interactive so they are accessible when self is
	    // accessible
	    
	    // define default node and line attrs 
	    var node_color = "#660066";
	    var node_highlight_color = "#660066"; // xxxx
	    var line_stroke_color = "grey";
	    var line_stroke_width = 1.2;
	    var line_stroke_opacity = 0.8;
	    // var incoming_color = "rgb(215,48,39)";
	    // var outgoing_color = "rgb(69,117,180)";

	    var incoming_color = "#993333";
	    var outgoing_color = "#333399";

	    var dim_color = "silver";
	    var line_dim_opacity = 0.5;
	    var node_dim_opacity = 0.65;
	    var node_selected_dim_opacity = 0.8;
	    
	    // set animation times
	    var animate_slow = 200;
	    var animate_fast = 30;
	    var animate_immediate = 0;
	    
	    // interactivity functions
	    this.interactive.old_to_new_paths = function (link_elements, color){
		var i;
		for (i in link_elements){
		    if (link_elements.hasOwnProperty(i)) {
			link_elements[i].animate({"path": link_elements[i].newpath,
						  "fill": color,
						  "stroke-width": 0.1
						 }, animate_slow);
		    }
		}
		return false;
	    };
	    
	    this.interactive.new_to_old_paths = function (link_elements){
		var i;
		for (i in link_elements){
		    if (link_elements.hasOwnProperty(i)) {
			link_elements[i].animate({"path": link_elements[i].oldpath,
						  "stroke": line_stroke_color,
						  "stroke-width": line_stroke_width
						 }, animate_fast);
		    }
		}
		return false;
	    };


	    this.interactive.deselect_all = function (node_elements){
		// element should be a node element
		var i;
		for (i in node_elements.items){
		    if (node_elements.items.hasOwnProperty(i)){
			var element = node_elements.items[i];
			// changes all selectes states to false
			element.selected = false;
			if (element.outgoing_nodes_set !== undefined &&
			    element.outgoing_nodes_set.items.length !== 0){
			    self.interactive.new_to_old_paths(element.outgoing_links_set.items);
			}
			if (element.incoming_nodes_set !== undefined &&
			    element.incoming_nodes_set.items.length !== 0){
			    self.interactive.new_to_old_paths(element.incoming_links_set.items);
			}
			element.own_label.hide();
			element.all_labels.hide();
		    }
		}
		return false;
	    };

	    this.interactive.reset_colors = function (node_elements, link_elements) {

		node_elements.animate({"fill": node_color, 
				       "fill-opacity": 1
				      }, animate_immediate);
		link_elements.animate({"stroke": line_stroke_color, 
				       "stroke-opacity": line_stroke_opacity
				      }, animate_immediate);
		return false;
	    };

	    this.interactive.node_selected = function(node_element, legend){

		var event_handler = function (event) {
		    // clear all other nodes and existing paths
		    self.interactive.deselect_all(node_element.parentset);

		    legend.show();
		    // set selected node and connected neighbors' selected
		    // state to true
		    node_element.selected = 1;
		    var i, j, k;
		    for (i in node_element.incoming_nodes_set.items){
			if (node_element.incoming_nodes_set.items.hasOwnProperty(i)){
			    node_element.incoming_nodes_set.items[i].selected = 2;
			}
		    }
		    for (j in node_element.outgoing_nodes_set.items){
			if (node_element.outgoing_nodes_set.items.hasOwnProperty(j)){
			    node_element.outgoing_nodes_set.items[j].selected = 3;
			}
		    }
		    for (k in node_element.complement_nodes_set.items){
			if (node_element.complement_nodes_set.items.hasOwnProperty(k)){
			    node_element.complement_nodes_set.items[k].selected = 4;
			}
		    }		    
		    // change all paths to directed arrows
		    self.interactive.old_to_new_paths(node_element.outgoing_links_set.items, 
				     outgoing_color);
		    self.interactive.old_to_new_paths(node_element.incoming_links_set.items, 
				     incoming_color);
		    
		    // placing objects in order on canvas
		    node_element.complement_links_set.toBack();
		    node_element.outgoing_links_set.toFront();
		    node_element.incoming_links_set.toFront();
		    node_element.parentset.toFront();
		    
		    // // show labels and then bring them to front 
		    node_element.all_labels.show().toFront();
		    node_element.own_label.show().toFront();
		    
		    // change color of nodes and lines
		    node_element.animate({"fill": node_color,
					  "fill-opacity": node_selected_dim_opacity
					 }, animate_slow);
		    
		    // animating the different sets
		    node_element.complement_nodes_set.animate(
			{"fill": dim_color,
			 "fill-opacity": node_dim_opacity
			}, animate_slow);
		    
		    node_element.complement_links_set.animate(
			{"stroke": dim_color,
			 "stroke-opacity": line_dim_opacity
			}, animate_slow);

		    if (node_element.incoming_nodes_set !== undefined &&
			node_element.incoming_nodes_set.items.length !== 0){
			node_element.incoming_nodes_set.animate(
			    {"fill": incoming_color, 
			     "fill-opacity": node_selected_dim_opacity
			    }, animate_slow);
		    }

		    if (node_element.outgoing_nodes_set !== undefined &&
			node_element.outgoing_nodes_set.items.length !== 0){
			node_element.outgoing_nodes_set.animate(
			    {"fill": outgoing_color, 
			     "fill-opacity": node_selected_dim_opacity
			    }, animate_slow);
		    }
		};
		return event_handler;
	    };


	    this.interactive.node_remains_selected = function (node_element, legend) {
		// the only difference between this and node_selected
		// is that this doesn't call this.interactive.deselect_all

		node_element.selected = 1;

		legend.show();
		var x, y, z;
		for (x in node_element.incoming_nodes_set.items){
		    if (node_element.incoming_nodes_set.items.hasOwnProperty(x)){
			node_element.incoming_nodes_set.items[x].selected = 2;
		    }
		}
		for (y in node_element.outgoing_nodes_set.items){
		    if (node_element.outgoing_nodes_set.items.hasOwnProperty(y)){
			node_element.outgoing_nodes_set.items[y].selected = 3;
		    }
		}
		for (z in node_element.complement_nodes_set.items){
		    if (node_element.complement_nodes_set.items.hasOwnProperty(z)){
			node_element.complement_nodes_set.items[z].selected = 4;
		    }
		}
		// change all paths to directed arrows
		self.interactive.old_to_new_paths(node_element.outgoing_links_set.items, 
				 outgoing_color, 
				 animate_slow);
		self.interactive.old_to_new_paths(node_element.incoming_links_set.items, 
				 incoming_color, 
				 animate_slow);
		
		// placing objects in order on canvas
		node_element.complement_links_set.toBack();
		node_element.outgoing_links_set.toFront();
		node_element.incoming_links_set.toFront();
		node_element.parentset.toFront();

		// show labels and then bring them to front 
		node_element.own_label.show().toFront();
		node_element.all_labels.show().toFront();
		
		// animating the different sets
		node_element.complement_nodes_set.animate(
		    {"fill": dim_color,
		     "fill-opacity": node_dim_opacity}
		    , animate_slow);
		
		node_element.complement_links_set.animate(
		    {"stroke": dim_color,
		     "stroke-opacity": line_dim_opacity}
		    , animate_slow);
		
		if (node_element.incoming_nodes_set !== undefined &&
		    node_element.incoming_nodes_set.items.length !== 0){
		    node_element.incoming_nodes_set.animate(
			{"fill": incoming_color, 
			 "fill-opacity": node_selected_dim_opacity}
			, animate_slow);
		}

		if (node_element.outgoing_nodes_set !== undefined &&
		    node_element.outgoing_nodes_set.items.length !== 0){
		    node_element.outgoing_nodes_set.animate(
			{"fill": outgoing_color, 
			 "fill-opacity": node_selected_dim_opacity}
			, animate_slow);
		}
		return false;
	    }

	    this.interactive.node_hover_in = function (node_element){
		function event_handler (event) {
		    node_element.animate({"fill": node_highlight_color}
					 , animate_immediate);
		    node_element.own_label.show().toFront();
		}
		return event_handler;
	    }
	    
	    this.interactive.node_hover_out = function (node_element){
		function event_handler (event) {
		    // *******
		    if (node_element.selected === 1){
			node_element.animate({"fill": node_color}
					     , animate_immediate);
		    }
		    else if (node_element.selected === 2) {
			node_element.animate({"fill": incoming_color}
					     , animate_immediate);
		    }
		    else if (node_element.selected === 3) {
			node_element.animate({"fill": outgoing_color}
					     ,animate_immediate);
		    }
		    else if (node_element.selected === 4) {
			node_element.own_label.hide();
			node_element.animate({"fill": dim_color,
					      "fill-opacity": node_dim_opacity}
					     , animate_immediate);
		    }
		    else {
			node_element.animate({"fill": node_color}
					     , animate_immediate);
			node_element.all_labels.hide();
			node_element.own_label.hide();
			self.interactive.new_to_old_paths(node_element.outgoing_links_set.items);
			self.interactive.new_to_old_paths(node_element.incoming_links_set.items);
		    }
		}
		return event_handler;
	    }


	    function background_click(node_elements, link_elements, legend) {
		function event_handler (event) {
		    legend.hide();
		    self.interactive.deselect_all(node_elements);
		    self.interactive.reset_colors(node_elements, link_elements);
		}
		return event_handler;
	    }
	    
	    // if a deleted node from previous network was the one
	    // selected, this.reset will be true; otherwise it is
	    // undefined
	    if (this.reset) {
		this.legend.hide();
		this.interactive.deselect_all(this.node_elements);
		this.interactive.reset_colors(this.node_elements, this.link_elements);
	    }

	    // click and hover functions
	    var i;
	    for (i in this.nodes){
		if (this.nodes.hasOwnProperty(i)){
		    var node_element = this.nodes[i].element;
		    
		    if (node_element.selected ===1 ) {
			this.interactive.node_remains_selected(node_element, this.legend);
		    }
		    
		    if (node_element.clickfn !== undefined) {
			node_element.unclick(node_element.clickfn);
		    }
		    node_element.clickfn = this.interactive.node_selected(node_element, this.legend);
		    node_element.click(node_element.clickfn);
		    
		    if (node_element.mouseoverfn !== undefined) {
			node_element.unmouseover(node_element.mouseoverfn);
		    }
		    node_element.mouseoverfn = this.interactive.node_hover_in(node_element);
		    node_element.mouseover(node_element.mouseoverfn);
		    
		    if (node_element.mouseoutfn !==undefined) {
			node_element.unmouseout(node_element.mouseoutfn);
		    }
		    node_element.mouseoutfn = this.interactive.node_hover_out(node_element);
		    node_element.mouseout(node_element.mouseoutfn);	    
		}
	    }
	    // don't have to do unbinding with the background because
	    // it gets re-drawn everytime	    
	    this.background.click(background_click(this.node_elements,
						   this.link_elements,
						   this.legend));

	    self.save_elements = function() {
		return [this.node_elements, 
			this.link_elements, 
			this.background, 
			this.legend];
	    };

	};
	return self;
    };
	
    var WeightedDirectedSpring = function (json) { 
	var self = __new__.WeightedDirectedSpring();
	self.__init__(json);
	return self;
    };


    __new__.Flow = function () {
	
	var self = NetworkLite.__new__.WeightedDirected();

	// override this method with the NetworkVisualization.FlowNode class
	self.add_node = function(id, json){
	    var node = FlowNode({"id": id, "attrs": json.node_attrs});
	    this.nodes[id] = node;
	    return node;
	};

	// override this method with the NetworkVisualization.WeightedLink class
        self.add_link = function (start_id, end_id, json) {
            var id = this.create_link_id(start_id, end_id);
            var start_node = this.nodes[start_id];
            var end_node = this.nodes[end_id];
            var link = WeightedLink({
		"id": id, 
		"start_node":start_node, 
		"end_node":end_node,
		"weight": json.edge_attrs.weight[id]
	    });
            this.links[id] = link;
	    return link;
        };

	var super__init__ = self.__init__;
	self.__init__ = function (args){
	    super__init__.call(this, args);
	    // get node_order from the first node, or any node
	    var i;
	    for (i in this.nodes){
		if (this.nodes.hasOwnProperty(i)){
		    this.order = this.nodes[i].node_order;
		    break;
		}
	    }
	    // total links (incoming should = outgoing) 
	    var total_in = 0;
	    var total_out = 0;

	    for (i in this.nodes) {
		if (this.nodes.hasOwnProperty(i)){
		    total_out += this.nodes[i].outgoing_total;
		    total_in += this.nodes[i].incoming_total;
		}
	    }
	    if (total_in === total_out) {
		this.total = total_in;
	    }
	};  
	// ----------------- where to put these variables???
	// variables for drawing later
	var width = $('#network').width();
	var height = $('#network').height();
	
	// set borders and bar widths
	var default_bar_width = 25;
	var h_border = width/5 + 30; // hack to get labels to fit for NU-TGS
	var v_border = height/50;
	var space_btw_bars = 1.5;
	
	// control points x coords
	var lcp = 0.7*(width-2*(h_border+default_bar_width))+(h_border+default_bar_width);
	var rcp = 0.3*(width-2*(h_border+default_bar_width))+(h_border+default_bar_width);

	// bar color and opacity
	var default_bar_opacity = 1;
	var dimmed_bar_opacity = 0.3;
	// var incoming_color = "rgb(215,48,39)";
	// var outgoing_color = "rgb(69,117,180)";
	var incoming_color = "#993333";
	var outgoing_color = "#333399";
	var selected_stroke_color = "white";

	// link color and opacity
	var selected_fill_opacity = 0.75;
	var hover_fill_opacity = 0.3;
	var deselected_fill_color = "grey";
	var deselected_fill_opacity = 0.08;
	    
	// font and text
	var font_family = "Comfortaa, sans-serif";
	var font_size = 10;
	var selected_font_color = "black";
	var deselected_font_color = "darkgrey";
	var dimmed_font_color = "gainsboro";

	self.draw = function (canvas, old_lbars, old_rbars, old_links) {

	    canvas.clear();

	    this.l_bar_set = canvas.set();
	    this.r_bar_set = canvas.set();
	    this.all_bars_set = canvas.set();
	    this.all_links_set = canvas.set();

	    // objects that record the selected state of each bar from
	    // previous network
	    var l_selected_states = {};
	    var r_selected_states = {};
	    var i,k;
	    for (i in old_lbars.items){
		if (old_lbars.items.hasOwnProperty(i)){
		    l_selected_states[old_lbars.items[i].id] = old_lbars.items[i].selected;
		}
	    }

	    for (i in old_rbars.items){
		if (old_rbars.items.hasOwnProperty(i)){
		    r_selected_states[old_rbars.items[i].id] = old_rbars.items[i].selected;
		}
	    }

	    // how much vertical space to use for the total height of bar
	    var factor = (height-2*v_border-(space_btw_bars*(this.order.length-1)))/(this.total);
	    
	    // variables that get updated after each node is drawn to
	    // give starting point of the next node
	    var l_starty = v_border;
	    var r_starty = v_border;
	    
	    // DRAW LEFT AND RIGHT BARS FOR EVERY NODE
	    // going downwards, draw according to order
	    for (k in this.order) {
		var node = this.nodes[this.order[k]];
		var l_bar, r_bar;
		var l_size = node.outgoing_total*factor;
		var r_size = node.incoming_total*factor;
		// see if size is empty (no weights), otherwise don't
		// create the l_bar		
		if (l_size !== 0) {
		    // draw bar and set attrs
		    l_bar = node.draw_left(canvas,
					      h_border,
					      l_starty,
					      default_bar_width,
					      l_size
					     ).attr(
						 {"fill": outgoing_color,
						  "fill-opacity":default_bar_opacity,
						  "stroke": "none",
						  "stroke-opacity": 0,
						  "stroke-linejoin": "round"});

		    node.left_element.own_label = canvas.text(
			h_border-3,
			l_starty+0.5*l_size,
			node.label.toUpperCase()).attr(
			    {"fill": deselected_font_color,
			     "font-family": font_family,
			     "font-size": font_size,
			     "font-weight": "bold",
			     "text-anchor": "end",
			     "cursor": "pointer"});

		    var bb = node.left_element.own_label.getBBox();

		    l_bar.id = node.id+"L";

		    if (l_selected_states[l_bar.id] === 1){
			l_bar.selected = l_selected_states[l_bar.id];
			l_bar.attr({"fill-opacity":default_bar_opacity});
		    }
		    else if (l_selected_states[l_bar.id] !== 0 && l_selected_states[l_bar.id] !== undefined){
			l_bar.selected = 0;
			l_bar.attr({"fill-opacity": dimmed_bar_opacity});
			l_bar.own_label.attr({"fill": dimmed_font_color});
		    }
		    else {
			l_bar.selected = 0;
		    }
		    
		    // push each bar into bar set for easy animation later
		    this.l_bar_set.push(l_bar);
		    this.all_bars_set.push(l_bar);
		    // increase counter for start position of next node
		    l_starty += l_size + space_btw_bars;
		    
		}
		
		if (r_size !== 0) {
		    r_bar = node.draw_right(
			canvas,
			width-h_border-default_bar_width, 
			r_starty,
			default_bar_width, 
			r_size).attr({"fill": incoming_color,
				      "fill-opacity":default_bar_opacity,
				      "stroke": "none",
				      "stroke-opacity": 0,
				      "stroke-linejoin": "round"}
				    );
		    
		    node.right_element.own_label = canvas.text(
			width-h_border + 3, 
			r_starty+0.5*r_size,
			node.label.toUpperCase()).attr(
			    {"fill": deselected_font_color,
			     "font-family": font_family,
			     "font-size": font_size,
			     "font-weight": "bold",
			     "text-anchor": "start",
			     "cursor": "pointer"});
		    
		    r_bar.id = node.id+"R";

		    if (r_selected_states[r_bar.id] === 1){
			r_bar.selected = r_selected_states[r_bar.id];		
		    }
		    else if (r_selected_states[r_bar.id] !== 0 && r_selected_states[r_bar.id] !== undefined){
			r_bar.selected = 0;
			r_bar.attr({"fill-opacity": dimmed_bar_opacity});
			r_bar.own_label.attr({"fill": dimmed_font_color});

		    }

		    this.r_bar_set.push(r_bar);
		    this.all_bars_set.push(r_bar);

		    // increase counter for start position of next node
		    r_starty += r_size + space_btw_bars;	    
		}

		// get start positions for the first link coming out and
		// going into this bar
		var link_l_start = l_bar.coords[0];
		var link_r_start = r_bar.coords[0];

		var j, linkid;
		for (j in this.order) {
		    if (this.order.hasOwnProperty(j)){
			if (this.order[j] in node.outgoing_nodes){
			    // save it as attribute of link
			    linkid = node.id+"-"+this.order[j];
			    this.links[linkid].l_start = link_l_start;
			    // starting point of next link
			    link_l_start += (this.links[linkid].weight)*factor;
			}
			if (this.order[j] in node.incoming_nodes){
			    linkid = this.order[j]+"-"+node.id;
			    // save it as attribute of link
			    this.links[linkid].r_start = link_r_start;
			    // starting point of next link	
			    link_r_start += (this.links[linkid].weight)*factor;
			}
		    }
		}
	    } // end of drawing bars

	    // DRAW LINKS 
	    // left and right x coords where links start and end; these
	    // stay constant
	    var x1 = h_border+default_bar_width;
	    var x2 = width-x1;
	    
	    for (i in this.links) {
		// points for top bezier curve
		var y1 = this.links[i].l_start;
		var y2 = this.links[i].r_start;
		var cx1 = rcp; 
		var cy1 = y1;
		var cx2 = lcp;
		var cy2 = y2;
		
		// offset that's equal to weight (times factor)
		var dy = this.links[i].weight*factor;

		// draw curve 
		var bezier = this.links[i].drawflow(canvas, 
						    x1, y1, 
						    x2, y2, 
						    cx1, cy1, 
						    cx2, cy2, 
						    dy)
		    .attr({"fill": deselected_fill_color, 
			   "fill-opacity": deselected_fill_opacity, 
			   "stroke": "none"
			  });
		
		this.links[i].start_node.left_element.linkset.push(bezier);
		this.links[i].end_node.right_element.linkset.push(bezier);
		this.all_links_set.push(bezier);
		
	    } // end of drawing links


	    // hacky way so that nodes don't flash when switching between networks
	    for (i in this.nodes) {
		var left_element = this.nodes[i].left_element;
		var right_element = this.nodes[i].right_element;
		if (left_element !== undefined && 
		    left_element.selected === 1) {
		    left_element.linkset.attr({"fill": outgoing_color,
					       "fill-opacity": selected_fill_opacity});
		    for (j in left_element.linkset.items) {
			left_element.linkset.items[j].end_bar.attr({"fill-opacity": default_bar_opacity});
		    }
		}
		if (right_element !== undefined &&
		    right_element.selected === 1) {
		    right_element.linkset.attr({"fill": incoming_color,
						"fill-opacity": selected_fill_opacity});
		    for (j in right_element.linkset.items) {
			right_element.linkset.items[j].start_bar.attr({"fill-opacity": default_bar_opacity});
		    }
		}
	    }

	    // make a clickable 'background' Raphael object 
	    this.background = canvas.rect(0,0, width, height
					).attr({"stroke": "none", 
						"fill": 'white', 
						"fill-opacity":0}).toBack();
	    
	    this.clickable_links = canvas.rect(h_border+default_bar_width, 
					       v_border, 
					       width-2*(h_border+default_bar_width), 
					       height-2*v_border).attr(
						   {"stroke": "none",
						    "fill": "white",
						   "fill-opacity": 0}).toFront();	
	};


	self.interactive = function() {
	    
	    // set animation times
	    var animate_slow = 150;
	    var animate_fast = 30;
	    var animate_immediate = 0;

	    // INTERACTIVITY FUNCTIONS
	    function deselect_all (all_bars_set) {
		var i, j;
		for (i in all_bars_set.items){
		    var bar = all_bars_set.items[i];
		    bar.selected = 0;
		    bar.alr_selected = 0;
		    
		    for (j in bar.linkset.items) {
			bar.linkset.items[j].selected = 0;
		    }
		}
		return false;
	    }

	    function reset_colors (all_bars_set) {	
		var i;
		for (i in all_bars_set.items) {
		    var bar = all_bars_set.items[i];
		    bar.own_label.attr({"fill": deselected_font_color});
		    
		    // return to bar's original color, depending on if bar is
		    // on left or right
		    if (bar.attrs.x > width/2) { // bar is on right
			bar.animate({"fill": incoming_color, 
				     "fill-opacity": 1.0,
				     "stroke-opacity": 0}, animate_fast);
		    }
		    else { // bar is on left
			bar.animate({"fill": outgoing_color, 
				     "fill-opacity": 1.0,
				     "stroke-opacity": 0}, animate_fast);		
		    }
		    
		    if (bar.linkset.items.length !== 0){
			bar.linkset.animate({"fill": deselected_fill_color,
					     "fill-opacity": deselected_fill_opacity}
					    , animate_fast).toBack();
		    }
		}
		return false;
	    }
	    
	    
	    function node_clicked (bar, color) {
		function event_handler (event) {
		    // if it was already selected, a second click should
		    // deselect it
		    if (bar.selected === 1){
			node_deselected(bar);
		    }
		    else {
			node_selected(bar, color);
		    }
		}
		return event_handler;
	    }

	    function node_deselected (bar) {
		// count total number of bars with selected === 1
		var count_selected = 0;
		var i;
		for (i in bar.all_bars_set.items) {
		    if (bar.all_bars_set.items[i].selected === 1){
			count_selected += 1;
		    }
		}
		// if this was the only bar selected, deselecting it is the
		// same as reset all
		if (count_selected === 1) {
		    deselect_all(bar.all_bars_set);
		    reset_colors(bar.all_bars_set);
		}
		
		// otherwise
		else {	    
		    var bish = false;
		    if (bar.attrs.x > width/2) { // bar is on right
			for (i in bar.linkset.items) {
			    // selected can only be 2 or 1 
			    // if start bar is not selected by another
			    // link, then return it to dim
			    if (bar.linkset.items[i].start_bar.alr_selected === 0 && 
				bar.linkset.items[i].start_bar.selected === 2) {

				bar.linkset.items[i].start_bar.selected = -1;
				bar.linkset.items[i].start_bar.animate(
				    {"fill": outgoing_color,
				     "fill-opacity": dimmed_bar_opacity});
				bar.linkset.items[i].start_bar.own_label.attr(
				    {"fill": dimmed_font_color});				
			    }

			    // if start bar is not selected by another
			    // link, BUT start bar itself is selected,
			    // let selected remain as === 1
			    else if (bar.linkset.items[i].start_bar.alr_selected === 0 &&
				     bar.linkset.items[i].start_bar.selected === 1) {
				// selected remains as === 1;
				bar.linkset.items[i].start_bar.alr_selected = 0;
			    }

			    else {
				bar.linkset.items[i].start_bar.alr_selected -= 1;

			    }
			    
			    // if link has only been selected once by this
			    // node, then we can deselect it
			    if (bar.linkset.items[i].selected === 1) {
				bar.linkset.items[i].selected = 0;
				bar.linkset.items[i].toBack();
				bar.linkset.items[i].animate(
				    {"fill": deselected_fill_color, 
				     "fill-opacity": deselected_fill_opacity}
				    , animate_fast);
			    }

			    else { // if link has been selected by something
				// else, return it to that color; bar
				// should remain as selected state = 2
				bar.linkset.items[i].selected -= 1;
				bar.linkset.items[i].insertBefore(bar.linkset.items[i].start_bar);
				bar.linkset.items[i].animate(
				    {"fill": outgoing_color,
				     "fill-opacity": selected_fill_opacity}, 
				    animate_fast
				);
				bish = true;
			    }
			}
		    }
		    
		    else { // bar is on left
			for (i in bar.linkset.items) {

			    if (bar.linkset.items[i].end_bar.alr_selected === 0 && 
				bar.linkset.items[i].end_bar.selected === 2) {

				bar.linkset.items[i].end_bar.selected = -1;
				bar.linkset.items[i].end_bar.animate(
				    {"fill": incoming_color,
				     "fill-opacity": dimmed_bar_opacity});
				bar.linkset.items[i].end_bar.own_label.attr(
				    {"fill": dimmed_font_color});
			    }
			    else if (bar.linkset.items[i].end_bar.alr_selected === 0 &&
				     bar.linkset.items[i].end_bar.selected === 1) {
				bar.linkset.items[i].end_bar.alr_selected = 0;
			    }
			    else {
				bar.linkset.items[i].end_bar.alr_selected -= 1;
				
			    }
			    
			    
			    if (bar.linkset.items[i].selected === 1) {
				bar.linkset.items[i].selected = 0;
				bar.linkset.items[i].toBack();
				bar.linkset.items[i].animate(
				    {"fill": deselected_fill_color, 
				     "fill-opacity": deselected_fill_opacity}
				    , animate_fast
				);
			    }
			    else { 
				bar.linkset.items[i].selected -= 1;
				bar.linkset.items[i].insertBefore(bar.linkset.items[i].end_bar);
				bar.linkset.items[i].animate(
				    {"fill": incoming_color,
				     "fill-opacity": selected_fill_opacity}, 
				    animate_fast
				);
				bish = true;
			    }
			}
		    }
		    
		    if (bish) {
			bar.selected = 2;
			bar.alr_selected -= 1;
			bar.attr({"stroke-opacity": 0});
		    }
		    else {
			bar.selected = -1;
			bar.own_label.attr({"fill": dimmed_font_color});
			bar.attr({"fill-opacity": dimmed_bar_opacity,
				  "stroke-opacity": 0});
		    }
		}
	    }
	    
	    function node_selected (bar, color) {
		var i;
		if (bar.selected === 2) {
		    bar.alr_selected += 1;
		}

		bar.selected = 1;


		// (1): change color of links in linkset
		bar.linkset.animate({"fill": color,
				     "fill-opacity": selected_fill_opacity
				    }, animate_slow).toFront();
		// (2): this goes after (1) so that the bar appears on top of
		// the links
		bar.animate({"fill-opacity": default_bar_opacity,
			     "stroke": selected_stroke_color,
			     "stroke-width": space_btw_bars,
			     "stroke-opacity": 1.0}, animate_slow).toFront();	    
		
		bar.own_label.attr({"fill": selected_font_color});

		// for each link, set selected state
		for (i in bar.linkset.items) {
		    if (bar.linkset.items[i].selected === 1) {
			bar.linkset.items[i].selected += 1;
		    }
		    else {
			bar.linkset.items[i].selected = 1;

		    }
		}
		
		// for each link's start bar or end bar, set selected state
		// and animate 
		if (bar.attrs.x > width/2) { // if selected bar is on right
		    for (i in bar.linkset.items) {
			
			// if bar already selected by another node, increase
			// it's alr_selected count (to keep track of no. of
			// nodes that are simultaneously selecting this node
			if (bar.linkset.items[i].start_bar.selected === 1 || 
			    bar.linkset.items[i].start_bar.selected ===2) {
			    bar.linkset.items[i].start_bar.alr_selected += 1;
			}
			else { // 0 or -1
			    bar.linkset.items[i].start_bar.selected = 2;
			    bar.linkset.items[i].start_bar.alr_selected = 0;
			}

			bar.linkset.items[i].start_bar.animate(
			    {"fill": outgoing_color,
			     "fill-opacity": default_bar_opacity}
			    ,animate_slow).toFront();
			
			bar.linkset.items[i].start_bar.own_label.animate(
			    {"fill": selected_font_color}, animate_slow);
		    }
		}
		
		else { // if selected bar is on left
		    // SAME AS ABOVE, except direction is switched
		    for (i in bar.linkset.items){
			
			// changed: end_bar instead of start_bar
			if (bar.linkset.items[i].end_bar.selected === 1 || 
			    bar.linkset.items[i].end_bar.selected === 2) {
			    bar.linkset.items[i].end_bar.alr_selected += 1;
			}
			else{
			    bar.linkset.items[i].end_bar.selected = 2;
			    bar.linkset.items[i].end_bar.alr_selected = 0;
			}

			bar.linkset.items[i].end_bar.animate(
			    {"fill": incoming_color, // changed
			     "fill-opacity": default_bar_opacity}
			    , animate_slow).toFront();

			bar.linkset.items[i].end_bar.own_label.animate(
			    {"fill": selected_font_color}, animate_slow);
		    }
		}
		
		// dim bars that are not selected
		for (i in bar.all_bars_set.items) {
		    var thing = bar.all_bars_set.items[i];
		    // if bar is neither primarily or secondarily selected, it
		    // should go to dim state
		    if (thing.selected !==1 && thing.selected !==2) {
			thing.animate({"fill-opacity": dimmed_bar_opacity}
				      , animate_slow);
			thing.own_label.animate({"fill": dimmed_font_color}
						, animate_slow);
			thing.selected = -1;
		    }
		}		
	    }
	    
	    function node_hover_in (bar) {
		function event_handler (event) {
		    bar.animate({"fill-opacity": selected_fill_opacity}
				, animate_fast);
		    bar.own_label.animate({"fill": selected_font_color}
					  , animate_fast);
		    // only if it's dimmed (selected = -1) or not
		    // selected (selected = 0)
		    if (bar.selected <= 0) {
			// highlight links when hovering over node
			bar.linkset.animate({"fill-opacity": hover_fill_opacity}
					    , animate_fast);
		    }
		}
		return event_handler;
	    }
	    
	    function node_hover_out (bar) {
		function event_handler (event) {
		    if (bar.selected >= 1) {
			// either selected primarily or secondarily (connected)
			bar.animate({"fill-opacity": default_bar_opacity}
				    , animate_fast);
		    }
		    else if (bar.selected === -1) { 
			// go to dim
			bar.linkset.animate({"fill":deselected_fill_color,
					     "fill-opacity":deselected_fill_opacity},
					    animate_fast);
			bar.animate({"fill-opacity": dimmed_bar_opacity}
				    , animate_fast);
			bar.own_label.animate({"fill": dimmed_font_color}
					      , animate_fast);	
		    }
		    else { // selected === 0 or undefined
			// original state
			bar.own_label.animate({"fill":deselected_font_color}
					      , animate_fast);
			bar.animate({"fill-opacity": default_bar_opacity}
				    , animate_fast);
			bar.linkset.animate({"fill": deselected_fill_color,
					     "fill-opacity":deselected_fill_opacity}
					    , animate_fast);
		    }
		}
		return event_handler;
	    }
	    
	    // interactivity
	    var i;
	    for (i in this.l_bar_set.items) {
		var l_bar = this.l_bar_set.items[i];
		// save sets as bar attributes
		l_bar.all_bars_set = this.all_bars_set;

		if (l_bar.selected === 1) {
		    // deselect_all(l_bar.all_bars_set);
		    node_selected(l_bar, outgoing_color);
		}
		l_bar.alr_selected = 0;
		// call interactive functions
		l_bar.click(node_clicked(l_bar, outgoing_color));	 
		l_bar.hover(node_hover_in(l_bar),
			    node_hover_out(l_bar));

		l_bar.own_label.click(node_clicked(l_bar, outgoing_color));
		l_bar.own_label.hover(node_hover_in(l_bar),
				      node_hover_out(l_bar));

	    }

	    for (i in this.r_bar_set.items) {
		var r_bar = this.r_bar_set.items[i];
		// save sets as bar attributes
		r_bar.all_bars_set = this.all_bars_set;

		if (r_bar.selected === 1) {
		    // deselect_all(r_bar.all_bars_set);
		    node_selected(r_bar, incoming_color);
		}

		r_bar.alr_selected = 0;
		// call interactive functions
		r_bar.click(node_clicked(r_bar, incoming_color));	   
		r_bar.hover(node_hover_in(r_bar),
			    node_hover_out(r_bar));

		r_bar.own_label.click(node_clicked(r_bar, incoming_color));
		r_bar.own_label.hover(node_hover_in(r_bar),
				      node_hover_out(r_bar));

	    }
	    
	    // background interactivity 
	    var all_bars_set = this.all_bars_set;
	   
	    this.background.click(function(event) {
		deselect_all(all_bars_set);
		reset_colors(all_bars_set);
		return false;
	    });
	    
	    this.clickable_links.click(function(event) {
		deselect_all(all_bars_set);
		reset_colors(all_bars_set);
		return false;
	    });
	};

	self.save_elements = function() {
	    var elements = [this.l_bar_set, this.r_bar_set, this.all_links_set];
	    return elements;
	};

        // return instance
        return self;
    };

    
    var Flow = function(json){
	var self = __new__.Flow();
	self.__init__(json);
	return self;
    };
    
    return {
	"WeightedDirectedSpring": WeightedDirectedSpring,
	"Flow": Flow
	};
}());