'use strict';
const express = require('express');
const router = express.Router();
const axios = require('axios');
const parser = require('xml2json');
var GtfsRealtimeBindings = require('gtfs-realtime-bindings');
var request = require('request');
var ByteBuffer = require('bytebuffer');
const db = require('knex')(require('../../knexfile.js')); //change knexfile location accordingly
const config = require('config');
const env = require('dotenv').config();
const fetch = require('node-fetch');

router.route('/')
    .get((req, res) => {
      console.log(`>>>>>>>>>> api/`);
      res.status(200).send('Hello World!');
    })
    .post((req, res) => {
      console.log('in the correct route');
      console.log(req.body);
      res.status(201).send({
          data: 'Posted!'
      });
    });

router.route('/closest_station')
    .post((req, res) => {
        let closestStationObj = {
            station_name: req.body.station_name,
            direction: req.body.direction
        };

        let url = `http://api.bart.gov/api/etd.aspx?cmd=etd&orig=${closestStationObj.station_name}&key=QQZR-5GY8-99PT-DWE9&dir=${closestStationObj.direction}`;

        axios.get(url)
            .then((result) => {
                console.log('I am working from inside closest_station');
                var json = parser.toJson(result.data);
                res.send(JSON.parse(json));
            })
            .catch((err) => {
                console.log('error from bart api: ', err.message);
            });

    });

//this is used for getting station longitude and latitude
router.route('/get_stations')
    .get((req, res) => {

        let url = `http://api.bart.gov/api/stn.aspx?cmd=stns&key=QQZR-5GY8-99PT-DWE9`;
        axios.get(url)
            .then((result) => {
                console.log('I am working from inside get_stations');
                var json = parser.toJson(result.data);
                let data = JSON.parse(json);
                let newArray = [];
                data.root.stations.station.forEach((x) => {
                        newArray.push([parseFloat(x.gtfs_longitude), parseFloat(x.gtfs_latitude)])
                    })
                    //console.log(newArray)
                res.send(newArray);
            })
            .catch((err) => {
                console.log('error from bart api: ', err.message);
            });
    });

router.route('/station_advisory')
    .post((req, res) => {

        let stationObj = {
            station: 'LAKE'
        };

        let url = `http://api.bart.gov/api/bsa.aspx?cmd=bsa&orig=${stationObj.station}&key=QQZR-5GY8-99PT-DWE9`;
        axios.get(url)
            .then((result) => {
                console.log('I am working from inside station_advisory');
                var json = parser.toJson(result.data);
                let data = JSON.parse(json);
                res.send(data);
            })
            .catch((err) => {
                console.log('error from bart api: ', err.message);
            });
    });


router.route('/schedule')
    .post((req, res) => {
        let schedules = [];

        let stationObj = {
            station: req.body.abbr
        };

        let url = `http://api.bart.gov/api/etd.aspx?cmd=etd&orig=${stationObj.station}&key=QQZR-5GY8-99PT-DWE9`;

        axios.get(url)
            .then((result) => {
                var json = parser.toJson(result.data);
                let data = JSON.parse(json);

                data.root.station.etd.map(
                    route => {
                        if (Array.isArray(route.estimate)) {
                            route.estimate.map(
                                eta => {
                                    schedules.push({
                                        minutes: eta.minutes,
                                        destination: route.destination
                                    })
                                }
                            )
                        } else {
                            schedules.push({
                                minutes: route.estimate.minutes,
                                destination: route.destination
                            })
                        }
                    }
                );
                res.send(schedules);
            })
            .catch((err) => {
                console.log('Error in api/schedule: ', err.message);
            });
    });

router.route('/advisory')
  .get((req, res) => {
    let url = `http://api.bart.gov/api/bsa.aspx?cmd=bsa&orig=all&key=QQZR-5GY8-99PT-DWE9`;

    axios.get(url)
      .then((result) => {
        var json = parser.toJson(result.data);
        let data = JSON.parse(json);
        res.send(data);
      })
      .catch((err) => {
        console.log('error from /advisory: ', err.message);
      });
  });

// router.route('/getgtfs')
//   .get((req, res) => {
//     var promises = [];
//     var changed = [];
//       fetch('http://api.bart.gov/gtfsrt/tripupdate.aspx', {method:'GET', encoding:null})
//       .then((response) => {
//         if (response.body._readableState.buffer.tail) {
//           promises = [];
      
