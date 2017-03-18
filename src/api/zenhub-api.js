const request = require('request-promise-native');

class ZenHubApi {
  constructor(apiKey) {
    this.baseUri = 'https://api.zenhub.io/v3/';
    this.options = {
      headers: {
        'x-authentication-token': apiKey
      },
      json: true
    };
  }

  getBoard(repoId) {
    return request.get(Object.assign({ 
      method: 'GET', 
      uri: this.baseUri + 'repos/' + repoId + '/board'
    }, this.options))
  }
}

module.exports = ZenHubApi;