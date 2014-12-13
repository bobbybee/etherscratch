(function(ext) {
	var socket;

	var data = "";
	var readyForData = true;

	var newPacket = "";

	ext._shutdown = function() {};
	
	ext._getStatus = function() {
		return { status: 2, msg: 'Ready' };
	};

	ext.connect = function() {
		socket = new WebSocket("ws://localhost:8080/");
		socket.onmessage = function(d) {
			data += d.data.trim() + " ";
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
		setTimeout(function() {
			readyForData = true;
		}, 100); // slight delay to fix race condition
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

		return hex;
	}

	ext.fetch_blob = function(size, type) {
		var hex = ext.fetchHex(size);

		if(type == 'hex') {
			return hex;
		} else if(type == 'raw') {
			var result = "";
			var hexBytes = hex.split(" ");

			for(var i = 0; i < size; ++i) {
				result += String.fromCharCode(parseInt(hexBytes[i], 16));
			}

			return result;
		}
	}

	ext.skip = function(amount) {
		data = data.slice(amount * 3);
	}

	ext.add = function(size, value, type) {
		// TODO: actually implement
		// for now, assume hex value
		var hex = value;

		if(type == 'number') {
			var length = ext.sizeToLength(size); // get length in bytes
			var zeroes = (new Array( (length * 2) + 1)).join("0"); // get string of zeroes for padding
			console.log(zeroes);
			console.log(value);
			var rawHex = (value * 1).toString(16).toUpperCase(); // this will return something like FFF
			console.log(rawHex);
			hex = (zeroes + rawHex).substr( (-length * 2), (length * 2)).match(/../g).join(" "); // fix padding and inject spaces
		}

		console.log(hex);

		if(type == 'raw') {
			// TODO
		}

		newPacket += hex + " ";
	}

	ext.flush = function() {
		socket.send(newPacket.trim());
		newPacket = "";
	}

	var descriptor = {
		blocks: [
			[' ', 'connect', 'connect'],
			['-'],
			['h', 'when data is available', 'when_data'],
			[' ', 'ready for data', 'dataReady'],
			['-'],
			['r', 'get next %m.size as %m.type', 'fetch', 'byte', 'number'],
			['r', 'get next blob of %n bytes as %m.blob', 'fetch_blob', 64, 'hex'],
			[' ', 'skip next %n bytes', 'skip'],
			['-'],
			[' ', 'add %m.size from %s of type %m.type to packet', 'add', 'byte', 'FF', 'hex'],
			[' ', 'flush packets', 'flush'],
		],
		menus: {
			'size': ['byte', 'short', 'int', 'MAC Address (6 octets)'],
			'type': ['number', 'hex', 'raw'],
			'blob': ['hex', 'raw'],
		}
	};

	ScratchExtensions.register("EtherScratch", descriptor, ext);
})({});