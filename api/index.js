const express = require("express");
const app = express();
var cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const bcryptSalt = bcrypt.genSaltSync(10); //can't do genSalt() as it is an async function so it returns a promise
const User = require("./models/User");
const cookieParser = require("cookie-parser");
const imageDownloader = require("image-downloader");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const Place = require("./models/Place");
const Booking = require("./models/Booking");
const { upload } = require("./middlewares/multer.middleware.js");
const { uploadBufferToCloudinary } = require("./utils/cloudinary.js");
const cloudinary = require("cloudinary").v2;
{
  /**middlewares */
}
app.use(express.json());
app.use(cookieParser());
app.use("/uploads", express.static(__dirname + "/uploads"));
app.use(
  cors({
    credentials: true,
    origin: "http://localhost:5173",
  })
);

{
  /**database */
}
mongoose
  .connect(process.env.MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error(err));

{
  /**routes */
}
function getUserDataFromToken(req) {
  return new Promise((resolve, reject) => {
    const token = req.cookies.token;
    const secret = process.env.JWT_SECRET;
    //console.log("Token:", token);
    //console.log("Secret:", secret);

    jwt.verify(token, secret, {}, (err, userData) => {
      if (err) {
        console.error("JWT Verification Error:", err);
        reject(err);
      } else {
        resolve(userData);
      }
    });
  });
}

app.get("/api/test", (req, res) => {
  res.json("test ok");
});

app.post("/api/register", async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const userDoc = await User.create({
      name,
      email,
      password: bcrypt.hashSync(password, bcryptSalt),
    });
    res.json(userDoc);
  } catch (error) {
    res.status(422).json(error);
  }
});

app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;
  const userDoc = await User.findOne({ email });
  if (userDoc) {
    const passOk = bcrypt.compareSync(password, userDoc.password);
    if (passOk) {
      const secret = process.env.JWT_SECRET;
      jwt.sign(
        { email: userDoc.email, id: userDoc.id },
        secret,
        {},
        (err, token) => {
          if (err) throw err;
          res
            .cookie("token", token, { secure: true, sameSite: "none" })
            .json(userDoc);
        }
      );
    } else {
      res.status(422).json({ msg: "password invalid" });
    }
  } else {
    res.status(422).json({ msg: "email not found" });
  }
});

app.get("/api/profile", (req, res) => {
  const token = req.cookies.token;
  const secret = process.env.JWT_SECRET;
  //console.log("Token:", token);
  //console.log("Secret:", secret);

  if (token) {
    jwt.verify(token, secret, {}, async (err, userData) => {
      if (err) {
        console.error("JWT Verification Error:", err);
        res.status(403).json({ msg: "Invalid token" });
      } else {
        const { name, email, _id } = await User.findById(userData.id);
        res.json({ name, email, _id });
      }
    });
  } else {
    res.json(null);
  }
});

app.post("/api/logout", (req, res) => {
  res.cookie("token", "").json(true);
});

app.post("/api/upload-by-link", async (req, res) => {
  try {
    const { link } = req.body;
    const result = await cloudinary.uploader.upload(link, {
      resource_type: "auto",
    });
    res.json({ path: result.secure_url });
  } catch (error) {
    console.error("Error uploading to Cloudinary:", error);
    res.status(500).json({ error: "Failed to upload image by link" });
  }
});

app.post("/api/upload", upload.array("photos", 100), async (req, res) => {
  try {
    const uploadedFiles = [];
    for (const file of req.files) {
      const result = await uploadBufferToCloudinary(file.buffer);
      uploadedFiles.push(result.secure_url);
    }
    res.json(uploadedFiles);
  } catch (error) {
    console.error("Error uploading to Cloudinary:", error);
    res.status(500).json({ error: "Failed to upload files" });
  }
});
app.post("/api/places", (req, res) => {
  const { token } = req.cookies;
  const {
    title,
    address,
    addedPhotos,
    description,
    perks,
    extraInfo,
    checkIn,
    checkOut,
    maxGuests,
    price,
  } = req.body;
  const secret = process.env.JWT_SECRET;
  jwt.verify(token, secret, {}, async (err, userData) => {
    if (err) throw err;
    const placeDoc = await Place.create({
      owner: userData.id,
      title,
      address,
      photos: addedPhotos,
      description,
      perks,
      extraInfo,
      checkIn,
      checkOut,
      maxGuests,
      price,
    });
    res.json(placeDoc);
  });
});

app.get("/api/user-places", (req, res) => {
  const { token } = req.cookies;
  const secret = process.env.JWT_SECRET;
  jwt.verify(token, secret, {}, async (err, userData) => {
    if (err) throw err;
    const { id } = userData;
    res.json(await Place.find({ owner: id }));
  });
});

app.get("/api/places/:id", async (req, res) => {
  const { id } = req.params;
  res.json(await Place.findById(id));
});

app.put("/api/places", async (req, res) => {
  const { token } = req.cookies;
  const {
    id,
    title,
    address,
    addedPhotos,
    description,
    perks,
    extraInfo,
    checkIn,
    checkOut,
    maxGuests,
    price,
  } = req.body;
  const secret = process.env.JWT_SECRET;
  jwt.verify(token, secret, {}, async (err, userData) => {
    if (err) throw err;
    const placeDoc = await Place.findById(id);
    if (userData.id === placeDoc.owner.toString()) {
      placeDoc.set({
        title,
        address,
        photos: addedPhotos,
        description,
        perks,
        extraInfo,
        checkIn,
        checkOut,
        maxGuests,
        price,
      });
      await placeDoc.save();
      res.json("ok");
    }
  });
});

app.get("/api/places", async (req, res) => {
  res.json(await Place.find());
});

app.post("/api/bookings", async (req, res) => {
  const userData = await getUserDataFromToken(req);
  const { place, checkIn, checkOut, numberOfGuests, name, phone, price } =
    req.body;
  Booking.create({
    place,
    checkIn,
    checkOut,
    numberOfGuests,
    name,
    phone,
    price,
    user: userData.id,
  })
    .then((doc) => {
      res.json(doc);
    })
    .catch((err) => {
      throw err;
    });
});

app.get("/api/bookings", async (req, res) => {
  const userData = await getUserDataFromToken(req);
  res.json(await Booking.find({ user: userData.id }).populate("place"));
});

app.listen(4000, () => console.log(`Server running on port 4000`));
