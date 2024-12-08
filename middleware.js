const ExpressError = require("./utils/ExpressError.js");
const {bookSchema, userSchema} = require("./schema.js");

module.exports.validateBook = (req,res,next)=>{
    let {error} = bookSchema.validate(req.body);
    if(error){
        throw new ExpressError(400,error.message);
    }
    else{
        next();
    }
}

module.exports.validateUser = (req,res,next)=>{
    let {error} = userSchema.validate(req.body);
    if(error){
        throw new ExpressError(400,error.message);
    }
    else{
        next();
    }
}

module.exports.isLoggedIn = (req,res,next)=>{
    if(!req.isAuthenticated()){
        req.session.redirectUrl = req.originalUrl;
        req.flash("error","Login to access the Library");
        return res.redirect("/login");
    }
    else{
        next();
    }
}

module.exports.saveRedirectUrl = (req,res,next)=>{
    if(req.session.redirectUrl){
        res.locals.redirectUrl=req.session.redirectUrl;
        delete req.session.redirectUrl;  // Clear the redirectUrl from session
    }
    next();
}