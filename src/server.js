require('dotenv').config();

const pushNotification = require('./push-notification.js');
const express     = require('express');
const app         = express();
const server      = require('http').Server(app);
const bodyParser  = require('body-parser');
const debug       = require('debug')('server');
const host        = process.env.HOST || 'localhost';
const port        = process.env.PORT || 80;
const middlewares = require('./git-middlewares.js');

if (process.env.GIT_HOOK_SECRET && process.env.GIT_HOOK_SECRET.length) {
  app.use(middlewares.signedBodyParser(process.env.GIT_HOOK_SECRET));
} else {
  app.use(middlewares.bodyParser());
}

app.use(function(err, req, res, next) {
  res.json({ error: err.message });
});

app.post('/', middlewares.eventType('push'), pushNotification);

server.listen(port, host, () => {
  console.log(`Server started on ${host}:${port}`);

  process.on('SIGINT', () => {
    server.close(() => {
      process.exit(0)
    });
  });
});

module.exports = server;