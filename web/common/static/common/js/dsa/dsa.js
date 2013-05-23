var Utilities = (function () {

    function object_length(obj) {
	
	// use mozilla __count__ method if possible
	var count = "__count__",
	    hasOwnProp = Object.prototype.hasOwnProperty,
	    prop;
	
	if (typeof obj[count] === "number" && !hasOwnProp.call(obj, count)) {
	    return obj[count];
	};
	
	// otherwise, loop through and manually count number of items
	count = 0;
	for (prop in obj) {
	    if (hasOwnProp.call(obj, prop)) {
		count++;
	    };
	};
	return count;
    };

    // this function is from Crockford (remedial JavaScript, to fix
    // the many problems with this language)
    // http://javascript.crockford.com/remedial.html
    function type_of(value) {
	var result = typeof value;
	if (result === 'object') {
	    if (value) {
		if (typeof value.length === 'number' &&
		    !(value.propertyIsEnumerable('length')) &&
		    typeof value.splice === 'function') {
		    result = 'array';
		};
	    } else {
		result = 'null';
	    };
	};
	return result;
    };
    
    function update_object(obj, other) {
	var key;
	for (key in other) {
	    if (other.hasOwnProperty(key)) {
		dict[key] = other[key];
	    };
	};
    };

    // useful sometimes for debugging
    function print_object(obj) {
	var key, result='{\n';
	for (key in obj) {
	    result += (key + ":" + obj[key] + ",\n");
	};
	return result + '}';
    };
    
    // useful for turning a number into a comma separated number ---
    // adapted from http://www.mredkj.com/javascript/nfbasic.html 
    function comma_format_number(nStr, nDecimals)
    {
	// return for the formatted number is the number os null
	if (nStr === null || isNaN(nStr) || !(isFinite(nStr))) {
	    return "N/A";
	};

	if (nDecimals === undefined) {
	    nDecimals = 1;
	};
	nStr += '';
	var x = nStr.split('.');
	var x1 = x[0];
	var x2 = x.length > 1 ? '.' + x[1].slice(0,nDecimals) : '';
	var rgx = /(\d+)(\d{3})/;
	while (rgx.test(x1)) {
	    x1 = x1.replace(rgx, '$1' + ',' + '$2');
	};
	return x1 + x2;
    };

    return {
	"object_length": object_length,
	"type_of": type_of,
	"update_object": update_object,
	"print_object": print_object,
	"comma_format_number": comma_format_number
    };
}());

