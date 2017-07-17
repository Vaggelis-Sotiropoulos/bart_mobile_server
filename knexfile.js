const config = require('config');
const env = require('dotenv').config();
config['knex'].connection = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/thesis';
module.exports = config['knex'];