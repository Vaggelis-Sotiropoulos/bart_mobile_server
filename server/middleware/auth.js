const session = require('express-session');
const RedisStore = require('connect-redis')(session);
const redisClient = require('redis').createClient(process.env.REDIS_URL);

module.exports.verify = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/login');
};

let storeOptions = process.env.REDIS_URL ?
{client: redisClient} :
{
  client: redisClient,
  host: 'localhost',
  port: 6379
};

module.exports.session = session({
  store: new RedisStore(storeOptions),
  secret: 'Mia fora thimamai magapouses',
  resave: false,
  saveUninitialized: false
});
