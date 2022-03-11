from subprocess import call,check_output, run
from os import environ, system, path, getcwd, getenv
from dotenv import load_dotenv

load_dotenv()

pathToNpmrc = 'common/config/rush/.npmrc-publish'
account = getenv("AWS_ACCOUNT")
domain = getenv("AWS_DOMAIN")
repository = getenv("AWS_REPOSITORY")
profile = getenv("AWS_PROFILE")
awsCLI = getenv("AWS_CLI_PATH", "aws")

cmd = "{5} codeartifact get-authorization-token --domain {0} --domain-owner {1} --query authorizationToken --output text --profile {4}".format(domain, account, repository, "" ,profile, awsCLI)

if(getenv("CDK_LOCATION")=="CLOUD"):
	cmd = "{5} codeartifact get-authorization-token --domain {0} --domain-owner {1} --query authorizationToken --output text".format(domain, account, repository, "" ,profile, awsCLI)

token = check_output(cmd.split(' ')).decode('utf-8').split('\n')[0]

print(token)

if path.isfile(pathToNpmrc):
	npmrc = open(pathToNpmrc, 'w')
	npmrc.write('@{0}:registry=https://{0}-{1}.d.codeartifact.eu-west-1.amazonaws.com/npm/{2}/\n'.format(domain, account, repository))
	npmrc.write('//{0}-{1}.d.codeartifact.eu-west-1.amazonaws.com/npm/{2}/:always-auth=true\n'.format(domain, account, repository))
	npmrc.write('//{0}-{1}.d.codeartifact.eu-west-1.amazonaws.com/npm/{2}/:_authToken={3}\n'.format(domain, account, repository, token))
	print("Writen to .npmrc-publish")
	npmrc.close()



# environ["CODEARTIFACT_AUTH_TOKEN"] = token

# os.environ["CODEARTIFACT_AUTH_TOKEN"] = subprocess.run(["aws codeartifact get-authorization-token", "--domain owljs","--domain-owner 844903409433","--query authorizationToken","--profile GitauGakwaTsavo", "--output text"], capture_output=True)