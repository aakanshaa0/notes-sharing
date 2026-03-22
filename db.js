const mongoose=require('mongoose');

const Schema=mongoose.Schema;

const userSchema = new Schema({
    name: String,
    email: String,
    password: String,
});

const notesSchema = new Schema({
    title: {
        type: String,
        required: true
    },
    content: {
        type: String,
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    isPublic: {
        type: Boolean,
        default: false
    },
    tags: [String],
    shareLink: {
        type: String,
        unique: true,
        sparse: true
    }
},
{
    timestamps: true
})

const userModel=mongoose.model('User',userSchema);
const notesModel=mongoose.model('Notes',notesSchema);

module.exports={
    userModel,
    notesModel
};