const GtfsRealtimeBindings = require('gtfs-realtime-bindings');
const ByteBuffer = require('bytebuffer');
const db = require('knex')(require('../../knexfile.js')); //change knexfile location accordingly
const config = require('config');
const env = require('dotenv').config();
const fetch = require('node-fetch');
const schedule = require('node-schedule');
const socket = require('socket.io');


    schedule.scheduleJob('1-59 * 4-23,0-2 * * *', function() {
      let d = new Date();

      let cur_seconds = d.toTimeString().split(' ')[0].split(':');
      cur_seconds = (+cur_seconds[0]) * 60 * 60 + (+cur_seconds[1]) * 60 + (+cur_seconds[2]);

      if (cur_seconds < 14400) {
        cur_seconds += 86400;
      }

      let finalLocations = [];

      let getFinalLocs = (queried) => {
        const newArr = [];

        for (var i = 0; i < queried.length - 1; i++) {
          //console.log('check docs: ', queried[i].arrival_time);
          if (queried[i].trip_id === queried[i + 1].trip_id) {
            if (cur_seconds >= queried[i].arrival_time && cur_seconds < queried[i + 1].arrival_time) {
              newArr.push([queried[i + 1].trip_id, (cur_seconds - queried[i].arrival_time) / (queried[i + 1].arrival_time - queried[i].arrival_time), queried[i].stop_id, queried[i + 1].stop_id, [queried[i].stop_lat, queried[i].stop_lon],
                [queried[i + 1].stop_lat, queried[i + 1].stop_lon], queried[i].stop_headsign
              ]);
              for (var g = 0; g < queried.length; g++) {
                if (queried[g].trip_id === queried[i].trip_id && queried[g].stop_sequence === 1) {
                  //console.log('yo yo yo yo in here');
                  if (queried[g].hex_color !== null) {
                    newArr[newArr.length - 1].push(queried[g].hex_color);
                  } else {
                    newArr[newArr.length - 1].push('000000');
                  }
                }
              }
            }
          }
        }
        // console.log('arr check: ', newArr[0]);
          
        for (var p = 0; p < newArr.length; p++) {
          const toChange = [(Number(newArr[p][5][0]) - Number(newArr[p][4][0])) * Number(newArr[p][1]), (Number(newArr[p][5][1]) - Number(newArr[p][4][1])) * Number(newArr[p][1])];
          const finalPoint = [Number(newArr[p][4][0]) + toChange[0], Number(newArr[p][4][1]) + toChange[1], newArr[p][6], newArr[p][7]];
          finalLocations.push(finalPoint);
        }
      };

      if ((d.getDay() == 6 && cur_seconds >= 14400) || (d.getDay() == 0 && cur_seconds >= 86400)) {

        db.raw("SELECT * FROM gtfs_schedule WHERE trip_id LIKE '%SAT%' ORDER BY id").then((result) => {
          getFinalLocs(result.rows);
          io.
        });

      } else if ((d.getDay() == 0 && cur_seconds >= 14400) || (d.getDay() == 1 && cur_seconds >= 86400)) {

        db.raw("SELECT * FROM gtfs_schedule WHERE trip_id LIKE '%SUN%' ORDER BY id").then((result) => {
          getFinalLocs(result.rows);
          io.
        });

      } else {

        db.raw("SELECT * FROM gtfs_schedule WHERE trip_id NOT LIKE '%SUN%' AND trip_id NOT LIKE '%SAT%' ORDER BY id").then((result) => {
          getFinalLocs(result.rows);
          io.
        });

      }
    });