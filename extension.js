(function(ext) {
	ext._shutdown = function() {};
	
	ext._getStatus = function() {
		return { status: 2, msg: 'Ready' };
	};

	var descriptor = {
		blocks: [
		]
	};

	ScratchExtensions.register("EtherScratch", descriptor, ext);
})({});