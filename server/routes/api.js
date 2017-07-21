'use strict';
const express = require('express');
const router = express.Router();
const axios = require('axios');
const parser = require('xml2json');
const config = require('config');
const env = require('dotenv').config();

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

module.exports = router;