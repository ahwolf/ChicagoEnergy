var Item = Backbone.Model.extend({
    defaults: {
	value: "hello world",
	highlighted: false,
	selected: false
    },

    validate: function (attrs) {

    	if (attrs.value !== undefined && 
	    (!_.isString(attrs.value) || attrs.value.length===0)) {
    	    return "'value' of a ListItem must be a non-empty string";
    	}

	if (attrs.highlighted !== undefined && 
	    !_.isBoolean(attrs.highlighted)) {
	    return "'highlighted' of a ListITem must be a boolean";
	}

	if (attrs.selected !== undefined &&
	    !_.isBoolean(attrs.selected)) {
	    return "'selected' of a ListITem must be a boolean";
	}

    }
});

var ItemCollection = Backbone.Collection.extend({
    model: Item
});

var List = Backbone.Model.extend({

    defaults: {

	// remember the most recently selected item from the
	// collection. this is used to enable the multiselect
	// functionality with [shift+click]. 
	last_multiselected_item: null,
	last_selected_item: null
    },

    initialize: function (attrs) {

	// use a generic backbone collection here. 
	this.items = new ItemCollection();

	// add all of the items from the values specified in the attrs
	var i, item;
	for (i in attrs.values) {
	    item = new Item({"value": attrs.values[i]});
	    this.items.add(item);
	};

    },

    validate: function (attrs) {

    }

});

