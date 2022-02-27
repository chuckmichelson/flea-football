const { FRAME_RATE } = require('./constants');
const { CANVAS_WIDTH } = require('./constants');
const { CANVAS_HEIGHT } = require('./constants');
const { BALL_WIDTH } = require('./constants');
const { BALL_HEIGHT } = require('./constants');
const { MAX_PLAYERS_PER_ROOM } = require('./constants');
const { AVATAR_RADIUS } = require('./constants');
const { BEACH_BALL_MASS } = require('./constants');
const { BEACH_BALL_DIAMETER } = require('./constants');
const { DRAG_COEFFICIENT } = require('./constants');
const { BOUNCE_VELOCITY } = require('./constants');
const { JOYSTICK_MULTIPLIER } = require('./constants');
const { BOUNCE_IMAGE_DECAY } = require('./constants');
const { KICK_TIME } = require('./constants');

const BEACH_BALL_ACCELERATION = DRAG_COEFFICIENT / BEACH_BALL_MASS;
const PIXELS_PER_METER = BALL_WIDTH / BEACH_BALL_DIAMETER;

const { makeid } = require('./utils');
const { makeArray } = require('./utils');
const { shuffleArray } = require('./utils');
var randomWords = require('random-words');


module.exports = {
  initGame,
  addPlayer,
  gameLoop,
  recordKeyPress,
  recordButtonPress,
  recordJoystick,
}

function initGame() {
  // console.log("*****made it to initGame()")
  state = createGameState();
  start = 0;
  return state;
}

function createGameState() {
  return {
    numActivePlayers: 0,
    activePlayers: [],
    round_count: 0,
    bounce_count: 0,
    score_count: 0,
    last_bounce_start: Date.now(),
    x: Array(100).fill(0),
    y: Array(100).fill(0),
    pressed: Array(255).fill(false),
    ball: {
      pos: {
        x: CANVAS_WIDTH / 2,
        y: CANVAS_HEIGHT / 2,
      },
      last_bounce: {
        x: CANVAS_WIDTH / 2,
        y: CANVAS_HEIGHT / 2,
      },
      vel_unit: {
        x: 0,
        y: 0,
      }
    },
  };
}


function addPlayer(state, clientid, playerInitials) {
  posx = state.ball.pos.x;
  posy = state.ball.pos.y;
  freespace = false;
  while (freespace == false) {
    // console.log("freespace: " + freespace)
    randx = Math.floor(Math.random() * CANVAS_WIDTH - 4 * AVATAR_RADIUS) + 2 * AVATAR_RADIUS;
    randy = Math.floor(Math.random() * CANVAS_HEIGHT - 4 * AVATAR_RADIUS) + 2 * AVATAR_RADIUS;
    distance = Math.sqrt(Math.pow(randx - posx, 2) + Math.pow(randy - posy, 2));
    if ( distance > BALL_WIDTH / 2 + AVATAR_RADIUS ) {
      freespace = true;
    }
  }
  let newPlayer = {
    clientid: clientid,
    initials: playerInitials,
    button: false,
    afterimage: 0,
    joyx: 0,
    joyy: 0,
    joytimestamp: 0,
    posx: randx,
    posy: randy,
    velx: 0,
    vely: 0,
    bounced: false,
    bouncetimestap: null,
  };
  state.numActivePlayers += 1;
  return newPlayer;
}

