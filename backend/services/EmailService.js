const nodemailer = require('nodemailer')
const nodemailerSendgrid = require('nodemailer-sendgrid')
const jwt = require('jsonwebtoken')

require('dotenv').config()
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY
const RESET_PASSWORD_SECRET_KEY = process.env.RESET_PASSWORD_SECRET_KEY
const VERIFICATION_SECRET_KEY = process.env.VERIFICATION_SECRET_KEY

const transporter = nodemailer.createTransport(
    nodemailerSendgrid({
        apiKey: SENDGRID_API_KEY
    })
)

exports.sendConfirmationEmail = async (user) => {
    const token = jwt.sign(
        {
            userId: user._id.toString(),
            email: user.email
        }, 
        VERIFICATION_SECRET_KEY, 
        { expiresIn: '1h' }
    ) 
    const url = `http://localhost:3000/confirmation/${token}`

    transporter.sendMail({
        from: 'jay.yoon7@gmail.com',
        to: `${user.email}`,
        subject: `Confirm your account, ${user.name} - homeworkApp`,
        html: `Confirm your account <a href=${url}>${url}</a>`
    }).then(() => {
        console.log('Email sent.')
    }).catch(err => {
        console.log(err.response.body)
    })
}

exports.sendResetEmail = async (user) => {
    const resetPasswordToken = jwt.sign(
        {
            userId: user._id.toString(),
            email: user.email
        }, 
        VERIFICATION_SECRET_KEY, 
        { expiresIn: '1h' }
    )

    const url = `http://localhost:3000/reset/${resetPasswordToken}`

    transporter.sendMail({
        from: 'jay.yoon7@gmail.com',
        to: `${user.email}`,
        subject: `Reset your password, ${user.name} - homeworkApp`,
        html: `Reset your password <a href=${url}>${url}</a>`
    }).then(() => {
        console.log('Reset email sent.')
    }).catch(err => {
        console.log(err.response.body)
    })
}

exports.sendPasswordResetConfirmationEmail = async (user) => {
    transporter.sendMail({
        from: 'jay.yoon7@gmail.com',
        to: `${user.email}`,
        subject: `Reset password succeed, ${user.name} - homeworkApp`,
        html: `Your password has been updated.`
    }).then(() => {
        console.log('Password reset confirmation email sent.')
    }).catch(err => {
        console.log(err.response.body)
    })

}