var Collection = function () {

    var Item = function (set, id) {
	this.set = set;
	this.id = id;
	this.query = this.set.jquery_func(this.id);

	$(this.query).mouseover(function (item) {
		return function (event) {
		    $(item).trigger("mouseover"); 
		};
	    }(this));
	$(this.query).mouseout(function (item) {
		return function (event) {
		    $(item).trigger("mouseout"); 
		};
	    }(this));
	$(this.query).mousedown(function (item) {
		return function (event) {
		    $(item).trigger("mousedown"); 
		};
	    }(this));
	$(this.query).click(function (item) {
		return function (event) {
		    $(item).trigger("click"); 
		};
	    }(this));
    };
    Item.prototype.searchlight = function (event) {
	$(this.query).css({
	    "background": this.set.searchlight_color,
	    "color": this.set.searchlight_text_color
	});
	// $(this.query).css({
	//     "text-decoration": "underline"
	// });
	return false;
    };
    Item.prototype.unsearchlight = function (event) {
	// $(this.query).css({
	//     "text-decoration": "none"
	// });
	$(this.query).css({
	    "background": this.set.background_color,
	    "color": this.set.foreground_color
	});
	return false;
    };
    Item.prototype.spotlight = function (event) {
	$(this.query).css({
	    "background": this.set.spotlight_color,
	    "color": this.set.spotlight_text_color
	});
	return false;
    };
    Item.prototype.unspotlight = function (event) {
	$(this.query).css({
	    "background": this.set.background_color,
	    "color": this.set.foreground_color
	});
	return false;
    };
    Item.prototype.mouseover = function () {
    };
    Item.prototype.mouseout = function () {
    };
    Item.prototype.mousedown = function () {
    };
    Item.prototype.click = function () {
    };

    var Set = function (data) {
	this.fadein_time = data["fadein_time"] || 100; // ms
	this.fadeout_time = data["fadeout_time"] || 500; // ms
	this.background_color = data["background_color"] || "white";
	this.foreground_color = data["foreground_color"] || "black";
	this.searchlight_color = data["searchlight_color"] || "rgb(225,225,225)";
	this.searchlight_text_color = data["searchlight_text_color"] || this.foreground_color;
	this.spotlight_color = data["spotlight_color"] || "rgb(255,150,75)";
	this.spotlight_text_color = data["spotlight_text_color"] || this.foreground_color;

	var jquery_func = data["jquery_func"],
	    i, ids = data["ids"];

	// ids and jquery_func are required
	if (ids===undefined) {
	    throw("missing argument 'ids' to Collection.Set");
	};
	if (jquery_func===undefined) {
	    throw("missing argument 'jquery_func' to Collection.Set");
	};

	// instantiate all of the items
	this.jquery_func = jquery_func;
	this.items = {};
	for (i=0;i<ids.length;i++) {
	    this.items[ids[i]] = new Item(this, ids[i]);
	};
    };

    return {
        "Item": Item,
	"Set": Set
    };
}();