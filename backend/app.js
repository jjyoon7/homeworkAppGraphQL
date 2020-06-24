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

app.use('/graphql', graphqlHttp({
    schema: graphqlSchema,
    rootValue: graphqlResolver,
    graphiql: true
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