const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const User = require("../models/User");
const Recipe = require("../models/Recipe");

// POST /api/users/save/:recipeId
router.post("/save/:recipeId", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const recipe = await Recipe.findById(req.params.recipeId);

    if (user.savedRecipes.includes(recipe._id)) {
      return res.status(400).json({ message: "Resep tealh disimpan" });
    }

    user.savedRecipes.push(recipe._id);
    await user.save();

    res.status(200).json({ message: "Resep berhasil disimpan ke favorit" });
  } catch (error) {
    res.status(500).json({ message: "Gagal menyimpan resep", error: error.message });
  }
});

// GET /api/users/saved
router.get("/saved", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate("savedRecipes");
    res.status(200).json(user.savedRecipes);
  } catch (error) {
    res.status(500).json({ message: "Gagal mengambil resep favorit", error: error.message });
  }
});

// DELETE /api/users/save/:recipeId
router.delete("/save/:recipeId", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    user.savedRecipes = user.savedRecipes.filter((id) => id.toString() !== req.params.recipeId);

    await user.save();

    res.status(200).json({ message: "Resep berhasil dihapus dari favorit" });
  } catch (error) {
    res.status(500).json({ message: "gagal menghapus resep favorit", error: error.message });
  }
});

module.exports = router;
