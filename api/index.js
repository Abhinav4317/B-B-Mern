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
const { uploadOnCloudinary } = require("./utils/cloudinary");
const { upload } = require("./middlewares/multer.middleware");
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

app.get("/test", (req, res) => {
  res.json("test ok");
});

app.post("/register", async (req, res) => {
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

app.post("/login", async (req, res) => {
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

app.get("/profile", (req, res) => {
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

app.post("/logout", (req, res) => {
  res.cookie("token", "").json(true);
});

app.post("/upload-by-link", async (req, res) => {
  const { link } = req.body;
  const newName = "photo" + Date.now() + ".jpg";
  const localFilePath = path.join(__dirname, "uploads", newName);

  try {
    await imageDownloader.image({
      url: link,
      dest: localFilePath,
    });

    const response = await uploadOnCloudinary(localFilePath);
    if (response) {
      res.json({ url: response.url });
    } else {
      res.status(500).json({ error: "Failed to upload to Cloudinary" });
    }
  } catch (error) {
    console.error("Error downloading or uploading image:", error);
    res.status(500).json({ error: "Failed to process image" });
  } finally {
    // Clean up the local file if it exists
    if (fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath);
    }
  }
});

app.post("/upload", upload.array("photos", 100), async (req, res) => {
  console.log(req.files);
  const uploadedFiles = [];
  for (let i = 0; i < req.files.length; i++) {
    const { path } = req.files[i];
    try {
      const response = await uploadOnCloudinary(path);
      if (response) {
        uploadedFiles.push(response.url);
      } else {
        res.status(500).json({ error: "Failed to upload file" });
        return;
      }
    } catch (error) {
      console.error("Error during file upload:", error);
      res.status(500).json({ error: "Failed to upload file" });
      return;
    }
  }
  res.json(uploadedFiles);
});

app.post("/places", (req, res) => {
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

app.get("/user-places", (req, res) => {
  const { token } = req.cookies;
  const secret = process.env.JWT_SECRET;
  jwt.verify(token, secret, {}, async (err, userData) => {
    if (err) throw err;
    const { id } = userData;
    res.json(await Place.find({ owner: id }));
  });
});

app.get("/places/:id", async (req, res) => {
  const { id } = req.params;
  res.json(await Place.findById(id));
});

app.put("/places", async (req, res) => {
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

app.get("/places", async (req, res) => {
  res.json(await Place.find());
});

app.post("/bookings", async (req, res) => {
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

app.get("/bookings", async (req, res) => {
  const userData = await getUserDataFromToken(req);
  res.json(await Booking.find({ user: userData.id }).populate("place"));
});

app.listen(4000, () => console.log(`Server running on port 4000`));
