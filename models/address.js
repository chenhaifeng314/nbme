var Schema = require('mongoose').Schema,
    ObjectId = Schema.Types.ObjectId;
    
exports.Model = require('mongoose').Schema({
	user: ObjectId,
    city: String,
    street: String
});