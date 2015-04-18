var STL = new TrackUI();
STL.init({
	type: "annotation-track", 
	id: "minhaTimeline", 
	initialTimeDomain: [0, 100], 
	width: 1000, 
	height: 100, 
	beatGrid: beatData, 
	segments: [], 
	parentContainerId: "timeline1",
	miniTimelineContainerId: "#minitimeline1", 
	timeRulerContainerId: "#cursor-control"
});
STL.add_segment(segmentData[0]);