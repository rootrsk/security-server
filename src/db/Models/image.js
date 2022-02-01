const mongoose = require ('mongoose')

const imageSchema = mongoose.Schema({
    key:{
        type: String,
        trim: true
    },
    uri :{
        type : String,
        required : true,
    },
    captured_at : {
        type : Date,
    },
    labels:{
        _id: false
    }
})

const Image = mongoose.model('Image',imageSchema)

module.exports = Image