function gameLoop(state) {

  // console.log("made it to gameLoop")
  if (!state) {
    return;
  }

  // check if the round is complete (everyone bounced the ball)
  var round_complete = true;
  for ( var i = state.activePlayers.length - 1; i >= 0; i-- ) {
    if (state.activePlayers[i].bounced === false) {
      round_complete = false;
    }
  }
  if (round_complete === true) {
    for ( var i = state.activePlayers.length - 1; i >= 0; i-- ) {
      state.activePlayers[i].bounced = false;
      state.activePlayers[i].bouncetimestap = null;
      state.round_count += 1;
    }
  }


  // update player positions
  state = updateVelocityAndPosition(state);

  // // decision rule
  // for (let i = 0; i < MAX_PLAYERS_PER_ROOM; i++) {
  //   // console.log("index: " + i)
  //   if (state.x[i] === 1 ) {
  //     // console.log("RIGHT")
  //     state.ball.pos.x += 3;
  //   }
  //   if (state.x[i] === -1 ) {
  //     // console.log("LEFT")
  //     state.ball.pos.x += -3;
  //   }
  //   if (state.y[i] === 1 ) {
  //     // console.log("DOWN")
  //     state.ball.pos.y += 3;
  //   }
  //   if (state.y[i] === -1 ) {
  //     // console.log("UP")
  //     state.ball.pos.y += -3;
  //   }

  //   // once we read the velocity, zero it out
  //   state.x[i] = 0;
  //   state.y[i] = 0;

  // }

  // keep the ball on the board
  lost_ball = false;
  if (state.ball.pos.x < 0 - BALL_WIDTH / 2 + 6) {
    lost_ball = true;
  }
  if (state.ball.pos.x > CANVAS_WIDTH + BALL_WIDTH / 2 - 6) {
    lost_ball = true;
  }
  if (state.ball.pos.y < 0 - BALL_WIDTH / 2 + 6) {
    lost_ball = true;
  }
  if (state.ball.pos.y > CANVAS_HEIGHT + BALL_WIDTH / 2 - 6) {
    lost_ball = true;
  }
  if (lost_ball === true) {
    state.ball.pos.x = CANVAS_WIDTH / 2;
    state.ball.pos.y = CANVAS_HEIGHT / 2;
    state.round_count = 0;
    state.bounce_count = 0;
    state.score_count = 0;
    state.ball.last_bounce.x = state.ball.pos.x;
    state.ball.last_bounce.y = state.ball.pos.y;
    state.ball.vel_unit.x = 0;
    state.ball.vel_unit.y = 0;
  }

  // reset all player velocities to 0 so the user must hold down the arrow keys
  state.x = Array(5).fill(0);
  state.y = Array(5).fill(0);

  // return with no exit code
  return false;
}


function recordKeyPress(keyCode) {
  // console.log("made it to recordKeyPress()")
  switch (keyCode) {
    case 32: { // space bar
      // console.log("SPACE BAR")
      return { x: 0, y: 0 };
    }
    case 37: { // left
      // console.log("LEFT")
      return { x: -1, y: 0 };
    }
    case 38: { // down
      // console.log("UP")
      return { x: 0, y: -1 };
    }
    case 39: { // right
      // console.log("RIGHT")
      return { x: 1, y: 0 };
    }
    case 40: { // up
      // console.log("DOWN")
      return { x: 0, y: 1 };
    }
  }
}

function recordButtonPress(clientid) {
   for ( var i = state.activePlayers.length - 1; i >= 0; i-- ) {

      match = state.activePlayers[i].clientid === clientid;
      // console.log("match: " + match)
      if (match === true) {
         state.activePlayers[i].button = true;
         state.activePlayers[i].afterimage = 15;
         console.log("Recorded the button press")
      }
   }

   return state;
}

function recordJoystick(state, clientid, joy) {
   for ( var i = state.activePlayers.length - 1; i >= 0; i-- ) {
      // console.log("RECORD JOYSTICK: joy.x: " + joy.x)
      match = state.activePlayers[i].clientid === clientid;
      if (match === true) {
         state.activePlayers[i].joyx = joy.x;
         state.activePlayers[i].joyy = joy.y;
         state.activePlayers[i].joytimestamp = Date.now();
         // console.log("Recorded the button press")
         // console.log("state.activePlayers[i].joyx: " + state.activePlayers[i].joyx)
      }
   }

   return state;
}

