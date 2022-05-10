<!-- TODO -->

Add default stage to the props of a resource
Thus if a property has only one stage, that will be the one run
If there are stages, the resource props will be used like global props

Add command to download the resources
So like gylfie download database dynamo
This is because most of this is too large and the more resources we have the more it becomes bloated
First start with dynamodb

Add command to log in to codeartifact in order to pull gylfiejs libs
This could be an api call that could take the access and secret token of the user
Get user details then return the token and config npmrc
This might be possible but kinda hard to comeby cause the role of the gateway
is predetermined and may have to pass the request through an iam auth before assuming a role
before this, it should basically be a shorthand notation for
aws codeartifact login --tool npm --domain gylfiejs --domain-owner 030534315909 --repository Gylfiejs --profile GitauGakwaGylfie --namespace "@gylfiejs"
An aws profile will be provided in gylfie.json

Fix cli after upgrade

Fix file creation and folder creation problems

<!-- Dynamo should technically be a service -->

Services
S3
https://github.com/localstack/localstack
https://github.com/good-idea/localstack-demo
Cognito
https://github.com/jagregory/cognito-local
