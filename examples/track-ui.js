function TrackUI() {
	var id;
	var type;
	var parentContainerId;
	var mainTimelineContainerId;
	var miniTimelineContainerId;
	var timeRulerContainerId;

	// var Timeline 	  = wavesUI.timeline;
	// var SegmentLayer   = wavesUI.segment;
	// var LabelLayer     = wavesUI.label;
	// var MarkerLayer    = wavesUI.marker;
	// var WaveformLayer  = wavesUI.waveform;
	// var d3 			  = wavesUI.timeline.d3;

	var defaultSegmentColor  	 = '#cb4b16';
	var defaultCursorColor   	 = '#dc322f';
	var defaultBeatColor 	 	 = 'steelblue';
	var defaultLabelColor 	 	 = '#686868';
	var defaultScrollCursorColor = 'grey';
	var defaultWaveformColor 	 = '#586e75';

	var cursor;
	var timeline;
	var beatGridLayer;
	var segmentsLayer;
	var labelsLayer;
	var waveformLayer;

	var miniTimeline;
	var scrollSegment;
	var timeRulerAxis;
	var timeRulerUIParentContainer;
	var timeRulerUI;

	var follow = true;
	var snap   = true;
	var snap_mode = "per-beat"; // per-beat, per-measure

	var counter = 0;

	var showTimeRuler = false;
	var showMiniTimeLine  = false;

	var listeners = {
		'track:segment:add' : {},
		'track:segment:update' : {},
		'track:segment:delete' : {},
		'track:segment:drag_start' : {},
		'track:segment:drag' : {},
		'track:segment:drag_end' : {},
		'track:set_time_domain' : {},
		'track:set_current_time' : {},
		'track:segment:click' : {}, 
		'track:click' : {}
	};

	var _;

	/**
	 * params: id, type, initialTimeDomain, width, height, beatGrid, segments,
	 *         miniTimelineContainerId, timeRulerContainerId, parentContainerId
	 */
	this.init = function (params) {

		_ = this;

		_.id   = params.id;
		_.type = params.type;

		_.parentContainerId 	  = params.parentContainerId;
		_.mainTimelineContainerId = _.type + "-" + _.id + "-mainTimeline";
		_.miniTimelineContainerId = _.type + "-" + _.id + "-miniTimeline";
		_.timeRulerContainerId    = _.type + "-" + _.id + "-timeRuler";


		// Create the timeline
		timeline = new wavesUI.timeline()
				.xDomain(params.initialTimeDomain || [0, 10])
				.width(params.width || 800)
				.height(params.height || 200);

		// Create time cursor
		cursor = new wavesUI.marker()
			.params({ 
				displayHandle: true,
				interactions: {
					editable: false, 
					selectable: false
				}
			})
			.color(defaultCursorColor)
			.opacity(0.9);

		// Create beat grid layer
		beatGridLayer = new wavesUI.marker()
			.params({
				displayHandle: false,
				interactions: { 
					editable: false,
				},
			})
			.data([])
			// .color(defaultBeatColor);
			.color(function(d, v) {
				if (d.in_measure_index == 1) 
					return "black";
				else 
					return defaultBeatColor;
			})
			.height(function(d, v) {
				if (d.in_measure_index == 1) 
					return 100;
				else 
					return 50;
			});
			

		this.set_beat_grid(params.beatGrid, false);

		// Create segments layer
		segmentsLayer = new wavesUI.segment()
			.params({
				interactions: { 
					editable: true, 
					selectable: true
				},
				opacity: 0.3,
				handlerOpacity: 0.5
			})
			.data(params.segments)
			.color(defaultSegmentColor);
		segmentsLayer.dragging = {};

		labelsLayer = new wavesUI.label()
			.data(segmentsLayer.__data)
			.x(function(d, v) { 
				return d.start; 
			})
			.y(0)
			.width(function(d, v) { 
				return d.duration; 
			})
			.height(1)
			.margin({ top: 2, right: 0, bottom: 0, left: 4 })
			.bgColor('none')
			.color(defaultLabelColor);

		// timeline.on('new-layer', function(layer){
		// 	console.log(layer);
		// })

		timeline.add(labelsLayer);
		timeline.add(segmentsLayer);
		timeline.add(beatGridLayer);
		timeline.add(cursor);

		var selection;
		if (_.parentContainerId)
			selection = d3.select('#'+_.parentContainerId);
		else
			selection = d3.select('body').append('div').attr('id', "track-"+_.id);

		selection.append('div').attr('id', _.timeRulerContainerId);
		selection.append('div').attr('id', _.miniTimelineContainerId);
		selection.append('div').attr('id', _.mainTimelineContainerId);

		d3.select("#"+_.mainTimelineContainerId).call(timeline.draw);

		setup_event_listeners();

		create_mini_timeline(_.miniTimelineContainerId, params.width, 15, params.initialTimeDomain);

		create_time_ruler(_.timeRulerContainerId, params.width, 15, params.initialTimeDomain);

		_.toggle_time_ruler(_.showTimeRuler);
		_.toggle_scroll(_.showMiniTimeLine);
	}

	function create_mini_timeline(containerId, width, height, domain) {
		miniTimeline = new wavesUI.timeline()
			.xDomain(domain)
			.width(width)
			.height(height);

		scrollSegment = new wavesUI.segment()
			.params({
				interactions: { 
					editable: true, 
					selectable: true
				},
				opacity: 0.3,
				handlerOpacity: 1
			})
			.data([{start: domain[0], duration: domain[1]}])
			.color(defaultScrollCursorColor);

		miniTimeline.add(scrollSegment);

		miniTimeline.on('drag', function(domElement, mouseEvent) {
			// _.set_time_domain(domElement.d.start, domElement.d.start + domElement.d.duration)
			update_time_ruler();
			var start = domElement.d.start;
			var end = start + domElement.d.duration;
			timeline.xScale.domain([start, end]);
			timeline.xZoomSet();
			timeline.update();
		});

		if (containerId)
			d3.select("#"+containerId).call(miniTimeline.draw);
	}

	function create_time_ruler(containerId, width, height, domain) {

		var timeRulerUIParentContainer = d3.select("#"+containerId).append('svg')
				.attr('width', width)
				.attr('height', height);

		timeRulerAxis = d3.svg.axis()
			.scale(timeline.xScale)
			.tickSize(1,1)
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

		timeRulerUI = timeRulerUIParentContainer.append('g')
			.attr('class', 'x-axis')
			.attr('transform', 'translate(0, 0)')
			.attr('fill', '#555')
			.attr('background', 'yellow')
			.call(timeRulerAxis);

		if (containerId)
			d3.select("#"+containerId).call(miniTimeline.draw);
	}

	function setup_event_listeners() {

		segmentsLayer.on('drag', function(domElement, mouseEvent) {
			
			if (domElement) {
				if (segmentsLayer.dragging.obj)
					_.emit('track:segment:drag', { d: mouseEvent.d });
				else 
					_.emit('track:segment:drag_start', { d: mouseEvent.d });
				segmentsLayer.dragging.obj = mouseEvent;
				// timeline.update(segmentsLayer); // FOR SOME REASON, THIS LINE MESSES THE EDITOR...
				timeline.update(labelsLayer);
				// segmentsLayer.select(domElement);
			}
		});

		timeline.on('mouseup', function(mouseEvent) {
			if (mouseEvent.target && segmentsLayer.dragging.obj) {
				if (snap) {
					var markerFilterFunction = function (i, grid) {

						if (_.get_snap_mode()=="per-measure" && grid[i].in_measure_index!=1)
							return false;
						else
							return true;
					};
					var beatGrid = beatGridLayer.__data;
					var struct = segmentsLayer.dragging.obj.d;
					var start = struct.start;
					var end = struct.start + struct.duration;
					var start_aligned = align_time_to_grid(beatGrid, start, markerFilterFunction);
					var end_aligned = align_time_to_grid(beatGrid, end, markerFilterFunction);
					struct.start = start_aligned;
					struct.duration = end_aligned - start_aligned;
					segmentsLayer.dragging.obj = undefined;
					struct = undefined;
				}
				// _.emit('track:segment:update', {data: mouseEvent.d});
				_.emit('track:segment:drag_end', {data: mouseEvent.d});
				timeline.update();
			}
		});

		segmentsLayer.on('drag-start', function(domElement, mouseEvent) {
			console.log("começou a draggar")
		});

		segmentsLayer.on('drag', function(domElement, mouseEvent) {
			console.log("está a draggar")
		});

		segmentsLayer.on('drag-end', function(domElement, mouseEvent) {
			console.log("acabou de draggar")
		});

		segmentsLayer.on('mousedown', function(domElement, mouseEvent) {
			if (mouseEvent.ctrlKey) {
				var beatGrid = beatGridLayer.__data;
				// var time = timeline.xScale.invert(mouseEvent.clientX);
				var time = timeline.xScale.invert(d3.mouse(this.g[0][0])[0]);
				var intervalData = get_closest_values(beatGrid, time, function (i, grid) {

						if (_.get_snap_mode()=="per-measure" && grid[i].in_measure_index!=1)
							return false;
						else
							return true;
					});
				// console.log(intervalData.values);
				var obj = {
					start: intervalData.values[0],
					duration: intervalData.values[1] - intervalData.values[0],
					text: ""+Math.random()
				}
				_.add_segment(obj);
				_.emit('track:segment:add', {input:obj});
			}
		});
	}
	

	this.add_segments = function (newSegments, layerId) {
		// TODO: add to specific layer
		var sl = segmentsLayer.__data;
		for (var i=0; i<newSegments; i++) {
			sl[sl.length] = newSegments[i];
		}
		timeline.update(segmentsLayer);
	}

	this.add_segment = function (newSegment, layerId) {
		// TODO: add to specific layer
		var L = segmentsLayer.__data.length | 0;
		segmentsLayer.__data[L] = newSegment;
		timeline.update(segmentsLayer);
		timeline.update(labelsLayer);
	}

	this.remove_segment = function (segmentId) {
		var L = segmentsLayer.__data.length | 0;
		for (var i=0; i<L; i++) {
			if (segmentsLayer.__data[i].id==segmentId) {
				this.emit('track:segment:delete', {id: segmentId});
				delete segmentsLayer.__data[i];
				return true;
			}
		}
		timeline.update(segmentsLayer);
		return false;
	}

	function update_time_ruler () {
		if (showTimeRuler) {
			timeline.xZoomSet();
			timeRulerUI.call(timeRulerAxis);
		}
	}

	

	this.show_segment_info = function() {
		// TODO
	}


    

	this.add_waveform = function(buffers) {
		waveformLayer = new wavesUI.waveform()
			.params({renderingStrategy: 'svg'})
			.data(buffers.getChannelData(0).buffer)
  			.sampleRate(buffers.sampleRate)
  			.color(defaultWaveformColor);

  		timeline.add(waveformLayer);
  		timeline.update();
	}



	


	function random_color(alpha) {
        return 'rgba(' + [
            ~~(Math.random() * 255),
            ~~(Math.random() * 255),
            ~~(Math.random() * 255),
            alpha || 1
        ] + ')';
    }

	function align_time_to_grid(grid, time, canInclude) {
		var r = get_closest_values(grid, time, canInclude);
		var a = Math.abs(time - r.values[0]);
		var b = Math.abs(time - r.values[1]);

		if (a > b)
			return r.values[0];
		else 
			return r.values[1];
    }

    function get_closest_values(grid, time, canInclude) {
		var lo, hi;
		var lo_i, hi_i;
		for (var i = grid.length; i--;) {
			if (canInclude(i, grid)) {
				if (grid[i].x <= time && (lo === undefined || lo < grid[i].x)) {
					lo = grid[i].x;
					lo_i = i;
				}

				if (grid[i].x >= time && (hi === undefined || hi > grid[i].x)) {
					hi = grid[i].x;
					hi_i = i;
				}
			}
		};
		return { values:[lo, hi], indexes:[lo_i,hi_i]};
	}

	/*
	 * -------------------------------------------
	 * ------------------SETTERS------------------
	 * -------------------------------------------
	 */

	this.set_beat_grid = function (newGrid, render) {
		beatGridLayer.__data.splice(0, beatGridLayer.__data.length);
		for (var i=0; i<newGrid.length; i++) {
			beatGridLayer.__data[i] = newGrid[i];
		}
		beatGridLayer.__data.sort(function(a, b){return a.x-b.x});
		if (render)
			timeline.update(beatGridLayer);
	}

	this.set_beat_grid_v2 = function () {
		var domain = timeline.xScale.domain();
		var start = domain[0];
		var end = domain[1];

		var refBPM = 120;
		var beatPeriod = 60/startBPM;
		var refBeatPeriod = 60/refBPM;
		var beatData = [];
		for (var time=0; time<end; i++) {

			beatPeriod
			beatData[i] = {
				in_measure_index: (i+1)%5,
				x: beatPeriod*i,
				originalX: beatPeriod*i
			};
		}
	}

	this.set_scroll_time_range = function (end) {
		if (showMiniTimeLine) {
			miniTimeline.update();
			var start = miniTimeline.xScale.domain()[0];
			miniTimeline.xScale.domain([start, end]);
			miniTimeline.xZoomSet();
		}
	}

	this.set_current_time = function (time) {
		if (follow) {
			var domain = timeline.xScale.domain();
			var start = domain[0];
			var end   = domain[1];
			var middle = (end-start)/2;

			var newStart = time - middle;
			var newEnd   = time + middle + ((newStart<0)? Math.abs(newStart) : 0);

			this.set_time_domain((newStart<0)? 0 : newStart, newEnd);
		}

		cursor.setCurrentTime(time);
		timeline.update(cursor);
	}

	this.set_time_domain = function (start, end) {
		
		scrollSegment.__data[0].start = start
		scrollSegment.__data[0].duration = end - start;
		miniTimeline.update(scrollSegment);
		miniTimeline.xScale.domain([start, end]);
		miniTimeline.xZoomSet();
		miniTimeline.update();
		
		timeline.xScale.domain([start, end]);
		timeline.xZoomSet();
		timeline.update();

		update_time_ruler();
	}

	this.set_snap_mode = function(mode) {

		if (mode=="per-measure") {
			snap_mode = "per-measure";
			return true;
		} else if (mode=="per-beat") {
			snap_mode = "per-beat";
			return true;
		}
		return false;
	}


	// EVENT LISTENER METHOD
	this.add_event_listener = function(eventType, callback) {
		var Ls = listeners[eventType];
		Ls[callback] = callback;
	}

	// EVENT LISTENER METHOD
	this.remove_event_listener = function(eventType, callback) {

		delete listeners[eventType][callback];
	}

	// EVENT LISTENER METHOD
	this.emit = function(eventType, params) {
		var Ls = listeners[eventType];
		if (Ls) {
			var callbacksNames = Object.getOwnPropertyNames(Ls)
			for (var i=0; i<callbacksNames.length; i++) 
				Ls[callbacksNames[i]](params);
		}
	}

	/*
	 * -------------------------------------------
	 * -----------------TOGGLERS------------------
	 * -------------------------------------------
	 */
	this.toggle_time_ruler = function(toggle) {
		showTimeRuler = toggle;
		d3.select("#"+_.timeRulerContainerId).style("display", (showTimeRuler)? "inherit" : "none");
		// TODO
	}

	this.toggle_scroll = function(toggle) {
		showMiniTimeLine = toggle;
		d3.select("#"+_.miniTimelineContainerId).style("display", (showMiniTimeLine)? "inherit" : "none");
		// TODO
	}

	this.toggle_grid = function (show) {
		beatGridLayer.g[0][0].setAttribute("style", (show)? "display:none" : "");
	}

	this.toggle_snap_to_grid = function (_snap) {
		snap = _snap;
	}

	this.toggle_follow_cursor = function (_follow) {
		follow = _follow;
	}

	/*
	 * -------------------------------------------
	 * -----------------GETTERS-------------------
	 * -------------------------------------------
	 */
	this.get_segments_layer = function (layerId) {
		/*
		 *	TODO
		 */
	}

	this.get_segments = function (ids) {
		var segmentsToReturn = [];
		if (!ids) {
			var L = segmentsLayer.__data.length;
			segmentsToReturn = new Array(L);
			var segments = segmentsLayer.__data;
			for (var i=0; i<L; i++) 
				segmentsToReturn[i] = segments[i];
			return segmentsToReturn;
		} else {
			var L = Math.min(ids.length, segmentsLayer.__data.length);
			segmentsToReturn = new Array(ids);
			var segments = segmentsLayer.__data;
			// TODO
		}
	}

	this.get_snap_mode =function() { return snap_mode; }

	// JUST FOR DEBUGGING
	this.get_timeline = function() { return timeline; }

	// JUST FOR DEBUGGING
	this.get_segments_layer = function() { return segmentsLayer; }

	// JUST FOR DEBUGGING
	this.get_cursor = function() { return cursor; }

	// JUST FOR DEBUGGING
	this.get_beat_grid_layer = function() { return beatGridLayer; }

	// JUST FOR DEBUGGING
	this.get_labels_layer = function() { return labelsLayer; }

	// JUST FOR DEBUGGING
	this.get_scroll_segment = function() { return scrollSegment; }

	// JUST FOR DEBUGGING
	this.get_waveform = function() { return waveformLayer; }

	/*
	 * -------------------------------------------
	 * -----------------HELPERS-------------------
	 * -------------------------------------------
	 */

}