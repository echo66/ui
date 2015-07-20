function TracksBoardUI() {

	var d3 = wavesUI.timeline.d3;

	var timeline;

	var miniTimeline;
	var scrollSegment;
	var timeRulerAxis;
	var timeRulerUIParentContainer;
	var timeRulerUI;

	var id;
	var type; 
	var beatGrid;
	var parentContainerId;
	var tracksContainerId;
	var miniTimelineContainerId;
	var timeRulerContainerId;

	var width;
	var height;

	var tracks = {};

	var listeners = {};

	var _;

	this.get_id = function() { return _.id; }

	this.get_type = function() { return _.type; }

	// params: id, type, beatGrid, initialTimeDomain, width, height, parentContainerId
	this.init = function (params) {

		_ = this;

		listeners = {
			'board:set-current-time': {},
			'board:set-time-domain': {},
			'board:track:add': {},
			'board:track:delete': {},
		}

		id = params.id;
		type = params.type;

		tracksContainerId       = get_tracks_container_id(id, type);
		miniTimelineContainerId = get_mini_timeline_container_id(id, type);
		timeRulerContainerId    = get_time_ruler_container_id(id, type);
		parentContainerId       = params.parentContainerId;

		var selection;
		if (parentContainerId)
			selection = d3.select('#'+parentContainerId);
		else {
			parentContainerId = get_id_prefix(id, type)
			selection = d3.select('body').append('div').attr('id', parentContainerId);
		}
			

		selection.append('div').attr('id', miniTimelineContainerId);
		selection.append('div').attr('id', timeRulerContainerId);
		selection.append('div').attr('id', tracksContainerId);

		beatGrid =params.beatGrid;

		initialTimeDomain = params.initialTimeDomain;

		width = params.width;

		height = params.height;

		_ = this;

		timeline = new wavesUI.timeline().xDomain(initialTimeDomain).width(width).height(height);
		var aux = new wavesUI.segment().params({}).data([]);
		timeline.add(aux);

		create_mini_timeline(miniTimelineContainerId, width, 15, initialTimeDomain);

		create_time_ruler(timeRulerContainerId, width, 15, initialTimeDomain);
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
			.color('grey');

		miniTimeline.add(scrollSegment);

		miniTimeline.on('drag', function(domElement, mouseEvent) {
			_.set_time_domain(domElement.d.start, domElement.d.start + domElement.d.duration)
		});

		d3.select("#"+containerId).call(miniTimeline.draw);
	}

	function create_time_ruler(containerId, width, height, domain) {

		var timeRulerUIParentContainer = d3.select(containerId).append('svg')
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

		d3.select("#"+containerId).call(miniTimeline.draw);
	}
	
	// params: id, type, height (opt)
	this.add_track = function (params) {
		var track = new TrackUI();
		var td = params;

		var domId = get_track_container_id(td.id, td.type);
		d3.select('#'+tracksContainerId).append('div').attr('id', domId);

		track.init({
			id: td.id, 
			type: td.type, 
			initialTimeDomain: initialTimeDomain, 
			width: width, 
			height: td.height || height, 
			beatGrid: beatGrid, 
			parentContainerId: domId
		});

		tracks[td.id] = track;
		d3.select('#'+domId).append('br');
		d3.select('#'+domId).append('div').attr('id', 'track-'+td.id+'-controls');

		this.emit('board:track:add', {input: td, track: track});

		return track;
	}

	this.remove_track = function(id) {
		var domId = get_track_container_id(tracks[id].get_id(), tracks[id].get_type());
		tracks[id].destroy();
		d3.select('#'+domId).remove();
		delete tracks[id];
		this.emit('board:track:delete', {id: id});
	}

	this.get_track = function(id) {
		return tracks[id];
	}

	this.set_scroll_time_range = function(end) {
		for (var id in tracks) 
			tracks[id].set_scroll_time_range(end);
	}

	this.set_time_domain = function(start, end) {
		own_set_time_domain(start, end);
		for (var id in tracks) 
			tracks[id].set_time_domain(start, end);
	}

	this.set_current_time = function(time) {
		for (var id in tracks) 
			tracks[id].set_current_time(time);
		_.emit('board:set_current_time', { time: time });
	}

	this.toggle_follow_cursor = function(_follow) {
		for (var id in tracks) 
			tracks[id].toggle_follow_cursor(_follow);
	}

	this.toggle_snap_to_grid = function(_snap) {
		for (var id in tracks) 
			tracks[id].toggle_snap_to_grid(_snap);
	}

	this.set_beat_grid = function (newGrid, render) {
		for (var id in tracks) 
			tracks[id].set_beat_grid(newGrid, true);
	}

	function own_set_time_domain (start, end) {
		timeline.xScale.domain([start, end]);
		timeline.xZoomSet();
		timeRulerUI.call(timeRulerAxis);
	}

	this.get_track_controls_dom = function(trackId) {
		//TODO
	}


	this.add_event_listener = function(eventType, callback, trackId) {
		if (trackId) {
			tracks[trackId].add_event_listener(eventType, callback);
		} else if (eventType.search("element")==-1 && eventType.search("layer")==-1) {
			var Ls = listeners[eventType];
			Ls[callback] = callback;
		} else {
			for (var i in tracks)
				tracks[trackId].add_event_listener(eventType, callback);
		}
		
	}

	this.remove_event_listener = function(eventType, callback, trackId) {
		if (trackId) {
			tracks[trackId].remove_event_listener(eventType, callback);
		} else
			delete listeners[eventType][callback];
	}

	this.emit = function(eventType, params) {
		var Ls = listeners[eventType];
		if (Ls) {
			var callbacksNames = Object.getOwnPropertyNames(Ls)
			for (var i=0; i<callbacksNames.length; i++) 
				Ls[callbacksNames[i]](params);
		}
	}

	this.destroy = function() {
		for (var i in tracks) 
			tracks[i].destroy();

		tracks = undefined;

		d3 = undefined;

		timeline = undefined;

		miniTimeline = undefined;
		scrollSegment = undefined;
		timeRulerAxis = undefined;
		timeRulerUIParentContainer = undefined;
		timeRulerUI = undefined;

		id = undefined;
		beatGrid = undefined;
		parentContainerId = undefined;
		tracksContainerId = undefined;
		miniTimelineContainerId = undefined;
		timeRulerContainerId = undefined;

		width = undefined;
		height = undefined;

		tracks = undefined;

		listeners = undefined;

		_ = undefined;
	}


	function get_id_prefix(id, type) { return type + "-tracks-board-" + id; }

	function get_tracks_container_id(id, type) { return get_id_prefix(id, type) + "-tracks"; }

	function get_mini_timeline_container_id(id, type) { return get_id_prefix(id, type) + "-miniTimeline"; }

	function get_time_ruler_container_id(id, type) { return get_id_prefix(id, type) + "-timeRuler"; }

	function get_track_container_id(id, type) { return get_id_prefix(id, type) + "-master-container";}
}