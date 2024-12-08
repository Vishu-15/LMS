const express = require('express');
const router = express.Router({mergeParams:true});

const ExpressError = require("../utils/ExpressError.js");
const wrapAsync = require("../utils/wrapAsync.js");
const Book = require('../models/books.js');
const {validateBook, isLoggedIn} = require("../middleware.js");

const {storage} = require("../cloudConfig.js");
const multer = require('multer');
const upload = multer({storage});

// all books index
router.get('/',isLoggedIn, wrapAsync(async(req,res)=>{
    let bookName = req.query.book || ""; 
    let allBooks;

    if (bookName === "") {
        allBooks = await Book.find({}).sort({title:1});
    } else {
        allBooks = await Book.find({ title: new RegExp(`^${bookName}`, 'i') });
    }
    res.render('books/showAllBooks.ejs',{allBooks});
}));

// add new book to db
router.post('/',isLoggedIn, upload.single('book[image]'), validateBook, wrapAsync(async(req,res)=>{
    let url = req.file.path;
    let filename = req.file.filename;

    let newBook = new Book(req.body.book);
    newBook.image={filename,url};
    console.log(newBook);
    await newBook.save();
    req.flash("success","New Book added Successfully!");

    res.redirect("/allBooks");
}));

// take new book details 
router.get('/addBook', 
    isLoggedIn,
    wrapAsync(async(req,res)=>{
    res.render('books/addBook.ejs');
}));

// show each book 
router.get('/:id',isLoggedIn, wrapAsync(async(req,res)=>{
    let id = req.params.id;
    let currBook = await Book.findById(id).populate("borrowers.user");
    if(!currBook){
        req.flash("error","Book Not Found");
        res.redirect('/allBooks');
    }
    res.render("books/showBookDetails.ejs",{currBook});
}));

// update book form 
router.get('/:id/updateBook', 
    isLoggedIn,
    wrapAsync(async(req,res)=>{
    let id = req.params.id;
    let currBook = await Book.findById(id);
    if(!currBook){
        req.flash("error","Book Not Found");
        res.redirect('/allBooks');
    }
    res.render("books/updateBook.ejs",{currBook});
}));

// update book details
router.put('/:id',isLoggedIn, upload.single('book[image]'), validateBook , wrapAsync(async(req,res)=>{
    let id = req.params.id;
    let updatedBook = await Book.findByIdAndUpdate(id,req.body.book);

    if(typeof req.file !=="undefined"){
        let url = req.file.path;
        let filename = req.file.filename;
        updatedBook.image = {filename,url};
        await updatedBook.save();
    }

    req.flash("success","Book updated Successfully!");
    res.redirect(`/allBooks/${id}`);
}));

// delete each book
router.delete('/:id', 
    isLoggedIn,
    wrapAsync(async(req,res)=>{
    let id = req.params.id;
    let deletedBook = await Book.findByIdAndDelete(id);
    req.flash("success","Book deleted Successfully!");
    res.redirect(`/allBooks`);
}));

module.exports=router;