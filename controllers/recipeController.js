const Recipe = require("../models/Recipe");

exports.createRecipe = async (req, res) => {
  try {
    const { title, description, ingredients, steps } = req.body;
    const newRecipe = new Recipe({
      title,
      description,
      ingredients,
      steps,
      createdBy: req.user.id,
    });
    await newRecipe.save();
    res.status(201).json({ message: "Resep berhasi di Upload", recipe: newRecipe });
  } catch (error) {
    res.status(500).json({ message: "Gagal upload resep", error: error.message });
  }
};
