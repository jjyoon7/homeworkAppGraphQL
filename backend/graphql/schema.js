const { buildSchema } = require('graphql')

module.exports = buildSchema(`
    type testData {
        name: String!
        age: Int
    }

    type rootQuery { 
        rootData: testData
    }

    schema { 
        query: rootQuery 
    }
`)