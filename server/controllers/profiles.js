const models = require('../../db/models');

module.exports.getAll = (req, res) => {
  models.Profile.fetchAll()
    .then(profiles => {
      res.status(200).send(profiles);
    })
    .catch(err => {
    // This code indicates an outside service (the database) did not respond in time
      res.status(503).send(err);
    });
};

module.exports.create = (req, res) => {
  let parsedPhone = '+1' + req.body.phone;
  models.Profile.forge({ 
    phone: parsedPhone
  })
    .save()
    .then(result => {
      //send "welcome to Bart Buddy! Bart Service Advisories: ${} ""
      res.status(201).send(result);
    })
    .catch(err => {
      if (err.constraint === 'users_username_unique') {
        return res.status(403); //send error message
      }
      res.status(500).send(err);
    });
};

module.exports.getOne = (req, res) => {
  models.Profile.where({ id: req.params.id }).fetch()
    .then(profile => {
      if (!profile) {
        throw profile;
      }
      res.status(200).send(profile);
    })
    .error(err => {
      res.status(500).send(err);
    })
    .catch(() => {
      res.sendStatus(404);
    });
};

module.exports.update = (req, res) => {
  models.Profile.where({ phone: req.body.phone }).fetch()
    .then(profile => {
      if (!profile) {
        throw profile;
      }
    })
    .then(() => {
      res.sendStatus(201);
    })
    .error(err => {
      res.status(500).send(err);  
    })
    .catch(() => {
      res.sendStatus(404);
    });
};

module.exports.deleteOne = (req, res) => {
  models.Profile.where({ phone: req }).fetch()
    .then(profile => {
      if (!profile) {
        throw profile;
      }
      return profile.destroy();
    })
    .error(err => {
      res.status(503).send(err);
    })
    .catch(() => {
      res.sendStatus(404);
    });
};
