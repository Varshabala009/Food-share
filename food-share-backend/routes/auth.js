const express = require("express");
const jwt     = require("jsonwebtoken");
const User    = require("../models/User");
const router  = express.Router();

const sign = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });

// ── Register ─────────────────────────────────────────────────
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, phone, role, orgName, city } = req.body;

    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: "Email already registered" });

    const user = await User.create({ name, email, password, phone, role, orgName, city });
    res.json({ token: sign(user._id), user: { id: user._id, name, email, role, orgName, city } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Login ─────────────────────────────────────────────────────
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: "Invalid email or password" });
    }
    res.json({
      token: sign(user._id),
      user: { id: user._id, name: user.name, email, role: user.role, orgName: user.orgName, city: user.city }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;