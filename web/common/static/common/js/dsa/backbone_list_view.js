// keep the views separate from the models --- this is the only place
// where the DOM should be manipulated

var ItemView = Backbone.View.extend({
    tagName: 'li',

    initialize: function (attrs) {

	// make sure that attrs has a listview argument passed to attrs
	if (attrs.listview === undefined) {
	    throw("ItemView must have a reference to its 'listview' parent.");
	}

	// bind the change events on the model to the render function
	// of this model
	_.extend(this.model, Backbone.Events);
	this.model.bind("change", this.render, this);
    },

    // list a series of basic events that can be triggered across
    // elements
    events: {
	"mouseover": "highlight",
	"mouseout": "dehighlight",
	"click": "toggle_select_deselect",
    },

    highlight: function (event) {
	this.model.set({"highlighted": true});
    },
    dehighlight: function (event) {
	this.model.set({"highlighted": false});
    },
    toggle_select_deselect: function (event) {

	// should be able to deselect element if ctrl/meta is pressed
	// during click event
	if (this.model.get("selected") && (event.ctrlKey || event.metaKey)) {
	    this.model.set({"selected": false});
	}

	// if ctrl/meta is not pressed during click, always set to true
	else {
	    this.model.set({"selected": true});

	    // trigger the multiselect_or_deselect signal and pass the
	    // event object to detect whether or not this is a click, a
	    // shift-click, or a ctrl-click event
	    this.options.listview.trigger(
		"list:multiselect_or_deselect", 
		{
		    event: event,
		    item: this.model
		});
	}

    },

    // this is the only place that the template is rendered. ALL
    // CHANGES TO HTML OCCUR HERE!
    render: function () {
    	$(this.el).html(this.model.get("value")); 
	if (this.model.get("selected")) {
	    $(this.el).addClass("S");
	}
	else {
	    $(this.el).removeClass("S");
	}
	if (this.model.get("highlighted")) {
	    $(this.el).addClass("H");
	}
	else {
	    $(this.el).removeClass("H");
	}
   	return this;
    }
});

var ListView = Backbone.View.extend({

    initialize: function (json) {

	// bind events to the change:selected event on any item to
	// decide whether to deselect all or not
	_.extend(this, Backbone.Events);
	this.bind(
	    "list:multiselect_or_deselect",
	    this.multiselect_or_deselect,
	    this
	);

    	// render the list
    	this.render();

    },

    multiselect_or_deselect: function (args) {

	// multiselect a random element of the list. 
	if (args.event.ctrlKey || args.event.metaKey) {
	    
	    // no additional select/deselect of items needs to be done
	    // in this case

	    // remember the most recently selected item
	    this.model.set({
		"last_multiselected_item": null,
		"last_selected_item": args.item
	    });
	} 

	// contiguous multiselect from previously selected element (if
	// there is one)
	else if (args.event.shiftKey) {

	    // find the index of the last selected item and the
	    // shift+clicked item
	    var last_selected_item = this.model.get("last_selected_item");
	    var last_selected_i = this.model.items.indexOf(last_selected_item);
	    var newly_selected_i = this.model.items.indexOf(args.item);

	    // defaults to selecting everything from the start of the
	    // list, inclusive
	    if (last_selected_item === null) {
		last_selected_i = 0;
	    }

	    // set all items between the last selected item and the
	    // currently selected item to be selected
	    var selected_range = _.range(last_selected_i,newly_selected_i+1,1);
	    if (last_selected_i > newly_selected_i) {
		selected_range=_.range(last_selected_i,newly_selected_i-1,-1);
	    }
	    _.each(selected_range, function (i) {
		this.model.items.at(i).set({"selected": true});
	    }, this);
	    
	    // deselect all items between the last multiselected item
	    // and the last selected item that were NOT just selected
	    // (hence use of _.difference)
	    var last_multiselected_item = this.model.get(
		"last_multiselected_item"
	    );
	    if (last_multiselected_item !== null) {
		var last_multiselected_i = this.model.items.indexOf(
		    last_multiselected_item
		);
		var range=_.range(last_selected_i+1,last_multiselected_i+1,1);
		if (last_selected_i > last_multiselected_i) {
		    range=_.range(last_selected_i-1,last_multiselected_i-1,-1);
		}
		range = _.difference(range, selected_range);
		_.each(range, function (i) {
		    this.model.items.at(i).set({"selected": false});
		}, this);
	    }
	    

	    // do not remember the most recently selected item, but do
	    // remember the most most most recently shift-clicked item
	    this.model.set({
		"last_multiselected_item": args.item
	    });
	    
	} 

	// deselect everything except the recently selected element
	else {
	    this.model.items.each(function(item) {
		if (! _.isEqual(args.item, item)) {
		    item.set({"selected": false});
		}
	    });

	    // remember the most recently selected item
	    this.model.set({
		"last_multiselected_item": null,
		"last_selected_item": args.item
	    });
	}

    },

    render: function () {

	// add an unordered list to the DOM
    	$(this.el).append("<ul></ul>");

	// for every item in the list, render that item in the DOM
    	_(this.model.items.models).each(function(item) {
    	    this.render_item(item);
    	}, this);
    },

    render_item: function(item) {
    	var item_view = new ItemView({
	    listview: this,
    	    model: item
    	});
    	$('ul', this.el).append(item_view.render().el);
    }
 
});