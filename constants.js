const FRAME_RATE = 20;
const CANVAS_WIDTH = 360;
const CANVAS_HEIGHT = 360;
const BALL_WIDTH = 16;
const BALL_HEIGHT = 16;
const MAX_PLAYERS_PER_ROOM = 100;
const AVATAR_RADIUS = 5;
const BEACH_BALL_MASS = 0.1; // in kg
const BEACH_BALL_DIAMETER = 0.64; // in meters (24" ball)
const DRAG_COEFFICIENT = -3; // air resistance, in arbitrary units
const BOUNCE_VELOCITY = 100; // initial velocity of ball right after bounce, in m/s
const JOYSTICK_MULTIPLIER = 0.02; // for translating arbitrary joystick units into player velocity
const BOUNCE_IMAGE_DECAY = 0.01;
const PITCH_LENGTH = 360;
const PITCH_WIDTH = 238;

module.exports = {
  FRAME_RATE,
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  BALL_WIDTH,
  BALL_HEIGHT,
  MAX_PLAYERS_PER_ROOM,
  AVATAR_RADIUS,
  BEACH_BALL_MASS,
  BEACH_BALL_DIAMETER,
  DRAG_COEFFICIENT,
  BOUNCE_VELOCITY,
  JOYSTICK_MULTIPLIER,
  BOUNCE_IMAGE_DECAY,
  PITCH_LENGTH,
  PITCH_WIDTH,
}
