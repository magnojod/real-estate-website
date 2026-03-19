const API_BASE = "https://real-estate-backend-1ygn.onrender.com/api";
const TOKEN_KEY = "estate_token";
const USER_KEY = "estate_user";
const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=1200&q=80";

let authMode = "login";
let editingPropertyId = null;
let selectedImages = [];
let otpSent = false;
let currentPage = 1;
let totalPages = 1;
let allProperties = [];

const views = {
  home: document.getElementById("homeView"),
  properties: document.getElementById("propertiesView"),
  auth: document.getElementById("authView"),
  dashboard: document.getElementById("dashboardView"),
  post: document.getElementById("postView"),
  details: document.getElementById("detailsView")
};

const navActions = document.getElementById("navActions");
const navLinks = document.getElementById("navLinks");
const navMobileUserActions = document.getElementById("navMobileUserActions");
const menuBtn = document.getElementById("menuBtn");

const propertyGrid = document.getElementById("propertyGrid");
const dashboardGrid = document.getElementById("dashboardGrid");
const allPropertiesGrid = document.getElementById("allPropertiesGrid");
const emptyProperties = document.getElementById("emptyProperties");
const emptyAllProperties = document.getElementById("emptyAllProperties");
const emptyDashboard = document.getElementById("emptyDashboard");
const propertyDetails = document.getElementById("propertyDetails");

const authTitle = document.getElementById("authTitle");
const authForm = document.getElementById("authForm");
const nameField = document.getElementById("nameField");
const authSwitchLink = document.getElementById("authSwitchLink");
const authSwitchText = document.getElementById("authSwitchText");
const authSubmitBtn = document.getElementById("authSubmitBtn");
const sendOtpBtn = document.getElementById("sendOtpBtn");
const otpField = document.getElementById("otpField");
const otpInput = document.getElementById("otpInput");
const usernameGreeting = document.getElementById("usernameGreeting");

const propertyForm = document.getElementById("propertyForm");
const propertyIdInput = document.getElementById("propertyIdInput");
const postFormTitle = document.getElementById("postFormTitle");
const propertySubmitBtn = document.getElementById("propertySubmitBtn");
const cancelEditBtn = document.getElementById("cancelEditBtn");
const imagesInput = document.getElementById("imagesInput");
const imagePreview = document.getElementById("imagePreview");

const searchForm = document.getElementById("searchForm");
const searchInput = document.getElementById("searchInput");
const typeFilter = document.getElementById("typeFilter");
const bedroomsFilter = document.getElementById("bedroomsFilter");
const minPriceInput = document.getElementById("minPriceInput");
const maxPriceInput = document.getElementById("maxPriceInput");
const citySuggestions = document.getElementById("citySuggestions");
const loadMoreBtn = document.getElementById("loadMoreBtn");
const loadMoreContainer = document.getElementById("loadMoreContainer");

const toast = document.getElementById("toast");

const getToken = () => localStorage.getItem(TOKEN_KEY);
const getUser = () => {
  const user = localStorage.getItem(USER_KEY);
  return user ? JSON.parse(user) : null;
};

