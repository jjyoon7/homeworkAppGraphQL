const path = require('path')
const fs = require('fs')

const deleteImageFile = filePath => {
    filePath = path.join(__dirname, '..', filePath)
    fs.unlink(filePath, err => console.log(err))
}

exports.deleteImageFile = deleteImageFile