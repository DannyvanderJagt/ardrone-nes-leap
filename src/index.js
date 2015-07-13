/* TODO: 

- Clean up code
- Code restructure.
- Wait of both controllers and ardrone to be ready. (done)
- Try to reach a certain height automatic.??? 
- Stabalize nes controller

- PNGStream / video stream?

- Create fancy client.

*/ 

// Dependencies.
var	util			= require('util'),
	EventEmitter	= require('eventemitter2').EventEmitter2,
	arDrone 		= require('ar-drone'),
	io 				= require('socket.io');
	Browser			= require('./browser');
var clc = require('cli-color');

// Controllers.
var NES = require('./nes.js');
var Leap = require('./leap.js');


// Module.
var	Drone = function(){
	if(!(this instanceof Drone)){
		return new Drone();
	}
		// this.wildcard = true;
	/**
	 * Is the drone arbone?
	 *
	 * The drone is:
	 *	0 - on the ground
	 *	1 - in the air
	 *	2 - taking off
	 * 	3 - lading
	 * 
	 */
	this.arborne = 0;

	/**
	 * State
	 * 	0 - offline
	 * 	1 - connecting...
	 * 	3 - connection failed
	 *  4 - connected (not ready)
	 *  5 - ready
	 *  6 - no controllers attached
	 */
	this.state = 0, 

	// Up to two controllers.
	this.controllers = {
		// nes: new NES({
		// 	serial: "/dev/cu.usbmodem1421", // Make sure this is set to your port! 
		//     controllers:[
		//         {
		//             clock: 2,
		//             latch: 3,
		//             data: 4
		//         }
		//     ]
		// }),
		leap: new Leap(this)
	};

	this.controllersReady = 0;

	// Type
	this.type = 'normal' // ease

	// Client. (the connection with the real ar drone)
	this.client = null; 

	// Max settings.
	this.max = {
		speed: {
			altitude: 0.1,
			moving: 0.1,
			turn: 0.1
		}
	};

	this.change = {
		up:{
			altitude: 1,
			moving: 1,
			turn: 1
		},
		down:{
			altitude: 3,
			moving: 3,
			turn: 3
		}
	};

	return this;
};

util.inherits(Drone, EventEmitter);

// Connect to the drone.
Drone.prototype.connect = function(){
	this.emit('state', this.state);

	// Check for controllers.
	if(this.controllers.length === 0){
		this.emit('error', 'There are no controllers to attache!');
	}

	// Make connection with the drone.
	this.state = 1;
	this.emit('state', this.state);
	this.client = arDrone.createClient();
	if(this.client === null){
		this.state = 3;
		this.emit('error', 'We couldn\'t connect to the drone!');
		this.emit('state', this.state);
	}
	this.state = 4;
	this.emit('state', this.state);
	this.emit('connected');

	// this.client.config('general:navdata_demo', 'FALSE');

	this.client.on('batteryChange', function(){
		// console.log('batteryChange', arguments);
	});

	// this.client.on('altitudeChange', function(){
	// 	console.log('altitudeChange', arguments);
	// });

	// Wait for the controllers to connect!
	// Listen to the controllers.
	var controller = null
	for(var name in this.controllers){
		controller = this.controllers[name];
		this.emit('controller', name, 'searching');
		controller.on('ready', this.onControllerReady.bind(this, name));
		controller.on('disconnect', this.onControllerDisconnect.bind(this, name));
		controller.on('command', this.onCommand.bind(this));
	}

	// this.client.animateLeds('doubleMissile', 5, 6);

	return this;
}

// Controller events.
Drone.prototype.onControllerReady = function(name){
	this.emit('controller', name, 'ready');
	this.controllersReady++;

	var allReady = true;
	for(var name in this.controllers){
		if(this.controllers[name].ready !== true){
			allReady = false;
			return false;
		}
	}

	if(allReady === true){
		this.state = 5;
		this.emit('state', this.state);
	}

	return this;
}