const setAuth = (token, user) => {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

const clearAuth = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

// City suggestions data
const cities = [
  "Mumbai",
  "Delhi",
  "Bangalore",
  "Hyderabad",
  "Pune",
  "Chennai",
  "Kolkata",
  "Ahmedabad"
];

// City suggestions functionality
const showCitySuggestions = (input) => {
  const value = input.toLowerCase().trim();
  
  if (value.length === 0) {
    citySuggestions.innerHTML = '';
    citySuggestions.classList.remove('show');
    return;
  }
  
  const matches = cities.filter(city => 
    city.toLowerCase().startsWith(value)
  );
  
  if (matches.length > 0) {
    citySuggestions.innerHTML = matches
      .map(city => `<div class="suggestion-item" data-city="${city}">${city}</div>`)
      .join('');
    citySuggestions.classList.add('show');
  } else {
    citySuggestions.innerHTML = '';
    citySuggestions.classList.remove('show');
  }
};

// Handle city suggestion click
const selectCitySuggestion = (city) => {
  searchInput.value = city;
  citySuggestions.innerHTML = '';
  citySuggestions.classList.remove('show');
};

// City suggestions event listeners
searchInput.addEventListener('input', () => {
  showCitySuggestions(searchInput.value);
});

searchInput.addEventListener('focus', () => {
  if (searchInput.value.trim()) {
    showCitySuggestions(searchInput.value);
  }
});

document.addEventListener('click', (event) => {
  if (!event.target.closest('.search-row')) {
    citySuggestions.classList.remove('show');
  }
});

citySuggestions.addEventListener('click', (event) => {
  if (event.target.classList.contains('suggestion-item')) {
    selectCitySuggestion(event.target.dataset.city);
  }
});

const showToast = (message, type = "success") => {
  toast.textContent = message;
  toast.className = `toast ${type}`;
  toast.classList.remove("hidden");

  setTimeout(() => {
    toast.className = "toast hidden";
  }, 2400);
};

const formatPrice = (price) => {
  const number = Number(price || 0);
  return number.toLocaleString("en-IN");
};

const getPropertyImage = (property) => {
  if (property?.images && property.images.length > 0) return property.images[0];
  return FALLBACK_IMAGE;
};

const showView = (viewName) => {
  Object.values(views).forEach((view) => view.classList.remove("active"));
  views[viewName].classList.add("active");
};

const renderNav = () => {
  const user = getUser();

  if (!user) {
    navActions.innerHTML = `
      <a class="btn btn-outline nav-user-actions" href="#/login">Login</a>
      <a class="btn btn-primary nav-user-actions" href="#/signup">Signup</a>
    `;
    if (navMobileUserActions) {
      navMobileUserActions.innerHTML = `
        <a href="#/login">Login</a>
        <a href="#/signup">Signup</a>
      `;
    }
    return;
  }

  navActions.innerHTML = `
    <a id="usernameGreeting" href="profile.html" class="user-profile-link">Hi, ${user.name}</a>
    <a class="btn btn-outline nav-user-actions" href="#/dashboard">Dashboard</a>
    <button class="btn btn-danger nav-user-actions" id="logoutBtn">Logout</button>
  `;

  if (navMobileUserActions) {
    navMobileUserActions.innerHTML = `
      <span>Hi, ${user.name}</span>
      <a href="#/dashboard">Dashboard</a>
      <button type="button" class="mobile-logout-btn" id="mobileLogoutBtn">Logout</button>
    `;
  }

  const logoutUser = () => {
    clearAuth();
    renderNav();
    showToast("Logged out successfully");
    navLinks.classList.remove("show");
    location.hash = "#/login";
  };

  // Add click handler for username greeting
  const usernameGreeting = document.getElementById("usernameGreeting");
  if (usernameGreeting) {
    usernameGreeting.addEventListener("click", (event) => {
      event.preventDefault();
      window.location.href = "profile.html";
    });
  }

  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) logoutBtn.addEventListener("click", logoutUser);

  const mobileLogoutBtn = document.getElementById("mobileLogoutBtn");
  if (mobileLogoutBtn) mobileLogoutBtn.addEventListener("click", logoutUser);
};

