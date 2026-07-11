// ── donations.js ──────────────────────────────────────────────
const express  = require("express");
const Donation = require("../models/Donation");
const Receiver = require("../models/Receiver");
const router   = express.Router();

// POST /api/donations — create donation + mark receiver as served
router.post("/", async (req, res) => {
  try {
    const { matchedReceiverId, ...rest } = req.body;
    const donation = await Donation.create({
      ...rest,
      matchedReceiver: matchedReceiverId,
      status: "assigned",
    });

    // Mark receiver as served today
    if (matchedReceiverId) {
      const today = new Date().toISOString().split("T")[0];
      await Receiver.findByIdAndUpdate(matchedReceiverId, {
        servedToday: true,
        lastServedDate: today,
        inNeed: false,
      });
    }

    res.json({ success: true, donation });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/donations — all donations
router.get("/", async (req, res) => {
  try {
    const donations = await Donation.find()
      .populate("matchedReceiver", "name type city address")
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(donations);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/donations/:id/status
router.patch("/:id/status", async (req, res) => {
  try {
    const { status } = req.body;
    const donation = await Donation.findByIdAndUpdate(
      req.params.id,
      { status, updatedAt: new Date() },
      { new: true }
    );
    res.json(donation);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;