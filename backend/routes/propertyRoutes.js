const express = require("express");
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const mongoose = require("mongoose");
const Property = require("../models/property");
const { authMiddleware } = require("./authRoutes");

const router = express.Router();

const uploadsDir = path.join(__dirname, "..", "..", "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname || "");
    cb(null, `${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 }
});

const getImagePathsFromFiles = (files = []) => files.map((file) => `/uploads/${file.filename}`);

router.get("/", async (req, res) => {
  try {
    const { q, type, minPrice, maxPrice, bedrooms, page = 1 } = req.query;
    const query = {};

    if (type && ["buy", "rent"].includes(type)) {
      query.type = type;
    }

    if (q) {
      // Enhanced search with better location handling
      query.$or = [
        { title: { $regex: q, $options: "i" } },
        { city: { $regex: q, $options: "i" } },
        { locality: { $regex: q, $options: "i" } },
        { description: { $regex: q, $options: "i" } }
      ];
    }

    if (bedrooms) {
      query.bedrooms = Number(bedrooms);
    }

    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    const limit = 6;
    const skip = (page - 1) * limit;

    const properties = await Property.find(query)
      .populate("owner", "name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Property.countDocuments(query);

    return res.status(200).json({
      properties,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit)
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch properties", error: error.message });
  }
});

router.get("/my", authMiddleware, async (req, res) => {
  try {
    const properties = await Property.find({ owner: req.user._id }).sort({ createdAt: -1 });
    return res.status(200).json({ properties });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch user properties", error: error.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid property id" });
    }

    const property = await Property.findById(req.params.id).populate("owner", "name email");
    if (!property) {
      return res.status(404).json({ message: "Property not found" });
    }

    return res.status(200).json({ property });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch property details", error: error.message });
  }
});

router.post("/", authMiddleware, upload.array("images", 5), async (req, res) => {
  try {
    const {
      title,
      description,
      price,
      city,
      locality,
      type,
      bedrooms,
      bathrooms,
      area
    } = req.body;

    const images = getImagePathsFromFiles(req.files);

    if (!images.length) {
      return res.status(400).json({ message: "At least one image is required" });
    }

    const property = await Property.create({
      title,
      description,
      price: Number(price),
      city,
      locality,
      type,
      bedrooms: Number(bedrooms),
      bathrooms: Number(bathrooms),
      area: Number(area),
      images,
      owner: req.user._id
    });

    return res.status(201).json({ message: "Property created successfully", property });
  } catch (error) {
    return res.status(500).json({ message: "Failed to create property", error: error.message });
  }
});

router.put("/:id", authMiddleware, upload.array("images", 5), async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid property id" });
    }

    const property = await Property.findById(req.params.id);
    if (!property) {
      return res.status(404).json({ message: "Property not found" });
    }

    if (property.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not allowed to edit this property" });
    }

    const allowedFields = [
      "title",
      "description",
      "price",
      "city",
      "locality",
      "type",
      "bedrooms",
      "bathrooms",
      "area"
    ];

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        if (["price", "bedrooms", "bathrooms", "area"].includes(field)) {
          property[field] = Number(req.body[field]);
        } else {
          property[field] = req.body[field];
        }
      }
    }

    const newImages = getImagePathsFromFiles(req.files);
    if (newImages.length) {
      property.images = newImages;
    }

    await property.save();
    return res.status(200).json({ message: "Property updated successfully", property });
  } catch (error) {
    return res.status(500).json({ message: "Failed to update property", error: error.message });
  }
});

router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid property id" });
    }

    const property = await Property.findById(req.params.id);
    if (!property) {
      return res.status(404).json({ message: "Property not found" });
    }

    if (property.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not allowed to delete this property" });
    }

    await Property.findByIdAndDelete(req.params.id);
    return res.status(200).json({ message: "Property deleted successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Failed to delete property", error: error.message });
  }
});

// Get properties by user ID
router.get("/user/:userId", async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.userId)) {
      return res.status(400).json({ message: "Invalid user id" });
    }

    const properties = await Property.find({ owner: req.params.userId })
      .populate("owner", "name email")
      .sort({ createdAt: -1 });

    return res.status(200).json({ properties });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch user properties", error: error.message });
  }
});

module.exports = router;