function updateVelocityAndPosition(state) {

  // players
  for ( var i = state.activePlayers.length - 1; i >= 0; i-- ) {
    // console.log("state.activePlayers[i].joyx: " + state.activePlayers[i].joyx)

    // update this player's position based on time elapsed since last joystick input
    joystick_vector_length = Math.sqrt(Math.pow(state.activePlayers[i].joyx, 2) + Math.pow(state.activePlayers[i].joyy, 2));
    // console.log("joystick_vector_length: " + joystick_vector_length)
    if (joystick_vector_length < 0.01) {
      joystick_vector_length = 0.01;
    }
    state.activePlayers[i].velx = state.activePlayers[i].joyx * JOYSTICK_MULTIPLIER / 140;
    state.activePlayers[i].vely = -state.activePlayers[i].joyy * JOYSTICK_MULTIPLIER / 140;
    state.activePlayers[i].posx += state.activePlayers[i].velx * (Date.now() - state.activePlayers[i].joytimestamp);
    state.activePlayers[i].posy += state.activePlayers[i].vely * (Date.now() - state.activePlayers[i].joytimestamp);

    // update this player's avatar color (based on time since they bounced the ball)
    if (state.activePlayers[i].bounced === true) {
      state.activePlayers[i].afterimage = Math.max(0, 15 - BOUNCE_IMAGE_DECAY * (Date.now() - state.activePlayers[i].bouncetimestap));
    }
    // keep this player on the screen
    if (state.activePlayers[i].posx < 0 + AVATAR_RADIUS) {
      state.activePlayers[i].posx = 0 + AVATAR_RADIUS;
    }
    if (state.activePlayers[i].posx > CANVAS_WIDTH - AVATAR_RADIUS) {
      state.activePlayers[i].posx = CANVAS_WIDTH - AVATAR_RADIUS;
    }
    if (state.activePlayers[i].posy < 0 + AVATAR_RADIUS) {
      state.activePlayers[i].posy = 0 + AVATAR_RADIUS;
    }
    if (state.activePlayers[i].posy > CANVAS_HEIGHT - AVATAR_RADIUS) {
      state.activePlayers[i].posy = CANVAS_HEIGHT - AVATAR_RADIUS;
    }

    // distance between this player and the ball
    px = state.activePlayers[i].posx; // + Math.random() / 100;
    py = state.activePlayers[i].posy; // + Math.random() / 100;
    bx = state.ball.pos.x; // + Math.random() / 100;
    by = state.ball.pos.y; // + Math.random() / 100;
    // console.log("px: " + px + ", py: " + py + ", bx: " + bx + ", by: " + by)
    distance = Math.sqrt(Math.pow(px - bx, 2) + Math.pow(py - by, 2));
    // console.log(distance)

    // if this player is touching the ball, make the ball bounce
    time_since_bounce = Date.now() - state.last_bounce_start;
    if (distance <= BALL_WIDTH / 2 + AVATAR_RADIUS) {   // bounce
      // console.log("time_since_bounce: " + time_since_bounce)
      // console.log(randomWords(5));
      state.activePlayers[i].bounced = true;
      state.activePlayers[i].bouncetimestap = Date.now();
      state.last_bounce_start = Date.now();
      state.ball.vel_unit.x = (bx - px) / distance; // normalized unit vector
      state.ball.vel_unit.y = (by - py) / distance; // normalized unit vector
      state.bounce_count += 1;
      state.score_count += state.numActivePlayers;
      state.ball.pos.x += (BALL_WIDTH / 2 + AVATAR_RADIUS + 5 - distance) * state.ball.vel_unit.x;
      state.ball.pos.y += (BALL_WIDTH / 2 + AVATAR_RADIUS + 5 - distance) * state.ball.vel_unit.y;
      state.ball.last_bounce.x = state.ball.pos.x;
      state.ball.last_bounce.y = state.ball.pos.y;
    }
  }
  x = state.ball.last_bounce.x;
  y = state.ball.last_bounce.y;
  velunitx = state.ball.vel_unit.x;
  velunity = state.ball.vel_unit.y;

  // kinematic equation to calculate the ball position as a function of time
  if ( Date.now() - state.last_bounce_start < KICK_TIME) {
    state.ball.pos.x = x + BOUNCE_VELOCITY * velunitx * (Date.now() - state.last_bounce_start) / 1000 + 1 / 2 * velunitx * BEACH_BALL_ACCELERATION * Math.pow((Date.now() - state.last_bounce_start) / 1000, 2);
    state.ball.pos.y = y + BOUNCE_VELOCITY * velunity * (Date.now() - state.last_bounce_start) / 1000 + 1 / 2 * velunity * BEACH_BALL_ACCELERATION * Math.pow((Date.now() - state.last_bounce_start) / 1000, 2);
  }

  return state;
}
