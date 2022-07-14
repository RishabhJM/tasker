require("dotenv").config()
const express = require("express")
const ejs = require("ejs")
const bodyParser = require("body-parser")
const mongoose = require("mongoose")
const session = require("express-session")
const passport = require("passport")
const passportLocalMongoose = require("passport-local-mongoose")
const _ = require("lodash")



const app = express()
app.set("view engine", "ejs")
app.use(express.static("public"))
app.use(bodyParser.urlencoded({
  extended: true
}))
//--------------------------------User's-item-Schema---------------------------
const itemsSchema = new mongoose.Schema({
  item:String,
  userId:String
})

const Item = mongoose.model("items", itemsSchema)

const item_1 = new Item ({
  item: "Welcome To Tasker."
})

const item_2 = new Item ({
  item:"Add A New Task"
})

const item_3 = new Item ({
  item:"Hit The Checkbox To Delete"
})

const defaultItems = [item_1, item_2, item_3]

//--------------------------------User's-list-Schema---------------------------

const listSchema = new mongoose.Schema({
  user:String,
  userId:String,
  listName: String,
  items:[itemsSchema]
})



const List = new mongoose.model("List", listSchema)
//---------------------------unremovable-List--------------------------------------
const defaultListSchema = new mongoose.Schema({
  userId:String,
  listName:String,
  items:[itemsSchema]
})

const DefaultList = mongoose.model("DefaultList", defaultListSchema)
//------------------------------------------------------------------------------
app.use(session({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: false,

}))

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect({process.env.DB_LINK);

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  lists:[String]
})

userSchema.plugin(passportLocalMongoose)

const User = mongoose.model("User", userSchema)

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
//------------------------------------------------------------------------------
app.get("/", (req, res) => {
  res.render("home")
})

app.get("/Today", (req, res) => {
if(req.isAuthenticated){

List.findOne({listName:"Today", userId:req.user._id}, (err, foundList) => {
  if(err){
    console.log(err)
  } else {
  if(!foundList){
    foundList =  new List ({
      user:req.user.name,
      userId:req.user._id,
      listName: "Today",
      items:defaultItems
    })
    foundList.save((err) =>{
      if(err){
        console.log(err)
      } else {
        res.render("list", {
          user:req.user.name,
          title:foundList.listName,
          items:foundList.items,
          listId:foundList._id
        })
      }
    })
  } else {
    res.render("list", {
      user:req.user.name,
      title:foundList.listName,
      items:foundList.items,
      listId:foundList._id
    })
  }
  }
})
} else {
  res.redirect("/login")
}
})

app.post("/Today", (req, res) => {
const submittedItem = _.capitalize(req.body.item)
const list_Id = req.body.hidden
const hiddenList = req.body.hiddenList
console.log(list_Id)

const newItem = new Item ({
  item:submittedItem,
  userId:req.user._id
})

newItem.save()
List.findByIdAndUpdate({_id:list_Id},{$push:{items:newItem}}, (err) =>{
  if(err){
    console.log(err)
  } else {
    if(hiddenList === "Today"){
      res.redirect("/Today")
    } else {
      res.redirect("/lists/" + hiddenList)
    }
  }
})


})

app.post("/delete", (req, res) => {
  const checkedBox = req.body.checkedBox
  const list_Id = req.body.checkBox_ListId
  const hiddenList = req.body.hiddenList
console.log(checkedBox)

List.findByIdAndUpdate({_id:list_Id},{$pull:{items:{_id:checkedBox}}}, (err) =>{
  if(err){
    console.log(Err)
  } else {
    console.log("deleted Item")
    if(hiddenList === "Today"){
      res.redirect("/Today")
    } else {
      res.redirect("/lists/" + hiddenList)
    }
  }
})
})
//-------------------------------User-Generated-Lists---------------------------
app.get("/makeList", (req, res) => {

  List.find({userId:req.user._id}, (err, foundLists) => {
    if(err){
      console.log(err)
    } else {
      res.render("userLists", {
        user:req.user.name,
        listName:foundLists
      })
    }
  })
})

app.post("/makeList", (req, res) => {
  const listNameInput = _.capitalize(req.body.listNameInput)

  List.findOne({listName:listNameInput, userId:req.user._id}, (err, foundList) => {
    if(err){
      console.log(err)
    } else{
      if(!foundList){
        foundList = new List ({
          user:req.user.name,
          userId:req.user._id,
          listName:listNameInput,
          items:defaultItems
        })
        foundList.save((err) =>{
          if(err){
            console.log(err)
          } else {
            res.redirect("/makeList")
          }
        })
      }else {
        console.log("list already found")
      }
    }
  })

})
//--------------------User-generated-dynamic-routes-------------------------------------

app.get("/lists/:customList", (req, res) => {

const generatedList = req.params.customList

  List.findOne({listName:generatedList, userId:req.user._id}, (err, foundList) =>{
    if(err){
      console.log(err)
    } else {
      if(foundList) {
      res.render("list", {
        user:req.user.name,
        title:generatedList,
        items:foundList.items,
        listId:foundList._id
      })

    } else {
      res.redirect("/makeList")
    }
    }
  })
})

app.post("/delete/list", (req, res) =>{
const listBox = req.body.listBox

List.findByIdAndDelete({_id:listBox},(err) =>{
  if(err){
    console.log(err)
  } else {
    res.redirect("/makeList")
  }
})

})

//--------------------Authentication-Routes-------------------------------------
app.get("/login", (req, res) => {
  res.render("login")
})

app.post('/login', passport.authenticate('local', {
  failureRedirect: '/login'
}), (req, res) => {
  res.redirect("/Today");

})

app.get("/register", (req, res) => {
  res.render("register")
})

app.post("/register", (req, res) => {
  User.register(({
      username: req.body.username
    }),
    req.body.password, (err, account) => {
      if (err) {
        return res.render('register', {
          error: err.message
        });
      } else {
        passport.authenticate('local')(req, res, () => {
          req.session.save((err) => {
            if (err) {
              console.log(err);
            }
            User.findOne({
              username: req.body.username
            }, (err, foundUser) => {
              if (err) {
                console.log(err)
              } else {
                if (foundUser) {
                  foundUser.name = req.body.name
                  foundUser.save(function(err) {
                    if (err) {
                      console.log(err)
                    } else {
                      res.redirect('/Today');
                    }
                  })

                }
              }
            })
          });
        });
      };

    })
});

app.get("/logout", (req, res) => {

  req.logOut()
  res.redirect("/login")
})
//------------------------------------------------------------------------------
app.listen(3000, () => {
  console.log("Your Server Is Up And Running")
})
