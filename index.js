require('dotenv').config();

const GitClient = require('./git-client.js');

const api = new GitClient(process.env.GIT_TOKEN);
api.getIssue('https://api.github.com/repos/Webini/js-engine/issues{/number}', 1)
.then((data) => console.log(data));
/*
const ZenHub = require('./zenhub.js');

const repo = 84737104;

const zen = new ZenHub(process.env.ZENHUB_PRIVATE_TOKEN);
zen
    .subscribeBoard(repo)
    .then((data) => {
        const pipe = zen.findPipeByName(repo, function(name) { 
            return /Back/i.test(name);
        });
        console.log('PIPE => ', pipe);
        if (pipe) {
            console.log('RET => ', zen.transferIssue(repo, 1, pipe[0]._id));
        }
    })
;*/