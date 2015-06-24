var EventEmitter = require('events').EventEmitter;

var _emit = EventEmitter.prototype.emit;
EventEmitter.prototype.emit = function(){
	_emit.call(arguments);
}

var _on = EventEmitter.prototype.on;
EventEmitter.prototype.on = function(){
	if(arguments[0] === '*'){

	}
	_on.apply(this, arguments);
}

module.exports = EventEmitter;