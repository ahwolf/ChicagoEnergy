var Chart = (function () {

    var Gantt = function (json) {

	var self = {};

	// set instance vars
	self.n_weeks = json['n_weeks'];
	self.start_date = new Date(json['start_date']);
	self.current_date = new Date(json['current_date']);

	// convert all dates to native Date types
	var i;
	self.phases = [];
	for (i in json['phases']) {
	    self.phases.push([
		json['phases'][i][0],
		(new Date(json['phases'][i][1])),
		json['phases'][i][2],
		json['phases'][i][3],
	    ]);
	};

	self.month_boundaries = function () {

	    var mpd = 1000*60*60*24; // milliseconds per day
	    var months = [
		'January',
		'February',
		'March',
		'April',
		'May',
		'June',
		'July',
		'August',
		'September',
		'October',
		'November',
		'December'
	    ];
	    var end_date = new Date();
	    end_date.setTime(self.start_date.getTime()+self.n_weeks*mpd*7);

	    var ms = self.start_date.getTime();
	    var day_date = new Date();
	    var date;
            var result = [];
	    var previous = 0;
	    var current;
	    while (ms <= end_date.getTime()) {
		day_date.setTime(ms);
		date = day_date.getDate();
		if (date == 1) {
		    current = (ms - self.start_date.getTime())/(self.n_weeks*mpd*7);
		    if (current - previous > 0) {
			result.push([previous, current, months[day_date.getMonth()-1]]);
		    };
		    previous = current;
		};
		ms += mpd;
	    };
	    current = 1;
	    if (current - previous > 0) {
		result.push([previous, current, months[day_date.getMonth()]]);
	    };
	    return result;
	};

	self.draw = function (div, width, height) {

	    var m_per_day = 1000*60*60*24; // milliseconds per day

	    // use a default width of 600 if not given
	    width = width || 600;

	    // if no height is given (probably the most often case),
	    // use the "natural" height (the number of phases times
	    // the default height (+padding) of each phase
	    var phase_height = 30;
	    var phase_padding = 1;
	    var phase_radius = 5;
	    if (height === undefined) {
		height = (self.phases.length + 2) * (phase_height + phase_padding);
	    } else {
                phase_height = height / (self.phases.length+2) - phase_padding;
	    };

	    var chart = d3.select(div)
		.append("svg:svg")
	        .attr("width", width)
		.attr("height", height)
		.append("svg:g")
		.attr("transform", "translate(0,0)");

	    var x_scale = d3.scale.linear()
		.domain([0, 7 * self.n_weeks]) // 7 is days per week
		.range([0, width]);

	    var index_list = [];
	    for (i = 0; i < (self.n_weeks + 1); i++) {
		index_list.push(i);
	    };
	    chart.selectAll().data(index_list).enter().append("svg:rect")
		.attr("x", function (d, i) {return i * (width / self.n_weeks);})
		.attr("width", width / self.n_weeks)
		.attr("y", phase_height + phase_padding)
		.attr("height", height - 2 * (phase_height + phase_padding))
		.attr("stroke", "none")
		.attr("class", function (d) {
		    if (d %2 ) {
			return "odd";
		    } else {
			return "even";
		    };
		});
	    chart.selectAll().data(index_list).enter().append("svg:rect")
		.attr("x", function (d, i) {return i * (width / self.n_weeks);})
		.attr("width", width / self.n_weeks)
		.attr("y", 0)
		.attr("height", phase_height)
		.attr("stroke", "none")
		.attr("class", function (d) {
		    if (d %2 ) {
			return "odd";
		    } else {
			return "even";
		    };
		});
	    chart.selectAll().data(self.month_boundaries())
		.enter()
		.append("svg:rect")
		.attr("x", function (d, i) {
		    return d[0] * width;
		})
		.attr("width", function (d, i) {
		    return (d[1] - d[0]) * width;
		})
		.attr("y", phase_height + phase_padding + self.phases.length * (phase_height + phase_padding) + phase_padding)
		.attr("height", phase_height)
		.attr("stroke", "none")
		.attr("class", function (d, i) {
		    if (i % 2) {
			return "odd";
		    } else {
			return "even";
		    };
		});
	    chart.selectAll().data(self.month_boundaries())
		.enter()
		.append("svg:text")
		.attr("x", function (d, i) {
		    return d[0] * width;
		})
		.attr("y", phase_height + phase_padding + self.phases.length * (phase_height + phase_padding) + phase_padding + 0.5 * phase_height)
		.attr("dx", function (d, i) {
		    return 5;
		})
		// .attr("dx", function (d, i) {
		//     return (d[1] - d[0]) * width / 2;
		// })
		.attr("dy", ".35em")
		.attr("text-anchor", "start")
		// .attr("text-anchor", "middle")
		.attr("class", "axislabel")
		.text(function (d, i) {
		    return d[2];
		});

	    chart.append("svg:line")
		.attr("x1", x_scale((self.current_date - self.start_date) / m_per_day))
		.attr("x2", x_scale((self.current_date - self.start_date) / m_per_day))
		.attr("y1", phase_height)
		.attr("y2", phase_height + phase_padding + self.phases.length * (phase_height + phase_padding) + phase_padding)
		.attr("stroke-linecap", "round")
		.attr("class", "current_line")
		.on("mouseover", function (d) {
		    var node = d3.select(this);
		    var oldclass = node.attr("class");
		    node.attr("class", oldclass + " " + "highlighted");
		})
		.on("mouseout", function (d) {
		    var node = d3.select(this);
		    var oldclass=node.attr("class");
		    var newclass=$.trim(oldclass.replace(/\bhighlighted\b/,''));
		    node.attr("class", newclass);
		})
		.append("svg:title")
		.text("Current Day")
	    ;
	    chart.selectAll().data(index_list).enter().append("svg:text")
		.attr("x", function (d, i) {return i * (width / self.n_weeks);})
		.attr("y", 0.5 * phase_height)
		.attr("text-anchor", "start")
		.attr("class", "axislabel")
		.attr("dx", function (d, i) {
		    return 5;
		})
		.attr("dy", "0.35em")
		.text(function (d, i) {
		    if (!(i % 2)) {
			return "Week " + (i + 1);
		    } else {
			return "";
		    };
		});

	    var phase_groups = chart.selectAll()
		.data(self.phases)
		.enter()
		.append("svg:a")
                .attr("xlink:href", function (d, i) {
		    return '#' + d[0];
		})
		.append("svg:g")
                .attr("class", function (d, i) {
		    if (d[3]) {
			return "phase complete";
		    } else {
			return "phase";
		    };
		})
		.on("mouseover", function (d) {
		    var node = d3.select(this);
		    var oldclass = node.attr("class");
		    node.attr("class", oldclass + " " + "highlighted");
		})
		.on("mouseout", function (d) {
		    var node = d3.select(this);
		    var oldclass=node.attr("class");
		    var newclass=$.trim(oldclass.replace(/\bhighlighted\b/,''));
		    node.attr("class", newclass);
		})
	    ;
	    phase_groups.append("svg:rect")
		.attr("x", function(d) {
		    return x_scale((d[1] - self.start_date) / m_per_day);
		})
		.attr("y", function(d, i) {
		    return (i + 1) * (phase_height + phase_padding);
		})
		.attr("width", function(d) {
		    return x_scale(7 * d[2]); // 7 is days per week
		})
		.attr("height", phase_height)
		.attr("rx", phase_radius)
		.attr("ry", phase_radius)
	    ;
	    phase_groups.append("svg:text")
		.attr("x", function(d) {
		    return x_scale((d[1] - self.start_date) / m_per_day);
		})
		.attr("y", function(d, i) {
		    return (i + 1 + 0.5) * (phase_height + phase_padding);
		})
		.attr("class", "phaselabel")
		.attr("dx", phase_radius)
		.attr("dy", "0.35em")
		.attr("text-anchor", "start")
		.text(function (d) {
		    return d[0];
		})
	    ;
	    
	};

	return self;
    };
    
    return {
	"Gantt": Gantt
    };
}());
