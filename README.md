# How to run #

1) cd into the project folder
2) Type "npm install" to install all the dependencies
3) Type "node server.js" to run the server. Default port is 3000 on localhost ("htttp://localhost:3000")
4) Here's how the project works. Users can signup and login using the /signup and /login endpoints respectively. After logging in the users can subscribe to other users using the /subscribe endpoint. The users can then update their city, age or weight and if any one of these three is updated an email will be sent to all the subscribers. This can be done using the endpoint /update. NOTE: For the last to endpoints user needs to be authenticated using the /login endpoint and generate a token, which the user must send with each request inside a parameter named token. There's another endpoint /users which is open to all the users authenticated or not to see the list of users and their details.
5) IMPORTANT: Change the parameters in config.js according to your needs
6) Enable Access for less secure apps if you are using gmail here: https://myaccount.google.com/lesssecureapps?pli=1 
7) Send requests to endpoints in the following format:

## /signup: ##

- name: String,
- email: String,
- password: String,
- city: String,
- age: Number,
- weight: Number


## /login: ##

- email: String,
- password: String

## /subscribe: ##

- email: String (Email of the user you want to subscribe to)

## /update: (All parameters are optional) ##

- city: String,
- age: Number,
- weight: Number

## /logout ##
No parameter required

## /users ##
No parameter required
