const Joi = require('joi'); // to validate req body in step 1 we need joi
const fs = require('fs');
const Blog = require('../models/blog');
const{BACKEND_SERVER_PATH} = require('../config/index');
const BlogDTO = require('../dto/blog');
const BlogDetailsDTO = require('../dto/blog-details');
const Comment = require('../models/comment');

const mongodbIdPatter = /^[0-9a-fA-F]{24}$/; // it is a requilar expression which matches with mongodb id
const blogController = {
    async create(req, res, next){
        // 1. validate req body
        // 2. handle photo storage, naming
        // 3. add to db
        // 4. return response

        //client side -> base64 encoded string -> decode -> store -> save photo's path indb
        
        const createBlogSchema = Joi.object({
            title: Joi.string().required(),
            author:Joi.string().regex(mongodbIdPatter).required(), //regex is regular expression, it matches with mongodb id expression
            content:Joi.string().required(),
            photo: Joi.string().required()
        });

        const {error} = createBlogSchema.validate(req.bod);

        if(error){
            return next (error);
        }

        const {title, author, content, photo} = req.body;

        // to handle photo
        //read as buffer
        const buffer = Buffer.from(photo.replace(/^data:image\/(png|jpg|jpeg);base64,/,''),'base64') // in photo meta data is replaces by emplty string then the cleaned photo is read through Buffer and 'base64' is the encoding passed of it
      
        //allot a random name
        const imagePath =`${Date.now()}-${author}.png`;
        // save locally

        try {
            fs.writeFileSync(`storage/${imagePath}`, buffer);
            
        } catch (error) {
            return next(error);
            
        }

        //save blog in db step 3 first import blog.js above
        let newBlog;
        try {
             newBlog = new Blog ({
                title,
                author,
                content,
                photoPath: `${BACKEND_SERVER_PATH}/storage/${imagePath}`//BACKEND_SERVER_PATH is written in .env file and then it stored in config -> index.js then it is imported above

            });
            await newBlog.save();
            
        } catch (error) {
            return next (error);
            
        }

        const blogDTO = new BlogDTO(newBlog); //create file blog.js under dto then assign parameters there then import it above
        return res.status(201).json({blog: blogDTO });




        


     },
    async getAll(req, res, next){ 
    try {
            const blogs = await Blog.find({});

            const blogsDto = [];

            for(let i=0; i<blogs.length; i++)
            {
                const dto= new BlogDTO(blogs[i]);
                blogsDto.push(dto);
            }

            return res.status(200).json({blogs: blogsDto});
        } catch (error) {
            return next(error);
            
        }    
   },
    async getById(req, res, next){
    //validate id
        //send response

        const getByIdSchema = Joi.object({
            id: Joi.string().regex(mongodbIdPatter).required()

        });

        const {error} = getByIdSchema.validate(req.params); //not send in request body,sent in request parameters

        if(error){
            return next(error);
        }

        let blog;

        const {id} = req.params;
        
        try {
           blog = await Blog.findOne({_id: id}).populate('author');
        } catch (error) {
            return next(error);
            
        }

        const blogDto = new BlogDetailsDTO(blog);
        return res.status(200).json({blog: blogDto});
     },
    async update(req, res, next){
      // validate req body
        

        const updateBlogSchema = Joi.object({
            title :Joi.string().required(),
            content: Joi.string().required(),
            author: Joi.string().regex(mongodbIdPatter).required(),
            blogId: Joi.string().regex(mongodbIdPatter).required(),
            photo: Joi.string()
        });
        const {error} = updateBlogSchema.validate(req.body);

        const{title, content, author, blogId, photo} = req.body; //title,content,author,blogId,photo need to be destrustructured from req body
    
        // delete previous photo if photo needs to be update
        // save new photo
        let blog;
        try {
             blog = await Blog.findOne({_id: blogId}); // blog which matches with blogId  will be store in blog object
        } catch (error) {
            return next (error);
        }
        if(photo){
            let previousPhoto = blog.photoPath; // photoPath from db under Blog is stored in previousPhoto

           previousPhoto = previousPhoto.split('/').at(-1); //121234-323134.png last index will be split after / by -1 then only file name will be stored

        
           // delete photo
           fs.unlinkSync(`storage/${previousPhoto}`); //The fs.unlinkSync() function is used to synchronously delete a file from the file system.  it is used to delete a file located in the storage directory with the filename specified in the previousPhoto variable.
       
           // to handle photo
        //read as buffer
        const buffer = Buffer.from(photo.replace(/^data:image\/(png|jpg|jpeg);base64,/,''),'base64') // in photo meta data is replaces by emplty string then the cleaned photo is read through Buffer and 'base64' is the encoding passed of it
      
        //allot a random name
        const imagePath =`${Date.now()}-${author}.png`;
        // save locally

        try {
            fs.writeFileSync(`storage/${imagePath}`, buffer); //The fs.writeFileSync() function is used to synchronously write data to a file. 
            
        } catch (error) {
            return next(error);
            
        }

        //update
        await Blog.updateOne({_id: blogId}, //MATCH ID
            {title, content, photoPath: `${BACKEND_SERVER_PATH}/storage/${imagePath}`} //fields need to be updated
            );
        }

        //if we dont need to update photo onlt title and contents need to be updated
        else{
            await Blog.updateOne({_id: blogId},{title, content});
        }

        return res.status(200).json({message: 'blog updated!'}); // 200 status code is for successful response

    },
    async delete(req, res, next){
    // validate id
        // delete blog
        // delete comments on this blog

        const deleteBlogSchema = Joi.object({
          id: Joi.string().regex(mongodbIdPatter).required()

        });
        const {error} = deleteBlogSchema.validate(req.params);

        const {id} = req.params;

        // delete blog
        // delete comments
        try {
            await Blog.deleteOne({_id: id});

            await Comment.deleteMany({blog: id}); 


        } catch (error) {
            return next(error);
            
        }

        return res.status(200).json({message: 'blog deleted'});
    }
    }



module.exports = blogController;
