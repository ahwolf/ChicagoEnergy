function update_dict(dict, other) {
    for (key in other) {
	if (other.hasOwnProperty(key)) {
	    dict[key] = other[key];
	};
    };
};

var Legend = function () {

    function line_path (x1, y1, x2, y2) {
	return "M" + x1 + " " + y1 + "L" + x2 + " " + y2;
    };

    function LineWidth(args)
    {
	this.min_width = args["min_width"];
	this.max_width = args["max_width"];
	this.min_opacity = args["min_opacity"];
	this.max_opacity = args["max_opacity"];
	this.min_value = args["min_value"];
	this.max_value = args["max_value"];
	this.x = args["x"];
	this.y = args["y"];
	this.width = args["width"] || 200;
	this.height = args["height"] || 133;
	this.title_text = args["title_text"] || "Line Width Legend";
	this.alt_title_text = args["alt_title_text"] || "Alternate Line Width Legend";
	this.description_text = args["description_text"] || [];
	this.alt_description_text = args["alt_description_text"] || [];
	this.padx = args["padx"] || 10;
	this.pady = args["pady"] || 10;
	var rect_attrs = args["rect_attrs"] || {};
	var title_attrs = args["title_attrs"] || {};
	var line_attrs = args["line_attrs"] || {};
	var label_attrs = args["label_attrs"] || {};
	var description_text_attrs = args["description_text_attrs"] || {};

	// these are the default values in rect_attrs
	this.rect_attrs = {
	    "r": this.padx,
	    "stroke-opacity": 0.25,
	    "stroke-width":2
	};
	update_dict(this.rect_attrs, rect_attrs);

	// these are the default values in title_attrs
	this.title_attrs = {
	    "text-anchor": "start",
	    "font-family": "Arial",
	    "font-weight": "bold",
	    "font-size": 12,
	    "fill": "white"
	};
	update_dict(this.title_attrs, title_attrs);

	this.alt_title_attrs = {
	    "text-anchor": "start",
	    "font-family": "Arial",
	    "font-weight": "bold",
	    "font-size": 12,
	    "fill": "white"
	};
	update_dict(this.alt_title_attrs, title_attrs);

	// these are the default values in the line_attrs
	this.line_attrs = {
	    "stroke": "rgb(0,0,0)"
	};
	update_dict(this.line_attrs, line_attrs);

	this.label_attrs = {
	    "text-anchor": "start",
	    "font-family": "Arial",
	    "font-size": 10,
	    "fill": "rgb(0,0,0)"
	};
	update_dict(this.label_attrs, label_attrs);

	this.description_text_attrs = {
	    "text-anchor": "start",
	    "font-family": "Arial",
	    "font-size": 10,
	    "fill": "rgb(0,0,0)"
	};
	update_dict(this.description_text_attrs, description_text_attrs);
    };
    LineWidth.prototype.set_description = function (raphael, line_list) {
	var i, line, dy, 
	  y = this.title.attr("y") + this.title.getBBox().height + this.pady;
	if (this.description_text_element !== undefined) {
	    this.description_text_element.remove();
	};
	this.description_text_element = raphael.set();
	for (i=0; i<line_list.length; i++) {
	    line = raphael.text(this.x+this.padx, y, line_list[i]);
	    dy = line.getBBox().height;
	    line.attr("y", y-dy/2);
	    line.attr(this.description_text_attrs);
	    y += line.getBBox().height;
	    this.description_text_element.push(line);
	};
	y -= dy/2;
	return y;
    };
    LineWidth.prototype.place_spot_box = function (raphael) {
	var x=this.spot_text.getBBox().x-this.box_radius,
	    y=this.spot_text.getBBox().y-0.5*this.box_radius,
	    width=this.spot_text.getBBox().width+2*this.box_radius,
   	    height=this.spot_text.getBBox().height+this.box_radius;
	if (this.spot_box === undefined) {
	    return raphael.rect(x,y,width,height);
	} else {
	    this.spot_box.attr({"x":x,"y":y,"width":width,"height":height});
	};
    };
    LineWidth.prototype.draw = function (raphael)
    {	
	// make set to hold the entire group of elements
	this.element = raphael.set();
	var labels = raphael.set();
	var lines = raphael.set();
	var values = raphael.set();
	var box_radius = 6;
	var box_shift = -2;

	// create bounding rectangle
	this.rect = raphael.rect(this.x, this.y, this.width, this.height);
	this.rect.attr(this.rect_attrs);
	this.element.push(this.rect);

	// create title
	this.title = raphael.text(this.x+this.padx,this.y,this.title_text);
	this.title.attr(this.title_attrs);
	this.element.push(this.title);
	
	// create a white background behind title (to break the border rect)
	this.title_box = raphael.rect(this.x+this.padx+box_shift,
				      this.y - 0.5*this.title.getBBox().height,
				      this.title.getBBox().width + box_radius,
				      this.title.getBBox().height);
	this.title_box.attr({
		"fill":"rgb(86,34,100)",
		    "stroke": null,
// 		"fill":"white",
// 		    "stroke": "black",
// 		    "stroke-opacity":0.25,
		    "r":box_radius
	    });
	this.title_box.insertBefore(this.title);

	// combine title and title box
	this.title_element = raphael.set();
	this.title_element.push(this.title_box);
	this.title_element.push(this.title);

	// create description (originally use description_text, not
	// alt_description_text)
 	var y = this.set_description(raphael, this.description_text);

	// create min line label
	y = y + this.pady
	this.min_label = raphael.text(this.x + this.padx,
				      y,
				      "min");
	this.min_label.attr(this.label_attrs);
	labels.push(this.min_label);
	this.element.push(this.min_label);
// 	y = this.min_label.attr("y") + this.min_label.getBBox().height/2;
// 	this.min_label.attr("y", y);

	// create min value
	this.min_value = raphael.text(this.x+this.width-this.padx, y, this.min_value.toString());
	this.min_value.attr(this.label_attrs);
	this.min_value.attr("text-anchor", "end");
	values.push(this.min_value);
	this.element.push(this.min_value);

	// 
	var dy = Math.max(this.max_width, this.min_value.getBBox().height) + this.pady;

	// create max line label
	y = this.min_label.attr("y") + 2*dy;
	this.max_label = raphael.text(this.x + this.padx, y, "max");
	this.max_label.attr(this.label_attrs);
	labels.push(this.max_label);
	this.element.push(this.max_label);

	// create max value
	this.max_value = raphael.text(this.x+this.width-this.padx, y, 
				      this.max_value.toString());
	this.max_value.attr(this.label_attrs);
	this.max_value.attr("text-anchor", "end");
	values.push(this.max_value);
	this.element.push(this.max_value);

	// create min line
	this.min_line = raphael.path(line_path(
	    this.max_label.getBBox().x+this.max_label.getBBox().width + this.padx,
	    this.min_label.attr("y"),
            this.max_value.getBBox().x - this.padx,
            this.min_label.attr("y")
	    )
        );
	this.min_line.attr(this.line_attrs);
	this.min_line.attr("stroke-width", this.min_width);
	this.min_line.attr("stroke-opacity", this.min_opacity);
	lines.push(this.min_line);
	this.element.push(this.min_line);

	// create max line
	this.max_line = raphael.path(line_path(
	    this.max_label.getBBox().x+this.max_label.getBBox().width + this.padx,
	    this.max_label.attr("y"),
            this.max_value.getBBox().x - this.padx,
            this.max_label.attr("y")
	    )
        );
	this.max_line.attr(this.line_attrs);
	this.max_line.attr("stroke-width", this.max_width);
	this.max_line.attr("stroke-opacity", this.max_opacity);
	lines.push(this.max_line);
	this.element.push(this.max_line);

	// create spot line
	this.spot_line = raphael.path(line_path(
	    this.max_label.getBBox().x+this.max_label.getBBox().width + this.padx,
	    this.max_label.attr("y")-dy,
            this.max_value.getBBox().x - this.padx,
            this.max_label.attr("y")-dy
	    )
        );
	this.spot_line.attr(this.line_attrs);
	this.spot_line.attr("stroke-width", this.max_width);
	this.spot_line.attr("stroke-opacity", this.max_opacity);
	lines.push(this.spot_line);
	this.element.push(this.spot_line);
	this.spot_line.hide();

	// create alternate title
	this.alt_title = raphael.text(this.x+this.padx,
				      this.y+this.rect.attr("height"),
				      this.alt_title_text);
	this.alt_title.attr(this.alt_title_attrs);
	this.element.push(this.alt_title);
	
	// create a white background behind title (to break the border rect)
	this.alt_title_box = raphael.rect(this.alt_title.getBBox().x+box_shift,
					  this.alt_title.getBBox().y,
					  this.alt_title.getBBox().width+box_radius,
					  this.alt_title.getBBox().height);
	this.alt_title_box.attr({
		"fill":"rgb(86,34,100)",
		    "stroke": null,
// 		"fill":"white",
// 		    "stroke": "black",
// 		    "stroke-opacity":0.25,
		    "r":box_radius
	    });
	this.alt_title_box.insertBefore(this.alt_title);

	// combine title and title box
	this.alt_title_element = raphael.set();
	this.alt_title_element.push(this.alt_title_box);
	this.alt_title_element.push(this.alt_title);

	// change height of bounding rectangle
	this.height = this.max_label.attr("y") + this.max_label.getBBox().height/2 + this.pady - this.y + this.alt_title.getBBox().height/2;
	this.rect.attr("height", this.height);
	this.alt_title.attr("y", this.y + this.height);
	this.alt_title_box.attr("y", this.y + this.height - this.alt_title.getBBox().height/2);

	this.spot_text = raphael.text(this.x+this.width-this.padx,
				      this.max_label.attr("y")-dy,
				      "");
	this.spot_text.attr(this.label_attrs);
	this.spot_text.attr("text-anchor", "end");

	this.box_shift=box_shift;
	this.box_radius=box_radius;
	this.spot_box = this.place_spot_box(raphael);
	this.spot_box.attr({
		"fill":"white",
                "stroke": "black",
		"stroke-width": 1,
		"stroke-opacity": 0.25,
		"r":this.box_radius
		});
	
	this.element.push(this.spot_text);
 	this.element.push(this.spot_box);

	// return the set of elements that make up the legend
	return this.element;
    };
    LineWidth.prototype.show_searchlight = function (raphael, width, opacity, value, attrs) {
	this.spot_text.attr("text", value.toString());
	this.place_spot_box();
	this.spot_box.show();
	this.spot_text.show();

	this.spot_line.attr("stroke-width", width);
	this.spot_line.attr("stroke-opacity", opacity);
	this.spot_line.show();

	this.spot_text.toFront();
    };
    LineWidth.prototype.hide_searchlight = function () {
	this.spot_text.hide();
	this.spot_line.hide();
 	this.spot_box.hide();
    };

    function Color(args)
    {
	this.values = args["values"];
	this.x = args["x"];
	this.y = args["y"];
	this.width = args["width"] || 200;
	this.height = args["height"] || 133;
	this.title_text = args["title_text"] || "Line Width Legend";
	this.padx = args["padx"] || 10;
	this.pady = args["pady"] || 10;
	this.description_text = args["description_text"] || [];
	var rect_attrs = args["rect_attrs"] || {};
	var title_attrs = args["title_attrs"] || {};
	var line_attrs = args["line_attrs"] || {};
	var label_attrs = args["label_attrs"] || {};
	var description_text_attrs = args["description_text_attrs"] || {};

	// these are the default values in rect_attrs
	this.rect_attrs = {
	    "r": this.padx,
	    "stroke-opacity": 0.25,
	    "stroke-width": 2
	};
	update_dict(this.rect_attrs, rect_attrs);

	// these are the default values in title_attrs
	this.title_attrs = {
	    "text-anchor": "start",
	    "font-family": "Arial",
	    "font-weight": "bold",
	    "font-size": 12,
	    "fill": "white"
	};
	update_dict(this.title_attrs, title_attrs);

	// these are the default values in the line_attrs
	this.line_attrs = {
	    "stroke": "rgb(0,0,0)"
	};
	update_dict(this.line_attrs, line_attrs);

	this.label_attrs = {
	    "text-anchor": "start",
	    "font-family": "Arial",
	    "font-size": 10,
	    "fill": "rgb(0,0,0)"
	};
	update_dict(this.label_attrs, label_attrs);

	this.description_text_attrs = {
	    "text-anchor": "start",
	    "font-family": "Arial",
	    "font-size": 10,
	    "fill": "rgb(0,0,0)"
	};
	update_dict(this.description_text_attrs, description_text_attrs);
    };
    Color.prototype.set_description = function (raphael, line_list) {
	var i, line, dy, 
	  y = this.title.attr("y") + this.title.getBBox().height + this.pady;
	if (this.description_text_element !== undefined) {
	    this.description_text_element.remove();
	};
	this.description_text_element = raphael.set();
	for (i=0; i<line_list.length; i++) {
	    line = raphael.text(this.x+this.padx, y, line_list[i]);
	    dy = line.getBBox().height;
	    line.attr("y", y-dy/2);
	    line.attr(this.description_text_attrs);
	    y += line.getBBox().height;
	    this.description_text_element.push(line);
	};
	y -= dy/2;
	return y;
    };
    Color.prototype.draw = function (raphael)
    {	
	// make set to hold the entire group of elements
	this.element = raphael.set();
	var labels = raphael.set();
	var lines = raphael.set();
	var values = raphael.set();
	var box_radius = 6;
	var box_shift = -2;

	// create bounding rectangle
	this.rect = raphael.rect(this.x, this.y, this.width, this.height);
	this.rect.attr(this.rect_attrs);
	this.element.push(this.rect);

	// create title
	this.title = raphael.text(this.x+this.padx,this.y,this.title_text);
	this.title.attr(this.title_attrs);
	this.element.push(this.title);
	
	// create a white background behind title (to break the border rect)
	this.title_box = raphael.rect(this.x+this.padx+box_shift,
				      this.y - 0.5*this.title.getBBox().height,
				      this.title.getBBox().width+box_radius,
				      this.title.getBBox().height);
	this.title_box.attr({
		"fill":"rgb(86,34,100)",
		    "stroke": null,
// 		"fill":"white",
// 		    "stroke": "black",
// 		    "stroke-opacity":0.25,
		    "r":box_radius
	    });
	this.title_box.insertBefore(this.title);

	// create description (originally use description_text, not
	// alt_description_text)
 	var y = this.set_description(raphael, this.description_text);

	var value, rect, text;
	var x = this.x + this.padx;
	y = y + this.pady - 5;
	this.search_values = {};
	this.spot_values = {};
	for (key in this.values) {
	    value = this.values[key];
	    rect = raphael.rect(x, y, 10, 10);
	    rect.attr(this.rect_attrs);
	    rect.attr("fill", value);
	    text = raphael.text(x + rect.attr("width") + this.padx,
				y + 0.5 * rect.attr("height"), key);
	    this.search_values[key] = text;
	    this.spot_values[key] = text;
	    text.attr(this.label_attrs);
	    this.element.push(rect);
	    y = rect.attr("y") + rect.getBBox().height + this.pady;
	};
	this.rect.attr("height", y - this.y);
	
	// return the set of elements that make up the legend
	return this.element;
    };
    Color.prototype.show_searchlight = function (raphael, value, attrs) {
	this.searchlight = value;
// 	this.search_values[value].attr("font-weight", "bold");
	this.search_values[value].attr("fill", "rgb(129,21,24)");
// 		    "stroke": "rgb(129,21,24)",
    };
    Color.prototype.hide_searchlight = function () {
// 	this.search_values[this.searchlight].attr("font-weight", "normal");
	this.search_values[this.searchlight].attr("fill", "black");
    };
    Color.prototype.show_spotlight = function (raphael, value, attrs) {
	this.spotlight = value;
 	this.spot_values[this.spotlight].attr("font-size", 14);
// 	this.spot_values[this.spotlight].attr("font-weight", "bold");
	this.spot_values[this.spotlight].attr("fill", "rgb(129,21,24)");
    };
    Color.prototype.hide_spotlight = function () {
	if (this.spotlight in this.spot_values) {
	    this.spot_values[this.spotlight].attr("font-size", this.label_attrs["font-size"]);
	    // 	this.spot_values[this.spotlight].attr("font-weight", "normal");
	    this.spot_values[this.spotlight].attr("fill", "black");
	};
    };

    function NodeSize(args)
    {
	this.min_radius = args["min_radius"];
	this.max_radius = args["max_radius"];
	this.min_value = args["min_value"];
	this.max_value = args["max_value"];
	this.x = args["x"];
	this.y = args["y"];
	this.width = args["width"] || 200;
	this.height = args["height"] || 133;
	this.title_text = args["title_text"] || "Node Size Legend";
	this.alt_title_text = args["alt_title_text"] || "Alternate Node Size Legend";
	this.description_text = args["description_text"] || [];
	this.alt_description_text = args["alt_description_text"] || [];
	this.padx = args["padx"] || 10;
	this.pady = args["pady"] || 10;
	var rect_attrs = args["rect_attrs"] || {};
	var title_attrs = args["title_attrs"] || {};
	var circle_attrs = args["circle_attrs"] || {};
	var current_attrs = args["current_attrs"] || {};
	var label_attrs = args["label_attrs"] || {};
	var description_text_attrs = args["description_text_attrs"] || {};

	// these are the default values in rect_attrs
	this.rect_attrs = {
	    "r": this.padx,
	    "stroke-opacity": 0.25,
	    "stroke-width": 2
	};
	update_dict(this.rect_attrs, rect_attrs);

	// these are the default values in title_attrs
	this.title_attrs = {
	    "text-anchor": "start",
	    "font-family": "Arial",
	    "font-weight": "bold",
	    "font-size": 12,
	    "fill": "white"
	};
	update_dict(this.title_attrs, title_attrs);

	this.alt_title_attrs = {
	    "text-anchor": "start",
	    "font-family": "Arial",
	    "font-weight": "bold",
	    "font-size": 12,
	    "fill": "rgb(0,0,0)"
	};
	update_dict(this.alt_title_attrs, title_attrs);

	// these are the default values in the line_attrs
	this.circle_attrs = {
	    "stroke": "#999"
	};
	update_dict(this.circle_attrs, circle_attrs);

	this.current_attrs = {
	    "stroke": "rgb(255,75,0)",
	    "stroke-width": 2
	};
	update_dict(this.current_attrs, current_attrs);

	this.label_attrs = {
	    "text-anchor": "start",
	    "font-family": "Arial",
	    "font-size": 10,
	    "fill": "rgb(0,0,0)"
	};
	update_dict(this.label_attrs, label_attrs);

	this.description_text_attrs = {
	    "text-anchor": "start",
	    "font-family": "Arial",
	    "font-size": 10,
	    "fill": "rgb(0,0,0)"
	};
	update_dict(this.description_text_attrs, description_text_attrs);
    };
    NodeSize.prototype.set_description = function (raphael, line_list) {
	var i, line, dy, 
	  y = this.title.attr("y") + this.title.getBBox().height + this.pady;
	if (this.description_text_element !== undefined) {
	    this.description_text_element.remove();
	};
	this.description_text_element = raphael.set();
	for (i=0; i<line_list.length; i++) {
	    line = raphael.text(this.x+this.padx, y, line_list[i]);
	    dy = line.getBBox().height;
	    line.attr("y", y-dy/2);
	    line.attr(this.description_text_attrs);
	    y += line.getBBox().height;
	    this.description_text_element.push(line);
	};
	y -= dy/2;
	return y;
    };
    NodeSize.prototype.place_spot_box = function (raphael) {
	var x=this.spot_text.getBBox().x-this.box_radius,
	    y=this.spot_text.getBBox().y-0.5*this.box_radius,
	    width=this.spot_text.getBBox().width+2*this.box_radius,
   	    height=this.spot_text.getBBox().height+this.box_radius;
	if (this.spot_box === undefined) {
	    return raphael.rect(x,y,width,height);
	} else {
	    this.spot_box.attr({"x":x,"y":y,"width":width,"height":height});
	};
    };
    NodeSize.prototype.draw = function (raphael)
    {	
	// make set to hold the entire group of elements
	this.element = raphael.set();
	var labels = raphael.set();
	var circles = raphael.set();
	var values = raphael.set();
	var box_radius = 6;
	var box_shift = -4;

	// create bounding rectangle
	this.rect = raphael.rect(this.x, this.y, this.width, this.height);
	this.rect.attr(this.rect_attrs);
	this.element.push(this.rect);

	// create title
	this.title = raphael.text(this.x+this.padx,this.y,this.title_text);
	this.title.attr(this.title_attrs);
	this.element.push(this.title);
	
	// create a white background behind title (to break the border rect)
	this.title_box = raphael.rect(this.x+this.padx+box_shift,
				      this.y - 0.5*this.title.getBBox().height,
				      this.title.getBBox().width+box_radius+4,
				      this.title.getBBox().height);
	this.title_box.attr({
		"fill":"rgb(86,34,100)",
		    "stroke": null,
// 		"fill":"white",
// 		    "stroke": "black",
// 		    "stroke-opacity":0.25,
		    "r":box_radius
	    });
	this.title_box.insertBefore(this.title);

	// combine title and title box
	this.title_element = raphael.set();
	this.title_element.push(this.title_box);
	this.title_element.push(this.title);

	// create description (originally use description_text, not
	// alt_description_text)
 	y = this.set_description(raphael, this.description_text);

	// create min line label
	y = y + this.pady;
	this.min_label = raphael.text(this.x + this.padx,
				      y,
				      "min");
	this.min_label.attr(this.label_attrs);
	labels.push(this.min_label);
	this.element.push(this.min_label);
	y = this.min_label.attr("y") + this.min_label.getBBox().height/2;
	this.min_label.attr("y", y);

	// create min value
	this.min_value = raphael.text(this.x+this.width-this.padx, y, this.min_value.toString());
	this.min_value.attr(this.label_attrs);
	this.min_value.attr("text-anchor","end");
	values.push(this.min_value);
	this.element.push(this.min_value);

	// calculate center of circles
	var cx = this.x + 0.5*this.width;
	var cy = y + this.max_radius - this.min_label.getBBox().height/2;

	// create min circle
	this.min_circle = raphael.circle(cx, cy,
					 this.min_radius);
	this.min_circle.attr(this.circle_attrs);
	this.min_circle.attr("r", this.min_radius);
	circles.push(this.min_circle);
	this.element.push(this.min_circle);

	// create max circle
	this.max_circle = raphael.circle(cx, cy, 
					 this.max_radius);
	this.max_circle.attr(this.circle_attrs);
	this.max_circle.attr("r", this.max_radius);
	circles.push(this.max_circle);
	this.element.push(this.max_circle);
	
	// create max label
// 	y = this.min_label.attr("y") + this.min_label.getBBox().height + this.pady;
	y = this.max_circle.attr("cy") + this.max_circle.attr("r") - this.min_label.getBBox().height/2;
	this.max_label = raphael.text(this.x + this.padx, y, "max");
	this.max_label.attr(this.label_attrs);
	labels.push(this.max_label);
	this.element.push(this.max_label);

	// create max value
	this.max_value = raphael.text(this.x+this.width-this.padx, y, this.max_value.toString());
	this.max_value.attr(this.label_attrs);
	this.max_value.attr("text-anchor", "end");
	values.push(this.max_value);
	this.element.push(this.max_value);

	// create alternate title
	this.alt_title = raphael.text(this.x+this.padx,
				      this.y+this.rect.attr("height"),
				      this.alt_title_text);
	this.alt_title.attr(this.alt_title_attrs);
	this.element.push(this.alt_title);
	
	// create a white background behind title (to break the border rect)
	this.alt_title_box = raphael.rect(this.alt_title.getBBox().x+box_shift,
					  this.alt_title.getBBox().y,
					  this.alt_title.getBBox().width+box_radius,
					  this.alt_title.getBBox().height);
	this.alt_title_box.attr({
		"fill":"rgb(86,34,100)",
		    "stroke": null,
// 		"fill":"white",
// 		    "stroke": "black",
// 		    "stroke-opacity":0.25,
		    "r":box_radius
	    });
	this.alt_title_box.insertBefore(this.alt_title);

	// combine title and title box
	this.alt_title_element = raphael.set();
	this.alt_title_element.push(this.alt_title_box);
	this.alt_title_element.push(this.alt_title);

	// change height of bounding rectangle
	this.height = this.max_circle.attr("cy") + this.max_radius + this.pady - this.y + this.alt_title.getBBox().height/2;
	this.rect.attr("height", this.height);
	this.alt_title.attr("y", this.y + this.height);
	this.alt_title_box.attr("y", this.y + this.height - this.alt_title.getBBox().height/2);

	// spot circle
	this.spot_circle = raphael.circle(this.max_circle.attr("cx"),
					  this.max_circle.attr("cy"),
					  0.5*(this.max_radius+this.min_radius));
	this.element.push(this.spot_circle);
	this.spot_circle.attr(this.max_circle.attrs);
	this.spot_circle.insertBefore(this.min_circle);
	
	this.spot_text = raphael.text(this.x+this.width-this.padx,
				      cy,
				      "");
	this.spot_text.attr(this.label_attrs);
	this.spot_text.attr("text-anchor", "end");

	this.box_shift=box_shift;
	this.box_radius=box_radius;
	this.spot_box = this.place_spot_box(raphael);
	this.spot_box.attr({
		"fill":"white",
                "stroke": "black",
		"stroke-width": 1,
		"stroke-opacity": 0.25,
		"r":this.box_radius
		});
	
	this.element.push(this.spot_text);
 	this.element.push(this.spot_box);

	// return the set of elements that make up the legend
	return this.element;
    };
    NodeSize.prototype.show_searchlight = function (raphael, radius, value, attrs) {

	// if not done yet, make the search circle
	if (this.search_circle === undefined) {
	    this.search_circle = raphael.circle(this.max_circle.attr("cx"),
						this.max_circle.attr("cy"),
						0.5*(this.max_radius+this.min_radius));
	    this.element.push(this.search_circle);
	    this.search_circle.attr(this.max_circle.attrs);
	    this.search_circle.insertBefore(this.min_circle);
	};

	// show the search circle
	this.search_circle.attr(attrs);
	this.search_circle.attr("r", radius);
	this.search_circle.attr("fill-opacity", 0.85);
	this.search_circle.show();
    };
    NodeSize.prototype.hide_searchlight = function () {
	if (this.search_circle !== undefined) {
	    this.search_circle.hide();
	};
    };
    NodeSize.prototype.show_spotlight = function (raphael, radius, value, attrs) {

	// show the spot circle
	this.spot_circle.attr(attrs);
	this.spot_circle.attr("r", radius);
	this.spot_circle.attr("fill-opacity", 0.85);
	this.spot_circle.show();

	this.spot_text.attr("text", value.toString());
	this.place_spot_box();
	this.spot_box.show();
	this.spot_text.show();

	this.spot_text.toFront();

    };
    NodeSize.prototype.hide_spotlight = function () {
	this.spot_circle.hide();
	this.spot_text.hide();
 	this.spot_box.hide();
    };


    function Description(args)
    {
	this.x = args["x"];
	this.y = args["y"];
	this.width = args["width"] || 200;
	this.height = args["height"] || 133;
	this.title_text = args["title_text"] || "Description";
	this.padx = args["padx"] || 10;
	this.pady = args["pady"] || 10;
// 	this.value = args["value"] || " ";
	this.value = args["value"] || [];
	var rect_attrs = args["rect_attrs"] || {};
	var title_attrs = args["title_attrs"] || {};
	var value_attrs = args["value_attrs"] || {};

	// these are the default values in rect_attrs
	this.rect_attrs = {
	    "r": this.padx,
	    "stroke-opacity": 0.25,
	    "stroke-width":2
	};
	update_dict(this.rect_attrs, rect_attrs);

	// these are the default values in title_attrs
	this.title_attrs = {
	    "text-anchor": "start",
	    "font-family": '"Arial"',
	    "font-weight": 'bold',
	    "font-size": 12,
	    "fill": "white"
	};
	update_dict(this.title_attrs, title_attrs);

	this.value_attrs = {
	    "text-anchor": "start",
	    "font-family": this.title_attrs["font-family"],
	    "font-size": 10,
	    "fill": "rgb(0,0,0)"
	};
	update_dict(this.value_attrs, value_attrs);

    };
    Description.prototype.draw = function (raphael)
    {	
	var box_radius = 6;
	var box_shift = -2;

	// make set to hold the entire group of elements
	this.element = raphael.set();

	// create bounding rectangle
	this.rect = raphael.rect(this.x, this.y, this.width, this.height);
	this.rect.attr(this.rect_attrs);
	this.element.push(this.rect);

	// create title
	this.title = raphael.text(this.x+this.padx,this.y,this.title_text);
	this.title.attr(this.title_attrs);
	this.element.push(this.title);
	
	// create a white background behind title (to break the border rect)
	this.title_box = raphael.rect(this.x+this.padx+box_shift,
				      this.y - 0.5*this.title.getBBox().height,
				      this.title.getBBox().width+box_radius,
				      this.title.getBBox().height);
	this.title_box.attr({
		"fill":"rgb(86,34,100)",
		    "stroke": null,
// 		    "stroke": "black",
// 		    "stroke": "rgb(129,21,24)",
// 		    "stroke-opacity":0.25,
		    "r":box_radius
	    });
	this.title_box.insertBefore(this.title);

	y = this.title.attr("y") + this.title.getBBox().height + this.pady;
				      
	var i, line, y_line=y;
	this.text = raphael.set();
	for (i=0; i<this.value.length; i++) {
	    line = raphael.text(this.x+this.padx, y_line, this.value[i]);
	    line.attr(this.value_attrs);
	    y_line += line.getBBox().height;
	};

	// return the set of elements that make up the legend
	return this.element;
    };



    // These are public
    return {
	"LineWidth": LineWidth,
	    "Color": Color,
	    "NodeSize": NodeSize,
	    "Description": Description,
	    "line_path": line_path
    };
}();
