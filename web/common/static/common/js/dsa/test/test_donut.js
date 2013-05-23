$(document).ready(function () {

    var values = [],
	labels = [],
	colors = [],
	order = [],
        rotate = ['red','orange','yellow','green','blue','violet'],
	mapping121 = {},
	mapping12M = {},
	mappingM2M = {},
	i, j, length = 5;
    mapping12M[0] = [];
    mapping12M[1] = [];
    mapping12M[2] = [];
    mapping12M[3] = [];
    mapping12M[4] = [];
    for (i=0; i<length; i++) {
	order.push(i);
	values.push(1);
	labels.push("mungotastic" + i);
	colors.push(rotate[i%rotate.length]);
	mapping121[i] = i;
	mapping12M[Math.floor(5*i/length)].push(i);
	mappingM2M[i] = [];
    };

    for (i=0; i<length; i++) {
	for (j=0; j<Math.floor(Math.random()*10); j++) {
	    mappingM2M[i].push(Math.floor(Math.random()*length));
	};
    };

    var jsonA = {
	'values': values,
	'labels': labels,
	'colors': colors,
	'order': order,
	"cx":150,
	"cy":150,
	"r_inner":100,
	"r_outer":125,
	"stroke-width":2,
	"label_dim_opacity":0,
	"fill_opacity":0.25,
	"fadein_time":200,
	"fadeout_time":200
    };


    var jsonB = jQuery.extend(true, {}, jsonA);
    jsonB["cx"] = 450;
    var jsonC = jQuery.extend(true, {}, jsonB);
    jsonC["cx"] = 750;

    var jsonD = jQuery.extend(true, {}, jsonA);
    jsonD["values"] = [0,1,2,3,4];
    jsonD["labels"] = [0,1,2,3,4];
    jsonD["cx"] = (225 / 2);
    jsonD["cy"] = 300 + (225 / 2);
    jsonD["r_outer"] = (225 / 2) - 25;
    jsonD["r_inner"] = jsonD["r_outer"] - 25;

    var jsonE = jQuery.extend(true, {}, jsonD);
    jsonE["values"] = values;
    jsonE["labels"] = labels;
    jsonE["cx"] += 225;

    var jsonF = jQuery.extend(true, {}, jsonE);
    jsonF["cx"] += 225;

    var jsonG = jQuery.extend(true, {}, jsonF);
    jsonG["cx"] += 225;

    var canvas = DsA.Canvas("donutA", 900, 600);

    var rect_params = {"r":50,"stroke":"rgb(200,200,200)","stroke-width":3};
    var frame = canvas.rect(0, 0, 900, 300).attr(rect_params);

    debug = canvas.text(150, 150, "debug").attr("font-size", 20);

    var donutA = Donut.Chart("A", jsonA).draw(canvas);

    canvas.anchor(donutA);

    var donutB = Donut.Chart("B", jsonB).draw(canvas);
    var donutC = Donut.Chart("C", jsonC).draw(canvas);

    // canvas.rect(0, 300, 450, 225).attr(rect_params);
    // var donutD = Donut.Chart("D", jsonD).draw(canvas);
    // var donutE = Donut.Chart("E", jsonE).draw(canvas);

    // canvas.rect(450, 300, 450, 225).attr(rect_params);
    // var donutF = Donut.Chart("F", jsonF).draw(canvas);
    // var donutG = Donut.Chart("G", jsonG).draw(canvas);

    // top row of one to one links
    donutA.one_to_one_link(donutB, mapping121);
    donutA.one_to_one_link(donutC, mapping121);
    donutB.one_to_one_link(donutC, mapping121);

    // donutD.one_to_many_link(donutE, mapping12M);

    // donutF.many_to_many_link(donutG, mappingM2M);

    // $('body').click(function(event) {
    // 	alert($(event.target).mousedown);
    // });

});
