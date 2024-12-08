const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const passportLocalMongoose = require('passport-local-mongoose');

const userSchema = new Schema({
    name:{
        type:String,
        uppercase:true,
        required:true,
    },
    gender:{
        type:String,
        uppercase:true,
        required:true,
    },
    dob:{
        type:Date,
        required:true,
    },
    contact:{
        type:Number,
        min:[1000000000,'Phone Number should contain at least 10 digits'],
        required:true,
    },
    address:{
        type:String,
        required:true,
    },
    emailId:{
        type:String,
        unique:true,
        sparse:true,
        required:true,
    },
    role:{
        type:String,
        default:"user",
        enum:["user","admin"],
        required:true,
    },
    regd_date:{
        type:Date,
        default:Date.now(),
        required:true,
    },
    fines:{
        type:Number,
        min:0,
        default:0,
    },
    borrows:{
        type:Number,
        min:0,
        default:0,
    },
    curr_borrows:{
        type:Number,
        default:0,
    },
    borrowing_history:[
        {   
            idx:Number,
            book: {
                type: Schema.Types.ObjectId,
                ref: "Book",
            },
            borrowing_date: {
                type: Date,
                required: true,
                default: Date.now,
            },
            return_date:Date,
            fine:Number,
        }
    ],
});


userSchema.post('findOneAndDelete', async(user)=>{
    let Book = require('./books.js');
    let books = await Book.find({});
    let userId=user.id;
    for(let book of books){
        book.borrowers.pull({user:userId});
        await book.save();
    }
});

userSchema.plugin(passportLocalMongoose,{usernameField : 'emailId'});

const User = mongoose.model("User",userSchema);
module.exports = User;