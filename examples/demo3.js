var board = new TracksBoardUI();
board.init({
	containerId: "timeline1", 
	beatGrid: [], 
	initialTimeDomain: [0, 10], 
	width: 500, 
	height: 100, 
	miniContainerId: "#minitimeline1", 
	timeRulerContainerId: "#cursor-control"
});

board.add_event_listener('board:track:add', function(data) {
	console.log("NEW TRACK")
	console.log(data);
});
board.add_event_listener('board:track:segment:add', function(data) {
	console.log("NEW SEGMENT");
	console.log(data);
});

board.add_event_listener('board:track:segment:drag_start', function(data) {
	console.log("DRAG START SEGMENT");
	console.log(data);
});
board.add_event_listener('board:track:segment:drag', function(data) {
	console.log("DRAG SEGMENT");
	console.log(data);
});
board.add_event_listener('board:track:segment:drag_end', function(data) {
	console.log("DRAG END SEGMENT");
	console.log(data);
});

board.toggle_snap_to_grid(true);


board.add_track({
	id: "subtimeline1",
	height: 50, 
});
// board.add_track({
// 	id: "subtimeline2",
// 	height: 50, 
// });
// board.add_track({
// 	id: "subtimeline3",
// 	height: 50, 
// });

board.set_beat_grid(beatData, true);