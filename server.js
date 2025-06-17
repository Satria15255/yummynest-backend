const express = require("express");
const cors = require("cors");
const path = require("path");
const recipeRoutes = require("./routes/recipeRoutes");
const adminRoutes = require("./routes/admin");
const userRoutes = require("./routes/user");
const authRoutes = require("./routes/authRoutes");
const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config();
const app = express();

const allowedOrigins = ["http://localhost:5173", "https://yummynest-foodrecipe.vercel.app"];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/api/admin", adminRoutes);
app.use("/api/users", userRoutes);
app.use("/api/recipes", recipeRoutes);

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("Database connected");
  })
  .catch((err) => {
    console.log(err);
  });

app.get("/", (req, res) => {
  res.send("Resep API Ready!!");
});

app.use("/api/auth", authRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server runnning on port ${PORT}`));
