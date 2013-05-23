var NetworkLite = (function () {
    "use strict";

    // this holds the equivalent to the __new__ method in
    // python. methods on __new__ just bind methods/attributes to each
    // object.
    var __new__ = {};

    // creates the Node but does NOT call the __init__ method, which
    // can be over-written by child classes
    __new__.Node = function () {

        // make an instance
        var self = {};

        // set attibutes. this expects args = {'id': some_id_here}
	self.__init__ = function (args) {
            this.id = args.id;

	    // {node_id: link}
            this.incoming_links = {};
            this.links = {};
	    
	    // {node_id: node}
	    this.incoming_nodes = {};
	    this.outgoing_nodes = {};
	    
	};

	// add a link to this node by changing the local data
	// structures to remember the correct things. this is not a
	// helpful comment.
	self.add_link = function (link) {
	    var start_id = link.start_node.id, end_id = link.end_node.id;

	    //self-link (this is more for the Flow network where a
	    //node on the left can go back to the same node on the
	    //right so we have to keep track from both sides
	    if (start_id === end_id) { 
		this.links[end_id] = link;
		this.outgoing_nodes[end_id] = link.end_node;
		this.incoming_links[start_id] = link;
		this.incoming_nodes[start_id]= link.start_node;
	    }
	    // if this node is a start_id, we need to add this link
	    // (and the end_node) to the outgoing links data
	    // structures
	    else if (this.id === start_id) {
		this.links[end_id] = link;
		this.outgoing_nodes[end_id] = link.end_node;
	    } 
	    // if this node is the end node, we need to add the link
	    // (and the start_node) to the incoming links data
	    // structures
	    else if (this.id === end_id) {
		this.incoming_links[start_id] = link;
		this.incoming_nodes[start_id]= link.start_node;

	    // this can not happen unless you are an idiot.
	    } else {
		throw("this link is not associated with this node. wtf!");
	    }
	};

	self.remove_link = function (link) {
	    var start_id = link.start_node.id;
	    var end_id = link.end_node.id;

	    // if this node is a start_id, we need to add this link
	    // (and the end_node) to the outgoing links data
	    // structures
	    if (this.id === start_id) {
		delete this.links[end_id];
		delete this.outgoing_nodes[end_id];

	    // if this node is the end node, we need to add the link
	    // (and the start_node) to the incoming links data
	    // structures
	    } else if (this.id === end_id) {
		delete this.incoming_links[start_id];
		delete this.incoming_nodes[start_id];

	    // this can not happen unless you are an idiot.
	    } else {
		throw("this link is not associated with this node. wtf!");
	    }
	};

        // return instance
        return self;
    };

    var Node = function (args) {
	var node = __new__.Node();
	node.__init__(args);
	return node;
    };

    __new__.Link = function () {
        // make an instance
        var self = {};

	self.__init__ = function (args) {
            // set attributes
            this.id = args.id;
            this.start_node = args.start_node;
            this.end_node = args.end_node;

	    this.start_node.add_link(this);
	    this.end_node.add_link(this);

	};

        // return instance
        return self;
    };

    var Link = function (args) {
	var self = __new__.Link;
	self.__init__(args);
	return self;
    };

    __new__.WeightedLink = function(){
	var self = __new__.Link();
	
	var super__init__ = self.__init__;
	self.__init__ = function(args) {
	    super__init__.call(this, args);
	    this.weight = args.weight;
	};

	return self;
    };

    var WeightedLink = function (args) {
	var self = __new__.WeightedLink();
	self.__init__(args);
        return self;
    };

    __new__.Directed = function() {
	var self = {};

	// json struction looks like this:
	//    XXXX
	self.__init__ = function(json) {
            // set attributes
            this.nodes = {};
            this.links = {};
	    this.node_attrs = {}; // {node_attrs: {"cx": {...}, "cy":{...}, "labels"..}

	    this.add_nodes(json);
	    this.add_links(json);
	};

	// this method is responsible for extracting whatever
	// information is needed from the json for the Node
        self.add_node = function (id, json) {
            var node = Node({"id": id});
            this.nodes[id] = node;
            return node;
        };

	// this is a convenience method for creating a bunch of nodes
	// from the json
	self.add_nodes = function (json) {
	    var i;
	    for (i in json.nodes) {
		if (json.nodes.hasOwnProperty(i)) {
	            self.add_node(json.nodes[i], json);
		}
	    }
	};

	// in a directed network, make the link id be 'start_id-end_id'
        self.create_link_id = function (start_id, end_id) {
            return start_id + '-' + end_id;
        };

	// this method is responsible for creating a new link from
	// start_id to end_id and extracting whatever information is
	// necessary from the json.
        self.add_link = function (start_id, end_id, json) {
            var id = this.create_link_id(start_id, end_id);
            var start_node = this.nodes[start_id];
            var end_node = this.nodes[end_id];
            var link = Link({
		"id": id, 
		"start_node":start_node, 
		"end_node":end_node
	    });
            this.links[id] = link;
	    return link;
        };

	// add links (edges)
	self.add_links = function (json) {
	    var j, edges=json.edges;
	    for (j in edges) {
		if (edges.hasOwnProperty(j)){
		    this.add_link(edges[j][0], edges[j][1], json);
		}
	    }
	};

        self.remove_link = function (start_id, end_id) {
            var id = this.create_link_id(start_id, end_id);

	    var link = this.links[id];
	    link.start_node.remove_link(link);
	    link.end_node.remove_link(link);
            delete this.links[id];

        };

        self.remove_node_links = function (id) {
            var links_to_remove = {};
            var node = this.nodes[id];
            var outgoing_links = node.links;
            var incoming_links = node.incoming_links;
            var end_id, start_id, link, link_id;
            for (end_id in outgoing_links) {
		if (outgoing_links.hasOwnProperty(end_id)) {
                    link = outgoing_links[end_id];
                    links_to_remove[link.id] = link;
		}
            }
            for (start_id in incoming_links) {
		if (incoming_links.hasOwnProperty(start_id)) {
                    link = incoming_links[start_id];
                    links_to_remove[link.id] = link;
		}
            }
            for (link_id in links_to_remove) {
		if (links_to_remove.hasOwnProperty(link_id)) {
                    link = links_to_remove[link_id];
                    this.remove_link(link.start_node.id, link.end_node.id);
		}
            }
        };

        self.remove_node = function(id) {
            this.remove_node_links(id);
            delete this.nodes[id];
        };

	return self;
    };

    var Directed = function (json) {
	var self = __new__.Directed();
	self.__init__(json);
	return self;
    };

    // var Undirected = function (json) {

    //     // make an instance
    //     var self = Directed();

    //     // use sorted link id for undirected graphs
    //     self.create_link_id = function (start_id, end_id) {
    //         if (start_id <= end_id) {
    //             return start_id + '-' + end_id;
    //         } else {
    //             return end_id + '-' + start_id;
    //         };
    //     };

    //     self.add_link = function (start_id, end_id) {
    //         var id = self.create_link_id(start_id, end_id);
    //         var nodes = self.nodes;
    //         var start_node = nodes[start_id];
    //         var end_node = nodes[end_id];
    //         var link = Link(id, start_node, end_node);
    //         start_node.links[end_id] = link;
    //         end_node.links[start_id] = link;
    //         self.links[id] = link;
    // 	    return link;
    //     };

    //     self.remove_link = function (start_id, end_id) {
    //         var id = self.create_link_id(start_id, end_id);
    //         var nodes = self.nodes;
    //         var start_node = nodes[start_id];
    //         var end_node = nodes[end_id];
    //         delete start_node.links[end_id];
    //         delete end_node.links[start_id];
    //         delete self.links[id];
    //     };

    // 	// this is basically like the "__init__" method
    // 	if (json !== undefined) {
    // 	    // we need to build the network from the json here
    // 	}

    //     // return instance
    //     return self;
    // };

    __new__.WeightedDirected = function () {
	var self = __new__.Directed();

	// this is the only function that changes!
        self.add_link = function (start_id, end_id, json) {
            var id = this.create_link_id(start_id, end_id);
            var start_node = this.nodes[start_id];
            var end_node = this.nodes[end_id];
            var link = WeightedLink({
		"id": id, 
		"start_node":start_node, 
		"end_node":end_node,
		"weight": json.edge_attrs.weight[id]
	    });
            this.links[id] = link;
	    return link;
        };

	return self;
    };

    var WeightedDirected = function (json) {
	var self = __new__.WeightedDirected();
	self.__init__(json);
	return self;
    };


    return {
	"__new__": __new__,
	"Node": Node,
	"Link": Link,
	"WeightedLink": WeightedLink,
        // "Undirected": Undirected,
        "Directed": Directed,
        // "WeightedUndirected": WeightedUndirected,
        // "WeightedDirected": WeightedDirected,
	// "Flow": Flow
	"WeightedDirected": WeightedDirected
    };

}());

var NetworkList = (function () {
    "use strict";
    var Basic = function () {

        // make an instance
        var self = {};
	
	self.add_network = function (label, network) {
	    self[label] = network;
	};
	
        // return instance
        return self;
    };


    return {
        "Basic": Basic
    };
}());
