$(document).ready(function () {

    // ONE TO ONE LINKS ARE WORKING!
    var jsonA = {
	"values":['a','b','c','d','e','f','g','h'],
	"order":[7,6,5,4,3,2,1,0]
    };
    var jsonB = {
	"values": ['X','Y','Z'],
	"order": [0,1,2]
    };

    mapping = {
	0:0,
	1:1,
	2:2,
	3:3,
	4:4,
	5:5,
	6:6,
	7:7
    };

    var listA = List.Basic("A", jsonA).draw("listA");

    var listB = List.Basic("B", jsonA).draw("listB");
    
    listA.one_to_one_link(listB, mapping);

    
    // ONE TO MANY AND MANY TO ONE LINKS ARE WORKING

    var mapping = {
    	0:[0,1,2,3],
    	1:[4,5],
    	2:[6,7]
    };

    // var mapping2 = {
    // 	0:0,
    // 	1:0,
    // 	2:0,
    // 	3:0,
    // 	4:1,
    // 	5:1,
    // 	6:2,
    // 	7:2
    // };

    var listC = List.Basic("C", jsonA).draw("listC");

    var listD = List.Basic("D", jsonB).draw("listD");

    listD.one_to_many_link(listC, mapping);

    // listA.many_to_one_link(listB, mapping2);
	
    // MANY TO MANY LINKS ARE WORKING!

    var mapping = {
    	0:[0,1,2,7],
    	1:[1,4,5,7],
    	2:[2,5,7]
    };

    // var mapping2 = {
    // 	0:[0],
    // 	1:[0,1],
    // 	2:[0,2],
    // 	// 3:[0],
    // 	4:[1],
    // 	5:[1,2],
    // 	// 6:[2],
    // 	7:[0,1,2]
    // };

    var listE = List.Basic("E", jsonA).draw("listE");

    var listF = List.Basic("F", jsonB).draw("listF");

    // listA.many_to_many_link(listB, mapping2);
    listF.many_to_many_link(listE, mapping);

});
