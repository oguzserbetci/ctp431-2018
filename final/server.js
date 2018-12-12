// Dependencies
var express = require('express');
var http = require('http');
var path = require('path');
var socketIO = require('socket.io');
var app = express();
var server = http.Server(app);
var io = socketIO(server);
app.set('port', 5000);
app.use('/static', express.static(__dirname + '/static'));
// Routing
app.get('/', function(request, response) {
    response.sendFile(path.join(__dirname, 'index.html'));
});
// Starts the server.
server.listen(5000, function() {
    console.log('Starting server on port 5000');
});

// Add the WebSocket handlers
var players = {
    id: [game_id, opponent]
}
var games = {
    0: {
        balls: [],
        vectors: []
    }
};
io.on('connection', function(socket) {
    socket.on('new player', function() {
        players.push(socket.id)
    });
    socket.on('createball', function(coordinates) {
        socket.broadcast.emit('createball', coordinates)
    });
    socket.on('ballup', function(coordinates) {
        socket.broadcast.emit('ballup', coordinates)
    });
    socket.on('balldrag', function(coordinates) {
        socket.broadcast.emit('balldrag', coordinates)
    });
});

setInterval(function() {
    io.sockets.emit('balls', games[0].balls);
}, 1000 / 60);

