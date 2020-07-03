const mongoose = require('mongoose')
const Schema = mongoose.Schema

const userSchema = new Schema({
    email: { type: String, required: true },
    password: { type: String, required: true },
    name: { type: String, required: true },
    status: { type: String, default: 'New user' },
    posts: [{
        type: Schema.Types.ObjectId,
        ref: 'Post'
    }],
    count: { type: Number, default: 0 },
    refreshToken: { type: String }
})

module.exports = mongoose.model('User', userSchema)