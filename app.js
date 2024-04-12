const express = require("express");
const app = express();
const mongoose = require("mongoose");
const Listing = require("./models/listing.js");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate= require("ejs-mate");
const session = require("express-session");
const flash = require("connect-flash");
const Review= require("./models/review.js");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user.js");

const listingRouter = require("./routes/listing.js");
const reviewRouter = require("./routes/review.js");
const userRouter = require("./routes/user.js");


const MONGO_URL = "mongodb://127.0.0.1:27017/wanderlust";

main()
.then(()=>{
    console.log("connected to DB");
})
.catch((err)=>{
    console.log(err);
});

async function main(){
    await mongoose.connect(MONGO_URL);
}

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({extended: true}));
app.use(methodOverride("_method"));
app.engine("ejs",ejsMate);
app.use(express.static(path.join(__dirname, "/public")));

const sessionOptions = {
    secret: "mysupersecretcode",
    resave: false,
    saveUninitialized: true,
    cookie:{
        expires: Date.now()+7 *24 * 60 * 60 *1000,
        maxAge: 7 * 24 * 60 *60 * 1000,
        httpOnly: true,
    },
};

app.get("/", (req,res)=>{
    res.send("Hi, I am root");
});




app.use(session(sessionOptions));
app.use(flash());


app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));


passport.serializeUser(User.serializeUser());  //------to serialize(store) users into the session--------//
passport.deserializeUser(User.deserializeUser());  //------to deserialize(remove) users into the session--------//


app.use((req, res, next)=>{
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    next();
});


//------DEMO USER-------//
// app.get("/demouser", async(req, res)=>{
//     let fakeUser = new User({
//         email: "student@gmail.com",
//         username: "delta-student"
//     });
//     let registeredUser = await User.register(fakeUser, "helloworld");
//     res.send(registeredUser);
// });



// //Index Route//
// app.get("/listings", async(req, res)=>{
//     const allListings = await Listing.find({});
//     res.render("listings/index.ejs", {allListings});
// });

// //New Route
// app.get("/listings/new",(req, res)=>{
//     res.render("listings/new.ejs");
// });

// //Show Route//
// app.get("/listings/:id", async (req, res) => {
//     let { id } = req.params;
//     const listing = await Listing.findById(id).populate("reviews");
//     res.render("listings/show.ejs", { listing });
//   });

// //Create Route//
// app.post("/listings", async(req, res, next)=>{
//     try{
//         const newListing = new Listing(req.body.listing);
//         await newListing.save();
//         res.redirect("/listings");
//     }catch(err){
//         next(err);
//     }
    
// });

// //Edit Route//
// app.get("/listings/:id/edit",async(req, res)=>{
//     let { id } = req.params;
//     const listing = await Listing.findById(id);
//     res.render("listings/edit.ejs", { listing });
// });

// //Update Route//
// app.put("/listings/:id", async(req, res)=>{
//     let { id } = req.params;
//     await Listing.findByIdAndUpdate(id, {...req.body.listing});
//     res.redirect(`/listings/${id}`);
// });


// //Delete Route
// app.delete("/listings/:id", async (req, res) => {
//     let { id } = req.params;
//     let deletedListing = await Listing.findByIdAndDelete(id);
//     console.log(deletedListing);
//     res.redirect("/listings");
//   });


app.use("/listings", listingRouter);  
// app.use("/listings/:id/reviews", reviews);
app.use("/", userRouter);



//Reviews
//Post Review Route//
app.post("/listings/:id/reviews", async(req, res)=>{
    let listing = await Listing.findById(req.params.id);
    let newReview = new Review(req.body.review);

    listing.reviews.push(newReview);

    await newReview.save();
    await listing.save();
    req.flash("success", "New Review Created");
    res.redirect(`/listings/${listing._id}`);
});

//Delete Review Route//
app.delete("/listings/:id/reviews/:reviewId", async(req, res)=>{
    let { id, reviewId } = req.params;

    await Listing.findByIdAndUpdate(id, {$pull: {reviews: reviewId}});
    await Review.findByIdAndDelete(reviewId);
    req.flash("success", "Review Deleted");
    res.redirect(`/listings/${id}`);
});




  



// app.get("/testListing",async(req, res)=>{
//     let sampleListing = new Listing({
//            title: "My New Villa",
//            description: "By the beach",
//            price: 1200,
//            location: "Calangute, Goa",
//            country: "India"
//     });
//     await sampleListing.save();
//     console.log("sample was saved");
//     res.send("successful testing");
// });

app.use((err, req, res, next)=>{
    res.send("something went wrong!");
});


app.listen(8080,()=>{
     console.log("server is listening to port 8080");
});