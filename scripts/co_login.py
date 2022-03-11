from subprocess import call,check_output, run
from os import environ, system, path, getcwd, getenv
from json import loads

location = getenv("CDK_LOCATION", "LOCAL")

if(location == "LOCAL") :
	from dotenv import load_dotenv
	load_dotenv()


pathToNpmrc = 'common/config/rush/.npmrc-publish'
account = getenv("AWS_ACCOUNT")
domain = getenv("AWS_DOMAIN")
repository = getenv("AWS_REPOSITORY")
profile = getenv("AWS_PROFILE")
awsCLI = getenv("AWS_CLI_PATH", "aws")

tokenCMD = "{5} codeartifact get-authorization-token --domain {0} --domain-owner {1} --query authorizationToken --output text --profile {4}".format(domain, account, repository, "" ,profile, awsCLI)
endpointCMD = "{5} codeartifact get-repository-endpoint --domain {0} --repository {2} --format npm --profile {4}".format(domain, account, repository, "" ,profile, awsCLI)

if(location=="CLOUD"):
	tokenCMD = "{5} codeartifact get-authorization-token --domain {0} --query authorizationToken --output text".format(domain, account, repository, "" ,profile, awsCLI)
	endpointCMD = "{5} codeartifact get-repository-endpoint --domain {0} --repository {2} --format npm".format(domain, account, repository, "" ,profile, awsCLI)

token = check_output(tokenCMD.split(' ')).decode('utf-8').split('\n')[0]
endpoint = loads(check_output(endpointCMD.split(' ')).decode('utf-8'))['repositoryEndpoint'].split(":")[1]

print(endpoint)

print(token)

if path.isfile(pathToNpmrc):
	npmrc = open(pathToNpmrc, 'w')
	npmrc.write('@{0}:registry=https:{4}\n'.format(domain, account, repository, token, endpoint))
	npmrc.write('{4}:always-auth=true\n'.format(domain, account, repository, token, endpoint))
	npmrc.write('{4}:_authToken={3}\n'.format(domain, account, repository, token, endpoint))
	print("Writen to .npmrc-publish")
	npmrc.close()



# environ["CODEARTIFACT_AUTH_TOKEN"] = token

# os.environ["CODEARTIFACT_AUTH_TOKEN"] = subprocess.run(["aws codeartifact get-authorization-token", "--domain owljs","--domain-owner 844903409433","--query authorizationToken","--profile GitauGakwaTsavo", "--output text"], capture_output=True)