const apiFetch = async (path, options = {}) => {
  const token = getToken();
  const headers = { ...(options.headers || {}) };
  
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  
  if (options.body && !(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }
  
  const url = `${API_BASE}${path}`;
  
  try {
    const res = await fetch(url, {
      ...options,
      headers
    });
    
    const text = await res.text();
    
    let data;
    try {
      data = JSON.parse(text);
    } catch (err) {
      console.error("Invalid JSON response:", text);
      throw new Error("Server error. Please try again.");
    }
    
    console.log("API RESPONSE:", data);
    
    if (!res.ok) {
      throw new Error(data?.message || "Something went wrong");
    }
    
    return data;
  } catch (error) {
    console.error("API Error:", error);
    throw error;
  }
};

const propertyCardTemplate = (property, ownerActions = false) => `
  <article class="card">
    <img class="card-image" src="${getPropertyImage(property)}" alt="${property.title}" />
    <div class="card-content">
      <div class="card-top">
        <span class="badge ${property.type}">${property.type}</span>
        <span class="price">₹${formatPrice(property.price)}</span>
      </div>
      <h3>${property.title}</h3>
      <p class="meta">${property.locality}, ${property.city}</p>
      <p class="meta">${property.bedrooms} BHK • ${property.bathrooms} Bath • ${property.area} sqft</p>
      <div class="card-actions">
        <a class="btn btn-outline" href="#/property/${property._id}">Details</a>
        ${
          ownerActions
            ? `<button class="btn btn-primary" data-edit-id="${property._id}">Edit</button>
               <button class="btn btn-danger" data-delete-id="${property._id}">Delete</button>`
            : ""
        }
      </div>
    </div>
  </article>
`;

const allPropertiesCardTemplate = (property) => `
  <article class="card">
    <img class="card-image" src="${getPropertyImage(property)}" alt="${property.title}" />
    <div class="card-content">
      <h3>${property.title}</h3>
      <p class="meta">${property.city}</p>
      <p class="meta">${property.locality}</p>
      <p class="price">₹${formatPrice(property.price)}</p>
      <div class="card-actions">
        <a class="btn btn-outline" href="#/property/${property._id}">View Details</a>
        ${
          property?.owner?.email
            ? `<button class="btn btn-primary" data-contact-email="${property.owner.email}">Contact Owner</button>`
            : ""
        }
      </div>
    </div>
  </article>
`;

const loadHomeProperties = async (resetPage = true) => {
  try {
    if (resetPage) {
      currentPage = 1;
      allProperties = [];
    }
    
    const hash = location.hash || "#/";
    const hashQueryString = hash.includes("?") ? hash.split("?")[1] : "";
    const hashParams = new URLSearchParams(hashQueryString);
    
    // Also read from URL search parameters
    const urlParams = new URLSearchParams(window.location.search);
    
    const q = searchInput.value.trim() || hashParams.get("q") || urlParams.get("q") || "";
    const type = typeFilter.value || hashParams.get("type") || urlParams.get("type") || "";
    const bedrooms = bedroomsFilter.value || hashParams.get("bedrooms") || urlParams.get("bedrooms") || "";
    const minPrice = minPriceInput.value || hashParams.get("minPrice") || urlParams.get("minPrice") || "";
    const maxPrice = maxPriceInput.value || hashParams.get("maxPrice") || urlParams.get("maxPrice") || "";
    const page = resetPage ? 1 : (hashParams.get("page") || urlParams.get("page") || currentPage);

    const query = new URLSearchParams();
    if (q) query.set("q", q);
    if (type) query.set("type", type);
    if (bedrooms) query.set("bedrooms", bedrooms);
    if (minPrice) query.set("minPrice", minPrice);
    if (maxPrice) query.set("maxPrice", maxPrice);
    query.set("page", page);

    const { properties, total, pages } = await apiFetch(`/properties?${query.toString()}`);
    
    if (resetPage) {
      allProperties = properties;
    } else {
      allProperties = [...allProperties, ...properties];
    }
    
    totalPages = pages;
    currentPage = Number(page);
    
    propertyGrid.innerHTML = allProperties.map((p) => propertyCardTemplate(p)).join("");
    emptyProperties.classList.toggle("hidden", allProperties.length > 0);
    
    // Show/hide load more button
    if (currentPage < totalPages) {
      loadMoreContainer.classList.remove("hidden");
      loadMoreBtn.textContent = `Load More (${total - allProperties.length} remaining)`;
    } else {
      loadMoreContainer.classList.add("hidden");
    }
  } catch (error) {
    propertyGrid.innerHTML = "";
    emptyProperties.classList.remove("hidden");
    loadMoreContainer.classList.add("hidden");
    showToast(error.message, "error");
  }
};

const loadAllPropertiesPage = async () => {
  try {
    const hash = location.hash || "#/properties";
    const queryString = hash.includes("?") ? hash.split("?")[1] : "";
    const params = new URLSearchParams(queryString);
    const type = params.get("type");

    const query = new URLSearchParams();
    if (type && ["buy", "rent"].includes(type.toLowerCase())) {
      query.set("type", type.toLowerCase());
    }

    const endpoint = query.toString() ? `/properties?${query.toString()}` : "/properties";
    const { properties } = await apiFetch(endpoint);

    allPropertiesGrid.innerHTML = properties.map((p) => allPropertiesCardTemplate(p)).join("");
    emptyAllProperties.classList.toggle("hidden", properties.length > 0);

    allPropertiesGrid.querySelectorAll("[data-contact-email]").forEach((button) => {
      button.addEventListener("click", () => {
        const email = button.dataset.contactEmail;
        if (!email) return;
        window.location.href = `mailto:${email}`;
      });
    });
  } catch (error) {
    allPropertiesGrid.innerHTML = "";
    emptyAllProperties.classList.remove("hidden");
    showToast(error.message, "error");
  }
};

const loadDashboard = async () => {
  try {
    const { properties } = await apiFetch("/properties/my");
    dashboardGrid.innerHTML = properties.map((p) => propertyCardTemplate(p, true)).join("");
    emptyDashboard.classList.toggle("hidden", properties.length > 0);

    dashboardGrid.querySelectorAll("[data-edit-id]").forEach((button) => {
      button.addEventListener("click", () => openEditProperty(button.dataset.editId));
    });

    dashboardGrid.querySelectorAll("[data-delete-id]").forEach((button) => {
      button.addEventListener("click", () => handleDeleteProperty(button.dataset.deleteId));
    });
  } catch (error) {
    dashboardGrid.innerHTML = "";
    emptyDashboard.classList.remove("hidden");
    showToast(error.message, "error");
  }
};

const renderSlider = (images = []) => {
  const allImages = images.length ? images : [FALLBACK_IMAGE];
  const sliderId = `slider-${Date.now()}`;

  return `
    <div class="gallery" id="${sliderId}">
      <div class="gallery-main-wrap">
        <button class="gallery-nav prev" data-dir="prev">← Previous</button>
        <img class="gallery-main" src="${allImages[0]}" alt="Property image" />
        <button class="gallery-nav next" data-dir="next">Next →</button>
      </div>
      <div class="gallery-thumbs">
        ${allImages
          .map(
            (img, idx) =>
              `<img class="gallery-thumb ${idx === 0 ? "active" : ""}" src="${img}" data-index="${idx}" alt="thumb-${idx}" />`
          )
          .join("")}
      </div>
    </div>
  `;
};

const initSliderInteractions = (container, images = []) => {
  const allImages = images.length ? images : [FALLBACK_IMAGE];
  let current = 0;

  const mainImg = container.querySelector(".gallery-main");
  const thumbs = container.querySelectorAll(".gallery-thumb");
  const prevBtn = container.querySelector(".gallery-nav.prev");
  const nextBtn = container.querySelector(".gallery-nav.next");

  const update = (index) => {
    current = (index + allImages.length) % allImages.length;
    mainImg.src = allImages[current];
    thumbs.forEach((thumb, i) => thumb.classList.toggle("active", i === current));
  };

  prevBtn.addEventListener("click", () => update(current - 1));
  nextBtn.addEventListener("click", () => update(current + 1));
  thumbs.forEach((thumb) => {
    thumb.addEventListener("click", () => update(Number(thumb.dataset.index)));
  });
};

const loadPropertyDetails = async (id) => {
  try {
    const { property } = await apiFetch(`/properties/${id}`);

    propertyDetails.innerHTML = `
      <article class="details-card">
        ${renderSlider(property.images || [])}
        <div class="details-content">
          <div class="card-top">
            <span class="badge ${property.type}">${property.type}</span>
            <span class="price">₹${formatPrice(property.price)}</span>
          </div>
          <h2>${property.title}</h2>
          <p class="meta">${property.locality}, ${property.city}</p>
          <p>${property.description}</p>
          <div class="details-grid">
            <span class="pill">${property.bedrooms} Bedrooms</span>
            <span class="pill">${property.bathrooms} Bathrooms</span>
            <span class="pill">${property.area} sqft</span>
            <span class="pill">Posted by ${property.owner?.name || "Owner"}</span>
          </div>

          <div class="owner-contact">
            <h3>Owner Information</h3>
            <p class="meta">Posted by: ${property.owner?.name || "Owner"}</p>
            <p class="meta">Email: ${property.owner?.email || "Not available"}</p>
            ${
              property?.owner?.email
                ? `<button class="btn btn-primary" id="contactOwnerBtn">Contact Owner</button>`
                : ""
            }
          </div>
        </div>
      </article>
    `;

    const gallery = propertyDetails.querySelector(".gallery");
    initSliderInteractions(gallery, property.images || []);

    const contactOwnerBtn = document.getElementById("contactOwnerBtn");
    if (contactOwnerBtn && property?.owner?.email) {
      contactOwnerBtn.addEventListener("click", () => {
        window.location.href = `mailto:${property.owner.email}`;
      });
    }
  } catch (error) {
    propertyDetails.innerHTML = `<p class="empty">${error.message}</p>`;
  }
};

// Function to populate edit form with property data
const populateEditForm = (property) => {
  document.getElementById("titleInput").value = property.title || "";
  document.getElementById("descriptionInput").value = property.description || "";
  document.getElementById("priceInput").value = property.price || "";
  document.getElementById("cityInput").value = property.city || "";
  document.getElementById("localityInput").value = property.locality || "";
  document.getElementById("typeInput").value = property.type || "buy";
  document.getElementById("bedroomsInput").value = property.bedrooms || "";
  document.getElementById("bathroomsInput").value = property.bathrooms || "";
  document.getElementById("areaInput").value = property.area || "";
  
  // Handle existing images
  if (property.images && property.images.length > 0) {
    selectedImages = [];
    imagePreview.innerHTML = `
      ${(property.images || [])
        .map(
          (img) =>
            `<div class="image-preview-item">
              <img class="image-preview-thumb" src="${img}" alt="existing-property-image" />
              <button type="button" class="btn btn-outline remove-btn" disabled>Existing</button>
            </div>`
        )
        .join('')}
    `;
  }
};

const switchAuthMode = (mode) => {
  authMode = mode;
  const isSignup = mode === "signup";

  // Reset OTP state
  otpSent = false;
  otpField.classList.add("hidden");
  sendOtpBtn.classList.toggle("hidden", !isSignup);

  authTitle.textContent = isSignup ? "Create Account" : "Login";
  authSubmitBtn.textContent = isSignup ? "Sign Up" : "Login";
  authSwitchText.textContent = isSignup ? "Already have an account?" : "Don't have an account?";
  authSwitchLink.textContent = isSignup ? "Login" : "Sign up";
  nameField.classList.toggle("hidden", !isSignup);
};

const syncInputFilesFromSelectedImages = () => {
  const dt = new DataTransfer();
  selectedImages.forEach((file) => dt.items.add(file));
  imagesInput.files = dt.files;
};

const renderSelectedImagePreviews = () => {
  if (!imagePreview) return;
  imagePreview.innerHTML = "";

  selectedImages.forEach((file, index) => {
    const row = document.createElement("div");
    row.className = "image-preview-row";

    const img = document.createElement("img");
    img.className = "image-preview-thumb";
    img.alt = file.name;
    img.src = URL.createObjectURL(file);

    const removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.className = "btn btn-outline remove-btn";
    removeBtn.textContent = "Remove";
    removeBtn.addEventListener("click", () => {
      selectedImages.splice(index, 1);
      syncInputFilesFromSelectedImages();
      renderSelectedImagePreviews();
    });

    const addBtn = document.createElement("button");
    addBtn.type = "button";
    addBtn.className = "btn btn-primary add-btn";
    addBtn.textContent = "Add Image";
    addBtn.addEventListener("click", () => {
      imagesInput.click();
    });

    row.appendChild(img);
    row.appendChild(removeBtn);
    row.appendChild(addBtn);
    imagePreview.appendChild(row);
  });
};

const handleImagesSelectionChange = () => {
  const incoming = imagesInput.files ? Array.from(imagesInput.files) : [];
  if (!incoming.length) return;

  const availableSlots = 5 - selectedImages.length;
  if (availableSlots <= 0) {
    showToast("Maximum 5 images allowed", "error");
    imagesInput.value = "";
    return;
  }

  if (incoming.length > availableSlots) {
    showToast("Maximum 5 images allowed", "error");
    imagesInput.value = "";
    return;
  }

  const validIncoming = incoming.filter((file) => file.type.startsWith("image/"));
  selectedImages = [...selectedImages, ...validIncoming].slice(0, 5);
  syncInputFilesFromSelectedImages();
  renderSelectedImagePreviews();
};

const openPostCreateMode = () => {
  editingPropertyId = null;
  selectedImages = [];
  propertyIdInput.value = "";
  postFormTitle.textContent = "Post Property";
  propertySubmitBtn.textContent = "Save Property";
  cancelEditBtn.classList.add("hidden");
  propertyForm.reset();
  syncInputFilesFromSelectedImages();
  if (imagePreview) imagePreview.innerHTML = "";
};

const openEditProperty = async (id) => {
  try {
    const { property } = await apiFetch(`/properties/${id}`);
    
    // Check if we're editing from profile page (which has ID in URL)
    const urlParams = new URLSearchParams(window.location.search);
    const urlId = urlParams.get('id');
    
    if (urlId) {
      // We're editing from profile page, populate form with property data
      populateEditForm(property);
      editingPropertyId = id;
      postFormTitle.textContent = "Edit Property";
      propertySubmitBtn.textContent = "Update Property";
      cancelEditBtn.classList.remove("hidden");
    } else {
      // Regular edit flow
      editingPropertyId = id;
      postFormTitle.textContent = "Edit Property";
      propertySubmitBtn.textContent = "Update Property";
      cancelEditBtn.classList.remove("hidden");
      
      document.getElementById("titleInput").value = property.title;
      document.getElementById("descriptionInput").value = property.description;
      document.getElementById("priceInput").value = property.price;
      document.getElementById("cityInput").value = property.city;
      document.getElementById("localityInput").value = property.locality;
      document.getElementById("typeInput").value = property.type;
      document.getElementById("bedroomsInput").value = property.bedrooms;
      document.getElementById("bathroomsInput").value = property.bathrooms;
      document.getElementById("areaInput").value = property.area;
      
      // Handle existing images
      if (property.images && property.images.length > 0) {
        selectedImages = [];
        imagePreview.innerHTML = `
          ${(property.images || [])
            .map(
              (img) =>
                `<div class="image-preview-item">
                  <img class="image-preview-thumb" src="${img}" alt="existing-property-image" />
                  <button type="button" class="btn btn-outline remove-btn" disabled>Existing</button>
                </div>`
            )
            .join('')}
        `;
      }
    }

    location.hash = "#/post";
  } catch (error) {
    showToast(error.message, "error");
  }
};

const handleDeleteProperty = async (id) => {
  const ok = confirm("Delete this property?");
  if (!ok) return;

  try {
    await apiFetch(`/properties/${id}`, { method: "DELETE" });
    showToast("Property deleted");
    await loadDashboard();
    await loadHomeProperties();
  } catch (error) {
    showToast(error.message, "error");
  }
};

authSwitchLink.addEventListener("click", (event) => {
  event.preventDefault();
  switchAuthMode(authMode === "login" ? "signup" : "login");
});

// Send OTP function
const sendOTP = async () => {
  const email = document.getElementById("emailInput").value.trim();
  
  if (!email) {
    showToast("Please enter your email address", "error");
    return;
  }

  if (!/^\S+@\S+\.\S+$/.test(email)) {
    showToast("Please enter a valid email address", "error");
    return;
  }

  const btn = sendOtpBtn;
  btn.disabled = true;
  btn.innerText = "Sending...";

  try {
    const res = await fetch("https://real-estate-backend-1ygn.onrender.com/api/auth/send-otp", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email })
    });

    const text = await res.text();

    let data;
    try {
      data = JSON.parse(text);
    } catch {
      showToast("Server error", "error");
      return;
    }

    console.log("OTP RESPONSE:", data);

    if (!res.ok) {
      showToast(data.message || "OTP failed", "error");
      return;
    }

    showToast("OTP sent! (Check console for OTP)");
    otpSent = true;
    otpField.classList.remove("hidden");
    btn.innerText = "Resend Code";

  } catch (err) {
    console.error(err);
    showToast("Network error", "error");
  } finally {
    btn.disabled = false;
  }
};