//           var d = new Date();
//           var cur_seconds = d.toTimeString().split(' ')[0].split(':');
//           cur_seconds = (+cur_seconds[0]) * 60 * 60 + (+cur_seconds[1]) * 60 + (+cur_seconds[2]);

//           var count = 0;

//           var conform = ByteBuffer.btoa(response.body._readableState.buffer.tail.data);
//           //var newConform = ByteBuffer.btoa(response.body._readableState.buffer.head.data);

//           var feed = GtfsRealtimeBindings.FeedMessage.decode(conform);
//           //var newFeed = GtfsRealtimeBindings.FeedMessage.decode(newConform);
//           //console.log('feed: ', feed.entity[0]);
//           //console.log('newFeed: ', newFeed);
//           var someArr = [];

//           feed.entity.forEach(function(entity) {
//             var obj = {}
//             if (entity.trip_update) {
//               obj[entity.trip_update.trip.trip_id] = [];
//               for (var k = 0; k < entity.trip_update.stop_time_update.length; k++) {
//                 obj[entity.trip_update.trip.trip_id].push([entity.trip_update.stop_time_update[k].stop_sequence, entity.trip_update.stop_time_update[k].departure.delay]);
//               }
//               someArr.push(obj);
//             }
//           });

//           var tempChanged = [];
//           var tempPromises = [];
//          // db.select().table('gtfs_schedule').where({'trip_id': '41DC11', 'stop_sequence': 5}).then((result) => {console.log(result)});

//           for (var v = 0; v < someArr.length; v++) {
//             for (var key in someArr[v]) {
//               for (var z = 0; z < someArr[v][key].length; z++) {
//                 if (someArr[v][key][z][1] > 0) {
//                   tempChanged.push(db.select().table('gtfs_schedule').where({'trip_id': key, 'stop_sequence':  someArr[v][key][z][0]}));
//                   tempPromises.push(db('gtfs_schedule').where({'trip_id': key, 'stop_sequence': someArr[v][key][z][0]}).increment('arrival_time', someArr[v][key][z][1]));
//                   tempPromises.push(db('gtfs_schedule').where({'trip_id': key, 'stop_sequence': someArr[v][key][z][0]}).increment('departure_time', someArr[v][key][z][1]));
//                 }
//               }
//             }
//           }

//           Promise.all(tempChanged).then((original) => {
//             changed = original;
//           }).then(() => {
//             Promise.all(tempPromises).then((updated) => {
//               promises = updated;
//               console.log('myPromise: ', promises[0]);
//               console.log('theOriginal: ', changed[0]);
//             });
//           }).then(() => {
//             //console.log('someArr[0]: ', someArr[0]);
//             if (d.getDay() == 6 || d.getDay() == 0) {
//               if (d.getDay() == 0) {
//                 db.select().table('gtfs_schedule').orderBy('id').then((trains) => {
//                   var arr = [];
//                   console.log('fullength: ', trains.length);

//                   var editStuff = trains.filter(function(item) {
//                     return (item.trip_id.slice(item.trip_id.length - 3) === 'SAT');
//                   });

//                   console.log('edited: ', editStuff.length);
//                   console.log('checkedit: ', editStuff[0]);

//                   for (var i = 0; i < editStuff.length - 1; i++) {
//                     //console.log('check docs: ', editStuff[i]);
//                     if (editStuff[i].trip_id === editStuff[i + 1].trip_id) {
//                       if (cur_seconds >= editStuff[i].arrival_time && cur_seconds < editStuff[i + 1].arrival_time) {
//                         arr.push([editStuff[i + 1].trip_id, (cur_seconds - editStuff[i].arrival_time) / (editStuff[i + 1].arrival_time - editStuff[i].arrival_time), editStuff[i].stop_id, editStuff[i + 1].stop_id, [editStuff[i].stop_lat, editStuff[i].stop_lon],
//                           [editStuff[i + 1].stop_lat, editStuff[i + 1].stop_lon]
//                         ]);
//                       }
//                     }
//                   }

//                   //var dist = Math.sqrt(Math.pow(arr[0][5][0] - arr[0][4][0], 2) + Math.pow(arr[0][5][1] - arr[0][4][1], 2));
//                   var finalLocations = [];

