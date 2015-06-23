// Dependencies.
var	util			= require('util'),
	EventEmitter	= require('events').EventEmitter,
	arDrone 		= require('ar-drone'),
	io 				= require('socket.io');

// Controllers.
var NES = require('./nes.js');


// Module.
var	Drone = function(){
	if(!(this instanceof Drone)){
		return new Drone();
	}

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
	this.controllers = [
		new NES({
			serial: "/dev/cu.usbmodem1411", // Make sure this is set to your port! 
		    controllers:[
		        {
		            clock: 2,
		            latch: 3,
		            data: 4
		        }
		    ]
		})
	];

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
		console.log('batteryChange', arguments);
	});

	this.client.on('altitudeChange', function(){
		console.log('altitudeChange', arguments);
	});

	// Wait for the controllers to connect!
	// Listen to the controllers.
	for(var controller in this.controllers){
		controller = this.controllers[controller];

		controller.on('ready', this.onControllerReady.bind(this));
		controller.on('disconnect', this.onControllerDisconnect.bind(this));
		controller.on('command', this.onCommand.bind(this));
	}

	this.client.animateLeds('doubleMissile', 5, 6);

	return this;
}

// Controller events.
Drone.prototype.onControllerReady = function(){
	console.log('A controller is ready');
	this.controllersReady++;

	if(this.controllersReady === this.controllers.length && this.state === 4){
		this.state = 5;
		this.emit('state', this.state);
	}

	return this;
}

Drone.prototype.onControllerDisconnect = function(){
	// Just the be careful.
	this.land();

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
	console.log('Trying to take off!');
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

d.on('error', console.log.bind(console,'error '));
d.on('state', function(){
	console.log('STATE', arguments);
});

d.on('command', function(){
	console.log('command', arguments);
});

d.connect();