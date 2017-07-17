'use strict';
const express = require('express');
const path = require('path');
const middleware = require('./middleware');
const routes = require('./routes');
const axios = require('axios');
const parser = require('xml2json');


const app = express();

app.use(middleware.morgan('dev'));
app.use(middleware.cookieParser());
app.use(middleware.bodyParser.urlencoded({ extended: false }));
app.use(middleware.bodyParser.json());
// app.use(express.static(path.join(__dirname, '../public')));

app.use('/', routes.auth);
app.use('/api', routes.api);
app.use('/api/profiles', routes.profiles);

module.exports = app;