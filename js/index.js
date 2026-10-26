document.addEventListener("DOMContentLoaded", () => {
  // Check if user is logged in
  const userRole = localStorage.getItem("userRole");

  if (userRole) {
    loadPage("pages/home.html", initHome);
  } else {
    loadPage("pages/login.html", initLogin);
  }
});

// Helper function to fetch and inject HTML partials
async function loadPage(pageUrl, initCallback) {
  const appContainer = document.getElementById("app");
  try {
    const response = await fetch(pageUrl);
    if (!response.ok) throw new Error("Failed to load view");
    
    const html = await response.text();
    appContainer.innerHTML = html;

    // Execute page-specific script initialization
    if (initCallback) {
      initCallback();
    }
  } catch (error) {
    console.error("Error loading page:", error);
    appContainer.innerHTML = `<div class="alert alert-danger m-4">Error loading page content.</div>`;
  }
}

// Global Logout helper accessible from anywhere
window.logoutUser = function() {
  localStorage.removeItem("userRole");
  loadPage("pages/login.html", initLogin);
};