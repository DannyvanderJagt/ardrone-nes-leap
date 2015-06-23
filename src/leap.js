// Dependencies.
var	util			= require('util'),
	EventEmitter	= require('events').EventEmitter,
	Leap 			= require('leapjs'),
	controller 		= new Leap.Controller();
	// controller.connect();

// Module.
var Controller = function(data){
	if(!(this instanceof Controller)){
		return new Controller(data);
	}

	this.load();

	return this;
}

util.inherits(Controller, EventEmitter);

// Make a connection!.
Controller.prototype.load = function(){
	// Little hack.
	setTimeout(function(){
		this.emit('ready');
	}.bind(this));


	Leap.loop(this.loop.bind(this));

	return this;
}

var preHandLeft = 0;
var preHandRight = 0;

Controller.prototype.loop = function(frame){
	var left = null;
	var right = null;
	var r = {};
	var l = {};

	if(frame.hands && frame.hands[0]){
		left = frame.hands[0].type == 'left' ? frame.hands[0] : left;
		right = frame.hands[0].type == 'right' ? frame.hands[0] : right;
	}
	if(frame.hands && frame.hands[1]){
		left = frame.hands[1].type == 'left' ? frame.hands[1] : left;
		right = frame.hands[1].type == 'right' ? frame.hands[1] : right;
	}

	if(right){
	  var hand = right;
	  var crossProduct = Leap.vec3.create();
	  var direction = hand.direction;
	  var normal = hand.palmNormal;
	  // Palm rotation (x axis)
	  // console.log(Leap.vec3.cross(crossProduct, direction, normal));
	
	  // Get the height of the fingers.
	  // console.log(hand.palmPosition[1]);// - frame.hands[0].fingers[0].stabilizedTipPosition[1]);
	  // console.log('r forback: ',hand.fingers[2].tipPosition[1] - hand.palmPosition[1]);
	  // console.log(hand.palmPosition);
	  r.forback = hand.fingers[2].tipPosition[1] - hand.palmPosition[1];
	  r.grap = hand.grabStrength;
	  r.roll = hand.roll();
	   // Left and right: 
	   // console.log('r roll: ', hand.roll());
	   // console.log('r grap: ', hand.grabStrength);
	   
	   // Up and down:
	   
	   
		var previousFrame = controller.frame(1);//.hands[0].palmPosition;
		
		// console.log('r: ', preHandLeft - hand.palmPosition[1]);
		r.heightChange = preHandLeft - hand.palmPosition[1];
		r.height = hand.palmPosition[1];
		preHandLeft = hand.palmPosition[1];
	}

	if(left){
	  var hand = left;
	  var crossProduct = Leap.vec3.create();
	  var direction = hand.direction;
	  var normal = hand.palmNormal;
	  // Palm rotation (x axis)
	  // console.log(Leap.vec3.cross(crossProduct, direction, normal));
	
	  // Get the height of the fingers.
	  // console.log(hand.palmPosition[1]);// - frame.hands[0].fingers[0].stabilizedTipPosition[1]);
	  // console.log('l forback: ',hand.fingers[2].tipPosition[1] - hand.palmPosition[1]);
	  // console.log(hand.palmPosition);
	  l.forback = hand.fingers[2].tipPosition[1] - hand.palmPosition[1];
	  l.grap = hand.grabStrength;
	  l.roll = hand.roll();
	   // Left and right: 
	   // console.log('l roll: ', hand.roll());
	   // console.log('l grap: ', hand.grabStrength);
	   
	   // Up and down:
	   
	   
		var previousFrame = controller.frame(1);//.hands[0].palmPosition;
		l.heightChange = preHandLeft - hand.palmPosition[1];
		l.height = hand.palmPosition[1];
		// console.log('l: ', preHandRight - hand.palmPosition[1]);
		preHandRight = hand.palmPosition[1];
	}


	this.process(l,r);

}


var motion = {
	roll: 0, // -1, 0, 1
	forward: 0,
	launch: 0,
	up: 0,
	clockwise: 0
}

