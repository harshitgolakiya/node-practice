var express = require('express');
var router = express.Router();
const usermodel = require("./users");
const postmodel = require("./post");
const passport = require('passport');
const upload = require("./multer");
const localstrategy = require("passport-local")

passport.use(new localstrategy(usermodel.authenticate()));
/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { nav: false });
});
router.get('/register',(req,res,next)=>{
  res.render("register",{ nav: false })
})
router.post('/register',(req,res,next)=>{
  const data = new usermodel({
    username: req.body.username,
    name: req.body.fullname,
    email: req.body.email,
    contect: req.body.contect
  })
  usermodel.register(data,req.body.password).then(()=>{
    passport.authenticate("local")(req,res,()=>{
      res.redirect("/profile");
    });
  })
})

router.post('/login', passport.authenticate("local",{
  failureRedirect:"/login",
  successRedirect:"/profile"
}) ,(req,res,next)=>{
  
 
})

router.get('/logout', function(req, res, next){
  req.logout(function(err) {
    if (err) { return next(err); }
    res.redirect('/login');
  });
});
router.get('/login',(req,res,next)=>{
  res.render("login",{ nav: false })
})

router.get('/profile',isLoggedIn,async (req,res,next)=>{
  const user =  await usermodel.findOne({username: req.session.passport.user}).populate("posts");
  res.render("profile",{user, nav:true})
})
router.get('/show/posts', isLoggedIn,async (req,res,next)=> {
  const user =  await usermodel.findOne({username: req.session.passport.user}).populate("posts");
  res.render("show",{user, nav:true})
})
router.get('/feed', isLoggedIn,async (req,res,next)=> {
  const user =  await usermodel.findOne({username: req.session.passport.user}).populate("posts");
  const posts = await postmodel.find().populate('user')
  res.render("feed",{posts, nav:true})
})
router.get('/add',isLoggedIn,async (req,res,next)=>{
  const user =  await usermodel.findOne({username: req.session.passport.user});
  res.render("add",{user, nav:true})
})
router.post('/fileupload',isLoggedIn, upload.single("image"),async (req,res,next)=>{
 const user =  await usermodel.findOne({username: req.session.passport.user});
 user.profileImage = req.file.filename;
 await user.save();
 res.redirect('profile')
})

router.post('/createpost',isLoggedIn, upload.single("postimage"),async (req,res,next)=>{
  const user =  await usermodel.findOne({username: req.session.passport.user});
  const post = await postmodel.create({
    user: user._id,
    title: req.body.posttitle,
    description: req.body.postdescription,
    image:req.file.filename
  });

  user.posts.push(post._id);
  await user.save();
  res.redirect('/profile');
 })

function isLoggedIn(req,res,next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect("/")
}

module.exports = router;
