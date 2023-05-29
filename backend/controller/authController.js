const Joi = require('joi'); //joy is for data vallidation so to instal joi npm i joi
const User = require('../models/user');
const bcrypt = require('bcryptjs'); // install for hash ' npm i bcryptjs '
const UserDTO = require('../dto/user');
const JWTService = require('../services/JWTService');
const RefreshToken = require ('../models/token');

const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,25}$/;
const authController = { 
    async register(req, res, next) {
        //1.vallidate user input
        const userRegisterSchema = Joi.object({
            username: Joi.string().min(5).max(30).required(),
            name: Joi.string().max(30).required(),
            email: Joi.string().email().required(), //In the latest versions of Joi (17.x.x and above), the email validation method has been changed. Instead of Joi.string.email(), you should use Joi.string().email().
            password: Joi.string().pattern(passwordPattern).required(),
            confirmPassword: Joi.ref('password')
        });

        const {error} = userRegisterSchema.validate(req.body); //{error} the bracket is destructure

        //2. if error in vallidation -> return error via middleware
        if (error){
            return next(error); // 'next' will call next middleware

        }

        // 3. if email or username is already registeres ->  return an error
        const {username, name, email, password} = req.body;
        try{

            const emailInUse = await User.exists({email}); //User is from mongoose ad exists({}) is a function

            const usernameInUse = await User.exists({username});

            if  (emailInUse){
                const error = {
                    status : 409,
                    message : 'Email already registered,use another email.'

                }
                return next(error); // calling middleware.
            }
            if (usernameInUse){
                const error = {
                    status : 409,
                    message: 'Username not available, choose another username'
                }
                return next(error); // calling middleware
            }
        }
        catch(error){
            return next (error);

        }
        // check if email is not registered already
        //4. password hash
        //123abc -> outtesgfjyuy95477556354246#$$%^^!*&^%% this is hash from the string which is 123abc
        //login -> 123abc -> hash will be same if the pass gives diff hash will be diff so cant login by user 
        // to hash install npm i bycryptyjs

        const hashedPassword = await bcrypt.hash(password, 10);




        //5. store user data in db
        let accessToken;
        let refreshToken;

        let user;

        try{
            const userToRegister = new User({
                username: username,
                email: email,
                name: name, // we can also only write 'name,' because 'name: name,/ are same
                password: hashedPassword
    
                
            })
             user = await userToRegister.save(); // store in db

            //token generation
            //accessToken = JWTService.signAccessToken({_id: user._id, username: user.username}, '30m');
            accessToken = JWTService.signAccessToken({_id: user._id}, '30m'); // username is removed to keep the consistency with other access and refreshtokens

            refreshToken = JWTService.signRefreshToken({_id: user._id},'60m');

        }
        catch(error){
            return next(error);

        }
        //store refreshToken n db
         await JWTService.storeRefreshToken(refreshToken, user._id);
        //accessToken and refreshToken willl be sent in cookies
        res.cookie('accessToken', accessToken, {
            maxAge: 1000 * 60 * 60 * 24, //maxAge means cookie expiry time which we get in milisecs, sec*min*hr*whole day
            httpOnly: true //for security client-site browser/javascript cannot access, it can only access when fresh token comes from client-site
                                  
        });
        res.cookie('refreshToken', refreshToken,{
            maxAge: 1000 * 60 * 60 * 24,
            httpOnly: true
        });
        
        // 6. response send 

        const userDto = new UserDTO(user);
        return res.status(201).json({user: userDto, auth: true});


    },
     async login(req, res, next) {
        // 1. validate user input
        // 2. if vallidation error, return error with the help of error handdling middleware
        // 3. match username and password
        // 4. return response
        
        // step 1
        // we expect infut data to be in such shape
        const userLoginSchema = Joi.object({
            username: Joi.string().min(5).max(30).required(),
            password: Joi.string().pattern(passwordPattern)

        }); //DTO: data transfer object, 

        const {error} = userLoginSchema.validate(req.body); //errorr is destructured by {error}

        if (error) {
            return next(error); //use middleware if error fount to handle error
        }

        //step 2 
        //if we want to comunicate with data we will use try catch so if there is any error found the db doesnt crash
        const {username, password} = req.body; //user input

        //const username = req.body.username
        //const password = req.body.password  

        let user; // user defined globally to access it outside try scope
        try{
            // match username
             user = await User.findOne({username: username}); //findOne is a method and user is a let var to store the record of username
 
            if( !user ){
                const error = {
                    status: 401, //status code is for unauthorized and invalid credentials
                    message: 'Invalid username'
                }

                return next(error);
            }

            //match password
            // req.body.password  -> hash -> match

            const match = await bcrypt.compare(password, user.password);  //password is user input, user.password from db user came from const user object created to store record of username

            if( !match ){
                const error = {
                    status: 401,
                    message: 'Invalid Password'
                }

                return next(error); // by using middleware this error has been returned


            }
            
        }
        catch(error){
            return next(error);
        }

       const accessToken = JWTService.signAccessToken({_id: user._id}, '30m'); //only id in payload
       const refreshToken = JWTService.signRefreshToken({_id: user._id}, '60m');

       //update refreshToken in db before updatig RefreshToken has been imported above from token.js
       try{
       await RefreshToken.updateOne({
        _id: user._id
       },
       {token: refreshToken},
       {upsert: true} // upsert means if it gets any matching record than it will updat and if it doesnt get any match then it will insert new

       )
    }
    catch(error){
        return next(error);
    }


       // sent to cookies
       res.cookie('accessToken', accessToken, {
        maxAge: 1000 * 60 * 60 * 24,
        htpOnly: true
       });

       res.cookie('refreshToken',refreshToken,{
        maxAge: 1000 * 60 * 60 * 24,
        httpOnly: true
       });

        // if both matched return response

        const userDto = new UserDTO(user); // filtered info according what we want to transfer and userDto is new obeject creater and UserDto is where we have imported in the beginning

        return res.status(200).json({user: userDto, auth: true});


     },

     // return req from auth in logout(req.....)

     async logout(req, res, next){
        console.log(req);
        //1. delete refresh token from db
        const {refreshToken} = req.cookies; // taken the key from cookies under refreshToken

        try{
           await RefreshToken.deleteOne({token: refreshToken}); // deleting refreshToken //token from token.js is matching with refreshToken then delete


        }catch(error){
            return next(error); 

        }
        //delete cookies
        res.clearCookie('accessToken');
        res.clearCookie('refreshToken');
        // 2. response
        res.status(200).json({user: null, auth: false});
     },
//create method named refresh
     async refresh(req, res, next){
        // 1. get refreshToken from cookies
        // 2. verify refreshToken
        // 3. generate new tokens
        // 4. update database, return response

        //step 1
        const originalRefreshToken = req.cookies.refreshToken;

        //step 2
        let id;
        try{
            id = JWTService.verifyRefreshToken(originalRefreshToken)._id;
        }
        catch(e){
            const error = {
                status: 401,
                message: ' Unauthorized'
            }

            return next(error);

        }

        try{
            const match =  RefreshToken.findOne({_id: id, token: originalRefreshToken});

            if( !match )
            {
                const error = {
                    status: 401,
                    message: 'Unauthorized'

                }

                return next(error);
            }
        }
        catch(e){
            return next(error);
           

        }

        //step 3

        try {
            const accessToken = JWTService.signAccessToken({_id: id}, '30m');
            const refreshToken = JWTService.signRefreshToken({_id: id}, '60m');
            
            await RefreshToken.updateOne({_id: id}, {token: refreshToken}); //step 4 update db

            // sent tokens to cookies
            res.cookie('accessToken',accessToken, {
                maxAge: 1000 * 60 * 60 * 24,
                httpOnly: true
            })
            
            res.cookie('refreshToken',refreshToken, {
                maxAge: 1000 * 60 * 60 * 24,
                httpOnly: true
            });

        } catch (e) {
            return next(e);
            
        }
        

        const user = await User.findOne({_id: id});
        const userDto = new UserDTO(user);

        return res.status(200).json({user: userDto, auth: true});




     }
    


}

module.exports = authController;
