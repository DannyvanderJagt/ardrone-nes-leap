// Dependencies.
var	util			= require('util'),
	EventEmitter	= require('events').EventEmitter,
	Nes 			= require('arduino-nes');

// Module.
var Controller = function(data){
	if(!(this instanceof Controller)){
		return new Controller(data);
	}

	this.serial = data.serial;
	this.controllers = data.controllers;

	this.client = null; // The nes instance.

	this.connect();

	return this;
}

util.inherits(Controller, EventEmitter);

// Make a connection!.
Controller.prototype.connect = function(){
	this.client = new Nes({
		serial: this.serial,
		controllers: this.controllers
	});

	this.client.on('error', this.onError);
	this.client.on('connected', this.onConnection.bind(this));
	this.client.on('disconnect', this.onDisconnect.bind(this));
	this.client.on('ready', this.onReady.bind(this));

	return this;
}

Controller.prototype.onError = function(error){
	this.emit('error', error);
	return this;
}

Controller.prototype.onConnection = function(){
	this.emit('connected');
	return this;
}

Controller.prototype.onDisconnect = function(){
	this.emit('disconnect');
	return this;
}

Controller.prototype.onReady = function(){
	this.emit('ready');
	this.client.controller[0].on('*', this.onCommand.bind(this));
	return this;
}

Controller.prototype.onCommand = function(event){
	var value = 0.3;
	var droneEvent = event;
	if(event === 'up'){
		droneEvent = 'forward';
	}else if(event === 'down'){
		droneEvent = 'backward'
	}if(event === 'a'){
		droneEvent = 'up';
		value = 1;
	}else if(event === 'b'){
		droneEvent = 'down';
		value = 1;
	}else if(event === 'start'){
		droneEvent = 'turnClockwise';
		value = 1;
	}else if(event === 'select'){
		droneEvent = 'turnCounterClockwise';
		value = 1;
	}

	if(event == 'a' || event == 'b'){
		var states = this.client.controller[0].getStates();

		if(states.a == true && states.b == true){
			droneEvent = 'stop';
		}
	}

	if(event == 'start' || event == 'select'){
		var states = this.client.controller[0].getStates();
		if(states.start == true && states.select == true){
			// toggleTakeoffAndLand
			droneEvent = 'toggleTakeoffAndLand';
			this.emit('command', 'stop');
		}
	}
	
	this.emit('command', droneEvent, value);
}




// Export.
module.exports = Controller;