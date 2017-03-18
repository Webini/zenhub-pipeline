const GitClient   = require('./api/git-client.js');
const ZenHub      = require('./api/zenhub.js');
const debug       = require('debug')('push-notification');
const gitApi      = new GitClient(process.env.GIT_TOKEN);
const zenApi      = new ZenHub(process.env.ZENHUB_PRIVATE_TOKEN);

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

      debug('Moving issue #%s to pipe "%s"', issueId, pipes[0].name);
      zenApi.transferIssue(repoId, issueId, issue.title, pipes[0]._id);
    })
    .catch((err) => debug('Transfer error for issue #%s (%s, %s)', issueId, issuesUrl, (err ? err.message : null)))
  ;
}

module.exports = function(req, res) {
  const event = req.body;
  const repoId = event.repository.id;
  const issuesUrl = event.repository.issues_url;

  zenApi
    .subscribeBoard(repoId)
    .then(() => {
      event.commits.forEach((commit) => {
        const message = commit.message;
        const matches = message.match(/#[0-9,\#\s]+\s*=>\s*[a-z]+/ig);
        if (!matches) {
          debug('No matches found for commit message "%s"', message);
          return;
        }

        matches.forEach((str) => {
          const data = str.match(/([0-9,\#\s]+)\s*=>\s*([a-z]+)/i);
          debug('Message matches %s (%o)', str, data);
          if (data.length !== 3) {
            return;
          }

          const ids = data[1].match(/([0-9]+)/g);
          debug('Issues attached %o', ids);
          ids.forEach((id) => {
            processTransfer(parseInt(id), issuesUrl, repoId, data[2]);
          });
        });
      });
    })
    .catch((e) => debug('Subscription error %O', e))
  ;

  res.status(200).send();
 };