Drone.prototype.onControllerDisconnect = function(name){
	// Just the be careful.
	this.land();
	this.emit('controller', name, 'disconnect');
	this.state = 6;
	this.controllersReady--;
	this.emit('state', 6);
	return this;
}


Drone.prototype.onCommand = function(event, value){
	if(this[event]){
		this[event](value);
	}
}

Drone.prototype.toggleTakeoffAndLand = function(){
	if(this.arborne === 0){
		this.takeoff();
	}else{
		this.land();
	}
	return this;
}

Drone.prototype.land = function(){
	if(!this.client){
		return false;
	}

	this.client.land();
	this.arborne = 0;
	this.emit('land');
	this.emit('command', 'land');
	return this;
}

Drone.prototype.takeoff = function(){
	// console.log('Trying to take off!');
	if(!this.client){
		return false;
	}

	this.client.takeoff();
	this.arborne = 1;
	this.emit('takeoff');
	this.emit('command', 'takeoff');
	return this;
}

Drone.prototype.up = function(value){
	if(!this.client){
		return false;
	}
	this.client.up(value);
	this.emit('command', 'up', value);
	return this;
}

Drone.prototype.down = function(value){
	if(!this.client){
		return false;
	}
	this.client.down(value);
	this.emit('command', 'down', value);
	return this;
}

Drone.prototype.left = function(value){
	if(!this.client){
		return false;
	}
	this.client.left(value);
	this.emit('command', 'left', value);
	return this;
}

Drone.prototype.right = function(value){
	if(!this.client){
		return false;
	}
	this.client.right(value);
	this.emit('command', 'right', value);
	return this;
}

Drone.prototype.forward = function(value){
	if(!this.client){
		return false;
	}
	this.client.front(value);
	this.emit('command', 'forward', value);
	return this;
}

Drone.prototype.backward = function(value){
	if(!this.client){
		return false;
	}
	this.client.back(value);
	this.emit('command', 'backward', value);
	return this;
}

Drone.prototype.turnClockwise = function(value){
	if(!this.client){
		return false;
	}
	this.client.clockwise(value);
	this.emit('command', 'clockwise', value);
	return this;
}

Drone.prototype.turnCounterClockwise = function(value){
	if(!this.client){
		return false;
	}
	this.client.counterClockwise(value);
	this.emit('command', 'counterClockwise', value);
	return this;
}

// Stop moving.
Drone.prototype.stop = function(){
	if(!this.client){
		return false;
	}
	this.client.stop();
	this.emit('command', 'stop');
	return this;
}

var d = Drone();

var logStates = {
	0: 'offline',
	1 : 'connecting...',
	3 : 'connection failed',
	4 : 'connected',
	5 : 'ready',
	6 : 'no controllers attached',
};

d.on('*', function(event, command, value){
	var msg = "";
	if(event === 'command'){
		if(value == 0){
			msg = clc.xterm(242)("Stop:" + command);
		}else{
			var msg = command;
			if(value !== undefined){
				msg += " at: " + value + " speed.";
			}
			msg = clc.xterm(242)(msg);
		}
	}else if(event === 'land'){
		msg = clc.xterm(228)(command);
	}else if(event === 'state'){
		msg = clc.xterm(36)('State: ')+ logStates[command];
	}else if(event === 'controller'){
		msg = clc.xterm(105)('Controller ('+command+'): ') + value;
	}else if(event === 'connected'){
		msg = clc.xterm(205)('Drone: ') + 'connected!';
	}else{
		msg = clc.xterm(36)(event, command, value);
	}
	console.log("> " + msg);
	// console.log(arguments);
	Browser.send.apply(Browser, arguments);
});

// d.on('error', console.log.bind(console,'error '));
// d.on('state', function(){
// 	console.log('STATE', arguments);
// });

// d.on('controller', function(name){
// 	console.log('Controller', arguments);
// });

// d.on('command', function(command, value){
// 	Browser.send('command', {
// 		command: command,
// 		value: value
// 	});
// 	console.log('command', arguments);
// });


d.connect();