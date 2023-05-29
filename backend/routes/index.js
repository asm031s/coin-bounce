const express = require('express');
const authController = require('../controller/authController');
const blogController = require('../controller/blogController');
const commentController = require('../controller/commentController');
const auth = require('../middlewares/auth');

const router = express.Router();

//testing
//router.get('/test', (req, res) => res.json({msg: 'working'}));


// user (authController.js)
// register
router.post('/register',authController.register);

// login
router.post('/login',authController.login);  //post is to send data from the user

// logout
router.post('/logout', auth, authController.logout); // auth imported above which is a middleware to verify access and refresh tokens
// refresh
router.get('/refresh', authController.refresh); //get is used to fetch data and post is to submit data

// blog (blogController.js)

// create
router.post('/blog', auth, blogController.create); // it is a protected endpoint that is why auth middleware is used do which user access must verify its tokens first // create is method

// read all blogs
router.get('/blog/all', auth, blogController.getAll);
// read blog by id
router.get('/blog/:id', auth, blogController.getById);
// update
router.put('/blog', auth, blogController.update);
// delete
router.delete('/blog/:id', auth, blogController.delete);

// comment
// create comment
router.post('/comment', auth, commentController.create);
// read comments by blog id(get)
router.get('/comment/:id', auth, commentController.getById);

module.exports = router;

