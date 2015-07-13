// Dependencies.
var	util			= require('util'),
	EventEmitter	= require('EventEmitter2').EventEmitter2,
	Leap 			= require('leapjs'),
	controller 		= new Leap.Controller();
	// controller.connect();

// Module.
var Controller = function(Drone){
	if(!(this instanceof Controller)){
		return new Controller(Drone);
	}

	this.ready = false;
	this.Drone = Drone;

	this.Drone.on('takeoff', function(){
		setTimeout(function(){
			// console.log("TAKEOFF DONE!!!");
			motion.arborne = 1;
		},500);
	});

	this.Drone.on('land', function(){
		setTimeout(function(){
			motion.arborne = 0;
		},500);
	});


	this.load();

	return this;
}

util.inherits(Controller, EventEmitter);

// Make a connection!.
Controller.prototype.load = function(){
	// Little hack.
	setTimeout(function(){
		this.ready = true;
		this.emit('ready');
	}.bind(this));


	Leap.loop(this.loop.bind(this));

	return this;
}

var preHandLeft = 0;
var preHandRight = 0;

Controller.prototype.loop = function(frame){
	if(this.Drone.arborne > 0 && frame.hands.length === 0){
		// Land.
		this.emit('command', 'stop');
		this.emit('command', 'land');
	}

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
	clockwise: 0,
	arborne: 0
}

Controller.prototype.process = function(l,r){
	if(l.grap > 0.8 && r.grap > 0.8){
		if(motion.launch === 0){
			// this.emit('command', 'stop');
			this.emit('command', 'toggleTakeoffAndLand');
			motion.launch = 1;
			setTimeout(function(){
				motion.launch = 0;
			},500);
		}
	}

	if(this.Drone.arborne > 0 && motion.arborne > 0){
		// if(l.grap > 0.8){
		// 	// Clockwise
		// 	if(motion.clockwise === 0){
		// 		console.log('counter clockwise');
		// 		this.emit('command', 'turnCounterClockwise', 0.1);
		// 		motion.clockwise = -1;
		// 	}
		// }else if(r.grap > 0.8){
		// 	// Clockwise
		// 	if(motion.clockwise === 0){
		// 		console.log('clockwise');
		// 		this.emit('command', 'turnClockwise', 0.1);
		// 		motion.clockwise = 1;
		// 	}
		// }else if(motion.clockwise !== 0){
		// 	motion.clockwise = 0;
		// 	console.log('stop clockwise');
		// }

		// Right hand.
		// Range: 0.2 - 0.4
		if(r.roll && r.grap < 0.5 && motion.clockwise === 0){
			r.roll = r.roll * 100;
			if(r.roll > 40){
				r.roll = 40;
			}else if(r.roll < -50){
				r.roll = -40;
			}
			if(r.roll > 20){
				if(motion.roll === 0){
					motion.roll = -1;
					this.emit('command', 'left', 0.3);
				}
			}else if(r.roll < -30){
				if(motion.roll === 0){
					this.emit('command', 'right', 0.3);
					motion.roll = 1;
				}
			}else{
				if(motion.roll !== 0){
					this.emit('command', 'left', 0);
					this.emit('command', 'right', 0);
					motion.roll = 0;
				}
			}
		}

		// // forwards and backwards.
		if(r.forback && r.grap < 0.5 && motion.clockwise === 0){
			if(r.forback <  -25){
				if(motion.forward === 0){
					this.emit('command', 'forward', 0.2);
					motion.forward = 1;
				}
			}else if(r.forback > 25){
				if(motion.forward === 0){
					this.emit('command', 'backward', 0.2);
					motion.forward = -1;
				}
			}else{
				if(motion.forward !== 0){
					this.emit('command', 'forward', 0);
					this.emit('command', 'backward', 0);
					motion.forward = 0;
				}
			}
		}

		// if(l.roll && l.grap < 0.5){
		// 	l.roll = l.roll * 100;
		// 	if(l.roll > 40){
		// 		l.roll = 40;
		// 	}else if(l.roll < -50){
		// 		l.roll = -40;
		// 	}
		// 	if(l.roll > 20){
		// 		if(motion.clockwise === 0){
		// 			motion.clockwise = -1;
		// 			this.emit('command', 'turnCounterClockwise', 0.5);
		// 		}
		// 	}else if(l.roll < -30){
		// 		if(motion.clockwise === 0){
		// 			this.emit('command', 'turnClockwise', 0.5);
		// 			motion.clockwise = 1;
		// 		}
		// 	}else{
		// 		if(motion.clockwise !== 0){
		// 			// this.emit('command', 'stop');
		// 			this.emit('command', 'turnClockwise', 0);
		// 			this.emit('command', 'turnCounterClockwise', 0);
		// 			motion.clockwise = 0;
		// 		}
		// 	}
		// }

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
		if(l.forback && l.grap == 0 && motion.clockwise === 0){
			// console.log(l.forback);
			if(l.forback >  25){
				if(motion.up === 0){
					// console.log('up');
					this.emit('command', 'up', 0.5);
					motion.up = 1;
				}
			}else if(l.forback < -25){
				if(motion.up === 0){
					// console.log('down');
					this.emit('command', 'down', 0.5);
					motion.up = -1;
				}
			}else{
				if(motion.up !== 0){
					// console.log('stop');
					this.emit('command', 'up', 0);
					this.emit('command', 'down', 0);
					motion.up = 0;
				}
			}
		}
	}
}





// Export.
module.exports = Controller;