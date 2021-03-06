const express = require('express')

const path = require('path')
const bodyParser = require('body-parser')
const mongoose = require('mongoose')
const multer = require('multer')

const graphqlHttp = require('express-graphql')
const graphqlSchema = require('./graphql/schema')
const graphqlResolver = require('./graphql/resolvers')

const cors = require('cors')
const app = express()

const morgan = require('morgan')
const PORT = 5000 || process.env.PORT
const auth = require('./middleware/auth')
const { deleteImageFile } = require('./utils/file')

const fileStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'images')
    },
    filename: (req, file, cb) => {
        cb(null, new Date().toISOString() + '-' + file.originalname)
    }
})

const fileFilter = (req, file, cb) => {
    if(file.mimetype === 'image/png' || file.mimetype === 'image/jpg' || file.mimetype === 'image/jpeg') {
        cb(null, true)
    } else {
        cb(null, false)
    }
}

app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())
app.use(multer({
    storage: fileStorage,
    fileFilter: fileFilter
}).single('image'))

app.use('/images', express.static(path.join(__dirname, 'images')))

require('dotenv').config()
// app.use((req, res, next) => {
//     res.setHeader('Access-Control-Allow-Origin', '*');
//     res.setHeader(
//       'Access-Control-Allow-Methods',
//       'OPTIONS, GET, POST, PUT, PATCH, DELETE'
//     );
//     res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
//     next();
//   });

app.use(cors({
    allowedHeaders: ['Content-Type', 'Authorization']
}))

app.use(morgan('dev'))

app.use(auth)

//middleware to save the file and return the filePath
app.put('/post-image', (req, res, next) => {
    if (!req.isAuth) {
        throw new Error('User not authenticated')
    }
    if (!req.file) {
        return res.status(200).json({message: 'File not provided'})
    }
    if (req.body.oldPath) {
        deleteImageFile(req.body.oldPath)
    }
    return res.status(201).json({message: 'File stored', filePath: req.file.path})
})

//middleware to get dynamic refreshToken from the url and verify
// app.get('/reset/:resetToken', (req, res, next) => {
//     const fetchedRefreshToken = req.params.refreshToken

//     const user = User.findOne({refreshToken: fetchedRefreshToken})

//     if(!user) {
//         const error = new Error('Unauthorised email')
//         error.code = 404
//         throw error
//     }

//     return res.status(200).json({ user })
// })

app.use('/graphql', graphqlHttp({
    schema: graphqlSchema,
    rootValue: graphqlResolver,
    graphiql: true,
    customFormatErrorFn: (error) => ({
        message: error.message,
        locations: error.locations,
        stack: error.stack ? error.stack.split('\n') : [],
        path: error.path
    })
}))

app.use((error, req, res, next) => {
    console.log(error)
    const status = error.statusCode || 500
    const message = error.message
    const data = error.data
    res.status(status).json({ message: message, data: data})
})

const uri = process.env.ATLAS_URI

mongoose.connect(uri, {
                        useNewUrlParser: true,
                        useCreateIndex: true,
                        useUnifiedTopology: true,
                        useFindAndModify: true
                        })
        .then(result => {
            console.log(`server is running on port ${PORT}`)
            console.log('mongoDB database connection established successfully.')
            app.listen(PORT)
        })
        .catch(err => console.log(err))
