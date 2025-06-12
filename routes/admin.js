const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const adminOnly = require("../middleware/admin");
const Recipe = require("../models/Recipe");
const multer = require("multer");

// GET semua resep
router.get("/recipe", auth, adminOnly, async (req, res) => {
  try {
    const recipes = await Recipe.find();
    res.status(200).json(recipes);
  } catch (err) {
    res.status(500).json({ message: "Gagal mengambil reseo", error: err.message });
  }
});

// DELETE resep
router.delete("/recipes/:id", auth, adminOnly, async (req, res) => {
  try {
    await Recipe.findbyIdandDelete(req.params.id);
    res.status(200).json({ message: "Resep berhasil dihapus" });
  } catch (err) {
    res.status(500).json({ message: "Gagagl menghapus resep", error: err.message });
  }
});

// EDIT resep
router.put("/recipes/:id", auth, adminOnly, async (req, res) => {
  try {
    const updatedRecipe = await Recipe.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    res.status(200).json(updatedRecipe);
  } catch (err) {
    res.status(500).json({ message: "Gagal mengedit resep", error: err.message });
  }
});

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage });
// EDIT gambar resep
router.put("/:id", upload.single("image"), async (req, res) => {
  try {
    const updateData = { ...req.body };

    if (req.file) {
      updateData.image = req.file.filename;
    }

    const updated = await Recipe.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!updated) {
      return res.status(404).json({ message: "Resep tidak diupdate" });
    }

    res.status(200).json({ message: "resep berhasil diupodate", data: updated });
  } catch (error) {
    res.status(500).json({ message: "Gagal update resepse", error: error.message });
  }
});

module.exports = router;
