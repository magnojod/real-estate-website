const API_BASE = "https://real-estate-backend-1ygn.onrender.com/api";
const TOKEN_KEY = "estate_token";
const USER_KEY = "estate_user";
const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=1200&q=80";

const navActions = document.getElementById("navActions");
const navLinks = document.getElementById("navLinks");
const navMobileUserActions = document.getElementById("navMobileUserActions");
const menuBtn = document.getElementById("menuBtn");
const toast = document.getElementById("toast");

const userName = document.getElementById("userName");
const userEmail = document.getElementById("userEmail");
const userPropertiesGrid = document.getElementById("userPropertiesGrid");
const emptyUserProperties = document.getElementById("emptyUserProperties");

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

const propertyCardTemplate = (property) => `
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
        <a class="btn btn-outline" href="index.html#/property/${property._id}">Details</a>
        <button class="btn btn-primary" onclick="window.location.href='index.html#/post?id=${property._id}'">Edit</button>
        <button class="btn btn-danger" onclick="deleteProperty('${property._id}')">Delete</button>
      </div>
    </div>
  </article>
`;

const renderNav = () => {
  const user = getUser();

  if (!user) {
    navActions.innerHTML = `
      <a class="btn btn-outline nav-user-actions" href="index.html#/login">Login</a>
      <a class="btn btn-primary nav-user-actions" href="index.html#/signup">Signup</a>
    `;
    if (navMobileUserActions) {
      navMobileUserActions.innerHTML = `
        <a href="index.html#/login">Login</a>
        <a href="index.html#/signup">Signup</a>
      `;
    }
    return;
  }

  navActions.innerHTML = `
    <a id="usernameGreeting" href="profile.html" class="user-profile-link">Hi, ${user.name}</a>
    <a class="btn btn-outline nav-user-actions" href="index.html#/dashboard">Dashboard</a>
    <button class="btn btn-danger nav-user-actions" id="logoutBtn">Logout</button>
  `;

  if (navMobileUserActions) {
    navMobileUserActions.innerHTML = `
      <span>Hi, ${user.name}</span>
      <a href="index.html#/dashboard">Dashboard</a>
      <button type="button" class="mobile-logout-btn" id="mobileLogoutBtn">Logout</button>
    `;
  }

  const logoutUser = () => {
    clearAuth();
    renderNav();
    showToast("Logged out successfully");
    navLinks.classList.remove("show");
    window.location.href = "index.html";
  };

  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) logoutBtn.addEventListener("click", logoutUser);

  const mobileLogoutBtn = document.getElementById("mobileLogoutBtn");
  if (mobileLogoutBtn) mobileLogoutBtn.addEventListener("click", logoutUser);
};

const loadUserProfile = () => {
  const user = getUser();
  
  if (!user) {
    showToast("Please login to view your profile", "error");
    window.location.href = "index.html#/login";
    return;
  }

  userName.textContent = user.name || "N/A";
  userEmail.textContent = user.email || "N/A";
  
  // Also populate header username
  const headerUserName = document.getElementById("headerUserName");
  if (headerUserName) {
    headerUserName.textContent = user.name || "User";
  }
};

const loadUserProperties = async () => {
  const user = getUser();
  
  if (!user) {
    return;
  }

  try {
    const response = await fetch(`${API_BASE}/properties/user/${user.id}`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to fetch properties");
    }

    const properties = data.properties || [];
    
    if (properties.length === 0) {
      userPropertiesGrid.innerHTML = "";
      emptyUserProperties.classList.remove("hidden");
    } else {
      userPropertiesGrid.innerHTML = properties.map((p) => propertyCardTemplate(p)).join("");
      emptyUserProperties.classList.add("hidden");
    }
  } catch (error) {
    userPropertiesGrid.innerHTML = "";
    emptyUserProperties.classList.remove("hidden");
    showToast(error.message, "error");
  }
};

const deleteProperty = async (propertyId) => {
  const ok = confirm("Delete this property?");
  if (!ok) return;

  try {
    const token = getToken();
    const response = await fetch(`${API_BASE}/properties/${propertyId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to delete property");
    }

    showToast("Property deleted successfully");
    await loadUserProperties();
  } catch (error) {
    showToast(error.message, "error");
  }
};

menuBtn.addEventListener("click", () => {
  navLinks.classList.toggle("show");
});

navLinks.addEventListener("click", (event) => {
  const target = event.target;
  if (target.tagName === "A" || target.closest("button")) {
    navLinks.classList.remove("show");
  }
});

// Initialize the page
document.addEventListener("DOMContentLoaded", () => {
  renderNav();
  loadUserProfile();
  loadUserProperties();
});