// Verify OTP and signup function
const verifyOTP = async (name, email, password, otp) => {
  try {
    const data = await apiFetch("/auth/signup", {
      method: "POST",
      body: JSON.stringify({ name, email, password, otp })
    });
    
    setAuth(data.token, data.user);
    showToast("Account created successfully!");
    renderNav();
    location.hash = "#/";
  } catch (error) {
    showToast(error.message, "error");
  }
};

sendOtpBtn.addEventListener("click", sendOTP);

authForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const name = document.getElementById("nameInput").value.trim();
  const email = document.getElementById("emailInput").value.trim();
  const password = document.getElementById("passwordInput").value.trim();
  const otp = otpInput.value.trim();

  try {
    if (authMode === "signup") {
      // Check if OTP was sent and verified
      if (!otpSent) {
        showToast("Please send and enter the verification code first", "error");
        return;
      }
      
      if (!otp) {
        showToast("Please enter the verification code", "error");
        return;
      }
      
      // Use OTP verification flow
      await verifyOTP(name, email, password, otp);
      return;
    }

    // Login flow
    const data = await apiFetch("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password })
    });
    setAuth(data.token, data.user);
    showToast("Login successful");
    renderNav();
    location.hash = "#/";
  } catch (error) {
    showToast(error.message, "error");
  }
});

propertyForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const formData = new FormData();
  formData.append("title", document.getElementById("titleInput").value.trim());
  formData.append("description", document.getElementById("descriptionInput").value.trim());
  formData.append("price", document.getElementById("priceInput").value);
  formData.append("city", document.getElementById("cityInput").value.trim());
  formData.append("locality", document.getElementById("localityInput").value.trim());
  formData.append("type", document.getElementById("typeInput").value);
  formData.append("bedrooms", document.getElementById("bedroomsInput").value);
  formData.append("bathrooms", document.getElementById("bathroomsInput").value);
  formData.append("area", document.getElementById("areaInput").value);

  const filesToUpload = selectedImages.slice(0, 5);
  filesToUpload.forEach((file) => formData.append("images", file));

  try {
    if (!editingPropertyId && filesToUpload.length === 0) {
      showToast("Please upload at least one image", "error");
      return;
    }

    if (editingPropertyId) {
      await apiFetch(`/properties/${editingPropertyId}`, {
        method: "PUT",
        body: formData
      });
      showToast("Property updated");
    } else {
      await apiFetch("/properties", {
        method: "POST",
        body: formData
      });
      showToast("Property posted");
    }

    openPostCreateMode();
    location.hash = "#/dashboard";
    await loadDashboard();
    await loadHomeProperties();
  } catch (error) {
    showToast(error.message, "error");
  }
});

