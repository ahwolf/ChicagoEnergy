var List = (function () {

    var Item = function (list, id, label) {

	// make a fresh object
	var self = DsA.VisualItem(list, id);
	self.label = label;

	self.draw = function (list) {
	    var dom_element = document.createElement("li"),
	        jquery_element = $(dom_element);
	    dom_element.innerHTML = self.label;
	    list.appendChild(dom_element);
	    self.elements["li"] = jquery_element;
	    self.bind_events(jquery_element);
	    return self;
	};
	
	return self;
    };
    
    var Basic = function(id, json_data) {

	// make a fresh object
	var self = DsA.Visual(id),
	    i;
	
	// so that style is done with css
	self.external_style = true;

	for (i=0; i<json_data['order'].length; i++) {
	    var id = json_data['order'][i];
	    var value = json_data['values'][id];
	    self.items[id] = Item(self, id, value);
	};

	self.draw = function (div_id) {
	    var i, id, value,
	        div = document.getElementById(div_id),
	        ul = document.createElement("ul");
	    // ul.className = "list_basic";
	    div.appendChild(ul);
	    for (i=0; i<json_data['order'].length; i++) {
		id = json_data['order'][i];
	    	self.items[id].draw(ul);
	    };
	    return self;
	};
	
	return self;
    };

    var Alphabetical = function (id, json_data) {

	var self = Basic(id, json_data);

	// remember header class
	self.header_class = json_data["header_class"] || "rolodex";

	// local capitalize function
	var capitalize = function (s) {
	    return s.charAt(0).toUpperCase();// + s.slice(1);
	};

	// re-write draw method
	self.draw = function (div_id) {
	    var i, id, value, current_char, last_char="",
	        div = document.getElementById(div_id),
	        ul = document.createElement("ul");
	    div.appendChild(ul);
	    for (i=0; i<json_data['order'].length; i++) {
		id = json_data['order'][i];

		// add alphabetical letter --- rolodex equivalent
		current_char = capitalize(json_data["values"][id]);
		if (current_char > last_char) {
		    last_char = current_char;
		    var char_li = document.createElement("li");
		    char_li.setAttribute("class",self.header_class);
		    char_li.setAttribute("className",self.header_class);
		    char_li.innerHTML = current_char;
		    ul.appendChild(char_li);
		};

	    	self.items[id].draw(ul);
	    };
	    return self;
	};

	return self;
    };

    return {
        "Item": Item,
	"Basic": Basic,
	"Alphabetical": Alphabetical
    };
}());