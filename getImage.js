var system = require('system');
var args = system.args;

if (args.length !== 3) {
    console.log('Usage : phantomjs getImage.js {URL} {Filename}');
    phantom.exit();
} else {
    var page = require('webpage').create();
    page.open(args[1], function() {
        page.viewportSize = { width: 1440, height: 1800 };
	window.setTimeout(function() {
	        var clipRect = page.evaluate(function(){
            		return document.querySelector('.permalink-container').getBoundingClientRect();
        	});
        	page.clipRect = {
            		top:    clipRect.top,
            		left:   clipRect.left,
	                width:  clipRect.width,
            		height: clipRect.height
        	};

        	page.render(args[2]);
	        phantom.exit();
	}, 3000);
    });
}
