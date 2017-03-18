ZenHub-Pipeline
===============

## Description

This small server allow you to change the pipeline of your issues using commit messages.

To move one issue 

```
git commit -m "#1 => InProgress"
``` 

To move multiple issues
```
git commit -m "#1 #5 #42 => InProgress"
```

The original pipeline name is escaped with all char except alpha, the app will match the start of what you have written. If multiple pipelines are found the issue is not moved. 

So `Review/QA` with be accessible by typing `review`, `rev` or `reviewqa`

Retreive your ZenHub token with your chrome debugger   
And create a git access token to your repositories  

## Configuration
We are using these env variables:

#### ZENHUB_PRIVATE_TOKEN
Your ZenHub private token. 
You can retreive it by opening your web debugger in the ZenHub board page, open one of the ZenHub XHR and use the value of request header "x-authentication-token"

#### GIT_TOKEN
The git token, it will be used to read issue's name from your private repositories.
[Create a new one here](https://github.com/settings/tokens/new?scopes=repo&description=ZenHubPipeline).

#### GIT_HOOK_SECRET (optional)
The hook secret specified at the creation of the hook.

#### HOST
Server host

#### PORT
Server port

## Installation
Run with docker or manually 
```
docker run -p 8080:8080 -e "ZENHUB_PRIVATE_TOKEN=<token>" -e "GIT_TOKEN=<token>" -e "GIT_HOOK_SECRET=1718f63a9153181ae694a04365c83589" nicocanicolas/zenhub-pipeline
``` 
Once the server is started, go to your repository(ies) and add a new push hook your brand new server address.

## Contributions
As this project was made in hurry, contributions are welcome :p  
The potential incoming issue is the lifetime of the ZenHub token, i don't know its duration.