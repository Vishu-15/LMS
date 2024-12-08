const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const User = require('./users.js');

const bookSchema = new Schema({
    title:{
        type:String,
        required:true,
    },
    author:{
        type:String,
        required:true,
    },
    genre:{
        type:String,
        required:true,
    },
    rack:{
        type:Number,
        default:0,
    },
    shelf:{
        type:Number,
        default:0,
    },
    quantity:{
        type:Number,
        required:true,
    },
    publisher:{
        type:String,
        required:true,
    },
    year:{
        type:Number,
        required:true,
    },
    isbn:{
        type:Number,
        required:true,
    },
    language:{
        type:String,
        required:true,
    },
    borrow_count:{
        type:Number,
        default:0,
    },
    image:{
        filename:String,
        url:String,
    },
    borrowers:[
        {
            user: {
                type:Schema.Types.ObjectId,
                ref:"User",
            },
            borrowing_date: {
                type: Date,
                required: true,
                default: Date.now,
            },
            return_date:Date,
            fine:Number,
        },
    ],
});

bookSchema.post('findOneAndDelete', async(book)=>{
    let users = await User.find({});
    let bookId=book.id;
    for(let user of users){
        user.borrowing_history.pull({book:bookId});
        await user.save();
    }
});

const Book = mongoose.model("Book",bookSchema);
module.exports = Book;