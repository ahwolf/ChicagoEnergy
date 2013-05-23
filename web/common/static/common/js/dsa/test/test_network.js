$(document).ready(function () {

    var nodes = ['a','b','c','d','e'];
    var edges = [['a','b'],['b','c']];
    // edges = [];
    var list_json = {
	"values": nodes,
	"order": [0,1,2,3,4]
    };
    var network_json = {
	"nodes": nodes,
	"edges": edges,
	"node_attrs": {'cx':{'a':20,'b':60,'c':100,'d':140,'e':180},
		       "label":{'a':"a",'b':"b",'c':"c",'d':"d",'e':"e"}},
	"node_default_attrs": {'cy':60, 'r':15}
    };
    var list = List.Basic("list", list_json).draw("list");

    var canvas = DsA.Canvas("network", 300, 300);
    var network = Network.Undirected("network", network_json).draw(canvas);
    
    list.one_to_one_link(network, {0:"a",1:"b",2:"c",3:"d",4:"e"});

    canvas.anchor(list);

    // list.one_to_one_link(network, nodes);

});
