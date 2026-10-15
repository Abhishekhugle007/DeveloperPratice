const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const studentSchema= new Schema({
    studentName:{type: String, required: false},
    age:{type: Number, required:false},
    email:{type:String, required:false, trim:true},
    phone:{type:String, required: false},
    address:{type:String, required:false},
    photo:{type:String} 

});

studentSchema.index(
    { email: 1 },
    {
        unique: true,
        partialFilterExpression: {
            email: { $type: 'string', $gt: '' }
        }
    }
);

module.exports = mongoose.model('Student',studentSchema);