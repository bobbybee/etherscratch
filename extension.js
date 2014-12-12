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

	ext.sizeToLength = function(size) {
		if(size == 'byte') return 1;
		if(size == 'short') return 2;
		if(size == 'int') return 4;
		if(size == 'MAC Address (6 octets)') return 6;
	}

	ext.fetchHex = function(numBytes) {
		var hex = data.slice(0, numBytes * 3);
		data = data.slice(numBytes * 3);
		return hex.trim();
	}

	ext.fetch = function(size, type) {
		var length = ext.sizeToLength(size);
		var hex = ext.fetchHex(length);
		
		if(type == 'hex') {
			return hex; // nothing to do
		}

		if(type == 'number') {
			// decode as network-endian (big-endian)
			// WARNING: due to ECMAScript logic, this will only work properly for bytes and shorts
			// proceed with caution

			return parseInt(hex.split(" ").join(''), 16);
		}

		if(type == 'raw') {
			// TODO: look into how encodings will affect this

			var result = "";
			var hexBytes = hex.split(" ");

			for(var i = 0; i < length; ++i) {
				result += String.fromCharCode(parseInt(hexBytes[i], 16));
			}

			return result;
		}

		// TODO: number, raw
		return hex;
	}

	var descriptor = {
		blocks: [
			[' ', 'connect', 'connect'],
			['-'],
			['h', 'when data is available', 'when_data'],
			[' ', 'ready for data', 'dataReady'],
			['-'],
			['r', 'get next %m.size as %m.type', 'fetch', 'byte', 'number'],
		],
		menus: {
			'size': ['byte', 'short', 'int', 'MAC Address (6 octets)'],
			'type': ['number', 'hex', 'raw'],
		}
	};

	ScratchExtensions.register("EtherScratch", descriptor, ext);
})({});