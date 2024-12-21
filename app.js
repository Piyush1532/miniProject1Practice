const express = require("express");
const app = express();
const userModel = require("./models/user");
const postModel = require("./models/post");
const cookieParser = require("cookie-parser");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
 const multerupload=require("./utils/multer")
const path=require("path");
const { log } = require("console");



app.set("view engine", "ejs");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname,"public")))

app.get("/", (req, res) => {
  res.render("index");
});

app.get("/login", (req, res) => {
  res.render("login");
});





// profile route start-----------------------
app.get("/profile",isloggedIn,async (req, res) => {
  let user=await userModel.findOne({email:req.user.email}).populate("posts")
  
  res.render("profile",{user});
});

// profile route end-----------------------

//profile pic upload route start-------------

app.get("/profile/upload",(req,res)=>{
res.render("picupload")
})



app.post("/upload",isloggedIn,multerupload.single("image"),async (req,res)=>{
let user=await  userModel.findOne({email:req.user.email})
user.profilepic=req.file.filename
await user.save()
res.redirect("/profile")
})

//profile pic upload route end-------------

//like feature start------------------------
app.get("/like/:id",isloggedIn,async (req, res) => {
  let postLike=await postModel.findOne({_id:req.params.id}).populate("user")
if(postLike.likes.indexOf(req.user.userid)=== -1){

  postLike.likes.push(req.user.userid)
}
else{
  postLike.likes.splice(postLike.likes.indexOf(req.user.userid),1)
}
  await postLike.save()


  res.redirect("/profile");
});

//like feature end------------------------


//edit feature start-------------------------
app.get("/edit/:id",isloggedIn,async (req, res) => {
  let post=await postModel.findOne({_id:req.params.id}).populate("user")

  res.render("edit",{post});
});
//edit feature end-------------------------

//update feature start----------------------
app.post("/update/:id",isloggedIn,async (req, res) => {
  let post=await postModel.findOneAndUpdate({_id:req.params.id},{content:req.body.content}) 
  res.redirect("/profile");
});
//update feature end----------------------










//register user start---------------------------

app.post("/register", async (req, res) => {
  let { username, name, age, email, password } = req.body;
  let user = await userModel.findOne({ email });

  if (user) return res.status(500).send("User Already registered");

  bcrypt.genSalt(10, (err, salt) => {
    bcrypt.hash(password, salt, async (err, hash) => {
      let user = await userModel.create({
        username,
        name,
        age,
        email,
        password: hash,
      });
      let token = jwt.sign({ email: email, userid: user._id }, "chupre");
      res.cookie("myCookie", token);
      res.send("User registered");
    });
  });
});

//register user end---------------------------

//login user start----------------------------

app.post("/login", async (req, res) => {
  let { email, password } = req.body;
  let user = await userModel.findOne({ email });

  if (!user) return res.status(500).send("Something Went wrong!");

  bcrypt.compare(password, user.password, (err, result) => {
    if (result) {
      let token = jwt.sign({ email: email, userid: user._id }, "chupre");
      res.cookie("myCookie", token);
      res.status(200).redirect("profile");
    } else res.redirect("/login");
  });
});


//login user end----------------------------

//post content start --------------
app.post("/post",isloggedIn,async (req, res) => {
     let {content}=req.body
  
    let user=await userModel.findOne({email:req.user.email})

    let post=await postModel.create({
        user:user._id,
        content
    })

    user.posts.push(post._id)
    await user.save()
    res.redirect("/profile")
    });

 
//post content end --------------




//logout route start ---------------------

app.get("/logout", (req, res) => {
  res.cookie("myCookie", "");
  res.redirect("/login");
});

//logout route end ---------------------

//middleware func for protected routes------------

function isloggedIn(req,res,next) {
 if(req.cookies.myCookie ==="")res.redirect("/login")
    else{
let data=  jwt.verify(req.cookies.myCookie,"chupre")
req.user=data
next()
}
}

//=-----------------------------

app.listen(3000, () => {
  console.log(`Server is Listening on 3000`);
});


