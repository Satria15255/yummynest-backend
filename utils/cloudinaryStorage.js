const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("./cloudinary");

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "recipes",
    allowed_formats: ["jpg", "png", "webp"],
    transformation: [{ width: 400, height: 400, crop: "fill" }],
  },
});

module.exports = storage;
