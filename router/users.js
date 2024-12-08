const express = require('express');
const router = express.Router({mergeParams:true});

const ExpressError = require("../utils/ExpressError.js");
const wrapAsync = require("../utils/wrapAsync.js");
const User = require('../models/users.js');
const Book = require('../models/books.js');
const passport = require("passport");
const { isLoggedIn, validateUser, saveRedirectUrl } = require('../middleware.js');

// all users page
router.get('/allUsers',isLoggedIn, wrapAsync(async(req,res)=>{
    let username = req.query.username || ""; 
    let users;

    if (username === "") {
        users = await User.find({});
    } else {
        users = await User.find({ name: new RegExp(`^${username}`, 'i') }); // Case-insensitive search for users starting with the username
    }

    res.render('users/allUsers.ejs', { users });
}));

// add details 
// router.get('/addDetails',async(req,res)=>{
//     let users = await User.find({});

//     for(let user of users){
//         let updatedUser = {...user.toObject(),gender:"male",dob:new Date("2000-01-01")}

//         await User.findByIdAndUpdate(user._id,updatedUser);
//     }

//     let allUsers = await User.find({});
//     res.send(allUsers);
// });

// add new user to db
router.post('/allUsers',isLoggedIn, wrapAsync(async(req,res)=>{
    try{
        let {password,role} = req.body;
        let newUser = new User(req.body.user);
        newUser.role=role;
        console.log(newUser);
        const registeredUser = await User.register(newUser,password);
        console.log(registeredUser);

        req.flash("success","New User Added Successfully!");
        res.redirect("/allUsers");
    }
    catch(e){
        req.flash("error",e.message);
        res.redirect("/allUsers/addUser");
    }
}));

// add new user form
router.get('/allUsers/addUser',isLoggedIn, wrapAsync(async(req,res)=>{
    res.render('users/newUser.ejs');
}));

// rendering login page 
router.get("/login", wrapAsync(async(req,res)=>{
    console.log("login page");
    res.render("users/login.ejs");
}));

// authenticating logged users details 
router.post("/login",
    passport.authenticate("local",{
        failureRedirect:"/login",
        failureFlash:true,
    }),
    wrapAsync(async(req,res)=>{
        req.flash(
            'success',
            req.user.role == 'admin'
                ? 'Admin Logged In, Welcome Back to LMS'
                : 'User Logged In, Welcome Back to LMS'
        );
        return res.redirect("/");
}));

// logout user 
router.get("/logout",isLoggedIn, wrapAsync(async(req,res)=>{
    req.logout((err)=>{
        if(err){
            return next(err);
        }
        req.flash("success","Successfully Logged Out!");
        return res.redirect("/login");
    });
}));

// show each user details
router.get('/allUsers/:userId',isLoggedIn, wrapAsync(async(req,res)=>{
    let userId = req.params.userId;
    let user = await User.findById(userId).populate("borrowing_history.book");
    // console.log(user);
    if(!user){
        throw new ExpressError(404,"User does not Exists !");
    }
    res.render('users/showUser.ejs',{user});
}));

// delete borrow book history

// router.get('/:userId/deleteBorrowBook', wrapAsync(async(req,res)=>{
//     let userId = req.params.userId;
//     let user = await User.findById(userId);

//     let {bookId} = req.query;
//     // let book = await Book.findById(bookId);
//     user.borrowing_history.pull({book:bookId});

//     await user.save();
//     res.redirect(`/allUsers/${userId}`);

// }));

// edit each user 
router.get('/allUsers/:userId/editUser',isLoggedIn, wrapAsync(async(req,res)=>{
    let userId = req.params.userId;
    let currUser = await User.findById(userId);
    res.render('users/editUser.ejs',{currUser});
}));

// update each user
router.put('/allUsers/:userId',isLoggedIn, validateUser, wrapAsync(async(req,res)=>{
    let userId = req.params.userId;
    let updatedUser = await User.findByIdAndUpdate(userId,req.body.user);
    // console.log(updatedUser);

    req.flash("success","User Updated Successfully!");
    res.redirect('/allUsers');
}));

// delete each user
router.delete('/allUsers/:userId',isLoggedIn, wrapAsync(async(req,res)=>{
    let userId = req.params.userId;
    let deletedUser = await User.findByIdAndDelete(userId);

    req.flash("success","User deleted Successfully!");
    console.log(deletedUser);
    res.redirect('/allUsers');
}));

//book returned
router.get('/allUsers/:userId/bookReturned',isLoggedIn, wrapAsync(async(req,res)=>{
    let {userId} = req.params;
    let user = await User.findById(userId);
    let idx = req.query.idx;
    
    user.borrowing_history[idx].return_date=Date.now();
    let delay = Math.floor((((user.borrowing_history[idx].return_date-user.borrowing_history[idx].borrowing_date)/1000)/3600)/24);
    let fine = delay>0?delay*20:0;
    user.borrowing_history[idx].fine = fine;
    user.fines+=fine;
    user.curr_borrows-=1;
    // console.log(user);

    let book = await Book.findById(user.borrowing_history[idx].book);
    // console.log(user.borrowing_history[idx].borrowing_date.getTime());
    let borrow_user = book.borrowers.find((borrower)=>{
        return (borrower.user == userId)&&(Math.abs(user.borrowing_history[idx].borrowing_date.getTime()-borrower.borrowing_date.getTime())<1000)
    });
    // console.log(borrow_user);
    borrow_user.return_date = Date.now(); 
    book.quantity+=1;

    await user.save();
    await book.save();
    res.redirect(`/allUsers/${userId}`);
}));


// LEND BOOK

//lend Book page
router.get('/allUsers/:userId/lendBook',isLoggedIn, wrapAsync(async(req,res)=>{
    let userId = req.params.userId;
    let user = await User.findById(userId);
    if(user.curr_borrows==3){
        req.flash("error","User cannot borrow more than 3 Books at a time !!");
        return res.redirect(`/allUsers/${userId}`);
    }

    let bookName = req.query.book || ""; 
    let books;

    if (bookName === "") {
        books = await Book.find({});
    } else {
        books = await Book.find({ title: new RegExp(`^${bookName}`, 'i') });
    }
    res.render('books/lendBook.ejs', {books,user});
}));

// assign book to user
router.get('/allUsers/:userId/lendBook/:id',isLoggedIn, wrapAsync(async(req,res)=>{
    let id = req.params.id;
    let userId = req.params.userId;

    let book = await Book.findById(id);
    let user = await User.findById(userId);
    // console.log(book);
    if(!book.quantity){
        req.flash("error","Book Unavailable At The Moment!");
        return res.redirect(`/allUsers/${userId}/lendBook`);
    }

    let idx=user.borrowing_history.length;
    user.borrowing_history.push({idx:idx,book:book,borrowing_date:Date.now()});
    user.borrows+=1;
    user.curr_borrows+=1;
    book.borrowers.push({user:user,borrowing_date:Date.now()});
    book.quantity-=1;
    book.borrow_count+=1;

    await user.save();
    await book.save();

    // console.log(user);
    req.flash("success","Book Issued Successfully!");
    res.redirect(`/allUsers/${userId}`);
}));



module.exports=router;