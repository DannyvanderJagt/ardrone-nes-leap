var socket = io('http://localhost:3000');


var Client = {

	onCommand: function(data){
		console.log('command:', data.command, data.value);
	}
}


// Listen for commands.
socket.on('command', Client.onCommand);

socket.on('controller', function(){
	console.log('controller ready!');
});

socket.on('connect', function(){
	console.log('connected!');
});

socket.on('*', function(event){
	console.log('*', event, arguments);
});