imagesInput.addEventListener("change", handleImagesSelectionChange);

cancelEditBtn.addEventListener("click", () => {
  openPostCreateMode();
  location.hash = "#/dashboard";
});

searchForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const params = new URLSearchParams();
  if (searchInput.value.trim()) params.set("q", searchInput.value.trim());
  if (typeFilter.value) params.set("type", typeFilter.value);
  if (bedroomsFilter.value) params.set("bedrooms", bedroomsFilter.value);
  if (minPriceInput.value) params.set("minPrice", minPriceInput.value);
  if (maxPriceInput.value) params.set("maxPrice", maxPriceInput.value);

  // Update both URL search parameters and hash
  const queryString = params.toString();
  window.history.pushState({}, '', `?${queryString}`);
  location.hash = `#/?${queryString}`;
});

// Load more functionality
loadMoreBtn.addEventListener("click", async () => {
  if (currentPage < totalPages) {
    currentPage += 1;
    await loadHomeProperties(false);
  }
});

menuBtn.addEventListener("click", () => {
  navLinks.classList.toggle("show");
});

navLinks.addEventListener("click", (event) => {
  const target = event.target;
  if (target.tagName === "A" || target.closest("button")) {
    navLinks.classList.remove("show");
  }
});

window.addEventListener("hashchange", async () => {
  await routeHandler();
});

