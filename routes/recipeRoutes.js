const express = require("express");
const router = express.Router();
const multer = require("multer");
const sharp = require("sharp");
const fs = require("fs");
const { createRecipe } = require("../controllers/recipeController");
const verifyToken = require("../middleware/auth");
const Recipe = require("../models/Recipe");
const path = require("path");
const auth = require("../middleware/auth");

// GET semua resep
router.get("/", async (req, res) => {
  try {
    const recipes = await Recipe.find().lean(); //ambil semua resep
    res.status(200).json(recipes);
  } catch (error) {
    res.status(500).json({ message: "Gagal mengambil resep", error: error.message });
  }
});

//GEt resep berdasarkan user
router.get("/myrecipes", verifyToken, async (req, res) => {
  try {
    const myRecipes = await Recipe.find({ user: req.user.id });
    res.json(myRecipes);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE resep by id
router.delete("/:id", async (req, res) => {
  try {
    const deleted = await Recipe.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: "Resep tidak ditemukan" });
    }
    res.status(200).json({ message: "Resep berhasil dihapus" });
  } catch (error) {
    res.status(500).json({ message: "gagal mengahpus resep", error: error.message });
  }
});

// EDIT resep by id

// GEt detail resep  by id
router.get("/:id", async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id)
      .populate("comments.user", "username") // Populate username for comments
      .populate("user", "username"); // Populate username for author
    if (!recipe) {
      return res.status(404).json({ messaage: "Resep tidak ditemukan" });
    }
    res.status(200).json(recipe);
  } catch (error) {
    res.status(500).json({ message: "Gagal mengambil resep", error: error.message });
  }
});

// POST komentar ke rsep
router.post("/:id/comments", auth, async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id);
    if (!recipe) {
      return res.status(404).json({ message: "Resep tidak ditemukan" });
    }

    const comment = {
      user: req.user.id,
      text: req.body.text,
    };

    recipe.comments.push(comment);
    await recipe.save();

    res.status(201).json({ message: "Komentar berhasil ditambahkan", data: comment });
  } catch (error) {
    res.status(404).json({ message: "Gagal menambahkan komentar", error: error.message });
  }
});

// DELETE komentar
router.delete("/:recipeId/comments/:commentId", auth, async (req, res) => {
  try {
    const { recipeId, commentId } = req.params;
    const userId = req.user.id;

    const recipe = await Recipe.findById(recipeId);
    if (!recipe) {
      return res.status(404).json({ message: "Resep tidak ditemukan" });
    }

    const comment = recipe.comments.id(commentId);
    if (!comment) {
      return res.status(404).json({ message: "Komentar tidak ditemukan" });
    }

    const isOwnerOfRecipe = recipe.user.toString() === userId;
    const isOwnerOfComment = comment.user.toString() === userId;

    if (!isOwnerOfRecipe && !isOwnerOfComment) {
      return res.status(403).json({ message: "Kamu tidak diizinkan menghapus komenmtar ini" });
    }

    recipe.comments = recipe.comments.filter((c) => c._id.toString() !== commentId);
    await recipe.save();

    res.status(200).json({ message: "Komentar berhasil dihapus" });
  } catch (error) {
    res.status(500).json({ message: "Gagal menghapus komentar", error: error.message });
  }
});

// Konfigurasi penyimpanan file
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage });

function safeUnlink(filePath, retries = 5, delay = 300) {
  setTimeout(() => {
    fs.unlink(filePath, (err) => {
      if (err) {
        if (retries > 0) {
          console.warn(`Retrying unlink... (${6 - retries}) for file: ${filePath}`);
          safeUnlink(filePath, retries - 1, delay);
        } else {
          console.error(`Gagal hapus file asli setelah beberapa kali percobaan: ${filePath}`, err.message);
        }
      } else {
        console.log(`File asli berhasil dihapus: ${filePath}`);
      }
    });
  }, delay);
}

// Route upload resep dengan gambar
router.post("/upload", verifyToken, upload.single("image"), async (req, res) => {
  try {
    const { title, description, ingredients, steps } = req.body;
    const fileName = `resep=${Date.now()}.webp`;
    const outputPath = path.join(__dirname, "../uploads", fileName);

    // Resize dan konversi gambar
    await sharp(req.file.path)
      .resize(400, 400, {
        fit: "cover",
        position: "center",
      })
      .webp({ quality: 75 })
      .toFile(outputPath);

    console.log("Resize selesai, mulai hapus file asli:", req.file.path);
    safeUnlink(req.file.path); // Hapus file asli setelah resize selesai

    // Simpan data resep ke database
    const newRecipe = new Recipe({
      title,
      description,
      ingredients: JSON.parse(ingredients),
      steps: JSON.parse(steps),
      image: fileName,
      createdBy: req.user.id,
      user: req.user.id,
    });

    await newRecipe.save();
    res.status(200).json({ message: "Resep berhasil ditambahkan", recipe: newRecipe });
  } catch (err) {
    res.status(500).json({ message: "Resep gagal ditambahkan", err: err.message });
  }
});

// Route edit resep dengan opsi update gambar
router.put("/:id", upload.single("image"), verifyToken, async (req, res) => {
  try {
    const updateData = {
      title: req.body.title,
      description: req.body.description,
      ingredients: Array.isArray(req.body.ingredients)
        ? req.body.ingredients
        : req.body.ingredients?.split("\n").filter(Boolean),
      steps: Array.isArray(req.body.steps)
        ? req.body.steps
        : req.body.steps?.split("\n").filter(Boolean),
    };

    if (req.file) {
      const fileName = `resep=${Date.now()}.jpg`;
      const outputPath = path.join(__dirname, "../uploads", fileName);

      await sharp(req.file.path)
        .resize(400, 400, {
          fit: "cover",
          position: "center",
        })
        .toFile(outputPath);

      console.log("Resize selesai (edit), mulai hapus file asli:", req.file.path);
      safeUnlink(req.file.path); // Hapus file asli setelah resize selesai

      updateData.image = fileName;
    }

    const resep = await Recipe.findById(req.params.id);
    if (!resep) {
      return res.status(404).json({ message: "Resep tidak ditemukan" });
    }

    if (resep.user.toString() !== req.user.id) {
      return res.status(403).json({ message: "Kamu tidak diizinkan mengedit resep ini" });
    }

    const updated = await Recipe.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!updated) {
      return res.status(404).json({ message: "Resep tidak ditemukan" });
    }

    res.status(200).json({ message: "Resep berhasil di update", data: updated });
  } catch (error) {
    res.status(500).json({ message: "Gagal update resep", error: error.message });
  }
});


module.exports = router;
