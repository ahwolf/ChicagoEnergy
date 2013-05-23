var Tree = (function () {

    var Item = function (tree, id, label) {

	// make a fresh object
	var self = {};

	// set the basic attributes
	self.tree = tree;
	self.id = id;
	self.label = label;
	self.children = {};

	// these are the case for the root node (they get overwritten
	// in the add_child method for child nodes
	self.parent = null;
	self.root = self;
	self.level = 0;

	self.add_child = function (id) {
	    var child = Item(self.tree, id, self.tree.labels[id]);
	    self.children[id] = child;
	    child.parent = self;
	    child.root = self.root;
	    child.level = self.level + 1;
	    return child;
	};

	self.toString = function () {
	    return "Item:" + self.id;
	};

	self.draw = function (parent_div_get) {

	    var div_id = "tree_" + self.id,
	        div_class = "tree_" + self.level,
	        div_get = "#tree_" + self.id,
	        child_id, index;

	    // create this node div element
	    $('<div id="'+div_id+'" class="'+div_class+'"></div>')
	    .appendTo($(parent_div_get));

	    // // get this div element
	    self.div = $(div_get);
	    
	    // append this div element's label
	    $('<span id="'+div_id+'_label" class="'+div_class+'_label">'+self.label+'</span>')
	    .appendTo(self.div);

	    // get this div element
	    self.span = $("#"+div_id+"_label");

	    self.span.mouseover(function (item) {
		return function (event) {
		    return $(item).trigger("mouseover");
		};
	    }(self));

	    self.span.mouseout(function (item) {
		return function (event) {
		    return $(item).trigger("mouseout");
		};
	    }(self));

	    self.span.mousedown(function (item) {
		return function (event) {
		    return $(item).trigger("mousedown");
		};
	    }(self));

	    self.span.click(function (item) {
		return function (event) {
		    return $(item).trigger("click");
		};
	    }(self));

	    // draw all children
	    var sorted_child_id_list = self.child_list_sorted_by_label();
	    for (index in sorted_child_id_list) {
		child_id = sorted_child_id_list[index];
		self.children[child_id].draw(div_get);
	    };

	};

	self.child_list_sorted_by_label = function () {
	    var child_id, index;
	    var sub_result = [];
	    for (child_id in self.children) {
		sub_result.push([self.tree.labels[child_id], child_id]);
	    };
	    sub_result.sort();
	    var result = [];
	    for (index in sub_result) {
		result.push(sub_result[index][1]);
	    };
	    return result;
	};

	self.child_list = function () {
	    var child_id;
	    var result = [];
	    for (child_id in self.children) {
		result.push(child_id);
	    };
	    result.sort();
	    return result;
	};

	self.grandchild_list = function () {
	    var child_id;
	    var grandchild_id;
	    var result = [];
	    for (child_id in self.children) {
		for (grandchild_id in self.children[child_id].children) {
		    result.push(grandchild_id);
		};
	    };
	    result.sort();
	    return result;
	};
	
	self.mouseover = function () {
	    return false;
	};
	self.mouseout = function () {
	    return false;
	};
	self.searchlight = function () {
	    self.div.addClass('highlighted');
	    self.span.addClass('highlighted');
	    return false;
	};
	self.unsearchlight = function () {
	    self.div.removeClass('highlighted');
	    self.span.removeClass('highlighted');
	    return false;
	};
	self.spotlight = function () {
	    self.div.addClass('selected');
	    self.span.addClass('selected');
	    return false;
	};
	self.unspotlight = function () {
	    self.div.removeClass('selected');
	    self.span.removeClass('selected');
	    return false;
	};
	
	return self;
    };
    
    var Basic = function(json_data) {

	// private method
	var build_tree = function (parent, child_id, subtree) {
	    var child;
	    if (parent !== null) {
		child = parent.add_child(child_id);
	    } else {
		child = Tree.Item(self, child_id, self.labels[child_id]);
	    };
	    var grandchild_id;
	    for (grandchild_id in subtree) {
		var grandchild = build_tree(child, grandchild_id,
					    subtree[grandchild_id]);
	    };
	    self.items[child_id] = child;
	    return child;
	};

	// make a fresh object
	var self = {};

	self.items = {};
	self.labels = json_data["labels"];
	self.attrs = json_data["attrs"];
	self.default_attrs = json_data["default_attrs"];
	self.root = build_tree(null, json_data["root"], json_data["structure"]);
	
	self.n_items = function () {
	    return object_length(self.items);
	};

	self.toString = function () {
	    return "<Tree instance rooted at " + self.root + ">";
	};

	self.draw = function (div_get) {
	    self.root.draw(div_get);

	};
	
	return self;
    };

    return {
        "Item": Item,
        "Basic": Basic
    };
}());