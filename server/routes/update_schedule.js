const GtfsRealtimeBindings = require('gtfs-realtime-bindings');
const ByteBuffer = require('bytebuffer');
const db = require('knex')(require('../../knexfile.js')); //change knexfile location accordingly
const config = require('config');
const env = require('dotenv').config();
const fetch = require('node-fetch');
const schedule = require('node-schedule');

var hash = {};

schedule.scheduleJob('0 * 4-23,0-2 * * *', function() {
  fetch('http://api.bart.gov/gtfsrt/tripupdate.aspx', {method:'GET', encoding:null})
  .then((response) => {
    if (response.body._readableState.buffer.tail) {
      var promises = [];
      
      // var d = new Date();
      // var cur_seconds = d.toTimeString().split(' ')[0].split(':');
      // cur_seconds = (+cur_seconds[0]) * 60 * 60 + (+cur_seconds[1]) * 60 + (+cur_seconds[2]);

      var conform = ByteBuffer.btoa(response.body._readableState.buffer.tail.data);
      //var newConform = ByteBuffer.btoa(response.body._readableState.buffer.head.data);

      var feed = GtfsRealtimeBindings.FeedMessage.decode(conform);
      //var newFeed = GtfsRealtimeBindings.FeedMessage.decode(newConform);
      //console.log('feed: ', feed.entity[0]);
      //console.log('newFeed: ', newFeed);

      feed.entity.forEach(function(entity) {
        if (entity.trip_update) {
          for (var k = 0; k < entity.trip_update.stop_time_update.length; k++) {
            if (hash.hasOwnProperty(entity.trip_update.trip.trip_id)) {
              var isInside = false;
              for (var h = 0; h < hash[entity.trip_update.trip.trip_id].length; h++) {
                if (hash[entity.trip_update.trip.trip_id][h][0] === entity.trip_update.stop_time_update[k].stop_sequence) {
                  isInside = true;
                  if (hash[entity.trip_update.trip.trip_id][h][1] < entity.trip_update.stop_time_update[k].departure.delay) {
                    hash[entity.trip_update.trip.trip_id][h][1] = entity.trip_update.stop_time_update[k].departure.delay - hash[entity.trip_update.trip.trip_id][h][1];
                    hash[entity.trip_update.trip.trip_id][h][2] = false;
                  } else if (hash[entity.trip_update.trip.trip_id][h][1] > entity.trip_update.stop_time_update[k].departure.delay) {
                    hash[entity.trip_update.trip.trip_id][h][1] -= entity.trip_update.stop_time_update[k].departure.delay;
                    hash[entity.trip_update.trip.trip_id][h][2] = false;
                  }
                }
                if (h === hash[entity.trip_update.trip.trip_id][hash[entity.trip_update.trip.trip_id].length - 1] && isInside === false) {
                  hash[entity.trip_update.trip.trip_id].push([entity.trip_update.stop_time_update[k].stop_sequence, entity.trip_update.stop_time_update[k].departure.delay, false]);
                }
              }
            } else {
              hash[entity.trip_update.trip.trip_id] = [];
              hash[entity.trip_update.trip.trip_id].push([entity.trip_update.stop_time_update[k].stop_sequence, entity.trip_update.stop_time_update[k].departure.delay, false]);
            }
          }
        }
      });

      console.log('********* HASH ********** ', hash)
      // var tempChanged = [];
      var tempPromises = [];
      // db.select().table('gtfs_schedule').where({'trip_id': '41DC11', 'stop_sequence': 5}).then((result) => {console.log(result)});

      for (var v in hash) {
        for (var z = 0; z < hash[v].length; z++) {
          if (hash[v][z][1] > 0 && hash[v][z][2] === false) {
            // tempChanged.push(db.select().table('gtfs_schedule').where({'trip_id': key, 'stop_sequence':  someArr[v][key][z][0]}));
            hash[v][z][2] = true;
            tempPromises.push(db('gtfs_schedule').where({'trip_id': v, 'stop_sequence': hash[v][z][0]}).increment('arrival_time', hash[v][z][1]));
            tempPromises.push(db('gtfs_schedule').where({'trip_id': v, 'stop_sequence': hash[v][z][0]}).increment('departure_time', hash[v][z][1]));
          }
        }
      }

      Promise.all(tempPromises).then((updated) => {
        promises = updated;
        console.log('myPromise: ', promises[0]);
      });
    }
  }).catch((err) => {console.log('ERROR: ', err)});
});

schedule.scheduleJob('0 0 3 * * *', function() {
  hash = {};
})
module.exports = hash;