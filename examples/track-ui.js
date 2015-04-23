function TrackUI() {
	var id;
	var type;
	var height;
	var width;

	var parentContainerId;
	var mainTimelineContainerId;
	var miniTimelineContainerId;
	var timeRulerContainerId;

	var defaults = {
		colors: {
			segment  : '#cb4b16',
			cursor   : '#dc322f',
			beat     : 'steelblue',
			label    : '#686868',
			scroll   : 'grey',
			waveform : '#586e75',
		},
		height: 200, 
		width : 800,
		timeDomain : [0, 10],
		opacity: {
			segment : 0.3,
			segmentHandler : 0.5,
			marker: 0.9,
			miniTimeline: 0.3,
			miniTimelineHandler: 1
		}
	};

	var cursor;
	var timeline;
	var beatGridLayer;
	var segmentsLayer;
	var labelsLayer;
	var waveformLayer;

	// LAYERS COLLECTIONS
	var layersCollections = {
		'segments'   : {},
		'automation' : {},
		'markers'    : {},
		'labels'     : {}
	};

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
		'track:set-time-domain' : {},
		'track:set-current-time' : {},
		'track:click' : {},

		'track:layer:set-visibility' : {},
		'track:layer:add' : {},
		'track:layer:update' : {}, 
		'track:layer:delete' : {},
		'track:layer:mousedown' : {},
		'track:layer:mouseup' : {},

		'track:layer:element:add' : {},
		'track:layer:element:update' : {}, 
		'track:layer:element:delete' : {},
		'track:layer:element:mousedown' : {},
		'track:layer:element:mouseup' : {},
		'track:layer:element:drag-start': {},
		'track:layer:element:drag': {},
		'track:layer:element:drag-end': {},
	};

	var _;

	/**
	 * params: id, type, initialTimeDomain, width, height, 
	 *          beatGrid, segments, parentContainerId
	 */
	this.init = function (params) {

		_ = this;

		_.id   = params.id;
		_.type = params.type;
		_.height = params.height;
		_.width = params.width;

		_.parentContainerId 	  = params.parentContainerId;
		_.mainTimelineContainerId = _.type + "-" + _.id + "-mainTimeline";
		_.miniTimelineContainerId = _.type + "-" + _.id + "-miniTimeline";
		_.timeRulerContainerId    = _.type + "-" + _.id + "-timeRuler";


		// Create the timeline
		timeline = new wavesUI.timeline()
				.xDomain(params.initialTimeDomain || defaults.timeDomain)
				.width(params.width || defaults.width)
				.height(params.height || defaults.height);

		// Create time cursor
		// params: displayHandle, editable, selectable, 
		//         data[{time, color (opt), height (opt)}], 
		//         color, height, opacity (opt), id
		cursor = create_markers_layer_object({
			displayHandle: true, editable: false, selectable: false,
			data: [{time:0}], color: defaults.colors.cursor, height: _.height,
			id: "time-cursor-layer" });

		// Create beat grid layer
		// params: displayHandle, editable, selectable, 
		//         data[{time, color (opt), height (opt)}], 
		//         color, height, opacity (opt), id
		beatGridLayer = create_markers_layer_object({
			displayHandle: false, editable: false, selectable: false, 
			data: [], 
			color: function(d, v) { if (d.in_measure_index == 0) return "black"; else return defaults.colors.beat; }, 
			height: function(d, v) { if (d.in_measure_index == 0) return 100; else return 50; },
			id: "beat-grid-layer"
		});

		_.set_beat_grid(params.beatGrid, false);

		// Create segments layer		
		_.add_layer({
			id: 'default', data: [], type: 'segments', hasLabels: true, 
			editable: true, selectable: true,
			segmentsColor: function(d,v) { return (d.color)? d.color : defaults.colors.segment; }, 
			labelsColor: defaults.colors.label
		});

		// timeline.on('new-layer', function(layer){
		// 	console.log(layer);
		// })

		// timeline.add(labelsLayer);
		// timeline.add(segmentsLayer);
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
		selection.append('div').attr('id', _.mainTimelineContainerId + "-additional-container");

		d3.select("#"+_.mainTimelineContainerId).call(timeline.draw);

		setup_event_listeners(layersCollections['segments']['default'], 'segments');

		create_mini_timeline(_.miniTimelineContainerId, params.width, 15, params.initialTimeDomain);

		create_time_ruler(_.timeRulerContainerId, params.width, 15, params.initialTimeDomain);

		_.toggle_time_ruler(_.showTimeRuler);
		_.toggle_scroll(_.showMiniTimeLine);
	}

	var create_mini_timeline = function(containerId, width, height, domain) {
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
				opacity: defaults.opacity.miniTimeline,
				handlerOpacity: defaults.opacity.minitTimelineHandler
			})
			.data([{start: domain[0], duration: domain[1]}])
			.color(defaults.colors.scroll);

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

	var create_time_ruler = function(containerId, width, height, domain) {

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

	function setup_event_listeners(layer, type) {

		layer.on('mouseup', function(domElement, mouseEvent) {
			console.log("mouseup");
			console.log(arguments);
		});

		layer.on('mousedown', function(domElement, mouseEvent) {
			console.log("mousedown");
			console.log(arguments);
			// ADD NEW SEGMENT
			if (mouseEvent.originalEvent.ctrlKey && !domElement) {
				var beatGrid = beatGridLayer.__data;
				// var time = timeline.xScale.invert(mouseEvent.clientX);
				var time = timeline.xScale.invert(d3.mouse(this.g[0][0])[0]);
				var intervalData = get_closest_values(beatGrid, time, function (i, grid) {

						if (_.get_snap_mode()=="per-measure" && grid[i].in_measure_index!=0)
							return false;
						else
							return true;
					});
				// console.log(intervalData.values);
				var start = intervalData.values[0];
				var end = intervalData.values[1];
				var duration = end - start;
				var color = random_color_v2();
				var obj = {
					start: start,
					duration: duration,
					color: color,
					text: ""+Math.random(),
					marginTop: Math.random()*(_.height-5-2)
				};
				_.add_segment(obj);
				_.emit('track:layer:element:add', {input:obj});
			}
		});

		layer.on('drag-start', function(domElement, mouseEvent) {
			console.log("começou a draggar");
			timeline.update(this.labelsLayer);
			_.emit('track:layer:element:drag-start', {domElement: domElement, mouseEvent: mouseEvent});
		});

		layer.on('drag', function(domElement, mouseEvent) {
			console.log("está a draggar");
			timeline.update(this.labelsLayer);
			_.emit('track:layer:element:drag', {domElement: domElement, mouseEvent: mouseEvent});
		});

		layer.on('drag-end', function(domElement, mouseEvent) {
			console.log("acabou de draggar");
			if (snap) {
				var markerFilterFunction = function (i, grid) {

					if (_.get_snap_mode()=="per-measure" && grid[i].in_measure_index!=0)
						return false;
					else
						return true;
				};
				var beatGrid = beatGridLayer.__data;
				var struct = mouseEvent.d;
				var start = struct.start;
				var start_aligned = align_time_to_grid(beatGrid, start, markerFilterFunction);
				var end = start_aligned + struct.duration;
				var end_aligned = align_time_to_grid(beatGrid, end, markerFilterFunction);
				struct.start = start_aligned;
				struct.duration = end_aligned - start_aligned;
			}
			_.emit('track:layer:element:drag-end', { domElement: domElement, mouseEvent: mouseEvent });
			this.draw(d3.select(domElement));
		});
	}

	this.snap_value = function(value) {
		// This function should be redefined for each use case
		return value;
	}
	
	/*

	this.remove_segment = function (segmentId) {
		var L = segmentsLayer.__data.length | 0;
		for (var i=0; i<L; i++) {
			if (segmentsLayer.__data[i].id==segmentId) {
				this.emit('track:layer:element:delete', {id: segmentId});
				delete segmentsLayer.__data[i];
				return true;
			}
		}
		timeline.update(segmentsLayer);
		return false;
	}
	*/

	var update_time_ruler = function() {
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
  			.color(defaults.colors.waveform);

  		timeline.add(waveformLayer);
  		timeline.update();
	}



	


	var random_color = function(alpha) {
        return 'rgba(' + [
            ~~(Math.random() * 255),
            ~~(Math.random() * 255),
            ~~(Math.random() * 255),
            alpha || 1
        ] + ')';
    }


	var random_color_v2 = function() {
        return 'rgb(' + [
            ~~(Math.random() * 255),
            ~~(Math.random() * 255),
            ~~(Math.random() * 255)
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
				if (grid[i].time <= time && (lo === undefined || lo < grid[i].time)) {
					lo = grid[i].time;
					lo_i = i;
				}

				if (grid[i].time >= time && (hi === undefined || hi > grid[i].time)) {
					hi = grid[i].time;
					hi_i = i;
				}
			}
		};
		return { values:[lo, hi], indexes:[lo_i,hi_i]};
	}

	function get_beats_between(grid, start, end) {
		var beats = [];
		for (var i = grid.length; i--;) {
			if (grid[i].time >= start && grid[i].time <= end)
				beats[beats.length] = grid[i];
		}
		return beats;
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
		beatGridLayer.__data.sort(function(a, b){return a.time-b.time});
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
				in_measure_index: i%4,
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

		_.emit('track:set-current-time', {time: time});
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

		_.emit('track:set-time-domain', {timeDomain: [start, end]});
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

	this.get_elements_from_layer = function (type, layerId) {
		return layersCollections[type][layerId].__data;
	}

	this.get_layers_ids = function (type, layerId) {
		// TODO
	}

	this.get_custom_data_from_layer = function(type, layerId, key, value) {
		// TODO
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

	this.get_current_time = function() { return cursor.__data[0].time; }

	this.get_id = function() { return id; }

	this.get_type = function() { return type; }

	this.get_snap_mode = function() { return snap_mode; }

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

	// EVENT LISTENER METHOD
	this.add_event_listener = function(eventType, callback) {
		var Ls = listeners[eventType];
		Ls[callback] = callback;
		Ls[callback].bind(this);
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













	// params: id, name, points, color
	this.add_automation_layer = function(params) {
		
	}

	this.remove_automation_layer = function(id) {
		
	}

	// params: layerId, time, value
	this.add_automation_point = function(params) {
		
	}

	this.remove_automation_point = function(layerId, pointId) {
		
	}

	this.add_marker = function(params) {
		var L = layersCollections['markers'][params.layerId].__data.length | 0;
		var lId = params.layerId;
		var mId = parmas.markerId;
		layersCollections['markers'][lId].__data[L] = {
			id: mId,
			x: params.time, 
			class: params.classId
		};
		layersCollections['markers'][lId].draw();
	}

	this.remove_marker = function(layerId, markerId) {
		var L = layersCollections['markers'][layerId].__data.length | 0;
		var V = layersCollections['markers'][layerId].__data;
		var dataToReturn;
		for (var i=0; i<L; i++) {
			if (V[i].id == markerId) {
				dataToReturn = V.splice(i,1)[0];
				break;
			}
		}
		return dataToReturn;
	}


	this.toggle_layer_visibility = function(type, id, show) {
		var _show = (show)?'inline':'none';
		if (type=='segments') {
			var layer = layersCollections['segments'][id];
			layer.segmentsLayer.g.attr('display', _show);
			layer.labelsLayer.g.attr('display', _show);
		} else if (type=='markers') {
			var layer = layersCollections['markers'][id];
			layer.g.attr('display', _show);
		} else if (type=='automation') {
			var layer = layersCollections['automation'][id];
			layer.g.attr('display', _show);
		} else if (type=='waveform') {
			throw "Not implement (yet)"
		}
	}

	this.change_layer_id = function(type, oldId, newId) {
		// TODO
	}


	// params: editable, selectable, opacity (opt), handlerOpacity (opt),
	//		   data[{start, duration, text (opt)}], segmentsColor ,
	//		   labelsColor, hasLabels
	var create_segments_layer_object = function(params) {
		var segmentsLayer = wavesUI.segment()
			.params({
				interactions: { 
					editable: params.editable, 
					selectable: params.selectable
				},
				opacity: params.opacity || defaults.opacity.segment,
				handlerOpacity: params.handlerOpacity || defaults.opacity.segmentHandler,
				name: params.id
			})
			.data(params.data)
			.color(params.segmentsColor);

		segmentsLayer.id = params.id;
		segmentsLayer.type = 'segments';

		var obj = {
			segmentsLayer: segmentsLayer
		};
		// TODO: remove the code under this IF. This should not be done in here
		if (params.hasLabels) { 
			var oldColor = params.color;
			var oldId    = params.id;
			params.color = params.labelsColor;
			params.id = params.id + "-labels";
			obj.labelsLayer = create_labels_layer_object(params)
			obj.segmentsLayer.labelsLayer = obj.labelsLayer;
			params.id = oldId;
			params.color = oldColor;
		} 

		return obj;
	}

	// params: data[{start, duration}], color, id
	var create_labels_layer_object = function(params) {
		var labelsLayer = wavesUI.label()
			.params({
				name: params.id
			})
			.data(params.data)
			.x(function(d, v) { 
				return d.start; 
			})
			.y(0)
			.width(function(d, v) { 
				return d.duration; 
			})
			.height(0)
			.margin({ top: 2, right: 0, bottom: 0, left: 5 })
			.bgColor('none')
			.color(params.color);

		labelsLayer.id = params.id;
		labelsLayer.type = 'labels';

		return labelsLayer;
	}

	// params: valuesRange, color, id
	//         data[{time, value, r (opt)}]
	var create_automation_layer_object = function(params) {
		var breakpointsLayer = wavesUI.breakpoint()
			.params({
				yDomain: params.valuesRange,
				interactions: {
					editable:true
				}
			})
			.data(params.data.map(function(v, i, a){
				return {
					cx: v.time,
					cy: v.value,
					r: v.radius || 5
				}	
			}))
			.color(params.color)
			.param('name', params.id);
			
		breakpointsLayer.id   = params.id;
		breakpointsLayer.type = 'automation';

		return breakpointsLayer;
	}

	// params: displayHandle, editable, selectable, 
	//         data[{time, color (opt),height (opt)}], 
	//         color, height, opacity (opt), id
	var create_markers_layer_object = function(params) {
		var markersLayer = wavesUI.marker()
			.params({
				displayHandle: params.displayHandle,
				interactions: { 
					editable: params.editable,
					selectable: params.selectable
				},
				opacity: params.opacity || defaults.opacity.marker,
				name: params.id, 
				// height: params.height
			})
			.x(function(d, v){
				if (!v) { return d.time; }
      			d.time = parseFloat(v, 10);
			})
			.data(params.data)
			.color(params.color);

		markersLayer.id   = params.id;
		markersLayer.type = 'markers';

		markersLayer.height(params.height || defaults.height);
		
		return markersLayer;
	}

	/*
	 * for segments   : id, data[{id, start, duration, text (opt), color (opt)}] (opt), 
	 *				 segmentsColor (opt), labelsColor (opt), editable, selectable
	 * for markers    : id, displayHandle, editable, selectable, data[{id, time, color}] (opt), 
	 * 				 color (opt), height (opt)
	 * for automation : id, valuesRange, color (opt), data (opt)
	 *
	 * for waveform   : TODO
	 */
	this.add_layer = function(params) {

		var type = params.type;
		var id = params.id;

		if (type=='segments') {

			var newLayers = create_segments_layer_object({
				id: id, 
				editable: params.editable,
				selectable: params.selectable, 
				data: params.data || [], 
				segmentsColor: params.segmentColor || function(d, v) { return d.color; }, 
				labelsColor: params.labelsColor || function(d, v) { return d.titleColor; },
				hasLabels: true
			});
			layersCollections['segments'][id] = newLayers.segmentsLayer;
			layersCollections['labels'][id] = newLayers.labelsLayer;
			timeline.add(layersCollections['segments'][id]);
			timeline.add(layersCollections['labels'][id]);
			_.focus_interactions_on_layer(params.id, "segments");
			_.emit('track:layer:add', {id:id, type:type});

		} else if (type=='markers') {

			var newLayer = create_markers_layer_object({
				id: id, 
				displayHandle: params.displayHandle, 
				editable: params.editable, 
				selectable: params.selectable, 
				data: params.data || [], 
				color: params.color || random_color_v2(), 
				height: params.height || defaults.height
			});
			timeline.add(newLayer);
			_.focus_interactions_on_layer(params.id, "markers");
			_.emit('track:layer:add', {id:id, type:type});

		} else if (type=='automation') {
			
			var newLayer = create_automation_layer_object({
				id: id, 
				valuesRange: params.valuesRange,
				color: params.color || random_color_v2(),
				data: params.data || []
			});
			timeline.add(newLayer);
			_.focus_interactions_on_layer(params.id, "automation");
			_.emit('track:layer:add', {id:id, type:type});

		} else if (type=='waveform') {
			// TODO
			_.focus_interactions_on_layer(params.id, "waveform");
			_.emit('track:layer:add', {id:id, type:type});
		}
	}


	this.remove_layer = function(type, layerId) {
		
		if (!layerId || layerId=='default')
			return;

		if (layersCollections['labels'][layerId]) {
			timeline.remove(layersCollections['labels'][layerId]);
			delete layersCollections['labels'][layerId];
		}

		if (type=='segment') {
			timeline.remove(layersCollections['segments'][layerId]);
			delete layersCollections['segments'][layerId];
			_.emit('track:layer:delete', {id:id, type:type});
		} else if (type=='markers') {
			timeline.remove(layersCollections['markers'][layerId]);
			delete layersCollections['markers'][layerId];
			_.emit('track:layer:delete', {id:id, type:type});
		} else if (type=='automation') {
			timeline.remove(layersCollections['automation'][layerId]);
			delete layersCollections['automation'][layerId];
			_.emit('track:layer:delete', {id:id, type:type});
		} else if (type=='waveform') {
			timeline.remove(waveformLayers[layerId]);
			delete waveformLayers[layerId];
			_.emit('track:layer:delete', {id:id, type:type});
		}
	}


	this.add_element_to_layer = function(params) {
		var type = params.type;
		params.layerId = (params.layerId)? params.layerId : 'default';
		if (type=='segment') {
			add_segment(params);
		} else if (type=='markers') {
			add_marker(params);
		} else if (type=='automation') {
			add_automation_point(params);
		} else if (type=='waveform') {
			//TODO
		}
	}

	// params: layerId (opt), id, time, color
	this.add_marker = function(params) {
		params.layerId = (params.layerId)? params.layerId : 'default';
		var layer = layersCollections['markers'][params.layerId];
		var L = layer.__data.length | 0;

		layer.__data.splice(L, 0, {
			id: params.id,
			time: params.time,
			color: params.color
		});

		if (layersCollections['labels'][params.layerId]) { add_label(params); }

		timeline.update(layer);
	}

	// params: layerId (opt), id, time, value, radius
	this.add_automation_point = function(params) {
		params.layerId = (params.layerId)? params.layerId : 'default';
		var layer = layersCollections['automation'][params.layerId];
		var L = layer.__data.length | 0;

		layer.__data.splice(L, 0, {
			id: params.id,
			time: params.time,
			value: params.value,
			radius: params.radius
		});

		if (layersCollections['labels'][params.layerId]) { add_label(params); }

		timeline.update(layer);
	}

	// params: layerId (opt), id, start, duration, text, color (opt)
	this.add_segment = function(params) {
		params.layerId = (params.layerId)? params.layerId : 'default';
		var layer = layersCollections['segments'][params.layerId];
		var L = layer.__data.length | 0;

		var newSegment = {
			id: params.id, start: params.start,
			duration: params.duration,
			text: params.text, 
			color: params.color || random_color_v2(),
			marginTop: params.marginTop
		};

		layer.__data.splice(L, 0, newSegment);

		// if (layersCollections['labels'][params.layerId]) { add_label(params); }
		
		timeline.draw(layer.g);
	}

	// params: layerId (opt), id, text
	var add_label = function(params) {
		params.layerId = (params.layerId)? params.layerId : 'default';
		var layer = layersCollections['labels'][params.layerId];
		var L = layer.__data.length | 0;
		layer.__data.splice(L, 0, {
			id: params.id, 
			text: params.text, 
			x: params.start, 
			margin: { top: 2, right: 0, bottom: 0, left: 4 }
		});
		timeline.update(layer);
	}


	// params: type, layerId (opt), id
	this.remove_element_from_layer = function(params) {
		params.layerId = (params.layerId)? params.layerId : 'default';
		var type = params.type;
		var layer;
		var L;
		if (type=='segment') 
			layer = layersCollections['segments'][params.layerId];
		else if (type=='markers') 
			layer = layersCollections['markers'][params.layerId];
		else if (type=='automation') 
			layer = layersCollections['automation'][params.layerId];
		else if (type=='waveform') 
			layer = waveformLayers[params.layerId];
		

		var layerD = layer.__data;

		for (var i=0; i<L; i++)
			if (layerData[i].id==id)
				layerData.splice(i,1);

		timeline.update(layer);
	}


	this.get_layers_visibility = function() {
		var visibility = [];
		for (var id in timeline.layers) {
			if (id) {
				var displayVal = timeline.layers[id].g.attr("display");
				visibility.splice(visibility.length, 0, {
					id: id,
					isVisible: (!displayVal) || (displayVal=="inline")
				})
			}
		}
		return visibility;
	}

	this.focus_interactions_on_layer = function(layerId, type) {
		timeline.focus(layersCollections[type][layerId]);
	}

	this.reset_focus = function() {
		timeline.resetFocus();
	}
}