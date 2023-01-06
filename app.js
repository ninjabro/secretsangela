//jshint esversion:6
require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require ("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');

// const encrypt = require("mongoose-encryption");

// tried bcrypt for salting and hasing
// const bcrypt = require("bcrypt");
// const saltRounds = 10;

// tried md5 for hasing 
// const md5 = require("md5");




mongoose.set('strictQuery', false);

const app = express();

const port = 3000;

app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));

app.use(session({
  secret:'ourlittlesecret',
  resave:true,
  saveUninitialized:true}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect('mongodb://127.0.0.1:27017/userDb',{useNewUrlParser:true});

// mongoose schema created 
const Schema = mongoose.Schema;

const userSchema = new Schema ({
  email: String,
  password: String,
  googleId: String,
  secret: String
});

// local passport setup
userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

// important to put mongoose userschema plugin above the model
// using hashing md5 so its commmented
// const secret =(process.env.SECRET);
// userSchema.plugin(encrypt, { secret: secret,encryptedFields: ['password']});

// created mongoose model to use schema
const User = new mongoose.model("User", userSchema);

// simplified passport/passport-local configuration
passport.use(User.createStrategy());

passport.serializeUser(function(user, cb) {
  process.nextTick(function() {
    return cb(null, {
      id: user.id,
      username: user.username,
      picture: user.picture
    });
  });
});

passport.deserializeUser(function(user, cb) {
  process.nextTick(function() {
    return cb(null, user);
  });
});

passport.use(new GoogleStrategy({
  clientID: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  callbackURL: "http://localhost:3000/auth/google/secrets"
},
function(accessToken, refreshToken, profile, cb) {
  console.log(profile);

  User.findOrCreate({ googleId: profile.id }, function (err, user) {
    return cb(err, user);
  });
}
));




app.get("/", (req,res)=>{
    res.render("home");
});

app.get('/auth/google',
passport.authenticate('google', { scope: ['profile'] }));

app.get('/auth/google/secrets', 
  passport.authenticate('google', { failureRedirect: "/login" }),
  function(req, res) {
   res.redirect("/secrets")
  });

app.get("/login", (req, res) => {
  res.render("login");
});
app.get("/register", (req, res) => {
  res.render("register");
});

app.get("/secrets", function(req,res){

  // if (req.isAuthenticated()){
  //   res.render("secrets");
  // } else {
  //   res.redirect("/login")
  // }
 
  User.find({"secret":{$ne:null}}, function(err, foundusers){
    if(err){
      console.log(err);
    } else {
      if(foundusers){
        res.render("secrets", {usersWithSecrets: foundusers});
      }
    }
  });
  
});



app.get("/logout", function(req,res){
  req.logout(function(err)
  {
    if(err){
      console.log(err);
    } else{
     res.redirect("/");
    }
  });
});

app.get("/submit", function(req,res){
        res.render("submit");
});

app.post("/register", (req, res) => {
 
      User.register({username: req.body.username},req.body.password,function(err,user){
        if(err){
          console.log(err);
          res.render("/register")
        } else {
          passport.authenticate("local")(req,res, function(){
            res.redirect("/secrets")
          })
        }

      } )
 
});

app.post("/submit", function(req, res){
   const submittedSecret = req.body.secret;
   console.log(req.user);

   User.findById(req.user.id, function(err, foundUser){
    if (err){
      console.log(err);
    } else {
      if(foundUser){
        foundUser.secret = submittedSecret;
        foundUser.save(function(){
          res.redirect("/secrets");
        })
      }
    }
   });
});

app.post("/login", (req, res)=>{

  const user =new User({
    username: req.body.username,
    passport:req.body.password
  })
  req.login(user, function(err){
    if(err){
      console.log(err);
    } else {
      passport.authenticate("local")(req,res, function(){
        res.redirect("/secrets");
      });
    }
  });
 
});

app.listen(port, () => {
  console.log(`server on ${port}`);
});


