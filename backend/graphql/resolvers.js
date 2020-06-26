const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const validator = require('validator')
const User = require('../models/user')
const { default: post } = require('../../homework-app/src/components/Feed/Post/Post')
const user = require('../models/user')
const { create } = require('../models/user')

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

        const createdUser = await user.save()

        return { ...createdUser._doc, _id: createdUser._id.toString() }
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
            'resolvethiskeyifyoucanbetyoucannotthisiswaytoolong', 
            { expiresIn: '1h' }
        )
        return { token: token, userId: user._id.toString()}

    },
    createMethod: async function({ postInput }, req) {
        const errors = []
        if (validator.isEmpty(userInput.title) ||
            !validator.isLength(userInput.title, { min: 5 })
        ) {
            errors.push({ message: 'Title is too short.' })
        }
        if (validator.isEmpty(userInput.content) || 
            !validator.isLength(userInput.content, { min: 5 })
        ) {
            errors.push({ message: 'Content is too short.' })
        }
        if(errors.length > 0) {
            const error = new Error('Invalid input')
            error.data = errors
            error.code = 422
            throw error
        }

        const post = new post({
            title: userInput.title,
            content: userInput.content,
            imageUrl: userInput.imageUrl
        })

        const createdPost = await post.save()

        return {
            ...createdPost._doc,
            _id: createdPost._id.toString(),
            createdAt: createdPost.createdAt.toISOString(),
            updatedAt: createdPost.updatedAt.toISOString()
        }
        
    }
}