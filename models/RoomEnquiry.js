const mongoose = require('mongoose');
const { Schema } = mongoose;

const EnquirySchema = new Schema({
    name: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        required: true
    },
    checkinDate: {
        type: Date,
        required: true
    },
    checkoutDate: {
        type: Date,
        required: true
    },
    roomType: {
        type: String,
        enum: ['basic', 'suite', 'luxury'], // Added enum validation
        required: true
    },
    datetime: {
        type: Date,
        default: Date.now
    }
});

const Enquiry = mongoose.model('Enquiry', EnquirySchema);
module.exports = Enquiry;
