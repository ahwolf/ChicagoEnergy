var SelectorLegend = function () {

    var format_number = Utilities.comma_format_number;

    var Caption = function (div_id, json) {
	var self = {};

	// attributes
	self.div_id = div_id;
	self.details_id = self.div_id + "_details";
	self.json = json;

	// attributes that could be specified in json with a bit more thought
	self.font_size = 10;

	// relevant jquery elements
	self.div = $('#' + self.div_id);

	// add the html elements to this div_id using jquery
	self.div.append("<p class=\"legend_caption\"></p>");
	self.div.append("<div id=\""+self.details_id+"\""
			+" class=\"legend_detail\"></div>");

	// remember the details element
	self.details = self.div.find('#' + self.details_id);

	self.set_caption_content = function (description, details) {

	    // render caption description
	    self.div.find("p.legend_caption").html(description);

	    // render details on demand
	    if (details !== undefined) {

	    	// add a 'more' link
	    	self.div.find("p.legend_caption")
		    .append("<br/><a href=\"#"+self.details_id+
			    "\" class=\"details\">Click for more details.</a>");

	    	// add content to the details on demand div, but make
	    	// it hidden by default
	    	self.details.html(details);
		self.details.hide();

	    	// create the tooltip
	    	self.div.find("p.legend_caption a.details").tooltip({ 
	    	    "bodyHandler": function() { 
	    		return $($(this).attr("href")).html();
	    	    }, 
		    "events":{
			"def": "click,mouseleave"
		    },
		    "showURL": false,
		    "position": "top left",
		    "offset": [10,-3]
	    	});
	    };
	};

	self.draw = function () {
	    self.set_caption_content(
		self.json["description"],
		self.json["details"]
	    );
	};

	return self;
    };

    var SelectorBase = function (div_id, json) {
	var self = Caption(div_id, json);

	// attributes
	self.visual_id = self.div_id + "_visual";
	self.metric = null;

	// attributes that could be specified in json with a bit more thought
	self.label_color = "#505050";

	// add the html elements to this div_id using jquery
	self.div.prepend("<div id=\""+self.visual_id+"\""
			 +" class=\"legend_visual\"></div>");
	self.div.prepend("<select class=\"legend_selector\"></select>");

	self.build_select_box = function () {

	    // add content to the drop down menu
	    var metric_type, metric, index;
	    var decorated = [];
	    for (metric_type in self.json["metrics"]) {
		metric = self.json["metrics"][metric_type];
		index = self.json["metrics"][metric_type]["index"];
		decorated.push([index, metric_type, metric]);
	    };
	    
	    // sort the decorated list
	    decorated.sort();
	    
	    // build the select box (MANUALLY!!!)
	    var i, metric;
	    for (i in decorated) {
		metric_type = decorated[i][1];
		metric = decorated[i][2];
		var h = "<option value=" + metric_type + ">"
		    + metric["name"]
		    +"</option>";
		self.div.find("select.legend_selector").append(h);
	    };
	    
	};

	self.draw_caption = function (metric) {

	    self.set_caption_content(
		self.json["metrics"][metric]["description"],
		self.json["metrics"][metric]["details"]
	    );

	};

	self.update_selected_option = function () {
	    self.div.find("select option:selected").removeAttr("selected");
	    self.div.find("select option[value="+self.metric+"]")
	        .attr("selected", "selected");
	};

	self.set_value_min_max = function (metric, json, scale) {

	    scale = scale || "linear";

	    // make the list of values and find the maximum and minimum
	    self.min_value=Infinity;
	    self.max_value=-Infinity;
	    self.has_null_value=false;
	    self.has_nonpositive_values=false;
	    self.has_infinite_positive_values=false;
	    var index=self.json["metrics"][metric]["index"];
            var id, value;
	    for (id in json) {

		// if the value is null, remember that we have null
		// values here and do not consider it for finding the
		// min and max
		value = json[id][index];
		if (value === null) {
		    self.has_null_value = true;
		    continue;
		};

		if (scale === "linear") {
		    // don't do anything
		} else if (scale ==="logarithmic") {

		    // if the value is less than zero, logs don't make
		    // sense. ignore this value
		    if (value <= 0) {
			self.has_nonpositive_values = true;
			continue;
		    } else if (value==Infinity) {
			self.has_infinite_positive_values = true;
		    };
		    value = Math.log(value);

		} else {
		    throw("scale '" + scale + "' is not understood --- meeeh");
		};

		if (value > self.max_value) {
		    self.max_value = value;
		};
		if (value < self.min_value) {
		    self.min_value = value;
		};
	    };
	};

	return self;
    };

    var Size = function (div_id, json) {
	var self = SelectorBase(div_id, json);

	// attributes that could be specified in json with a bit more thought
	self.fill_opacity = 0.8;

	// set instance variables
    	self.metadata = self.json["metadata"];

    	self.canvas = Raphael(self.visual_id,
			      self.metadata["width"],
			      self.metadata["height"]);

	self.min_size = self.json["metadata"]["min_size"] || 4;
	self.max_size = self.json["metadata"]["max_size"] || 20;
	self.null_size = 0.5*self.min_size;
	self.min_value = null;
	self.max_value = null;
	self.has_null_value = false;

	// build the select box
	self.build_select_box();

	// define methods
	self.value2size = function (value) {
	    if (value === null) {
		return self.null_size;	    
	    } else if (self.max_value === self.min_value) {
		return 0.5*(self.min_size + self.max_size);
	    } else {
		return (self.max_size - self.min_size) * Math.sqrt(value / self.max_value) + self.min_size;
	    };
	};

	self.draw = function (metric, json) {

	    // clear that canvas
	    self.canvas.clear();

	    // set the current metric
	    self.metric = metric;

	    // get the list of values for this metric
	    self.set_value_min_max(metric, json);

	    // // if the number of unique values is less than the number
	    // // of symbols, use the number of unique values as the
	    // // number of symbols
	    // var n_symbols = self.metadata["n_symbols"];
	    // var n_unique_values = self.n_unique_values(metric, json);
	    // if (n_unique_values < n_symbols) {
	    // 	n_symbols = n_unique_values;
	    // };

	    // if there are null values in this legend, add the N/A
	    // entry to the legend
	    var n_symbols = self.metadata["n_symbols"];
	    var data=[];
	    if (self.has_null_value) {
		self.min_value = 0;
		data.push([null, self.value2size(null)]);

		// if there are actually no values, then only show the
		// null value of the legend
		if (self.min_value>self.max_value) {
		    n_symbols = 0;
		};

	    };

	    // build the list of symbols
	    var i;
	    var value=self.min_value;
	    var delta=(self.max_value-self.min_value) / (n_symbols-1);
	    if (delta == 0) {
		self.max_value = self.min_value + n_symbols;
		delta = 1;
	    };
	    if (isFinite(delta)) {
		data.push([value, self.value2size(value)]);
		for (i=1; i<n_symbols; i++) {
		    value += delta;
		    data.push([value, self.value2size(value)]);
		};
	    };

	    // determine the spacing between symbols by starting with the
	    // width and subtracting the diameter of each symbol
	    var spacing = self.metadata["width"];
	    var n = n_symbols;
	    if (self.has_null_value) {
		n += 1;
	    };
	    for (var i in data) {
		spacing -= 2*data[i][1];
	    };
	    if (spacing<0) {
		throw("sizes too big");
	    };
	    spacing /= (n + 1);

	    // add legend contents
	    var y_space = (self.metadata["height"] 
			   - 1.5*self.font_size - 2*data[n-1][1]) / 2;
	    var y_text = y_space + 0.5*self.font_size;
	    var y = y_text + self.font_size + data[n-1][1];
	    var x = 0;
	    var circle, label, r;
	    for (var i in data) {
		r = data[i][1];
		x += spacing + r;
		
		circle = self.canvas.circle(x, y, r)
		    .attr({"fill-opacity": self.fill_opacity,
			   "fill": self.metadata["fill"],
			   "stroke": self.metadata["stroke"],
			   "r": r});
		// if (data[i][0] === 1) {
		//     circle.attr({"stroke-dasharray": '- ',
		//     		"fill":"none"});
		// };
		label = self.canvas.text(x, y_text, format_number(data[i][0]))
		    .attr({"fill": self.label_color, 
			   "font-size": self.font_size});
		
		x += data[i][1];

	    };
	    
	    // add the description for the active element
	    self.draw_caption(metric);

	    // select the correct option in the selector dropdown
	    self.update_selected_option();
	
	    return self;
	};
	
	return self;
    };

    var Color = function (div_id, json, type) {
	var self = SelectorBase(div_id, json, type);

	// set instance variables
	self.metadata = self.json["metadata"];

	self.canvas = Raphael(self.visual_id,
			      self.metadata["width"],
			      self.metadata["height"]);

	self.stroke = self.metadata["stroke"] || "white";

	self.null_color = self.metadata["null_fill_color"] || "black";

	// build the select box
	self.build_select_box();
    
	// define methods
	self.value2color = function (value) {
	    var colors = self.json["metrics"][self.metric]["colors"];
	    var range = self.max_value - self.min_value;

	    // if the value is null or the range is 0, return the null color
	    if (value === null) {
		return self.null_color;
	    };
	    var i;
	    var tiny = 0.000001*range;
	    var metric_metadata=self.json["metrics"][self.metric]["metadata"];
	    if (metric_metadata["scale"]==="logarithmic") {
		if (value <= Math.exp(self.min_value)) {
		    return colors[0];
		} else if (value >= Math.exp(self.max_value)) {
		    return colors[colors.length-1];
		} else {
		    value = Math.log(value);
		};
	    };
	    var range = self.max_value - self.min_value;

	    // if there is no range, use the middle value
	    i = Math.floor((value-self.min_value)/(range+tiny)*colors.length);
	    return colors[i];
	};

	self.draw = function (metric, json) {

	    // clear that canvas
	    self.canvas.clear();

	    // set the current metric
	    self.metric = metric;

	    // get the list of values for this metric
	    var metric_metadata=self.json["metrics"][self.metric]["metadata"];
	    self.set_value_min_max(metric, json, metric_metadata["scale"]);

	    // make a deep copy of the colors
	    var colors=[];
	    for (var i in self.json["metrics"][metric]["colors"]) {
		colors.push(self.json["metrics"][metric]["colors"][i]);
	    };

	    // null values are present in this view. redefine things
	    // as necessary
	    if (self.has_null_value) {

		// insert the null color to the beginning of the color bar
		colors.unshift(self.null_color);

		// if all values are null, only use one color
		if (self.min_value > self.max_value) {
		    colors = [colors[0]];
		};

		// set the minimum value to the smallest possible value
		if (metric_metadata["scale"] === "logarithmic") {
		    self.min_value = -1;
		} else {
		    self.min_value = 0;
		};

	    };
	    
	    // adjusting range so that minimum and maximum are
	    // equidistant from midpoint
	    if (metric_metadata["type"]==="diverging") {
		var midpoint;
		if (metric_metadata["scale"] === "linear") {
		    midpoint = metric_metadata["midpoint"];
		} else if (metric_metadata["scale"] === "logarithmic") {
		    midpoint = Math.log(metric_metadata["midpoint"]);
		} else {
		    throw("scale '" + metric_metadata["scale"] + "' wrong");
		};
		var min_distance = midpoint - self.min_value;
		var max_distance = self.max_value - midpoint;
		if (min_distance > max_distance) {
		    self.max_value = midpoint + min_distance;
		} else {
		    self.min_value = midpoint - max_distance;
		};
	    };

	    // in the situation where there are some non-null values,
	    // adjust the range such that the we have some scale
	    if (self.min_value >= self.max_value) {
		if (metric_metadata["type"]==="sequential") {
		    self.max_value = self.min_value + 2;
		} else if (metric_metadata["type"]==="diverging") {

		    // values are the same
		    if (isFinite(self.min_value) || isFinite(self.max_value)) {
			var distance = Math.abs(midpoint - self.min_value);
			if (distance == 0) {
			    distance = 1;
			};
			self.min_value = midpoint - distance;
			self.max_value = midpoint + distance;

		    // no non-null values
		    } else {
			self.min_value = midpoint - 1;
			self.max_value = midpoint + 1;
		    };
		} else {
		    throw("what in taaaarnation!");
		};

	    };

	    // determine how tall the legend labels will be
	    var max_label_rows = 1;
	    
	    // quick and dirty legend
	    var dy = 25;
	    var dx = self.metadata["width"]/(colors.length+2);
	    var y_space = (self.metadata["height"] 
			   - dy - (0.5+max_label_rows)*self.font_size)/2;
	    var y_text = y_space + (max_label_rows-0.5)*self.font_size;
	    var y = y_text + self.font_size + dy/2;
	    var x = dx;
	    var rect, label;
	    for (var i in colors) {
		rect = self.canvas.rect(x + (dx-dy)/2, y-dy/2, dy, dy)
		    .attr({"stroke":self.stroke, "fill":colors[i]});
		x += dx;
	    };


	    // add labels --- HOLY HACKAPOTOMIS PART DEUX
	    var label;
	    var mid_value = 0.5*(self.min_value + self.max_value);
	    var min_value = self.min_value;
	    var max_value = self.max_value;
	    if (self.json["metrics"][self.metric]["metadata"]["scale"] === "logarithmic") {
		min_value = Math.exp(min_value);
		mid_value = Math.exp(mid_value);
		max_value = Math.exp(max_value);
		if (!(isFinite(min_value)) || !(isFinite(max_value))) {
		    min_value = null;
		    max_value = null;
		};
	    };
	    if (self.has_null_value) {
		label = self.canvas.text(dx + dx/2, y_text,
					 format_number(null))
	    	    .attr({"fill": self.label_color, 
	    		   "font-size": self.font_size});
	    };
	    if (colors.length>1) {
		label = format_number(min_value);
		if (self.has_nonpositive_values) {
		    label = "<" + label;
		};
		label = self.canvas.text(dx + (1+2*self.has_null_value)*dx/2, y_text,
					 label)
	    	    .attr({"fill": self.label_color, 
	    		   "font-size": self.font_size});
		label = self.canvas.text(dx + (5+2*self.has_null_value)*dx/2, y_text,
					 format_number(mid_value))
	    	    .attr({"fill": self.label_color, 
	    		   "font-size": self.font_size});
		label = format_number(max_value);
		if (self.has_infinite_positive_values) {
		    label = ">" + label;
		};
		label = self.canvas.text(dx + (9+2*self.has_null_value)*dx/2, y_text,
					 label)
	    	    .attr({"fill": self.label_color, 
	    		   "font-size": self.font_size});
	    };

	    // add the description for the active element
	    self.draw_caption(metric);

	    // select the correct thing in the selector
	    self.update_selected_option();
	
	    return self;
	};

	return self;
    };

    return {
	"Caption": Caption,
	"Size": Size,
	"Color": Color
    };
}();