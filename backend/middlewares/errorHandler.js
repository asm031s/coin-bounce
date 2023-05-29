const {ValidationError} = require('joi');
// errorHandler function and error, req, res, next are arguments
const errorHandler = (error, req, res, next) => {
    //default error
    let status = 500;
    let data = {
        message: 'Internal Server Error'
    }
// instanceof means what type of object
if(error instanceof ValidationError){
    status = 401;
    data.message = error.message;

    return res.status(status).json(data);
}

if (error.status){
    status = error.status;
}

if (error.message){
data.message = error.message;
}
return res.status(status).json(data);

}

module.exports = errorHandler;


