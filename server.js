require('dotenv').config();

const express     = require('express');
const app         = express();
const server      = require('http').Server(app);
const bodyParser  = require('body-parser');
const debug       = require('debug')('server');
const GitClient   = require('./git-client.js');
const ZenHub      = require('./zenhub.js');
const gitApi      = new GitClient(process.env.GIT_TOKEN);
const zenApi      = new ZenHub(process.env.ZENHUB_PRIVATE_TOKEN);
const host        = process.env.HOST || 'localhost';
const port        = process.env.PORT || 80;

app.use(bodyParser.json());

function processTransfer(issueId, issuesUrl, repoId, pipeline) {
  gitApi
    .getIssue(issuesUrl, issueId)
    .then((issue) => {
      const pipes = zenApi.findPipeByName(repoId, function(name) {
        return (new RegExp('^' + pipeline, 'i')).test(name.replace(/[^a-z]+/ig, ''));
      });

      if (pipes.length !== 1) {
        debug('Too much pipe founds (%O)', pipes);
        return;
      }

      zenApi.transferIssue(repoId, issueId, issue.title, pipes[0]._id);
    })
    .catch((err) => debug('Transfer error %O', err))
  ;
}

app.post('/push', (req, res, next) => {
  const eventType = req.get('X-GitHub-Event');
  if (!eventType || eventType.toLowerCase() !== 'push') {
    return res.status(403).send();
  }

  const event = req.body;
  const repoId = event.repository.id;
  const issuesUrl = event.repository.issues_url;

  let promise = Promise.resolve({});
  if (!zenApi.isBoardSubscribed(repoId)) {
    promise = zenApi.subscribeBoard(repoId);
  }

  promise.then(() => {
    event.commits.forEach((commit) => {
      const message = commit.message;
      const matches = message.match(/#[0-9]+ goto #[a-z]+/ig);
      matches.forEach(function(str) {
        var data = str.match(/#([0-9]+) goto #([a-z]+)/i);
        debug('Message matches %s (%o)', str, data);
        if (data.length === 3) {
          processTransfer(parseInt(data[1]), issuesUrl, repoId, data[2]);
        }
      });
    });
  });

  res.status(200).send();
});

server.listen(port, host, () => {
  debug('Server started on %s:%s', host, port);
});

module.exports = server;