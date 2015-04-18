var timeline = wavesUI.timeline;
// var segment  = wavesUI.segment;
// var label	 = wavesUI.label
var d3 = timeline.d3;
var segmentColor = '#cb4b16';

graph = timeline()
	.xDomain([0, 100])
	.width(800)
	.height(50);

segmentsLayer = wavesUI.movableWaveform()
	.params({
		interactions: { 
			editable: true, 
			selectable: true
		},
		opacity: 0.3,
		handlerOpacity: 0.5
	})
	.data(segmentData)
	.color(segmentColor);

// labelsLayer = new label()
// 	.data(segmentsLayer.__data)
// 	.x(function(d, v) { 
// 		return d.start; 
// 	})
// 	.y(0)
// 	.width(function(d, v) { 
// 		return d.duration; 
// 	})
// 	.height(1)
// 	.margin({ top: 2, right: 0, bottom: 0, left: 4 })
// 	.bgColor('none')
// 	.color('#686868');

// add the label layer to the timeline

graph.add(segmentsLayer);
// graph.add(labelsLayer);
d3.select('#timeline1').call(graph.draw);

var xAxis = d3.svg.axis()
	.scale(graph.xScale)
	.tickSize(10,10)
	.tickFormat(function(d) {
		var form = "";
		if (d > 3600) 
			form = '%Hh%Mm%Ss';
		else if (d >= 60)
			form = '%Mm%Ss';
		else 
			form = '%Ss';
		if (d % 1 !== 0) 
			form += '%Lms';
		var date = new Date(d * 1000);
		var format = d3.time.format(form);
		return format(date);
		
	});

var zoomerSvg = d3.select('#zoomer').append('svg')
	.attr('width', 800)
	.attr('height', 30);

var axis = zoomerSvg.append('g')
	.attr('class', 'x-axis')
	.attr('transform', 'translate(0, 0)')
	.attr('fill', '#555')
	.attr('background', 'yellow')
	.call(xAxis);