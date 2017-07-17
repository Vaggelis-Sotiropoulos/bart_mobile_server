const express = require('express');
const router = express.Router();
const models = require('../../db/models');
const MessagingResponse = require('twilio').twiml.MessagingResponse;
const ProfileControler = require('../controllers/profiles')
const createProfile = ProfileControler.create;
const getAllProfiles = ProfileControler.getAll;
const getOneProfile = ProfileControler.getOne;
const updateProfile = ProfileControler.update;
const deleteProfile = ProfileControler.deleteOne;

router.route('/delete')
  .get((req, res) => deleteProfile(req, res));

router.route('/update')
  .post((req, res) => updateProfile(req, res) );

router.route('/create')
  .post((req, res) => createProfile(req, res) );

router.route('/getAll')
  .get((req, res) => getAllProfiles(req, res));

router.route('/retrieve')
  .get((req, res) => getAllProfiles(req, res));

router.route('/inbound')
  .post((req, res) => {
    
    if (req.body.Body === "thanks") {
      //delete user from DB
      deleteProfile(req.body.From, res);

      let resp  = new MessagingResponse();

      resp.message(`You have been unsubscribed. Thank you for using Bart Buddy.`);
      res.send(resp.toString());
    } else {
      res.send("We're looking to get hired! Find us at github.com/thewizards ");  
  }
    
  })


module.exports = router;