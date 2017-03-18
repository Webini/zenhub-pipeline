const crypto     = require('crypto');
const bodyParser = require('body-parser');
const debug      = require('debug')('middleware');

module.exports = {
  eventType: function(eventName) {
    eventName = eventName.toLowerCase();
    return (req, res, next) => {
      const gitEvent = req.get('X-GitHub-Event'); 
      if (gitEvent && gitEvent.toLowerCase() === eventName) {
        return next();
      }

      res.status(500).json({ error: 'Unsupported event type' });
    };
  },
  bodyParser: bodyParser.json,
  signedBodyParser: function(secret) {
    return bodyParser.json({
      verify: (req, res, buff, encoding) => {
        const signature = req.get('X-Hub-Signature');
        if (!signature) {
          throw new Error('GitHub signature not found');
        }

        const digest = 'sha1=' + crypto.createHmac('sha1', secret).update(buff).digest('hex');
        if (digest !== signature) {
          console.log(buff, buff.toString());
          debug('Original signature %s, processed signature %s', signature, digest);
          throw new Error('Invalid signature found');
        }
      }
    });
  }
};