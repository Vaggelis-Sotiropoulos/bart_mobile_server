const scheduling = require('node-schedule');
const newdb = require('knex')(require('../knexfile.js'));

let getTheTrains = (io) => {
  scheduling.scheduleJob('1-59/2 * 4-23,0-2 * * *', function() {
    let d = new Date();

    let cur_seconds = d.toTimeString().split(' ')[0].split(':');
    cur_seconds = (+cur_seconds[0]) * 60 * 60 + (+cur_seconds[1]) * 60 + (+cur_seconds[2]);

    if (cur_seconds < 14400) {
      cur_seconds += 86400;
    }

    let finalLocations = [];

    let getFinalLocs = (queried) => {
      const newArr = [];
      const getShapes = [];
      const getIdNext = [];
      const getIdPrev = [];

      for (var i = 0; i < queried.length - 1; i++) {
        if (queried[i].trip_id === queried[i + 1].trip_id) {
          if (cur_seconds >= queried[i].arrival_time && cur_seconds < queried[i + 1].arrival_time) {
            
            if ((queried[i].stop_id === '19TH_N' || queried[i+1].stop_id === '19TH_N') || (queried[i].stop_id === 'MCAR_S' || queried[i+1].stop_id === 'MCAR_S')) {
              if(queried[i].stop_id === '19TH_N') {
                queried[i].stop_id = '19TH';
              }
              if(queried[i+1].stop_id === '19TH_N') {
                queried[i+1].stop_id = '19TH';
              }
              if(queried[i].stop_id === 'MCAR_S') {
                queried[i].stop_id = 'MCAR';
              }
              if(queried[i+1].stop_id === 'MCAR_S') {
                queried[i+1].stop_id = 'MCAR';
              }
            }

            newArr.push([queried[i + 1].trip_id, (cur_seconds - queried[i].arrival_time) / (queried[i + 1].arrival_time - queried[i].arrival_time), queried[i].stop_id, queried[i + 1].stop_id, queried[i].stop_headsign, queried[i].shape_id]);
            
            for (var g = 0; g < queried.length; g++) {
              if (queried[g].trip_id === queried[i].trip_id && queried[g].stop_sequence === 1) {
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

      for (var v = 0; v < newArr.length; v++) {
        getIdNext.push(newdb.raw("SELECT * FROM shapes WHERE shape_id='"+newArr[v][5]+"' AND shape_stop='"+newArr[v][3]+"'"));
      }

      for (var z = 0; z < newArr.length; z++) {
        getIdPrev.push(newdb.raw("SELECT * FROM shapes WHERE shape_id='"+newArr[z][5]+"' AND shape_stop='"+newArr[z][2]+"'"))
      }

      Promise.all(getIdNext).then((firstRes) => { 
        Promise.all(getIdPrev).then((secondRes) => {
          for (var p = 0; p < newArr.length; p++) {
            getShapes.push(newdb.raw("SELECT * FROM shapes WHERE id="+(Math.floor(newArr[p][1] * (firstRes[p].rows[0].id - secondRes[p].rows[0].id)) + secondRes[p].rows[0].id)));
          }
          Promise.all(getShapes).then((finalRes) => {
            for (var j = 0; j < finalRes.length; j++) {
              finalLocations.push([Number(finalRes[j].rows[0].shape_pt_lat), Number(finalRes[j].rows[0].shape_pt_lon), newArr[j][4], newArr[j][6]]);
            }
            io.sockets.emit('data', finalLocations);
          });
        });
      });
    };

    if ((d.getDay() == 6 && cur_seconds >= 14400) || (d.getDay() == 0 && cur_seconds >= 86400)) {
      newdb.raw("SELECT * FROM gtfs_schedule WHERE trip_id LIKE '%SAT%' ORDER BY id").then((result) => {
        getFinalLocs(result.rows);
      });
    } else if ((d.getDay() == 0 && cur_seconds >= 14400) || (d.getDay() == 1 && cur_seconds >= 86400)) {
      newdb.raw("SELECT * FROM gtfs_schedule WHERE trip_id LIKE '%SUN%' ORDER BY id").then((result) => {
        getFinalLocs(result.rows);
      });
    } else {
      newdb.raw("SELECT * FROM gtfs_schedule WHERE trip_id NOT LIKE '%SUN%' AND trip_id NOT LIKE '%SAT%' ORDER BY id").then((result) => {
        getFinalLocs(result.rows);
      });
    }
  });
};

module.exports = getTheTrains;
