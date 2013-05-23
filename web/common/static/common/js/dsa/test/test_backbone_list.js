$(document).ready(function () {

    // create all of the items that will be used throughout the
    // example. This should only have to be done ONCE. These List
    // models will be rendered in several different ways throughout
    // the example.
    var listA = new List({"values": ['a','b','c','d','e','f','g','h']});
    var listB = new List({"values": ['X','Y','Z']});

    var listA_view = new ListView({
	el: "#listA",
	model: listA
    });
    var listB_view = new ListView({
	el: "#listB",
	model: listB
    });

});
