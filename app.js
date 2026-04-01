const express = require("express");
const app = express();
const mongoose = require("mongoose");
const Listing = require("./models/listing");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const wrapasync = require("./utils/wrapasync");
const expresserror = require("./utils/expresserror");
const { listingSchema } = require("./schema.js");



const mongo_url = "mongodb://127.0.0.1:27017/wanderlust";
main()
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("Failed to connect to MongoDB", err));
async function main() {
  await mongoose.connect(mongo_url);
}

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.engine("ejs", ejsMate);
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.send("Hi I am root!");
});

const validateListing = (req, res, next) => {
    let {error} = listingSchema.validate(req.body);
    if(error){
        let errmsg = error.details.map(el => el.message).join(",");
        throw new expresserror(errmsg,400);
    }   
    else{
        next();
    }
};

//index route
app.get("/listings", wrapasync(async (req, res) => {
    let listings = await Listing.find({});
    res.render("listings/index.ejs",{listings});
})) ;

//New route
app.get("/listings/new", (req, res) => {
    res.render("listings/new.ejs");
});

//create route
app.post("/listings", validateListing, wrapasync(async (req, res,next) => {
    await new Listing(req.body.listing).save();
    res.redirect("/listings");
    
}));

//edit route
app.get("/listings/:id/edit", wrapasync(async (req, res) => {
    let listing = await Listing.findById(req.params.id);
    res.render("listings/edit.ejs",{listing});
}));

//update route
app.put("/listings/:id",validateListing, wrapasync(async (req, res) => {
    await Listing.findByIdAndUpdate(req.params.id, req.body.listing);
    res.redirect(`/listings/${req.params.id}`);
}));

//show route
app.get("/listings/:id", wrapasync(async (req, res) => {
    let listing = await Listing.findById(req.params.id);
    res.render("listings/show.ejs",{listing});
}));

//delete route
app.delete("/listings/:id", wrapasync(async (req, res) => {
    await Listing.findByIdAndDelete(req.params.id);
    res.redirect("/listings");
})) ;



// app.get("/testlisting",  async (req, res) => {
//     let sampleListing = new Listing({
//         title: "Cozy Apartment in the Heart of the City",
//         description: "A charming and cozy apartment located in the heart of the city, perfect for travelers looking to explore the vibrant culture and attractions. This listing features a comfortable living space, modern amenities, and a convenient location close to popular landmarks, restaurants, and public transportation.",
//         image: "",
//         price: 1500,
//         location: "manali",
//         country: "India"
//     });
//     await sampleListing.save();
//     console.log("Sample listing saved to the database");
//     res.send("Sample listing created and saved to the database!");
// });

app.use((req, res, next) => {
    next(new expresserror("Page Not Found", 404));
});


app.use((err, req, res, next) => {
    let{message="Something went wrong!",statuscode=500} = err;
    res.render("error.ejs",{message,statuscode});
    // res.status(statuscode).send(message);
});


app.listen(8080, () => {
  console.log("Server is running on port 8080");
});
