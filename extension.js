(function(ext) {

	ext._shutdown = function() {};
	
	ext._getStatus = function() {
		return { status: 2, msg: 'Ready' };
	};

	ext.connect = function() {
		var socket = new WebSocket("ws://localhost:8080/");
		socket.onmessage = function(d) {
			console.log(d.data);
		}
	};

	var descriptor = {
		blocks: [
			[' ', 'connect', 'connect'],
		]
	};

	ScratchExtensions.register("EtherScratch", descriptor, ext);
})({});