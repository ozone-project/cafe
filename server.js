const express = require('express');
const bodyParser = require('body-parser');
const Database = require('./database');
const createRoutes = require('./routes');

const app = express();
const PORT = 3000;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

// Initialize database
const database = new Database('cafe.db');

// Setup routes
app.use(createRoutes(database));

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down gracefully...');
  database.close();
  process.exit(0);
});

app.listen(PORT, () => {
  console.log(`CAFE server running at http://localhost:${PORT}`);
});