var io 			= require('socket.io')(3000);

console.log('The server is running at port: 3000');

var Browser = {

	send: function(event, data){
		io.emit.apply(io, arguments);
		io.emit.apply(io, ['*', arguments]);
	}
};




module.exports = Browser;

