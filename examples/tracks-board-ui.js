function TracksBoardUI() {

	// var Timeline     = wavesUI.timeline;
	var SegmentLayer = wavesUI.segment;
	var d3 			 = wavesUI.timeline.d3;

	var timeline;

	var miniTimeline;
	var scrollSegment;
	var timeRulerAxis;
	var timeRulerUIParentContainer;
	var timeRulerUI;

	var masterContainerId;
	var beatGrid;

	var width;
	var height;

	var tracks = {};

	var listeners = {};

	var defaultListeners = {};

	var _;
	
	this.init = function (params) {

		listeners = {
			'board:set_current_time': {},
			'board:track:add': {},
			'board:track:delete': {},
			'board:track:segment:add': {},
			'board:track:segment:update': {},
			'board:track:segment:remove': {},
			'board:track:segment:drag_start': {},
			'board:track:segment:drag': {},
			'board:track:segment:drag_end': {},
		}

		defaultListeners = {
			'board:track:segment:add': function(data) { _.emit('board:track:segment:add', data); },
			'board:track:segment:update': function(data) { _.emit('board:track:segment:update', data); },
			'board:track:segment:remove': function(data) { _.emit('board:track:segment:remove', data); },
			'board:track:segment:drag_start': function(data) { _.emit('board:track:segment:drag_start', data); },
			'board:track:segment:drag': function(data) { _.emit('board:track:segment:drag', data); },
			'board:track:segment:drag_end': function(data) { _.emit('board:track:segment:drag_end', data); },
		}

		masterContainerId = params.id;

		beatGrid =params.beatGrid;

		initialTimeDomain = params.initialTimeDomain;

		width = params.width;

		height = params.height;

		_ = this;

		timeline = new wavesUI.timeline().xDomain(initialTimeDomain).width(width).height(height);
		var aux = new SegmentLayer().params({}).data([]);
		timeline.add(aux);

		create_mini_timeline(params.miniContainerId, width, 15, initialTimeDomain);

		create_time_ruler(params.timeRulerContainerId, width, 15, initialTimeDomain);
	}


	function create_mini_timeline(containerId, width, height, domain) {
		miniTimeline = new wavesUI.timeline()
			.xDomain(domain)
			.width(width)
			.height(height);

		scrollSegment = new SegmentLayer()
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

		d3.select(containerId).call(miniTimeline.draw);
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

		d3.select(containerId).call(miniTimeline.draw);
	}
	
	this.add_track = function (trackData) {
		var track = new TrackUI();
		var td = trackData;

		var domId = 'track-'+td.id+'-container';
		d3.select('#'+masterContainerId).append('div').attr('id', domId);

		track.init({
			parentContainerId: domId,
			id: td.id,
			segments: [],
			beatGrid: beatGrid, 
			initialTimeDomain: initialTimeDomain,
			width: width,
			height: td.height,
			minitimeline: false,
			timeruler: false
		});
		tracks[td.id] = track;
		d3.select('#'+domId).append('div').attr('id', 'track-'+td.id+'-controls');
		d3.select('#'+domId).append('br');

		track.add_event_listener('track:segment:add', defaultListeners['board:track:segment:add']);
		track.add_event_listener('track:segment:update', defaultListeners['board:track:segment:update']);
		track.add_event_listener('track:segment:delete', defaultListeners['board:track:segment:delete']);
		track.add_event_listener('track:segment:drag_start', defaultListeners['board:track:segment:drag_start']);
		track.add_event_listener('track:segment:drag', defaultListeners['board:track:segment:drag']);
		track.add_event_listener('track:segment:drag_end', defaultListeners['board:track:segment:drag_end']);

		this.emit('board:track:add', {input: td, track: track});

	}

	this.remove_track = function(id) {
		this.emit('board:track:delete', {id: td});
		var domId = 'track-'+td.id+'-container';
		d3.remove('#'+domId);
		delete tracks[id];
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


	this.add_event_listener = function(eventType, callback) {
		var Ls = listeners[eventType];
		Ls[callback] = callback;
	}

	this.remove_event_listener = function(eventType, callback) {
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

}