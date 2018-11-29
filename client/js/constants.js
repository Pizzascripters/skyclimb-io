const PLAYER_COLOR = "#fc7";
const OBJECT_COLOR = "#655";
const PLAYER_OUTLINE = true;
const PLAYER_OUTLINE_COLOR = "#000";
const PLAYER_OUTLINE_WIDTH = 3;
const OBJECT_OUTLINE = true;
const OBJECT_OUTLINE_COLOR = "#000";
const OBJECT_OUTLINE_WIDTH = 2;

const VERTICES_PER_BODY = 4;
const VERTICES_PER_PLAYER = 26; // # of vertices in a player body
const VERTEX_SIZE = 8;          // # of bytes in a vertex
const PLAYER_BYTES = VERTICES_PER_PLAYER * VERTEX_SIZE + 8;

var VERTICES_PER_BULLET = 4;
const BULLET_BYTES = VERTICES_PER_BULLET * VERTEX_SIZE + 4;
