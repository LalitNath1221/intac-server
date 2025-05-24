const mongoose = require('mongoose');
const { Schema } = mongoose;

const UserSchema = new Schema({
    name:{
        type:String,
        requied:true
    },
    email: {
        type:String,
        requied:true
    },
    password: {
        type:String,
        requied:true
    },
    datetime:{
        type:Date,
        default: Date.now
    }
});
const User =  mongoose.model('user', UserSchema)
module.exports = User