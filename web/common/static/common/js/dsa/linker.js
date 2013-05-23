// This is used to link dynamic elements of two distinct visual
// elements by synchronizing their interactive behavior.

var Linker = function () {

    // a_dict = {key: obj}
    // b_dict = {key: obj}
    // a2bs_dict = {a_key: [b_keys]}
    function OneToMany(a_dict, b_dict, a2bs_dict) {
	this.a_dict = a_dict;
	this.b_dict = b_dict;
	this.a2bs_dict = a2bs_dict;
	this.trigger_funcs = {};
    };
    
    // bind = 'event' to bind for a (can be method name or event name)
    // trigger = 'event' to trigger for b (can be method name or event name)
    // trigger_func = f(a_obj, b_obj) returns truth of whether trigger occurs
    OneToMany.prototype.make_linkages = function (bind, trigger, trigger_func) {
	var a_key, a_obj, b_key, b_obj, a_key_list, b_key_list, i;
	if (!(bind in this.trigger_funcs)) {
	    this.trigger_funcs[bind] = {};
	};
	this.trigger_funcs[bind][trigger] = trigger_func;
	for (a_key in this.a2bs_dict) {
	    b_key_list = this.a2bs_dict[a_key];
	    a_obj = this.a_dict[a_key];
	    for (i in b_key_list) {
		b_key = b_key_list[i];
		b_obj = this.b_dict[b_key];
		this.make_linkage(a_obj, b_obj, bind, trigger);
	    };
	};
    };

    // a_obj = object to bind bind_event for
    // b_obj = object to trigger trigger_event for
    // bind = 'event' to bind for a (can be method name or event name)
    // trigger = 'event' to trigger for b (can be method name or event name)
    OneToMany.prototype.make_linkage = function (a_obj, b_obj, bind, trigger) {

	// link events behavior
	$(a_obj).bind(bind, function (linker, a, b, trigger_func) {
		return function (event) {
		    if (trigger_func === undefined
			|| trigger_func(a, b)) {
			return $(b).trigger(trigger);
		    };
		};
	    }(this, a_obj, b_obj, this.trigger_funcs[bind][trigger]));
    };

    // these are public
    return {
	"OneToMany": OneToMany
    };
}();