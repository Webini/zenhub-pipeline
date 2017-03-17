const request = require('request-promise-native');

class GitClientApi {
  constructor(token) {
    this.options = {
      headers: {
        'Authorization': 'token ' + token,
        'user-agent': 'webini'
      },
      json: true
    };
  }

  getIssue(uri, issueId) {
    console.log(uri.replace(/\{\/number\}/, issueId));
    return request.get(Object.assign({ 
      method: 'GET', 
      uri: uri.replace(/\{\/number\}/, '/' + issueId)
    }, this.options))
  }
}

module.exports = GitClientApi;
