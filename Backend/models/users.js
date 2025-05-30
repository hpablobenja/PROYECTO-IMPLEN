const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    firstName: 'String',
    lastName : 'String',
    email: 'String',
    password: 'String',
    phoneNumber: 'String',
    imageUrl: 'String',
});

const User = mongoose.model("users", UserSchema);
module.exports = User;