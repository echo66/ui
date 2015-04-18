var loadSample = function(url, callback) {
	var request = new XMLHttpRequest();
	request.open('GET', url, true);
	request.responseType = 'arraybuffer';

	request.onload = function() {
		console.log('url loaded');
		context.decodeAudioData(request.response, callback);
	}

	console.log('reading url');
	request.send();
}