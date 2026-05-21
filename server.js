const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();
const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");

const app = express();

app.use(cors());
app.use(express.json());
app.use(authRoutes);
app.use(adminRoutes);

mongoose.connect(process.env.MONGO_URI)
.then(() => {
    console.log("MongoDB Connected Successfully");
})
.catch((err) => {
    console.log(err);
});

app.get("/", (req, res) => {
    res.send("Backend Running Successfully");
});

app.listen(process.env.PORT, () => {
    console.log(`Server Running On ${process.env.PORT}`);
});