const routeHandler = async () => {
  renderNav();
  const hash = location.hash || "#/";
  const cleanHash = hash.split("?")[0];
  const user = getUser();

  // Check for edit mode in post route
  if (cleanHash === "#/post") {
    const params = new URLSearchParams(hash.split('?')[1]);
    const propertyId = params.get("id");
    
    if (propertyId) {
      // Edit mode - fetch property data and populate form
      try {
        const { property } = await apiFetch(`/properties/${propertyId}`);
        populateEditForm(property);
        editingPropertyId = propertyId;
        postFormTitle.textContent = "Edit Property";
        propertySubmitBtn.textContent = "Update Property";
        cancelEditBtn.classList.remove("hidden");
      } catch (error) {
        showToast(error.message, "error");
        openPostCreateMode();
      }
    }
  }

  if (cleanHash.startsWith("#/property/")) {
    const id = cleanHash.split("#/property/")[1];
    showView("details");
    await loadPropertyDetails(id);
    return;
  }

  switch (cleanHash) {
    case "#/":
      showView("home");
      await loadHomeProperties();
      break;
    case "#/properties":
      showView("properties");
      await loadAllPropertiesPage();
      break;
    case "#/login":
      switchAuthMode("login");
      showView("auth");
      break;
    case "#/signup":
      switchAuthMode("signup");
      showView("auth");
      break;
    case "#/dashboard":
      if (!user) {
        location.hash = "#/login";
        return;
      }
      showView("dashboard");
      await loadDashboard();
      break;
    case "#/post":
      if (!user) {
        location.hash = "#/login";
        return;
      }
      showView("post");
      if (!editingPropertyId) openPostCreateMode();
      break;
    default:
      showView("home");
      await loadHomeProperties();
  }
};

(async () => {
  renderNav();
  if (!location.hash) {
    location.hash = "#/";
  }
  await routeHandler();
})();
