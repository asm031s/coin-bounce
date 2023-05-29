//for validation whether or not user have valid access token and refresh token
const  JWTService = require('../services/JWTService');
const User = require('../models/user');
const UserDTO = require('../dto/user');
const auth = async (req, res, next) => {
    try{
    // 1. refresh, access token validation
    const {refreshToken, accessToken} = req.cookies; //REFRESH AND ACCESS token retreive from cookies

    if(!refreshToken || !accessToken) {
        const error = {
            status: 401,
            message: ' Unauthorized'
        }
        return next(error)
    }



    //to handle error use try catch
    let _id;
    try{

    _id = JWTService.verifyAccessToken(accessToken); // to verify accessToken import JWTService //returns payload which contain only id 
     

    }

    catch(error){
        return next(error); // if there's error middleware which is for errorhandling will handle the error
    }
    let user;

    try{
        user = await User.findOne({_id: _id});

    }

    catch(error){
        return next(error);

    }

    const userDto = new UserDTO(user);

    req.user = userDto;

    next(); //next middleware is caled

}

catch(error){
    return next(error);
}

    


}

module.exports = auth;