const { app } = require('electron');
const path = require('path');
const Database = require('better-sqlite3');

const dbPath = path.join(app.getPath('userData'), 'bazar.db');

const db = new Database(dbPath);

module.exports = db;
