const { Sequelize } = require('sequelize');
const keys = require('../keys');

const db = new Sequelize(
  keys.DB_NAME,
  keys.DB_USER,
  keys.DB_PASSWORD,
  {
    host: keys.DB_HOST,
    dialect: 'mysql',
    timezone: '+07:00',
  }
);

db.authenticate()
  .then(() => console.log('[DB]: Database connected...'))
  .catch((error) => console.error('[DB]: Database connection failed:', error));

module.exports = db;