var mongoose = require('mongoose');

var Schema = mongoose.Schema;
var bcrypt = require('bcrypt-nodejs');

var UserSchema = new Schema({
	name: { type: String, required: true },
	email: { type: String, required: true, index: { unique: true } },
	password: { type: String, required: true },
	subscribers: [ { name: { type: String, required: true }, email: { type: String, required: true } }],
	city: { type: String , required: true },
	age: { type: Number , required: true },
	weight: { type: Number , required: true }
});

UserSchema.pre('save', function(next) {

	var user = this;

	if(!user.isModified('password')) return next();

	// bcyrpt-nodejs package stores the password as a hash
	bcrypt.hash(user.password, null, null, function(err, hash) {
		if(err) return next(err);

		user.password = hash;
		next();
	});
});

UserSchema.methods.comparePassword = function(password) {
	var user = this;
	return bcrypt.compareSync(password, user.password);
}

module.exports = mongoose.model('User', UserSchema);