var board = new TracksBoardUI();
board.init({
	id: "board1", 
	type: "annotation",
	beatGrid: [], 
	initialTimeDomain: [0, 10], 
	width: 500, 
	height: 100, 
	parentContainerId: "timeline1",
	miniContainerId: "minitimeline1", 
	timeRulerContainerId: "cursor-control"
});

board.add_event_listener('board:track:add', function(data) {
	console.log("NEW TRACK")
	console.log(data);
});
board.add_event_listener('track:element:add', function(data) {
	console.log("NEW SEGMENT");
	console.log(data);
});
board.add_event_listener('track:element:drag-start', function(data) {
	console.log("DRAG START SEGMENT");
	console.log(data);
});
board.add_event_listener('track:element:drag', function(data) {
	console.log("DRAG SEGMENT");
	console.log(data);
});
board.add_event_listener('track:element:drag-end', function(data) {
	console.log("DRAG END SEGMENT");
	console.log(data);
});

board.toggle_snap_to_grid(true);


board.add_track({
	id: "subtimeline1",
	type: "annotation-track",
	height: 50, 
});

board.add_track({
	id: "subtimeline2",
	type: "annotation-track",
	height: 50, 
});
board.add_track({
	id: "subtimeline3",
	type: "annotation-track",
	height: 50, 
});

board.set_beat_grid(beatData, true);