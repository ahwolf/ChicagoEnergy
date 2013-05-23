$(document).ready(function () {

    var listJSON = {
	// "values": {0:'a',1:'b',2:'c',3:'d',4:'e'},
	"values": ['a','b','c','d','e'],
	"order": [4,3,2,1,0]
    };
    var donutJSON = {
    	'values': {'x':4,'y':2, 'z':2},
    	'labels': {'x':'group a','y':'group b','z':'group c'},
    	'colors': {'x':'red','y':'blue','z':'green'},
    	'order': ['x','y','z'],
    	"cx":150,
    	"cy":150,
    	"r_inner":100,
    	"r_outer":125,
    	"stroke-width":1,
	"label_offset":-15,
	"label_orientation": "arched",
	"allow_upsidedown_label": false,
    	"fill_opacity":0.5
    };

    var canvas = DsA.Canvas("donut", 300, 300);

    var list = List.Basic("list", listJSON).draw("list");

    var donut = Donut.Chart("donut", donutJSON).draw(canvas);

    donut.one_to_many_link(list, mapping={
    	'x': [0,1],
    	'y': [2,3],
    	'z': [4]
    });

});
