const util           = require('util');
const EventEmitter   = require('events');
const SocketIoClient = require('socket.io-client');
const ZenHubApi      = require('./zenhub-api.js');
const debug          = require('debug')('ZenHub');

function ZenHub(token) {
  this.ws = SocketIoClient('wss://api.zenhub.io', {
    transports: [ 'websocket' ],
    path: '/socket.io',
    query: 'token=' + encodeURIComponent(token),
    extraHeaders: {
      Origin: 'https://github.com'
    }
  });

  const self = this;
  
  this.ws.on('board:updated', (data) => self.onBoardUpdated(data));
  this.ws.on('connect', () => debug('Connected to ZenHub'));
  this.ws.on('connect_error', (err) => debug('Connection to ZenHub failed (%0)', err));

  this.api = new ZenHubApi(token);
  this.boards = {};
  this.boardsMap = {};
}

util.inherits(ZenHub, EventEmitter);

ZenHub.prototype.subscribeBoard = function(repoId) {
  return this.api
    .getBoard(repoId)
    .then((data) => {
      this.boardsMap[repoId] = data._id;
      this.boards[data._id] = data;
      this.ws.emit('v4:board:subscribe', { repo_id: repoId });
    })
  ;
};

ZenHub.prototype.isBoardSubscribed = function(repoId) {
  return (!!this.boardsMap[repoId]);
};

ZenHub.prototype.onBoardUpdated = function(data) {
  debug('Board %s updated (%O)', data._id, data);
  this.boards[data._id] = data;
  return this;
}

ZenHub.prototype.getBoard = function(repoId) {
  return this.boards[this.boardsMap[repoId]];
};

/**
 * @return {Object|null}
 */
ZenHub.prototype.findIssueById = function(repoId, id) {
  const board = this.getBoard(repoId);
  
  for (let i = 0, sz = board.pipelines.length; i < sz; i++) {
    const pipe = board.pipelines[i];
    for (let j = 0, sz = pipe.issues.length; j < sz; j++) {
      if (pipe.issues[j].issue_number === id) {
        return Object.assign({
          pipe_id: pipe._id
        }, pipe.issues[j]);
      }
    }
  }

  return null;
};

/**
 * @param {Integer} repoId
 * @param {Callback} matchingMethod must return true to get the object
 * @return {Array}
 */
ZenHub.prototype.findPipeByName = function(repoId, matchingMethod) {
  const board = this.getBoard(repoId);
  return board.pipelines.filter((pipe) => {
    return matchingMethod(pipe.name);
  });
};

ZenHub.prototype.transferIssue = function(repoId, issueId, issueTitle, newPipeId) {
  const board = this.getBoard(repoId);
  const issue = this.findIssueById(repoId, issueId);
  if (!issue || !board) {
    debug('Issue %s or board for repo %s not found', issueId, repoId);
    return false;
  }

  this.ws.emit('v3:board:transferIssue', {
    from_pipeline_id: issue.pipe_id,
    id: board._id,
    issue_number: issueId,
    issue_title: issueTitle,
    pipeline_id: newPipeId,
    position: 0,
    repo_id: repoId
  });
  return true;
};

module.exports = ZenHub;