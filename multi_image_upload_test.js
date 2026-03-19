const fs = require("fs");

const indexHtml = fs.readFileSync("index.html", "utf8");
const scriptJs = fs.readFileSync("script.js", "utf8");
const propertyRoutes = fs.readFileSync("backend/routes/propertyRoutes.js", "utf8");
const serverJs = fs.readFileSync("backend/server.js", "utf8");
const propertyModel = fs.readFileSync("backend/models/property.js", "utf8");

const checks = [];
const add = (name, pass) => checks.push({ name, pass });

add(
  "index.html has multiple file input with name=images and accept=image/*",
  /<input[^>]*id="imagesInput"[^>]*type="file"[^>]*name="images"[^>]*multiple[^>]*accept="image\/\*"[^>]*>/.test(indexHtml)
);

add(
  "index.html has image preview container",
  /id="imagePreview"/.test(indexHtml)
);

add(
  "script.js appends selectedImages to FormData using key images",
  /filesToUpload\.forEach\(\(file\)\s*=>\s*formData\.append\("images",\s*file\)\)/.test(scriptJs)
);

add(
  "script.js validates at least one image on create",
  /if\s*\(!editingPropertyId\s*&&\s*filesToUpload\.length\s*===\s*0\)/.test(scriptJs) &&
    /Please upload at least one image/.test(scriptJs)
);

add(
  "script.js maintains selectedImages array and remove/add buttons",
  /let selectedImages = \[\];/.test(scriptJs) &&
    /const handleImagesSelectionChange/.test(scriptJs) &&
    /selectedImages\.splice\(index,\s*1\)/.test(scriptJs) &&
    /removeBtn\.textContent = "Remove"/.test(scriptJs) &&
    /addBtn\.textContent = "Add Image"/.test(scriptJs) &&
    /imagesInput\.click\(\)/.test(scriptJs)
);

add(
  "script.js enforces max 5 images with append behavior",
  /const availableSlots = 5 - selectedImages\.length/.test(scriptJs) &&
    /Maximum 5 images allowed/.test(scriptJs) &&
    /selectedImages = \[\.\.\.selectedImages,\s*\.\.\.validIncoming\]\.slice\(0,\s*5\)/.test(scriptJs)
);

add(
  "propertyRoutes uses multer upload.array('images', 5) for create and update",
  /router\.post\("\/"[^]*upload\.array\("images",\s*5\)/.test(propertyRoutes) &&
    /router\.put\("\/:id"[^]*upload\.array\("images",\s*5\)/.test(propertyRoutes)
);

add(
  "propertyRoutes stores uploaded files in /uploads path",
  /const uploadsDir = path\.join\(__dirname,\s*"\.\.",\s*"\.\.",\s*"uploads"\)/.test(propertyRoutes) &&
    /`\/uploads\/\$\{file\.filename\}`/.test(propertyRoutes)
);

add(
  "server.js statically serves /uploads",
  /app\.use\("\/uploads",\s*express\.static\(/.test(serverJs)
);

add(
  "property model stores images as array of strings",
  /images:\s*\{[^}]*type:\s*\[String\]/.test(propertyModel)
);

add(
  "script.js property cards use first image",
  /if\s*\(property\?\.images\s*&&\s*property\.images\.length\s*>\s*0\)\s*return\s*property\.images\[0\]/.test(scriptJs)
);

add(
  "script.js details page slider with thumbnails and prev/next exists",
  /renderSlider/.test(scriptJs) &&
    /gallery-nav prev/.test(scriptJs) &&
    /gallery-nav next/.test(scriptJs) &&
    /gallery-thumb/.test(scriptJs)
);

const passCount = checks.filter((c) => c.pass).length;
console.log("=== Multi Image Upload Verification ===");
checks.forEach((c) => console.log(`[${c.pass ? "PASS" : "FAIL"}] ${c.name}`));
console.log(`Summary: ${passCount}/${checks.length} passed`);
if (passCount !== checks.length) process.exit(1);
