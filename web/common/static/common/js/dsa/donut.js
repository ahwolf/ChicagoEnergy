
var Donut = function () {

    var Slice = function (list, id, label, value) {

	// make a fresh object
	var self = DsA.VisualItem(list, id);

	self.label = label;
	self.value = value;

	self.path = function (dr_factor) {
	    dr_factor = dr_factor || 1;
	    var index=self.container.id2index[self.id];
	    var cx = self.container.cx, 
	        cy = self.container.cy, 
	        r_inner = self.container.r_inner,
	        r_outer = dr_factor*self.container.r_outer+(1-dr_factor)*r_inner, 
	        inner_adjust = 90 * self.container.stroke_width / (Math.PI * r_inner),
	        outer_adjust = 90 * self.container.stroke_width / (Math.PI * r_outer),
	        endAngle_outer = self.container.angles[index+1] - outer_adjust,
	        startAngle_outer = self.container.angles[index] + outer_adjust, 
	        endAngle_inner = self.container.angles[index+1] - inner_adjust,
	        startAngle_inner = self.container.angles[index] + outer_adjust, 
	        rad = Math.PI/180,
	        x1 = cx + r_outer * Math.cos(startAngle_outer * rad),
                x2 = cx + r_outer * Math.cos(endAngle_outer * rad),
	        x3 = cx + r_inner * Math.cos(endAngle_inner * rad),
                x4 = cx + r_inner * Math.cos(startAngle_inner * rad),
                y1 = cy + r_outer * Math.sin(startAngle_outer * rad),
                y2 = cy + r_outer * Math.sin(endAngle_outer * rad),
                y3 = cy + r_inner * Math.sin(endAngle_inner * rad),
	        y4 = cy + r_inner * Math.sin(startAngle_inner * rad);
	        return ["M", x4, y4, 
			"L", x1, y1, 
			"A", r_outer, r_outer, 0, +(endAngle_inner - startAngle_inner > 180), 1, x2, y2, 
			"L", x3, y3,
			"A", r_inner, r_inner, 0, +(endAngle_inner - startAngle_inner > 180), 0, x4, y4, 
			"Z"];
	};
	
	// --------------------------------------------------- label attributes
	self.get_radial_coordinates = function (element) {
	    
	    // temporarily unrotate element
	    var rotation = element.attr('rotation');
	    element.attr('rotation',0);

	    // move 
	    var index=self.container.id2index[self.id],
	        r_outer = self.container.r_outer,
	        endAngle = self.container.angles[index+1],
	        startAngle = self.container.angles[index], 
	        cx = self.container.cx,
	        cy = self.container.cy,
	        delta = self.container.label_offset,
	        popangle = (startAngle + endAngle) / 2.0,
	        bb = element.getBBox(),
	        r = r_outer+delta+0.5*bb.width,
	        x = cx + r*Math.cos(popangle*Math.PI/180),
	        y = cy + r*Math.sin(popangle*Math.PI/180);
	    element.attr('rotation',rotation);
	    return {'x':x,'y':y};
	};

	self.label_attrs = function (canvas) {
	    var index=self.container.id2index[self.id];
 	    var cx = self.container.cx, 
	        cy = self.container.cy, 
	        r_outer = self.container.r_outer, 
	        r_inner = self.container.r_inner,
	        endAngle = self.container.angles[index+1],
	        startAngle = self.container.angles[index], 
	        rad = Math.PI/180,
	        delta = self.container.label_offset,
	        popangle = (startAngle + endAngle) / 2.0,
	        x = cx + (r_outer + delta) * Math.cos(popangle * rad),
	        y = cy + (r_outer + delta) * Math.sin(popangle * rad),
	        rotation=0;

	    // deal with nonsense for radial or tangential labels
	    if (self.container.label_orientation === "tangential") {
		rotation = popangle;
		rotation = (rotation + 90) % 360;
		if (!self.container.allow_upsidedown_label 
		    && 90<rotation && rotation<270) {
		    rotation = (rotation + 180) % 360;
		};
	    } else if (self.container.label_orientation === "radial") {
		// rotate
		rotation = (popangle) % 360;
		if (!self.container.allow_upsidedown_label 
		    && 90<rotation && rotation<270) {
		    rotation = (rotation + 180) % 360;
		};
	    } else if (self.container.label_orientation === "arched") {
		// this is entirely handled in the instantiate_element method
	    };

	    return {
		'x': x,
		'y': y,
		'rotation': rotation
	    };
	};

	// tweek VisualItem.get_attr to get the correct thing for
	// arched labels
	self.get_attr = function (element_type) {
	    var attrs = self.get_attr_defaults(
	        element_type,
		self.container.item_attrs,
		self.container.item_default_attrs
	    );
	    if (element_type === "label" && 
		self.container.label_orientation === "arched") {
		delete attrs["x"];
		delete attrs["y"];
		delete attrs["text"];
		delete attrs["rotation"];
	    };
	    return attrs;
	};

		
	// tweek VisualItem.instantiate_element to get the correct
	// type of element
	self.instantiate_element = function (element_type, attrs) {
	    var element_graphic_type = self.container.graphic_type[element_type],
	        element = self.container.canvas[element_graphic_type]().attr(attrs);

	    if (element_type==="label") {
		if (self.container.label_orientation === "radial") {

		    // change this element's location
		    var coordinates = self.get_radial_coordinates(element);
		    element.attr(coordinates);

		    // specify this in the attr dict so things are
		    // updated properly
		    self.set_attr("label", coordinates);
		} else if (self.container.label_orientation === "arched") {

		    // get rid of the old element
		    element.remove();

		    // determine whether characters need to be reversed.
		    var i = self.container.id2index[self.id],
			angle = (0.5*(self.container.angles[i]+self.container.angles[i+1]))%360,
			reverse_characters = false;
		    if (!self.container.allow_upsidedown_label && 0<angle && angle<180) {
			reverse_characters = true;
		    };
		
		    // find the width of each character
		    var c, chars=[], text=self.container.labels[self.id],
			char_widths=[], width=0;
		    var element = self.container.canvas.set();
		    if (reverse_characters) {
			var reverse_chars = [];
			for (var j=text.length-1;j>=0;j--) {
			    reverse_chars.push(text[j]);
			};
			text = reverse_chars;
		    };
		    for (var j=0;j<text.length;j++) {
			c = self.container.canvas.text(self.container.cx, 
						       self.container.cy,
						       text[j]);
			c.attr(self.label_attrs());
			chars.push(c);
			char_widths.push(c.getBBox().width);
			width += c.getBBox().width;
		    };

		    // hack to set the width of a ' ' char to be the
		    // average width of all characters.
		    var space_width = width/char_widths.length;
		    for (var j=0;j<char_widths.length;j++) {
			if (char_widths[j]===0) {
			    char_widths[j] = space_width;
			    width += space_width;
			};
		    };

		    // find location, relative to usual placement
		    var relative_location = [];
		    if (char_widths.length>=1) {
			relative_location.push(0.5*char_widths[0]);
		    };
		    for (var j=1;j<char_widths.length;j++) {
			relative_location.push(0.5*char_widths[j-1]
					       +0.5*char_widths[j]
					       +relative_location[j-1]);
		    };
		    for (var j=0;j<relative_location.length;j++) {
			relative_location[j] -= 0.5*width;
		    };
		
		    // find corresponding rotation angles for these characters
		    var dthetas = [], 
			R=self.container.r_outer+self.container.label_offset;
		    for (var j=0;j<char_widths.length;j++) {
			dthetas.push(relative_location[j]/R*180/Math.PI);
		    };
		
		    // place each character
		    var x, y, theta,
			cx = self.container.cx,
			cy = self.container.cy;
		    for (var j=0;j<chars.length;j++) {
			theta = angle+dthetas[j];
			chars[j].attr({
				"x":cx+R*Math.cos(theta*Math.PI/180),
				"y":cy+R*Math.sin(theta*Math.PI/180)
			});
		    
			theta = (theta + 90) % 360;
			if (reverse_characters) {
			    theta = (theta + 180) % 360;
			};
			chars[j].rotate(theta);
		    };
		
		    // add characters back to the element
		    for (var j=0;j<chars.length;j++) {
			element.push(chars[j]);
		    };
		    element.toFront();

		    // style things accordingly
		    var attr = self.get_attr("label");
		    element.attr(attr);
		};
	    };

	    return element;

	};


	return self;
    };

    var Chart = function(id, json_data) {

	// make a fresh object
	var self = DsA.Visual(id),
	    i;	

	self.cx = json_data["cx"] || 0;
	self.cy = json_data["cy"] || 0;
	self.r_inner = json_data["r_inner"] || 150;
	self.r_outer = json_data["r_outer"] || 200;
	self.stroke = json_data["stroke"] || "white";
	self.fill_opacity = json_data["fill_opacity"] || 1;
	self.fadein_time = json_data["fadein_time"] || 500; // ms
	self.fadeout_time = json_data["fadeout_time"] || 500; // ms
	self.label_size = json_data["label_size"] || 10;
	self.label_offset = json_data["label_offset"] || 10;
	self.label_orientation = json_data["label_orientation"] || "normal";
	self.allow_upsidedown_label = json_data["allow_upsidedown_label"];
	if (self.allow_upsidedown_label === undefined) {
	    self.allow_upsidedown_label = false;
	};
	slice_type = json_data["slice_type"] || Slice;

	self.midtxt_visible = true;
	if(json_data["midtxt_visible"]!==undefined) {
	    self.midtxt_visible = json_data["midtxt_visible"];
	};
	self.label_dim_opacity = 0.25;
	if(json_data["label_dim_opacity"]!==undefined) {
	    self.label_dim_opacity = json_data["label_dim_opacity"];
	}
	self.start_angle = 270;
	if(json_data["start_angle"]!==undefined) {
	    self.start_angle = json_data["start_angle"];
	}
	self.stroke_width = 2;
	if(json_data["stroke-width"]!==undefined) {
	    self.stroke_width = json_data["stroke-width"];
	};
	
	// values, labels are required
	if (json_data["values"] === undefined || json_data["labels"] === undefined) {
	    throw("missing argument 'values', 'labels' in Donut.Chart");
	};
	if (json_data["values"].length !== json_data["labels"].length) {
	    throw("'values' and 'labels' must have the same length");
	};
	self.values = json_data["values"];
	self.labels = json_data["labels"];

	self.set_default_attr("symbol", {
	    "stroke": self.stroke,
	    "stroke-width": self.stroke_width,
	    "fill-opacity": self.fill_opacity,
	    "fill": "yellow"
	});

	self.set_default_attr("label", {
	    "fill": "black",
	    "text": "",
	    "x": self.cx,
	    "y": self.cy
	});

	self.set_default_visibility("symbol", true);
	self.set_default_visibility("label", true);
	self.set_default_tag_visibility("label", "H", true);
	self.set_default_tag_visibility("label", "H__11", false);
	self.set_default_tag_visibility("label", "H__1M", false);
	self.set_default_tag_visibility("label", "H__M1", true);
	self.set_default_tag_visibility("label", "H__MM", false);
	self.set_default_tag_visibility("label", "S", true);
	self.set_default_tag_visibility("label", "S__11", true);
	self.set_default_tag_visibility("label", "S__1M", false);
	self.set_default_tag_visibility("label", "S__M1", true);
	self.set_default_tag_visibility("label", "S__MM", false);
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
	self.set_default_tag_attr("symbol", "H", {"stroke":"black"});
	self.set_default_tag_attr("symbol", "H__11", {"stroke":"black"});
	self.set_default_tag_attr("symbol", "H__1M", {"stroke":"black"});
	self.set_default_tag_attr("symbol", "H__M1", {"stroke":"black"});
	self.set_default_tag_attr("symbol", "H__MM", {"stroke":"black"});
	self.set_default_tag_attr("symbol", "S", {"fill-opacity":1.0});
	self.set_default_tag_attr("symbol", "S__11", {"fill-opacity":1.0});
	self.set_default_tag_attr("symbol", "S__1M", {"fill-opacity":1.0});
	self.set_default_tag_attr("symbol", "S__M1", {"fill-opacity":1.0});
	self.set_default_tag_attr("symbol", "S__MM", {"fill-opacity":1.0});
	self.set_default_interactivity("symbol", true);
	self.set_default_interactivity("label", true);

	var element_type;
	
	self.order = json_data["order"];
	
	json_data["values"];
	json_data["labels"];

	json_data["slice_attr"];
	json_data["slice_tag_attr"];

	for (element_type in json_data["slice_default_attr"]) {
	    self.set_default_attr(
	        element_type,
		json_data["slice_default_attr"][element_type]
	    );
	};
	json_data["slice_default_tag_attr"];
	json_data["slice_visibility"];
	json_data["slice_tag_visibility"];

	for (element_type in json_data["slice_default_visibility"]) {
	    self.set_default_visibility(
	        element_type,
		json_data["slice_default_visibility"][element_type]
	    );
	};

	json_data["slice_default_tag_visibility"];

	json_data["slice_interactivity"];
	json_data["slice_tag_interactivity"];
	json_data["slice_default_interactivity"];
	json_data["slice_default_tag_interactivity"];



	self.graphic_type = {
	    "symbol": 'path',
	    "label": 'text'
	};
	self.graphic_type_order = ["symbol","label"];

	
	self.calculate_angles = function () {
	    var i, id, total=0, length=json_data["order"].length;
	    for (i=0; i<length; i++) {
		id=json_data["order"][i];
		total += self.values[id];
	    };
	    total = total * 1.000001; //increment a small amount to
				      //avoid problems
	    var angle=self.start_angle, 
	    angles=[angle];
	    for (i=0; i<json_data["order"].length; i++) {
		id = json_data["order"][i];
		angle += 360 * self.values[id]/total;
		angles.push(angle);
	    };
	    return angles;
	};

	self.angles = self.calculate_angles();

	self.id2index = {};
	var i, id, length = json_data["order"].length, item;
	for (i=0; i<length; i++) {
	    id = json_data["order"][i];
	    self.id2index[id] = i;
	    item = Slice(self, id,
			 json_data["labels"][id],
			 json_data["values"][id]);

	    self.items[id] = item;
	    item.set_attr("symbol", {
		"path": item.path()
	    });

	    // set label text first before dilly-dallying with
	    // position and rotation
	    item.set_attr("label", { 
		"text": json_data["labels"][id]
	    });
	    item.set_attr("label", item.label_attrs());
	    item.set_tag_attr("symbol", "S", {"path":item.path(2)});
	};

	self.draw = function (canvas) {
	    var i, id;

	    // store reference to canvas that this is drawn on
	    self.canvas = canvas;

	    // draw the slices
	    var i, id, length = json_data["order"].length, item;
	    for (i=0; i<length; i++) {
		id = json_data["order"][i];
		self.items[id].draw();
	    };

	    
	    return self;
	};
	
	return self;
    };
    
    // these are public
    return {
	"Chart": Chart
    };
}();
