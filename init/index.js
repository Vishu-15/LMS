require('dotenv').config({ path: '../.env' });
const express = require('express');
const app = express();
const mongoose = require('mongoose');
const booksData = require('./booksData.js');
const Books = require('../models/books.js');

// const dbUrl = 'mongodb://127.0.0.1:27017/books';
const dbUrl = process.env.MONGO_URL;
main()
.then(()=>{
    console.log("database initailized");
})
.catch((err)=>{
    console.log(err);
})

async function main() {
    await mongoose.connect(dbUrl);
}

// let addBooks=async()=>{
//     let initBooks = await Books.insertMany(booksData);
//     console.log(initBooks);
// }

// addBooks();

// let deleteBooks= async ()=>{
//     let deletedBooks = await Books.deleteMany();
//     console.log(deletedBooks);
// }
// deleteBooks();

let updateBookData = async(req,res)=>{
    let books = booksData;
    let updatedBooks = books.map((book)=>{
        return {...book,image:{filename:"initial_image",url:book.image}};
    });
    // console.log(updatedBooks);
    await Books.insertMany(updatedBooks);
}

updateBookData();