const { buildSchema } = require('graphql')

module.exports = buildSchema(`
    input UserInputData {
        email: String
        name: String
    }

    type RootMutation {
        createUser(userInput: UserInputData)
    }

    schema { 
        mutation: RootMutation
    }
`)