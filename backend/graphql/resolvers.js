const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const validator = require('validator')

const User = require('../models/user')
const Post = require('../models/post')

const { deleteImageFile } = require('../utils/file')
const { sendConfirmationEmail } = require('../services/EmailService')

require('dotenv').config()
const  JWT_SECRET_KEY = process.env.JWT_SECRET_KEY

module.exports = {
    createUser: async function ({ userInput }, req) {
        const errors = []

        if(!validator.isEmail(userInput.email)) {
            errors.push({ message: 'Email invalid' })
        }
        if(
            validator.isEmpty(userInput.password) ||
            !validator.isLength(userInput.password, { min: 5 })
        ) {
            errors.push({ message: 'Password too short' })
        }
        if(errors.length > 0) {
            const error = new Error('Invalid input')
            error.data = errors
            error.code = 422
            throw error
        }

        const existingUser = await User.findOne({email: userInput.email})
        
        if(existingUser) {
            const error = new Error('User exists already.')
            throw error
        }
        
        const hashedPW = await bcrypt.hash(userInput.password, 12)

        const user = new User({
            email: userInput.email,
            name: userInput.name,
            password: hashedPW
        })

        await user.save()
        
        // await sendConfirmationEmail(createdUser)

        return { ...user._doc, _id: user._id.toString() }
        
    },
    login: async function ({ email, password }) {
        const user = await User.findOne({ email: email })
        if (!user) {
            const error = new Error('User not found.')
            error.code = 401
            throw error
        }
        const isEqual = await bcrypt.compare(password, user.password)
        if (!isEqual) {
            const error = new Error('Password is incorrect.')
            error.code = 401
            throw error
        }
        const token = jwt.sign(
            {
                userId: user._id.toString(),
                email: user.email
            }, 
            JWT_SECRET_KEY, 
            { expiresIn: '1h' }
        )

        const refreshToken = jwt.sign(
            {
                userId: user._id.toString(),
                email: user.email
            }, 
            JWT_SECRET_KEY, 
            { expiresIn: '1h' }
        )


        return { token: token, refreshToken: refreshToken, userId: user._id.toString()}

    },
    createPost: async function({ postInput }, req) {
        if (!req.isAuth) {
          const error = new Error('Not authenticated!');
          error.code = 401;
          throw error;
        }
        const errors = [];
        if (
          validator.isEmpty(postInput.title) ||
          !validator.isLength(postInput.title, { min: 5 })
        ) {
          errors.push({ message: 'Title is invalid.' });
        }
        if (
          validator.isEmpty(postInput.content) ||
          !validator.isLength(postInput.content, { min: 5 })
        ) {
          errors.push({ message: 'Content is invalid.' });
        }
        if (errors.length > 0) {
          const error = new Error('Invalid input.');
          error.data = errors;
          error.code = 422;
          throw error;
        }
        const user = await User.findById(req.userId);
        if (!user) {
          const error = new Error('Invalid user.');
          error.code = 401;
          throw error;
        }
        const post = new Post({
          title: postInput.title,
          content: postInput.content,
          imageUrl: postInput.imageUrl,
          creator: user
        });
        const createdPost = await post.save();
        user.posts.push(createdPost);
        await user.save();
        return {
          ...createdPost._doc,
          _id: createdPost._id.toString(),
          createdAt: createdPost.createdAt.toISOString(),
          updatedAt: createdPost.updatedAt.toISOString()
        };
      },
      posts: async function({ page }, req) {
        if (!req.isAuth) {
          const error = new Error('Not authenticated!');
          error.code = 401;
          throw error;
        }
        if (!page) {
          page = 1;
        }
        const perPage = 2;
        const totalPosts = await Post.find().countDocuments();
        const posts = await Post.find()
          .sort({ createdAt: -1 })
          .skip((page - 1) * perPage)
          .limit(perPage)
          .populate('creator');
        return {
          posts: posts.map(p => {
            return {
              ...p._doc,
              _id: p._id.toString(),
              createdAt: p.createdAt.toISOString(),
              updatedAt: p.updatedAt.toISOString()
            };
          }),
          totalPosts: totalPosts
        };
      },
      post: async function({ id }, req) {
        if (!req.isAuth) {
          const error = new Error('Not authenticated!');
          error.code = 401;
          throw error;
        }
        const post = await Post.findById(id).populate('creator');
        if (!post) {
          const error = new Error('No post found!');
          error.code = 404;
          throw error;
        }
        return {
          ...post._doc,
          _id: post._id.toString(),
          createdAt: post.createdAt.toISOString(),
          updatedAt: post.updatedAt.toISOString()
        };
      },
    updatePost: async function ({ id, postInput }, req) {
        //check if the author is authorized
        if (!req.isAuth) {
            const error = new Error('User cannot be authenticated.')
            error.code = 401
            throw error
        }
        
        const post = await Post.findById(id).populate('creator')

        //if the post does not exists, throw en error
        if (!post) {
            const error = new Error('Cannot find the post')
            error.code = 404
            throw error
        }
        //check if the person who is trying to edit the post is 
        //also the person who created the post
        console.log('post.creator._id', post.creator._id)
        if (post.creator._id.toString() !== req.userId.toString()) {
            const error = new Error('Unauthorized user.')
            error.code = 403
            throw error
        }

        //check if the user input data is validated
        const errors = []
        if (
            validator.isEmpty(postInput.title) ||
            !validator.isLength(postInput.title, { min: 5 })
        ) {
            errors.push({ message: 'Title is too short.' })
        }
        if (
            validator.isEmpty(postInput.content) || 
            !validator.isLength(postInput.content, { min: 5 })
        ) {
            errors.push({ message: 'Content is too short.' })
        }
        if(errors.length > 0) {
            const error = new Error('Invalid input')
            error.data = errors
            error.code = 422
            throw error
        }
        
        post.title = postInput.title
        post.content = postInput.content

        //check if the imageUrl has been updated with new imageUrl
        if (postInput.imageUrl !== 'undefined') {
            post.imageUrl = postInput.imageUrl
        }

        const updatedPost = await post.save()
        return {
            ...updatedPost._doc,
            _id: updatedPost._id.toString(),
            createdAt: updatedPost.createdAt.toISOString(),
            updatedAt: updatedPost.updatedAt.toISOString()
        }
    },
    deletePost: async function({ id }, req) {
        if (!req.isAuth) {
            const error = new Error('User cannot be authenticated.')
            error.code = 401
            throw error
        }

        //post has creator field, where it could check if the creator of the post
        //is also the owner of the post.
        const post = await Post.findById(id)

        if (!post) {
            const error = new Error('Cannot find the post')
            error.code = 404
            throw error
        }
        //check if the person who is trying to delete the post is 
        //also the person who created the post
        console.log('post.creator._id', post.creator._id)
        if (post.creator.toString() !== req.userId.toString()) {
            const error = new Error('Unauthorized user.')
            error.code = 403
            throw error
        }
        //if the person tries to delete the post is the person who created the post,
        //delete the image data
        deleteImageFile(post.imageUrl)

        //remove that post from DB
        await Post.findByIdAndRemove(id)

        //find the user, to delete the post(using 'id' args) from its posts array
        const user = await User.findById(req.userId)
        user.posts.pull(id)
        await user.save()

        //return boolean because in the schema, it is expecting it.
        return true
    },
    user: async function (args, req) {
        if (!req.isAuth) {
            const error = new Error('User cannot be authenticated.')
            error.code = 401
            throw error
        }

        const user = await User.findById(req.userId)

        if (!user) {
            const error = new Error('Cannot find the user')
            error.code = 404
            throw error
        }

        return {
            ...user._doc,
            _id: user._id.toString()
        }
    },
    updateStatus: async function ({ status }, req) {
        if (!req.isAuth) {
            const error = new Error('User cannot be authenticated.')
            error.code = 401
            throw error
        }

        const user = await User.findById(req.userId)
        if (!user) {
            const error = new Error('Cannot find the user')
            error.code = 404
            throw error
        }

        user.status = status
        await user.save()

        return {
            ...user._doc,
            _id: user._id.toString()
        }
    },
    resetPassword: async function ({ userInput }, req) {
      console.log(userInput)
    }
}