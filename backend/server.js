const express = require('express');
const dbConnect = require('./database/index');
const {PORT} = require('./config/index');
const router = require('./routes/index');
const errorHandler = require('./middlewares/errorHandler');
const cookieParser = require('cookie-parser'); //installed npm i cookie-parser
const app = express(); // app created of express

app.use(cookieParser()); // cookieParser middleware is registered
app.use(express.json()); //the application can communicate data in json, data can be accepted in json and also send
app.use(router);
dbConnect();
app.use('/storage',express.static('storage')); //in 4:02 hr in youtube it is use to potray the photo from storage in web which path is copieth from mongodb

app.use(errorHandler);
app.listen(PORT, console.log(`Backend is running on port: ${PORT}`));