//                   for (var p = 0; p < arr.length; p++) {
//                     var toChange = [(arr[p][5][0] - arr[p][4][0]) * arr[p][1], (arr[p][5][1] - arr[p][4][1]) * arr[p][1]];
//                     var finalPoint = [Number(arr[p][4][0]) + Number(toChange[0]), Number(arr[p][4][1]) + Number(toChange[1])];
//                     finalLocations.push(finalPoint);
//                   }
//                   res.send(JSON.stringify(finalLocations));
//                 });
//               }
//             } else {
//               db.select().table('gtfs_schedule').orderBy('id').then((stuff) => {    
//                 console.log('inside man');
//                 var arr = [];

//                 var editStuff = stuff.filter(function(item) {
//                   if (item.trip_id.slice(item.trip_id.length - 3) === 'SAT' || item.trip_id.slice(item.trip_id.length - 3) === 'SUN') {
//                     return false;
//                   }
//                   return true;
//                 });
//                 // var moreEdits = [];
//                 // for (var g = 0; g < editStuff.length; g++) {
//                 //   console.log('g_unit: ', g);
//                 //   moreEdits.push(db.select('hex_color', 'trip_id').table('gtfs_schedule').where({'trip_id': editStuff[g].trip_id, 'stop_sequence': 1}));
//                 // }
//                 console.log("I'm outside -g");
//                 //console.log('colors: ', colors);
//                 for (var i = 0; i < editStuff.length - 1; i++) {
//                   //console.log('check docs: ', editStuff[i]);
//                   if (editStuff[i].trip_id === editStuff[i + 1].trip_id) {
//                     if (cur_seconds >= editStuff[i].arrival_time && cur_seconds < editStuff[i + 1].arrival_time) {
//                       arr.push([editStuff[i + 1].trip_id, (cur_seconds - editStuff[i].arrival_time) / (editStuff[i + 1].arrival_time - editStuff[i].arrival_time), editStuff[i].stop_id, editStuff[i + 1].stop_id, [editStuff[i].stop_lat, editStuff[i].stop_lon],
//                         [editStuff[i + 1].stop_lat, editStuff[i + 1].stop_lon], editStuff[i].stop_headsign
//                       ]);
//                       for (var g = 0; g < editStuff.length; g++) {
//                         if (editStuff[g].trip_id === editStuff[i].trip_id && editStuff[g].stop_sequence === 1) {
//                           console.log('yo yo yo yo in here');
//                           if (editStuff[g].hex_color !== null) {
//                             arr[arr.length - 1].push(editStuff[g].hex_color);
//                           } else {
//                             arr[arr.length - 1].push('000000');
//                           }
//                         }
//                       }
//                     }
//                   }
//                 }
//                 console.log('aTest: ', arr[0]);
//                 //var dist = Math.sqrt(Math.pow(arr[0][5][0] - arr[0][4][0], 2) + Math.pow(arr[0][5][1] - arr[0][4][1], 2));
//                 var finalLocations = [];

//                 for (var p = 0; p < arr.length; p++) {
//                   var toChange = [(arr[p][5][0] - arr[p][4][0]) * arr[p][1], (arr[p][5][1] - arr[p][4][1]) * arr[p][1]];
//                   var finalPoint = [Number(arr[p][4][0]) + Number(toChange[0]), Number(arr[p][4][1]) + Number(toChange[1]), arr[p][6], arr[p][7]];
//                   finalLocations.push(finalPoint);
//                 }
//                 res.send(finalLocations);
//               });
//             }
//           });
//         } else {
//           res.send('Nothing yet, bro');
//         }
//       })
//       .catch((err) => {
//         console.log('error: ', err)
//       });
//   })

router.route('/getTheTrains')
  .get((req, res) => { 
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
          res.send(finalLocations);
        });

      } else if ((d.getDay() == 0 && cur_seconds >= 14400) || (d.getDay() == 1 && cur_seconds >= 86400)) {

        db.raw("SELECT * FROM gtfs_schedule WHERE trip_id LIKE '%SUN%' ORDER BY id").then((result) => {
          getFinalLocs(result.rows);
          res.send(finalLocations);
        });

      } else {

        db.raw("SELECT * FROM gtfs_schedule WHERE trip_id NOT LIKE '%SUN%' AND trip_id NOT LIKE '%SAT%' ORDER BY id").then((result) => {
          getFinalLocs(result.rows);
          res.send(finalLocations);
        });

      }
    });

module.exports = router;