Controller.prototype.process = function(l,r){
	// console.log(l.grap, r.grap);
	if(l.grap > 0.8 && r.grap > 0.8){
		if(motion.launch === 0){
			console.log("LAUNCH OR LAND");
			this.emit('command', 'toggleTakeoffAndLand');
			this.emit('command', 'stop');
			motion.launch = 1;
			setTimeout(function(){
				motion.launch = 0;
			},1000);
		}
	}

	if(l.grap > 0.8){
		// Clockwise
		if(motion.clockwise === 0){
			console.log('counter clockwise');
			this.emit('command', 'turnCounterClockwise', 0.1);
			motion.clockwise = -1;
		}
	}else if(r.grap > 0.8){
		// Clockwise
		if(motion.clockwise === 0){
			console.log('clockwise');
			this.emit('command', 'turnClockwise', 0.1);
			motion.clockwise = 1;
		}
	}else if(motion.clockwise !== 0){
		motion.clockwise = 0;
		console.log('stop clockwise');
	}

	// Right hand.
	// Range: 0.2 - 0.4
	if(r.roll && r.grap == 0){
		r.roll = r.roll * 100;
		if(r.roll > 40){
			r.roll = 40;
		}else if(r.roll < -40){
			r.roll = -40;
		}
		if(r.roll > 20){
			if(motion.roll === 0){
				motion.roll = -1;
				console.log('left');
				this.emit('command', 'left', 0.1);
			}
		}else if(r.roll < -20){
			if(motion.roll === 0){
				console.log('right');
				this.emit('command', 'right', 0.1);
				motion.roll = 1;
			}
		}else{
			if(motion.roll !== 0){
				console.log('stop');
				// this.emit('command', 'stop');
				this.emit('command', 'left', 0);
				this.emit('command', 'right', 0);
				motion.roll = 0;
			}
		}
	}

	// forwards and backwards.
	if(r.forback){
		if(r.forback <  -25){
			if(motion.forward === 0){
				console.log('forward');
				this.emit('command', 'forward', 0.1);
				motion.forward = 1;
			}
		}else if(r.forback > 25){
			if(motion.forward === 0){
				console.log('backward');
				this.emit('command', 'backward', 0.1);
				motion.forward = -1;
			}
		}else{
			if(motion.forward !== 0){
				console.log('stop');
				// this.emit('command', 'stop');
				this.emit('command', 'forward', 0);
				this.emit('command', 'backward', 0);
				motion.forward = 0;
			}
		}
	}

	// up and down. / height.
	// if(r.heightChange){
	// 	r.heightChange = r.heightChange * 10;
	// 	if(r.heightChange > 15){
	// 		if(motion.height === 0){
	// 			console.log('down');
	// 			this.emit('command', 'down', 0.1);
	// 			motion.height = -1;
	// 		}
	// 	}else if(r.heightChange < -15){
	// 		if(motion.height === 0){
	// 			console.log('up');
	// 			this.emit('command', 'up', 0.1);
	// 			motion.height = 1;
	// 		}
	// 	}else{
	// 		if(motion.height !== 0){
	// 			console.log('stop');
	// 			this.emit('command', 'stop');
	// 			motion.height = 0;
	// 		}
	// 	}
	// }

	// if(r.height){
	// 	console.log(r.height);
	// 	if(r.height > 150 && r.height < 250){
	// 		// Change height of drone.
	// 		console.log('change height of drone ', r.height);
	// 	}
	// }
	
	// Left hand.
	// up and down.
	if(l.forback){
		// console.log(l.forback);
		if(l.forback >  25){
			if(motion.up === 0){
				console.log('up');
				this.emit('command', 'up', 0.1);
				motion.up = 1;
			}
		}else if(l.forback < -25){
			if(motion.up === 0){
				console.log('down');
				this.emit('command', 'down', 0.1);
				motion.up = -1;
			}
		}else{
			if(motion.up !== 0){
				console.log('stop');
				// this.emit('command', 'stop');
				this.emit('command', 'forward', 0);
				this.emit('command', 'backward', 0);
				motion.up = 0;
			}
		}
	}
}





// Export.
module.exports = Controller;