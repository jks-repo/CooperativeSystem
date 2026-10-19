/**
 * js/login.js
 * 
 * Initializes the login view when injected into index.html.
 * Handles REST API login requests or fallback mock logins.
 */

function initLogin() {
  const loginForm = document.getElementById("loginForm");
  const alertBox = document.getElementById("alertBox");
  const loginBtn = document.getElementById("loginBtn");

  if (!loginForm) return;

  // Set REST backend URL here when ready
  const API_LOGIN_URL = "http://localhost:3000/api/login"; 

  loginForm.addEventListener("submit", async function (e) {
    e.preventDefault();

    // Reset alert display
    if (alertBox) {
      alertBox.classList.add("d-none");
      alertBox.textContent = "";
    }

    // Indicate loading status on button
    loginBtn.disabled = true;
    loginBtn.textContent = "Logging in...";

    const usernameInput = document.getElementById("username").value.trim();
    const passwordInput = document.getElementById("password").value;

    try {
      await new Promise((resolve) => setTimeout(resolve, 300));

      if (usernameInput && passwordInput) {
        try {
          // 1. Fetch your mock data JSON file
          const response = await fetch("mockdata/mockdata.json");
          const mockData = await response.json();

          // 2. Find a user account that matches the username typed
          // (mockData.userAccounts matches the user block schema from your diagram)
          const foundUser = mockData.userAccounts.find(
            (user) => user.username.toLowerCase() === usernameInput.toLowerCase()
          );

          if (foundUser) {
            // 3. Map userLevel from mock data (e.g., "Admin", "Officer") to lowercase role
            const userRole = foundUser.userLevel.toLowerCase();

            // Store role in local storage
            localStorage.setItem("userRole", userRole);

            // Load the Home view conditionally
            loadPage("pages/home.html", initHome);
          } else {
            showError("Invalid username or password in mock data.");
          }
        } catch (fetchErr) {
          console.error("Error reading mock data:", fetchErr);
          showError("Could not load mock data file.");
        }
      } else {
        showError("Please fill out both username and password.");
      }

    } catch (error) {
      console.error("Login Error:", error);
      showError("Unable to connect to login server. Please try again.");
    } finally {
      loginBtn.disabled = false;
      loginBtn.textContent = "Login";
    }
  });

  // Helper to display error messages inside alert box
  function showError(msg) {
    if (alertBox) {
      alertBox.textContent = msg;
      alertBox.classList.remove("d-none");
    } else {
      alert(msg);
    }
  }
}