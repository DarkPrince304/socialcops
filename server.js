var express = require('express');
var bodyParser = require('body-parser');
var morgan = require('morgan');
var mongoose = require('mongoose');
var nodemailer = require('nodemailer');
var config = require('./config');
var host = "http://localhost:"+config.port;

var app = express();

mongoose.connect(config.database, function(err) {
	if(err) {
		console.log(err);
	} else {
		console.log("Connected to the database!");
	}
});

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(morgan('dev'));

var routes = require('./app/routes')(app, express);

app.use('/', routes);

app.listen(config.port, function(err) {
	if(err) {
		console.log(err);
	} else {
		console.log("Listening on port " + config.port);
	}
})
