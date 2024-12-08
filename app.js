if(process.env.NODE_ENV!="production"){
    require('dotenv').config();
}

const express = require('express');
const app = express();
const mongoose = require('mongoose');
const path=require('path');
var methodOverride = require('method-override');
const ejsMate = require('ejs-mate');
const ExpressError = require("./utils/ExpressError.js");
const wrapAsync = require("./utils/wrapAsync.js");
const session = require('express-session');
const MongoStore = require('connect-mongo');
const flash = require('connect-flash');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const User = require('./models/users.js');

const booksRoute = require('./router/books.js');
const usersRoute = require('./router/users.js');

const { isLoggedIn } = require('./middleware.js');

app.set('view engine','ejs');
app.set('views',path.join(__dirname,'/views'));
app.use(express.urlencoded({extended:true}));
app.use(methodOverride('_method'));
app.engine('ejs',ejsMate);
app.use(express.static(path.join(__dirname,'/public')));


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

const store = MongoStore.create({
    mongoUrl: dbUrl,
    crypto: {
      secret:process.env.SECRET,
    },
    touchAfter: 24*3600,
});
store.on("error",(err)=>{
    console.log("ERROR IN MONGO SESSION STORE :",err);
});
const sessionOptions={
    store,
    secret:process.env.SECRET,
    resave:false,
    saveUninitialized:true,
    cookie:{
        expires: Date.now() + 7*24*60*60*1000,
        maxAge: 7*24*60*60*1000,
        httpOnly: true, //to prevent cross script attacks
    },
};

app.use(session(sessionOptions));
app.use(flash());


app.use(passport.initialize());
app.use(passport.session());

passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req,res,next)=>{
    res.locals.success=req.flash("success");
    res.locals.error=req.flash("error");
    res.locals.currUser=req.user||null;
    next();
});

app.use('/allBooks',booksRoute);
app.use('/',usersRoute);
// app.use('/',adminsRoute);

app.get('/',isLoggedIn, wrapAsync((req,res)=>{
    res.render('dashboard/dashboard.ejs',{currUser:req.user});
}));

app.get('/getUser',(req,res)=>{
    try{
        let user = req.user;
        console.log(user);
        res.status(201).json(user);
    }
    catch(e){
        console.log(e);
        res.status(400).send("unauthorized");
    }
})

app.all("*",(req,res)=>{
    throw new ExpressError(400,"Page Not Found");
})

app.use((err,req,res,next)=>{
    let {statusCode=500,message="Something Went Wrong"}=err;
    res.status(statusCode).render("error.ejs",{message});
});

app.listen(3000,()=>{
    console.log('app is listening at port 3000');
});