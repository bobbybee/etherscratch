(function(ext) {
	var data = "";
	var readyForData = true;

	ext._shutdown = function() {};
	
	ext._getStatus = function() {
		return { status: 2, msg: 'Ready' };
	};

	ext.connect = function() {
		var socket = new WebSocket("ws://localhost:8080/");
		socket.onmessage = function(d) {
			data += d.data.trim() + " ";
			//console.log(d.data);
		}
	};

	ext.when_data = function() {
		if(readyForData && data.length > 1) {
			readyForData = false;
			return true;
		}

		return false;
	};

	ext.dataReady = function() {
		readyForData = true;
	};

	var descriptor = {
		blocks: [
			[' ', 'connect', 'connect'],
			['-'],
			['h', 'when data is available', 'when_data'],
			[' ', 'ready for data', 'dataReady'],
		]
	};

	ScratchExtensions.register("EtherScratch", descriptor, ext);
})({});