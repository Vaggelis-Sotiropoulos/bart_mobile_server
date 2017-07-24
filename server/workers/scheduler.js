var schedule = require('node-schedule');
const db = require('knex')(require('../../knexfile.js')); 
const config = require('config');
const env = require('dotenv').config();

var rule = new schedule.RecurrenceRule();
rule.hour = 3;

schedule.scheduleJob(rule, function(){
  var arr = [];
  arr.push(db.raw('UPDATE gtfs_schedule t2 SET arrival_time = t1.arrival_time FROM absolute_times t1 WHERE t2.id = t1.id'));
  arr.push(db.raw('UPDATE gtfs_schedule t2 SET departure_time = t1.departure_time FROM absolute_times t1 WHERE t2.id = t1.id'));
  Promise.all(arr).then((res)=>{console.log('database reset')});
});