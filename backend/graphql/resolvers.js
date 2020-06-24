const bcrypt = require('bcryptjs')
const validator = require('validator')
const User = require('../models/user')

module.exports = {
    createUser: async function ({ userInput }, req) {
        const error = []

        if(!validator.isEmail(userInput.email)) {
            error.push({ message: 'Email invalid' })
        }
        if(
            validator.isEmpty(userInput.password) ||
            !validator.isLength({ min: 5 })
        ) {
            error.push({ message: 'Password too short' })
        }
        if(errors.length > 0) {
            const error = new Error('Invalid input')
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
    }
}