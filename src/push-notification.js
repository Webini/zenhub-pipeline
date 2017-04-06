const GitClient   = require('./api/git-client.js');
const ZenHub      = require('zenhub-api');
const debug       = require('debug')('push-notification');
const gitApi      = new GitClient(process.env.GIT_TOKEN);
const zenApi      = new ZenHub(process.env.ZENHUB_TOKEN);

async function processTransfer(issueId, issuesUrl, repoId, pipeline) {
  try {
    const issue  = await gitApi.getIssue(issuesUrl, issueId);
    const boards = await zenApi.getBoard({ repo_id: repoId });
    const pipes  = boards
      .pipelines
      .filter(function(board) {
        return (new RegExp('^' + pipeline, 'i')).test(board.name.replace(/[^a-z]+/ig, ''));  
      }).map(function(board) {
        return { name: board.name, id: board.id };
      })
    ;

    if (pipes.length !== 1) {
      debug('Too much pipe founds (%O)', pipes);
      return;
    }

    debug('Moving issue #%s to pipe "%s"', issueId, pipes[0].name);
    await zenApi.changePipeline({
      repo_id: repoId,
      issue_number: issueId,
      body: {
        pipeline_id: pipes[0].id,
        position: 'top'
      }
    });
  } catch(e) {
    debug('Transfer error for issue #%s (%s, %s)', issueId, issuesUrl, (e ? e.message : null));
  }
}

module.exports = function(req, res) {
  const event = req.body;
  const repoId = event.repository.id;
  const issuesUrl = event.repository.issues_url;

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
  
  res.status(200).send();
 };