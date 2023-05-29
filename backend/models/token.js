// install jsw for authentication npm i jsonwebtoken
const mongoose = require('mongoose');

const {Schema} = mongoose; //Schema is destructured

const refreshTokenSchema = Schema({
    token: {type: String, required: true},
    userId: {type: mongoose.SchemaTypes.ObjectId, ref: 'User'}
}, //model created
    {timestamps: true}

);

module.exports = mongoose.model('RefreshToken',refreshTokenSchema,'tokens'); //modelname,schematype,dbname
