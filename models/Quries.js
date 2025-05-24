const mongoose = require('mongoose');
const { Schema } = mongoose;

const OuerySchema = new Schema({
    name:{
        type:String,
        requied:true
    },
    email: {
        type:String,
        requied:true
    },
    phone: {
        type:Number,
        requied:true
    },
    message: {
        type:String,
        requied:true
    },
    datetime:{
        type:Date,
        default: Date.now
    }
});
const Query = mongoose.model('quries', OuerySchema)
module.exports = Query