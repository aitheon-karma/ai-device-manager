const uuidv1 = require('uuid').v1();

module.exports = {
    output: {
        jsonpFunction: 'ai-' + uuidv1()
    },
};
