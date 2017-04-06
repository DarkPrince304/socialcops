var jsonwebtoken = require('jsonwebtoken');
var validate = require('express-jsonschema').validate; // To enforce JSON Requests schema
var config = require('../config');
var User = require('../models/user');
var secretKey = config.secretKey;
var nodemailer = require('nodemailer'); // npm package to send mails

// Creates a token for authentication
function createToken(user) {
	var token = jsonwebtoken.sign({
		id: user._id,
		name: user.name,
		email: user.email
	}, secretKey, {
		expiresIn: "1m"
	});
	return token;
}

module.exports = function(app, express) {

	var routes = express.Router();

	routes.post('/signup', function(req, res) {
		var user = new User(req.body);

		user.save(function(err) {
			if(err) {
				res.send(err);
				return;
			}
			return res.json({message: 'User has been created'});
		});
	});

	routes.post('/login', function(req, res) {
		User.findOne({email: req.body.email}).select('name email password').exec(function(err, user) {
			if(err){
				throw err;
			}

			if(!user) {
				res.send({message: "User doesn't exist"});
			} else if (user) {
				var validPassword = user.comparePassword(req.body.password);
				if(!validPassword) {
					res.send({ message: "Invalid Password"});
				} else {
					var token = createToken(user);
					res.json({
						success: true,
						message: "Logged in Succesfully",
						token: token
					});
				}
			}
		});
	});

	// If secret key changes in middle of the session the authentication ends
	routes.get('/logout', function(req, res) {
		secretKey = secretKey + "0";
		res.json({message: "Logged out Succesfully"});		
	});

	// No need to be authorized via a token for this api call
	routes.get('/users', function(req, res) {
		User.find({}, function(err, users) {
			if(err) {
				res.send(err);
				return;
			}
			users = JSON.stringify(users, null, 4);
			res.json({users: users});
		});
	});

	// Middleware for requiring to be authenticated for using the endpoints below
	routes.use(function(req, res, next) {
		var token = req.body.token || req.params.token || req.headers['x-access-token'] || req.headers.token;
		if( token ) {
			jsonwebtoken.verify(token, secretKey, function(err, decoded) {
				if(err) {
					res.status(403).send({ success: false, message: "Failed to authenticate"});
				} else {
					req.decoded = decoded;
					next();
				}
			});
		} else {
			res.status(403).send({ success: false, message: "No access token provided"});
		}
	});

	var SubscriberSchema = {
		type: 'object',
		properties: {
			email: {
				type: 'string',
				format: 'email',
				required: true
			}
		}
	}

	// Sends a post request to subscribe to a user. You can also subscribe to yourself. You cannot subscribe to
	// a person two times
	routes.post('/subscribe', validate({body: SubscriberSchema}), function(req, res) {
		var subscribeTo = req.body.email;
		User.findOne({subscribers: {$elemMatch: { email: req.decoded.email} } } ).select("name").exec(function(err, result) {
			if(result.name) {
				res.json({message: "You have already subscribed to " + subscribeTo + "!"})
			} else {
				var currentUser = {};
				currentUser.name = req.decoded.name;
				currentUser.email = req.decoded.email;
				User.findOneAndUpdate({ email: subscribeTo }, { $push: { subscribers: currentUser } }, {'new': true}, function(err, result) {
					if(err) {
						res.send(err);
						return;
					}
					res.json({message: "You subscribed to " + subscribeTo + "!"});
				});
			}
		});
	});

	var UserSchema = {
		type: 'object',
		properties: {
			city: {
				type: 'string'
			},
			age: {
				type: 'number'
			},
			weight: {
				type: 'number'
			}
		}
	}

	function sendMail(user, newDetails) {
		User.findOne({_id: user.id}).select("subscribers").exec(function(err, result) {

			var ccList = "";
			result.subscribers.forEach(function(subscriber) {
				ccList = subscriber.email+", "+ccList;
			});

			// Composing the email
			ccList = ccList.substring(0, ccList.length - 2);
			var msg = "The following details of the user <b>"+user.email+"</b> were updated.<br>";
			msg = msg + JSON.stringify(newDetails, null, 4);

			// Change your credentials in '../config.js' . Service parameter by default is 'Gmail'
			var transporter = nodemailer.createTransport({
				service: config.service,
				auth: {
					user: config.email,
					pass: config.pass
				}
			});

			var mailOptions = {
				from: ' Social Cops <no-reply@socialcops.com>',
				to: ccList,
				subject: 'Subscriber Notification',
				text: 'HelloWorld',
				html: msg
			};

			// Sending the emails
			transporter.sendMail(mailOptions, function(error, info){
				if (error) {
					return console.log(error);
				}
				console.log('Message '+info.messageId+' + sent: '+info.response);
			});
		})
	}

	// Update city, age or weight and notification emails will be sent to the subscribed users.
	routes.post('/update', validate({body: UserSchema}), function(req, res) {
		var newDetails = {};
		if(req.body.city)
			newDetails.city = req.body.city;
		if(req.body.age)
			newDetails.age = req.body.age;
		if(req.body.weight)
			newDetails.weight = req.body.weight;
		User.findOneAndUpdate({ _id: req.decoded.id }, { $set : newDetails }, {'new': true}, function(err, result) {
			if(err) {
				res.send(err);
				return;
			}
			sendMail(req.decoded, newDetails);
			res.json({message: "Details updated!"});
		});
	});

	return routes;
	
}