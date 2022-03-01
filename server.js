
// ***** CODE THAT WORKS FOR LOCALHOST *********************
// // Load HTTP module
// const http = require("http");
// const hostname = '127.0.0.1';
// const PORT = 3000;

// //Create HTTP server and listen on port 3000 for requests
// const server = http.createServer((req, res) => {

//   //Set the response HTTP header with HTTP status and Content type
//   res.statusCode = 200;
//   res.setHeader('Content-Type', 'text/plain');
//   res.end('Hello World\n');
// });

// const io = require('socket.io')();

// //listen for request on port 3000, and as a callback function have the port listened on logged
// io.listen(process.env.PORT || 3000);
// server.listen(PORT, hostname, () => {
//   console.log(`Server running at http://${hostname}:${PORT}/`);
// });
// *********************************************************


// ***** LITERALLY THE ONLY CODE IN THE SNAKES EXAMPLE *****
const io = require('socket.io')();
io.listen(process.env.PORT || 3000);
// *********************************************************


const { FRAME_RATE } = require('./constants');
const { CANVAS_WIDTH } = require('./constants');
const { CANVAS_HEIGHT } = require('./constants');
const { BALL_WIDTH } = require('./constants');
const { BALL_HEIGHT } = require('./constants');
const { initGame, addPlayer, gameLoop, recordKeyPress, recordButtonPress, recordJoystick } = require('./game');
const { makeid } = require('./utils');
const { trimActivePlayerList, decrementAfterImage, sleep, callSleep } = require('./utils');

let start = Date.now();
let now = Date.now();
let timePassed = (now - start);

const state = {};
const clientRooms = {};


io.on('connection', client => {


  client.on('joinRoom', handleJoinRoom);
  client.on('joinGame', handleJoinGame);
  client.on('keydown', handleKeydown);
  client.on('buttondown', handleButtonDown);
  client.on('joydown', handleJoyDown);


  function handleJoinRoom(roomName) {

    clientRooms[client.id] = roomName;
    client.join(roomName);
    const room = io.sockets.adapter.rooms[roomName];
    let allUsers;
    if (room) {
      allUsers = room.sockets;
    }
    let numClients = 0;
    if (allUsers) {
      numClients = Object.keys(allUsers).length;
    }
    client.emit('initclient', client.id);
    console.log("Client " + client.id + " entered the room")

    if (!state[roomName] || numClients === 1) {
      createNewGame(roomName);
      return;
    }
  }


  function handleJoinGame(playerName) {

    // currently everybody goes to the same room - I'll create separate rooms later
    roomName = "AAAAA";

    // create a new player object and push it into the list
    newPlayer = addPlayer(state[roomName], client.id, playerName);
    state[roomName].activePlayers.push(newPlayer);
    state[roomName].numActivePlayers = state[roomName].activePlayers.length;

    // log the new player
    console.log("Client " + client.id + " (" + playerName + ") joined the game")

  }


  function handleKeydown(keyCode) {
    const roomName = clientRooms[client.id];

    if (!roomName) {
      console.log("No room name")
      return;
    }
    try {
      keyCode = parseInt(keyCode);
    } catch(e) {
      console.error(e);
      return;
    }

    const vel = recordKeyPress(keyCode);

    if (vel) {
      state[roomName].x[client.number - 1] = vel.x;
      state[roomName].y[client.number - 1] = vel.y;
    }
  }

  function handleButtonDown() {
    const roomName = clientRooms[client.id];
    if (!roomName) {
      console.log("No room name")
      return;
    }
    console.log("##### Button Pressed by Client " + client.id)
    state[roomName].pressed[client.number - 1] = true;
    state[roomName] = recordButtonPress(client.id);
  }

  function handleJoyDown(joy) {
    const roomName = clientRooms[client.id];
    if (!roomName) {
      console.log("No room name")
      return;
    }

    // parse the joystick values
    joy = JSON.parse(joy);

    // store them in the state object
    state[roomName] = recordJoystick(state[roomName], client.id, joy);

  }

});


function startGameInterval(roomName) {

  start = Date.now();
  const intervalId = setInterval(() => {

    const winner = gameLoop(state[roomName]);
    now = Date.now();
    timePassed = now - start;
    start = Date.now();
    if (!winner) {

      const room = io.sockets.adapter.rooms[roomName];
      let allUsers;
      if (room) {
        allUsers = room.sockets;
      }
      if (allUsers) {
        state[roomName] = trimActivePlayerList(state[roomName], Object.keys(allUsers));
      }
      state[roomName].numActivePlayers = state[roomName].activePlayers.length;
      // console.log("state[roomName].numActivePlayers: " + state[roomName].numActivePlayers)
      state[roomName] = decrementAfterImage(state[roomName]);
      emitGameState(roomName, state[roomName]);
    } else {
      emitGameOver(roomName, state[roomName]);
      clearInterval(intervalId);
    }
  }, 1000 / FRAME_RATE);
}


function createNewGame(roomName) {

  state[roomName] = initGame();
  startGameInterval(roomName);

}


function testInterval() {
  console.log("Time stamp: " + Date.now())
}


function emitGameState(room, gameState) {
  // Send this event to everyone in the room.
  io.sockets.in(room)
    .emit('gameState', JSON.stringify(gameState));
}

function emitGameOver(room, gameState) {
  // Send this event to everyone in the room.
  io.sockets.in(room)
    .emit('gameOver', JSON.stringify(gameState));
}

function emitScore(room, score) {
  // Send this event to everyone in the room.
  io.sockets.in(room)
    .emit('gameScore', JSON.stringify(score));
}

