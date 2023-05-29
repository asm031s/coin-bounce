const jwt = require('jsonwebtoken'); //imported jwt for authentication // install npm i jsonwebtoken
const { ACCESS_TOKEN_SECRET, REFRESH_TOKEN_SECRET } = require('../config/index');
const RefreshToken = require('../models/token');
//ACCESS_TOKEN_SECRET AND REFRESH_TOKEN_SECRET these are commented out because the secret keys are transfereed to .env file and in config it is imported 
// for a secret key go to terminal write node then const crypto = require('crypto') then crypto.randomBytes(64).toString('hex') then copy the key nd past it 
//const ACCESS_TOKEN_SECRET="16ff22926d3326fccab7fd793725c58a75e385f69dabdfaa9d3e025d1fa2edad2c8d5182810690ccd9691c0f1b7407b50eba5df3b1d8f8f268f4c8ce47d8044a"

//GO AGAIN TO TERMINAL crypto.randomBytes(64).toString('hex') run this another secret key willl apear copy and paste it here
//const REFRESH_TOKEN_SECRET="2c0fad4f59a051a258073f571ec1eae3cbcb70e2dc36b25e51590322a598abaefc4fc23530b5c9de510ea9a5f9cf1f43b5e47cd6044d701ceb4f1b84bb91ee12"
class JWTService{
    // sign access token
    //methods are declared as static so that whenever they need to import or use new object doesnt require to make, this methods then can be access directly by mentioning the class
    static signAccessToken(payload, expiryTime){
        return jwt.sign(payload, ACCESS_TOKEN_SECRET, {expiresIn: expiryTime}); //acess token expires early than refresh token
    }
    // sign refresh token
    static signRefreshToken(payload, expiryTime){
        return jwt.sign(payload, REFRESH_TOKEN_SECRET, {expiresIn: expiryTime}); // {expiresIn: expiryTime} is an object


    }

    // verify access token method create
    //token is from user
    static verifyAccessToken(token){
        return jwt.verify(token,ACCESS_TOKEN_SECRET); // returning payload

    }
    // verify refresh token
    static verifyRefreshToken(token){
        return jwt.verify(token,REFRESH_TOKEN_SECRET);
    }
    // store refresh token
    static async storeRefreshToken(token, userId){
        //to communicate with db use try catch
        try{
            const newToken = new RefreshToken ({
                token: token,
                userId: userId
            });

            //store in db
            await newToken.save();


        }
        catch(error){
            console.log(error);
        }
    }
}

module.exports = JWTService;