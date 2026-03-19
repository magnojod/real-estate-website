const mongoose = require("mongoose");

const propertySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: 120
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      maxlength: 2000
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: 0
    },
    city: {
      type: String,
      required: [true, "City is required"],
      trim: true
    },
    locality: {
      type: String,
      required: [true, "Locality is required"],
      trim: true
    },
    type: {
      type: String,
      enum: ["buy", "rent"],
      required: [true, "Type is required"]
    },
    bedrooms: {
      type: Number,
      required: [true, "Bedrooms are required"],
      min: 0
    },
    bathrooms: {
      type: Number,
      required: [true, "Bathrooms are required"],
      min: 0
    },
    area: {
      type: Number,
      required: [true, "Area is required"],
      min: 1
    },
    images: {
      type: [String],
      default: []
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Property", propertySchema);