var DsA = (function () {

    var VisualItem = function (container, id, spec, my) {

	// make a fresh object
	var self = {};
	
	// every item has a container: a Visual object
	self.container = container;

	// every item has an id, that must be unique among all of the
	// other items in the container.
	self.id = id;

	// this holds all of the DOM elements for this VisualItem
	self.elements = {};

	// this holds other VisualItems that are linked to this
	// VisualItem
	self.links = {};

	// 
	self.moused_over = false;

	// set a default string
	self.toString = function () {
	    return "DsA.VisualItem:" + self.id;
	};

	// this is a private helper function used because the add and
	// remove tag functions are almost identical
	var add_remove_tag = function (tag, origin, add_or_remove) {

	    var tag_fname = add_or_remove + '_tag',
	        class_fname = add_or_remove + 'Class';

	    if (add_or_remove === 'add') {
		// record that this Item is tagged
		self.container.items_by_tag[tag][self.id] = self;
		
	    } else {
		// record that this Item is no longer tagged
		delete self.container.items_by_tag[tag][self.id];
	    };

	    // if this Item's container Visual was the origin of the
	    // event that is asking for a tag to be added, go
	    // through and add the appropriate tags to linked
	    // items
	    if (origin === self.container.id) {
		var item_i,
		    visual_i, 
		    link_type_i,
		    links,
		    linked_item_tag;
		for (visual_i in self.links) {
		    for (link_type_i in self.links[visual_i]) {
			links = self.links[visual_i][link_type_i];
			linked_item_tag = tag + link_type_i;
			for (item_i in links) {
			    links[item_i][tag_fname](linked_item_tag, origin);
			};
		    };
		};
	    };

	    // if this Item is externally styled with CSS, add the
	    // appropriate tag classes to the item
	    if (self.container.external_style) {
		var element_type;
		for (element_type in self.elements) {
		    self.elements[element_type][class_fname](tag);
		};
	    // otherwise, call the update function
	    } else {
		self.update();
	    };
	};

	self.add_tag = function (tag, origin) {
	    // call the helper function with "add"
	    return add_remove_tag(tag, origin, 'add');
	};

	self.remove_tag = function (tag, origin) {
	    // call the helper function with "remove"
	    return add_remove_tag(tag, origin, 'remove');
	};

	self.has_tag = function (tag) {
	    return (self.id in self.container.items_by_tag[tag]);
	};

	self.get_tags = function() {
	    // THIS MIGHT BE SPED UP BY ADDING A DATA STRUCTURE THAT
	    // STORE TAGS BY ITEM
	    var tag,
	        items_by_tag = self.container.items_by_tag,
	        result = [];
	    for (tag in items_by_tag) {
		if (self.id in items_by_tag[tag]) {
		    result.push(tag);
		};
	    };
	    result.sort(); // This is a hacky way of putting highlight
			   // first before select
	    result.reverse();
	    return result;
	};

	self.add_link = function (other_item, link_type) {
	    var links = self.links,
	        links_by_visual,
	        links_by_type;

	    // if this Item has not yet been linked to anything from
	    // the other Visual, create a spot to store links to the
	    // other Visual (and store a local reference for speed)
	    if (links[other_item.container.id] === undefined) {
		links[other_item.container.id] = {};
	    };
	    links_by_visual = links[other_item.container.id];

	    // if this Item has not yet been linked to anything with
	    // this *type* of link to the other Visual, create a spot
	    // to store these links to the other Visual (and store a
	    // local reference for speed)
	    if (links_by_visual[link_type] === undefined) {
		links_by_visual[link_type] = {};
	    };
	    links_by_type = links_by_visual[link_type];

	    // actually add the link!
	    links_by_type[other_item.id] = other_item;
	};

	self.update = function () {

	    var element_type,
	        element_dict = self.elements,
	        element,
	        tag_i,
	        tag_list = self.get_tags(),
	        tag,
	        new_attrs,
	        state_attrs,
	        attr,
	        show;

	    // for each DOM element type in this Items list of
	    // elements, update it it with the appropriate style for
	    // it's current state (list of tags)
	    for (element_type in element_dict) {

		// start with the elements "normal" on / off state
		show = self.get_visibility(element_type);

		element = element_dict[element_type];

		// start with the elements "normal" attributes
		new_attrs = self.get_attr(element_type);

		// create the new attribute dictionary for this
		// elements state based on the SORTED list of tags
		// (tags that are later in the list have priority over
		// earlier tags.  Also, update the "show" variable to
		// the value of the last tag in the list.
		// state_attrs = self.get_tag_attrs(element_type, tag);
		// state_attrs = self.state_attrs[element_type];
		for (tag_i in tag_list) {
		    tag = tag_list[tag_i];
		    state_attrs = self.get_tag_attr(element_type, tag);
		    for (attr in state_attrs) {
			new_attrs[attr] = state_attrs[attr];
		    };
		    show = self.get_tag_visibility(element_type, tag);
		    //state_show[element_type][tag];
		};

		// if the element is not drawn...
		if (element === null) {
		    // ...and it is supposed to be drawn, draw it with
		    // the new attributes
		    if (show) {
			element = self.create_element(element_type, new_attrs);
		    };

		// if the element is already drawn
		} else {
		    // ...and it is supposed to be drawn, then just
		    // change the attributes
		    if (show) {
			element.attr(new_attrs);
			// element.animate(new_attrs, 200, '<>');

		    // ...and it's not supposed to be there, destroy.
		    } else {
			self.destroy_element(element_type);
		    };
		};
	    };
	};

	self.bind_events = function (element) {

	    // NOTE: this "element[0]" is used because apparently in
	    // both jQuery and raphael, the [0]th item of this element
	    // is the actual dom element node.  Then, the native
	    // events are used instead.  This "already_over" variable
	    // prevents the mouseover function from getting called
	    // continuously (see the Australian Map example in the
	    // Raphael demos) I think what this basically does is the
	    // same as the "fake" mouseenter and mouseleave functions
	    // of jQuery.  For some reason, these "native" event
	    // handlers work a lot better than the jQuery/Raphael
	    // versions...
	    var domNode = element[0];
	    var already_over = false;

	    // this sets the cursor style to a "pointer" (this should
	    // be fixed to work with elements that are sets).
	    if (domNode.style !== undefined) {
		domNode.style.cursor = "pointer";
	    };

	    domNode.onmouseover = function (event) {

		if (!(already_over)) {
		    
		    // debug.attr("text","over");
		    
		    if (!event) var event = window.event;
		    var relTarg = event.relatedTarget || event.fromElement;
		    
		    // Raphael uses a tspan tag inside of a text tag
		    // for a "text" element.
		    if (relTarg && relTarg.nodeName && relTarg.nodeName === 'tspan') {
			relTarg = relTarg.parentNode;
		    };
		    
		    // if the mouse just came from another interactive
		    // element of this item, then do nothing (it already
		    // has an "H" tag, then).  Otherwise, add the "H" tag
		    var element_type, element, add=true;
		    for (element_type in self.elements) {
			element = self.elements[element_type];		    
			if (element && relTarg === element[0] && self.get_interactivity(element_type)) {
			    add = false;
			};
		    };
		    
		    // alert("over: from " + relTarg + " to " + event.target + ": " + add);
		    
		    if (add) {
			self.add_tag("H", self.container.id);
		    };
		    
		    already_over = true;
		};

		return false;
	    };
	    domNode.onmouseout = function (event) {

		self.remove_tag("H", self.container.id);

		// alert('out');
		// debug.attr("text","out");
		
		if (!event) var event = window.event;
		var relTarg = event.relatedTarget || event.toElement;

		// Raphael uses a tspan tag inside of a text tag
		// for a "text" element.
		if (relTarg && relTarg.nodName && relTarg.nodeName === 'tspan') {
		    relTarg = relTarg.parentNode;
		};

		// if the element that the mouse moves to is an
		// interactive element of this object, then do not
		// remove the "H" tag.  otherwise, remove the "H" tag
		var element_type, element, remove=true;
		for (element_type in self.elements) {
		    element = self.elements[element_type];
		    if (element && relTarg === element[0] && self.get_interactivity(element_type)) {
			remove = false;
		    };
		};

		// alert("out: from " + event.target + " to " + relTarg + ": " + remove);

		if (remove) {
		    self.remove_tag("H", self.container.id);
		};

		already_over = false;

		return false;
	    };
	    domNode.onmousedown = function (event) {
	    	if (!(self.has_tag("S"))) {
		    self.container.remove_tag_from_all_visuals("S");
	    	};
		return false;
	    };
	    domNode.onmouseup = function (event) {
	    	var highlighted=self.container.get_items_by_tag("H"),
	    	    id;
	    	for (id in highlighted) {
	    	    highlighted[id].add_tag("S", self.container.id);
	    	};
		return false;
	    };
	};

	// this function is the basic constructor, used to create an
	// element.  this is meant to be over-ridden by child classes
	// when necessary (e.g. the 'element' is actually a
	// Raphael.set).
	self.instantiate_element = function (element_type, attrs) {
	    var element_graphic_type = self.container.graphic_type[element_type],
	        element = self.container.canvas[element_graphic_type]().attr(attrs);
	    return element;
	};

	// this function creates the canvas dom element of the given
	// type for this Item
	self.create_element = function (element_type, attrs) {

	    var element = self.instantiate_element(element_type, attrs);

	    // if this DOM element is supposed to be "interactive"
	    // (have the standard behavior bound to it), then bind the
	    // events
	    if (self.get_interactivity(element_type)) {
		self.bind_events(element);
	    };

	    // store this element in the list of DOM elements
	    self.elements[element_type] = element;

	    return element;
	};

	// this function destroys the canvas dom element for this
	// element type
	self.destroy_element = function (element_type) {
	    self.elements[element_type].remove();
	    self.elements[element_type] = null;
	};

	// this functions draws all of the dom elements for this Item
	// (if they are supposed to be drawn in the tagless state).
	self.draw = function () {

	    var element_type_i, element_type, symbol_type;
	    for (element_type_i in self.container.graphic_type_order) {
		element_type = self.container.graphic_type_order[element_type_i];

		// if the tagless states has the element, create it
	    	if (self.get_visibility(element_type)) {
		    // self.create_element(element_type,
		    // 			self.element_attrs(element_type));
		    element = self.create_element(element_type,
						  self.get_attr(element_type));
		// otherwise, store a null (the tagless dictionary
		// must have all of the possible elements for this
		// Item)
	    	} else {
		    self.elements[element_type] = null;
		};
	    };
	    
	    // return this Item (so that cascading is possible)
	    return self;
	};

	var set_attrs_with_dict = function (element_type,
					    attr_dict,
					    new_attrs) {
	    var attr, has="hasOwnProperty";
	    
	    // if this element_type is not in the item attribute
	    // dictionary, then add it
	    if (!(attr_dict[has](element_type))) {
		attr_dict[element_type] = {};
	    };
	    
	    for (attr in new_attrs) {
		
		if (new_attrs[has](attr)) {
		    
		    // if this attribute is not in this
		    // element_type's attribute dictionary, add it
		    if (!(attr_dict[element_type][has](attr))) {
			attr_dict[element_type][attr] = {};
		    };

		    // set the attribute value for this item (for
		    // this element_type and attribute)
		    attr_dict[element_type][attr][self.id] = new_attrs[attr];
		    
		};
	    };
	    
	    // return the element so that cascading is possible
	    return self;
	    
	};

	var set_value = function (element_type, value_dict, new_value) {
	    
	    // if this element_type is not in the item value
	    // dictionary, then add it
	    if (!(value_dict[has](element_type))) {
		value_dict[element_type] = {};
	    };
	    	    
	    // set the value for this item (for this element_type)
	    value_dict[element_type][self.id] = new_value;
	    
	    // return the element so that cascading is possible
	    return self;
	    
	};

	self.set_attr = function (element_type, dictionary) {
	    return set_attrs_with_dict(element_type,
				       self.container.item_attrs,
				       dictionary);
	};
	self.set_tag_attr = function (element_type, tag, dictionary) {
	    return set_attrs_with_dict(element_type,
				       self.container.item_tag_attrs[tag],
				       dictionary);
	};
	self.set_visibility = function (element_type, bool) {
	    return set_value(element_type,
			     self.container.item_visibility,
			     bool);
	};
	self.set_tag_visibility = function (element_type, tag, bool) {
	    return set_value(element_type,
			     self.container.item_tag_visibility[tag],
			     bool);
	};
	self.set_interactivity = function (element_type, bool) {
	    return set_value(element_type,
			     self.container.item_interactivity,
			     bool);
	};
	self.set_tag_interactivity = function (element_type, tag, bool) {
	    return set_value(element_type,
			     self.container.item_tag_interactivity[tag],
			     bool);
	};

	self.get_attr_defaults = function (element_type,
					   attr_dict,
					   default_attr_dict) {
	    var attr,
	        symbol_attr_dict,
	        item_attr_dict,
	        result = {};
				
	    // this loop fills the result dictionary with all of the
	    // key-value pairs that are in the default attribute
	    // dictionary
	    if (default_attr_dict.hasOwnProperty(element_type)) {
		symbol_attr_dict = default_attr_dict[element_type];
		for (attr in symbol_attr_dict) {
		    if (symbol_attr_dict.hasOwnProperty(attr)) {
			result[attr] = symbol_attr_dict[attr];
		    };
		};
	    };
	    
	    // this loop over-rides the default values for any
	    // attribute that is in the item-specific attribute
	    // dictionary
	    if (attr_dict.hasOwnProperty(element_type)) {
		symbol_attr_dict = attr_dict[element_type];
		for (attr in symbol_attr_dict) {
		    if (symbol_attr_dict.hasOwnProperty(attr)) {
			item_attr_dict = symbol_attr_dict[attr];
			if (item_attr_dict.hasOwnProperty(self.id)) {
			    result[attr] = item_attr_dict[self.id];
			};
		    };
		};
	    };
	    
	    // return a dictionary
	    return result;

	};

	self.get_value_defaults = function (element_type,
					   attr_value,
					   default_value) {
	    var result;
				
	    // try to get default value (can be undefined if there is
	    // not a default value for this element type
	    result = default_value[element_type];
	    
	    // over-ride the default with item-specific value
	    if (attr_value.hasOwnProperty(element_type)) {
		result = attr_value[element_type][self.id];
	    };
	    
	    // return a value
	    return result;

	};

	self.get_attr = function (element_type) {
	    return self.get_attr_defaults(
	        element_type,
		self.container.item_attrs,
		self.container.item_default_attrs
	    );
	};
	self.get_tag_attr = function (element_type, tag) {
	    return self.get_attr_defaults(
	        element_type,
		self.container.item_tag_attrs[tag],
		self.container.item_default_tag_attrs[tag]
	    );
	};
	self.get_visibility = function (element_type) {
	    return self.get_value_defaults(
	        element_type,
		self.container.item_visibility,
		self.container.item_default_visibility
	    );
	};
	self.get_tag_visibility = function (element_type, tag) {
	    return self.get_value_defaults(
	        element_type,
		self.container.item_tag_visibility[tag],
		self.container.item_default_tag_visibility[tag]
	    );
	};
	self.get_interactivity = function (element_type) {
	    return self.get_value_defaults(
	        element_type,
		self.container.item_interactivity,
		self.container.item_default_interactivity
	    );
	};
	self.get_tag_interactivity = function (element_type, tag) {
	    return self.get_value_defaults(
	        element_type,
		self.container.item_tag_interactivity[tag],
		self.container.item_default_tag_interactivity[tag]
	    );
	};

	return self;
	
    };
    
    var Visual = function(id) {
	
	// make a fresh object
	var self = {};

	// all Visuals have have an ID that is unique among the
	// Visuals on a page
	self.id = id;

	// set this to true if this is a "canvas drawn" object, false
	// if the elements will be styled with CSS
	self.external_style = false;

	// store the link types
	self.links = {
	    '__11': {},
	    '__1M': {},
	    '__M1': {},
	    '__MM': {}
	};

	// store a set of all linked visuals that are connected to
	// this one at any distance (including self)
	self.all_visuals = {};
	self.all_visuals[self.id] = self;
	
	// this function returns a dictionary of dictionaries where
	// the keys of the base dictionary are all of the possible tag
	// types {"H":{},"H__11":{},...}
	var possible_tag_dict = function () {
	    var tag_i, tag, link_type, tag_list = ['H', 'S'],
	        result = {};
	    for (tag_i in tag_list) {
		result[tag_list[tag_i]] = {};
	    };
	    for (tag_i in tag_list) {
		for (link_type in self.links) {
		    result[tag_list[tag_i] + link_type] = {};
		};
	    };
	    return result;
	};

	// store all of the Items for this Visual
	self.items = {};

	// store item-specific "actual" attributes; the attributes
	// that the item's elements have in their normal, tagless
	// state.  this is the way this object is structured:
	// item_attrs[element_type][attr][item_id] = value
	self.item_attrs = {};

	// store default attributes for the "actual" attributes.  this
	// is the way it's structured:
	// item_attrs[element_type][attr] = value
	self.item_default_attrs = {};

	// store the item-specific attributes that get applied when an
	// item is tagged.  I think that it is very likely that this
	// will be empty most of the time, as we will probably want
	// the "highlight" (H) and "select" (S) styles to be
	// consistent across items.  However, this exists to allow
	// (item, tag)-specific styles.  It has following structure:
	// item_tag_attrs[tag][element_type][attr][item_id] = value
	self.item_tag_attrs = possible_tag_dict();

	// store the default attributes that get applied when an item
	// is tagged.  this will probably be how we apply the styles
	// most of the time.  It has the following structure:
	// item_default_tag_attrs[tag][element_type][attr] = value
	self.item_default_tag_attrs = possible_tag_dict();

	// the following dictionaries are almost the same as the above
	// item_attr, item_tag_attr, etc... dictionaries, except they
	// store the "visibility" property, which specifies whether
	// the object *exists*.  They are one level less deep.

	// item_visibility[element_type][item_id] = boolean
	self.item_visibility = {};

	// item_tag_visibility[tag][element_type][item_id] = boolean
	self.item_tag_visibility = possible_tag_dict();
	
	// item_default_visibility[element_type] = boolean
	self.item_default_visibility = {};

	// item_default_tag_visibility[tag][element_type] = boolean
	self.item_default_tag_visibility = possible_tag_dict();

	// the following dictionaries are almost the same as the above
	// item_attr, item_tag_attr, etc... dictionaries, except they
	// store the "interactivity" property, which specifies whether
	// the events are bound to the element or not.  They are also
	// one level less deep than the attr dictionaries.

	// item_interactivity[element_type][item_id] = boolean
	self.item_interactivity = {};

	// item_tag_interactivity[tag][element_type][item_id] = boolean
	self.item_tag_interactivity = possible_tag_dict();
	
	// item_default_interactivity[element_type] = boolean
	self.item_default_interactivity = {};

	// item_default_tag_interactivity[tag][element_type] = boolean
	self.item_default_tag_interactivity = possible_tag_dict();

	// store references to the items by tag (for quick lookup by
	// tag)
	self.items_by_tag = possible_tag_dict();
	
	self.n_items = function () {
	    return Utilities.object_length(self.items);
	};

	self.toString = function () {
	    return "DsA.Visual";
	};

	self.remove_tag_from_all_items = function (tag, origin) {
	    var id;
	    for (id in self.items_by_tag[tag]) {
		self.items_by_tag[tag][id].remove_tag(tag, origin);
	    };
	};

	self.remove_tag_from_all_visuals = function (tag) {
	    var id, all_visuals=self.all_visuals;
	    for (id in all_visuals) {
		all_visuals[id].remove_tag_from_all_items(tag, id);
	    };
	};

	self.get_items_by_tag = function (tag) {
	    return self.items_by_tag[tag];
	};

	var link = function (other, mapping, cardinalityA, cardinalityB) {

	    var id, i, other_id,
	        items = self.items,
	        other_items = other.items,
	        link_type = '__' + cardinalityA + cardinalityB,
	        reverse_link_type = '__' + cardinalityB + cardinalityA;

	    // the following loop links each Item to all of the other
	    // Items given in the mapping

	    // for link type one-to-one and many-to-one (when the
	    // cardinality of other is 1, then the mapping is id --> id
	    if (link_type === '__11' || link_type === '__M1') {
		for (id in mapping) {
		    other_id = mapping[id];
		    items[id].add_link(other_items[other_id], link_type);
		    other_items[other_id].add_link(items[id],
						   reverse_link_type);
		};
	    // for link type one-to-many and many-to-many (when the
	    // cardinality of other is "many", then the mapping is
	    // id --> 'list of ids'
	    } else {
		for (id in mapping) {
		    for (i in mapping[id]) {
			other_id = mapping[id][i];
			items[id].add_link(other_items[other_id], link_type);
			other_items[other_id].add_link(items[id],
						       reverse_link_type);
		    };
		};
	    };

	    // this links the two Visuals together
	    self.links[link_type][other.id] = other;
	    other.links[reverse_link_type][self.id] = self;

	    // make the set of linked visuals be the same for each
	    // visual
	    var all_visuals = self.get_all_linked_visuals();
	    for (id in all_visuals) {
		all_visuals[id].all_visuals = all_visuals;
	    };
	};

	self.get_all_linked_visuals = function () {
	    var link_type, node, neighbor, 
	        visuals = {},
	        q = [self];
	    visuals[self.id] = self;
	    while (q.length > 0) {
		node = q.pop();
		for (link_type in node.links) {
		    for (neighbor_id in node.links[link_type]) {
			neighbor = node.links[link_type][neighbor_id];
			if (!(neighbor_id in visuals)) {
			    visuals[neighbor_id] = neighbor;
			    q.push(neighbor);
			};
		    };
		};
	    };
	    return visuals;
	};

	self.one_to_one_link = function (other, mapping) {
	    return link(other, mapping, '1', '1');
	};

	self.many_to_one_link = function (other, mapping) {
	    return link(other, mapping, 'M', '1');
	};

	self.one_to_many_link = function (other, mapping) {
	    return link(other, mapping, '1', 'M');
	};

	self.many_to_many_link = function (other, mapping) {
	    return link(other, mapping, 'M', 'M');
	};

	var set_default_attrs_with_dict = function (element_type,
						    attr_dict,
						    new_attrs) {
	    var attr, has="hasOwnProperty";
	    
	    // if this element_type is not in the item attribute
	    // dictionary, then add it
	    if (!(attr_dict[has](element_type))) {
		attr_dict[element_type] = {};
	    };
	    
	    for (attr in new_attrs) {
		
		if (new_attrs[has](attr)) {
		    
		    // set the attribute value for this item (for
		    // this element_type and attribute)
		    attr_dict[element_type][attr] = new_attrs[attr];
		    
		};
	    };
	    
	    // return the element so that cascading is possible
	    return self;
	    
	};

	var set_default_value = function (element_type, value_dict, new_value) {
	    	    	    
	    // set the value for this container (for this element_type)
	    value_dict[element_type] = new_value;
	    
	    // return the element so that cascading is possible
	    return self;
	    
	};

	self.set_default_attr = function (element_type, dictionary) {
	    return set_default_attrs_with_dict(
	        element_type,
		self.item_default_attrs,
		dictionary
	    );
	};
	self.set_default_tag_attr = function (element_type, tag, dictionary) {
	    return set_default_attrs_with_dict(
	        element_type,
		self.item_default_tag_attrs[tag],
		dictionary
	    );
	};
	self.set_default_visibility = function (element_type, bool) {
	    return set_default_value(
	        element_type,
		self.item_default_visibility,
		bool
	    );
	};
	self.set_default_tag_visibility = function (element_type, tag, bool) {
	    return set_default_value(
	        element_type,
		self.item_default_tag_visibility[tag],
		bool
	    );
	};
	self.set_default_interactivity = function (element_type, bool) {
	    return set_default_value(
	        element_type,
		self.item_default_interactivity,
		bool
	    );
	};
	self.set_default_tag_interactivity = function (element_type,tag,bool) {
	    return set_default_value(
	        element_type,
		self.item_default_tag_interactivity[tag],
		bool
	    );
	};
		
	return self;
    };

    var Canvas = function (div, width, height, filename) {
	
	var self = Raphael(div, width, height);
	
	// this is a visual that is used to link this canvas
	// background to the visual
	var anchor_visual = null;

	if (filename === undefined) {
	    var background = self.rect(0, 0, width, height).attr({
		"fill": "white",
		"fill-opacity": 0.0,
		"stroke": "none",
		"stroke-opacity": 0.0
	    });	    
	} else {
	    var background = self.image(filename, 0, 0, width, height);
	};

	self.anchor = function (visual) {
	    anchor_visual = visual;
	};

	var over_background = false;
	background[0].onmousedown = function (event) {
	    anchor_visual.remove_tag_from_all_visuals("S");
	};
	background[0].onmouseover = function (event) {
	    if (!(over_background)) {
		anchor_visual.remove_tag_from_all_visuals("H");
		over_background = true;
	    };
	    return false;
	};
	background[0].onmouseout = function (event) {
	    over_background = false;
	    return false;
	};

	return self;
    };
    
    return {
	"VisualItem": VisualItem,
	"Visual": Visual,
	"Canvas": Canvas
    };
}());

