The realization I'm coming to is that most stuff have to be hard coded to get the best out of Typescript
So something like that attributes that will be in the dynamodb Table are best hard coded
Be creating static types that then cal be versioned
You can create an additional version for each change
https://github.com/saleae/typescript-migration
We could use this for versioning types
This will allow us to have a base type then add onto it
From this, we can then use the typedorm for dynamo stuff
https://github.com/typedorm/typedorm

The problem comes when trying to implement this in a library format
We can define the base class for like a user
This will technically only require the uuid
This is the one used as the identifier for cognito

We should also use this for attribute changing
https://github.com/typestack/class-transformer

So far typedorm has proved useless
https://github.com/baseprime/dynamodb
This might be better

AllowJS is set to true due to
https://github.com/sdawood/dynamo-update-expression

Local Cognito Emulation
https://github.com/jagregory/cognito-local

Make cognito more abstract, i.e, remove the Cakeworld links
Also complete access patterns and everything

Entity

Prioritize attribute name to value over key-derived value
If there is a difference, suggest an update somehow.
This can be done through a variable passed through the returned value.
This should contain the attribute name that is shifted.
Should be an array that contains an object with the derived partitionKey values and sort key ones if they are not shifted.
Also, if the any of the Index keys do not match, they too should be considered shifted.
This should result in a Index key update.
The shift will most likely be recognized in the Index keys since attribute name values have higher priority
