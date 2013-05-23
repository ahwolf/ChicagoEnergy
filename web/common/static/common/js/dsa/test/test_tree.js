$(document).ready(function () {

    var json = {
	"root": 0,
	"structure": {
	    1: {},
	    2: {},
	    3: {
		4:{},
		5:{}
	    }
	},
	"labels": {
	    0:"A",
	    1:"B",
	    2:"C",
	    3:"D",
	    4:"E",
	    5:"F"
	}
    };

    var tree = Tree.Basic(json).draw("#tree");
    
});
