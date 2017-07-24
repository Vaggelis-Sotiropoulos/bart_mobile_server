'use strict';
const app = require('./app');
const socket = require('socket.io');
const db = require('../db');
const update = require('./routes/update_schedule.js');
const schedule = require('./workers/scheduler.js');
const twilio = require('./workers/twilio.js');
const env = require('dotenv').config();
const PORT = process.env.PORT || 1337;
const trains = require('./getTrains.js');

const server = app.listen(PORT, () => {
  console.log(`Bart Buddy listening on port ${PORT}!`);
});

const io = socket(server);

io.on('connection', function(socket) {
  console.log('In business');
});

trains(io);