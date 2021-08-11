const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const apiRoutes = require('./routes/api.routes');
const db = require('./models');
const applySocketEvents = require('./socket/events');

require('dotenv').config();
global.__basedir = __dirname;

const port = process.env.PORT || 5000;
const app = express();
db.sequelize.sync({ force: false, alter: true });

// Rest api server
const corsOptions = { origin: 'http://localhost:3000' };
app.use(cors(corsOptions));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET, POST, PUT, PATCH, DELETE'
  );
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});

app.use('/resources', express.static(__dirname + '/resources'));
app.use('/api', apiRoutes);

// Socket server
const httpServer = require('http').createServer();
const io = require('socket.io')(httpServer, {
  cors: {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
});
applySocketEvents(io);
httpServer.listen('5001');

app.listen(port, () => {
  console.log(`Chat Application API listening on port:: ${port}`);
});
