const User = require('../models/user')

module.exports = {
    createUser: async function ({ userInput }, req) {
        
        const existingUser = await User.findOne({email: userInput.email})
    }
}