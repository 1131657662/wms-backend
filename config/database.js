const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'mysql',
    logging: false,
    timezone: '+08:00',
    dialectOptions: {
      charset: 'utf8mb4'
    },
    define: {
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci',
      timestamps: false,
      freezeTableName: true
    },
    pool: {
      afterCreate: (conn, done) => {
        conn.query("SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;", err => done(err, conn));
      }
    }
  }
);

module.exports = sequelize;
