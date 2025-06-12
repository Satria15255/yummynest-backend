const User = require("../models/User");

const adminOnly = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user || user.role !== "admin") {
      return res.status(403).json({ message: "Akses ditolak, anda bukan admin" });
    }

    next();
  } catch (error) {
    res.status(500).json({ message: "gagal merverifikasi admin", error: error.message });
  }
};

module.exports = adminOnly;
