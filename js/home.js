function initHome() {
  console.log("Home View Initialized");

  // 1. Handle Logout Button
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", function () {
      if (typeof window.logoutUser === "function") {
        window.logoutUser();
      } else {
        localStorage.removeItem("userRole");
        location.reload();
      }
    });
  }

  // 2. Read current user role from localStorage (set during login)
  const userRole = localStorage.getItem("userRole") || "officer";
  console.log("Current active role session:", userRole);

  // 2. Read active role from localStorage
  const activeRole = localStorage.getItem("userRole") || "officer";
  console.log("Active role detected:", activeRole);

  // 3. Select ALL sections with the role-section class
  const sections = document.querySelectorAll(".role-section");

  // 4. Hide all sections by adding 'd-none'
  sections.forEach((section) => {
    section.classList.add("d-none");
  });

  // 5. Find and show ONLY the target section (e.g., adminSection)
  const targetSection = document.getElementById(`${activeRole}Section`);
  if (targetSection) {
    targetSection.classList.remove("d-none");
  }

  // 6. Update badge text if it exists
  const roleBadge = document.getElementById("activeRoleBadge");
  if (roleBadge) {
    roleBadge.textContent = activeRole.toUpperCase();
  }

  // 7. Initialize dashboard components (Tables, Forms, Mock Data rendering)
  loadDashboardData();
  
  // admin handlers

  loadMockDataToLocalStorage()
    .then(() => {
      renderAdminUsers();
      renderPendingRegistrations();
      renderPendingLoanRequests();
      populatePaymentMembers();
      renderTransactionContainers();
      renderOfficerMembers();
    })
    .catch(()=> {
      renderAdminUsers();
      renderPendingRegistrations();
      renderPendingLoanRequests();
      populatePaymentMembers();
      renderTransactionContainers();
      renderOfficerMembers();
    });

  setupAdminUserHandlers();
  setupEditUserHandlers();
  setupDeleteUserHandlers();
  
  // officer form submission
  setupOfficerRegistrationForm();
  setupFarmRegistrationForm();

  // secretary approvals
  setupPendingRegistrationsHandlers();
  setupPendingLoanRequestsHandlers();

  setupCashierTabs();
  setupPaymentForm();


}

/**
 * Example helper function to load mock data or dynamic UI logic for home.html
 */
function loadDashboardData() {
  // If you are using mockdata.json or coopMockData, you can fetch/load them here:
  console.log("Loading dashboard tables and role permissions...");
}


// Render admin user list from mockdata (localStorage.mockdata.userAccounts)
async function getMockUserAccounts() {
  try {
    // Prefer localStorage copy (loadMockDataToLocalStorage populates this on startup)
    const stored = localStorage.getItem("mockdata");
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed.userAccounts)) return parsed.userAccounts;
      // Backwards compatibility: maybe it's userAccounts or userAccounts key missing
      if (Array.isArray(parsed.users)) return parsed.users;
    }

    // Fallback: fetch the repo mockdata file directly
    const res = await fetch("mockdata/mockdata.json", { cache: "no-store" });
    if (!res.ok) return [];
    const data = await res.json();
    return data.userAccounts || data.user_accounts || data.users || [];
  } catch (err) {
    console.warn("Failed to load mock users:", err);
    return [];
  }
}

async function getMockMembers() {
  try {
    // Prefer localStorage copy (loadMockDataToLocalStorage populates this on startup)
    const stored = localStorage.getItem("mockdata/mockdata.json");
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed.members)) return parsed.members;

    }

    // Fallback: fetch the repo mockdata file directly
    const res = await fetch("mockdata/mockdata.json", { cache: "no-store" });
    if (!res.ok) return [];
    const data = await res.json();
    return data.members || [];
  } catch (err) {
    console.warn("Failed to load mock users:", err);
    return [];
  }
}

function renderOfficerMembers() {
  try {
    const tbody = document.getElementById("officerMembersTbody");
    if (!tbody) return;

    const members = getMembersFromLocalStorage();
    if (!members.length) {
      tbody.innerHTML = `<tr><td colspan="7" class="small text-muted text-center">No members found</td></tr>`;
      return;
    }

    tbody.innerHTML = members.map((m) => {
      const id = m.memberID || m.memberId || m.id || "";
      let name = "";
      if (m.name) {
        name = typeof m.name === "string"
          ? m.name
          : `${m.name.first || ""} ${m.name.last || ""}`.trim();
      } else {
        name = m.fullName || m.memberName || "";
      }

      const status = (m.memberStatus || m.status || "").toString();
      const type = (m.memberType || m.type || "").toString();
      const shared = Number(m.sharedCapital || m.shared_capital || m.initialPaymentAmount || 0) || 0;
      const contact = (m.contacts && (m.contacts.num || m.contacts.phone)) || m.contact || "";
      const joined = m.createdAt ? new Date(m.createdAt).toLocaleDateString() : "";

      return `
        <tr data-member-id="${escapeHtml(id)}">
          <td class="small">${escapeHtml(id)}</td>
          <td>${escapeHtml(name)}</td>
          <td>${escapeHtml(status)}</td>
          <td>${escapeHtml(type)}</td>
          <td class="text-end">₱${shared.toLocaleString()}</td>
          <td>${escapeHtml(contact)}</td>
          <td class="small text-muted">${escapeHtml(joined)}</td>
        </tr>
      `;
    }).join("");
  } catch (err) {
    console.warn("renderOfficerMembers error", err);
  }
}




async function renderAdminUsers() {
  const tbody = document.getElementById("adminUsersTbody");
  if (!tbody) return;
  tbody.innerHTML = "";

  const accounts = await getMockUserAccounts();

  if (!accounts.length) {
    tbody.innerHTML = `<tr><td colspan="5" class="text-muted small text-center">No users found</td></tr>`;
    return;
  }

  accounts.forEach((user) => {
    // Map fields from mock to table columns
    const userId = user.userID || user.userId || user.userId || user.id || "";
    const displayName = user.name || user.fullName || `${user.firstName || ""} ${user.lastName || ""}` || "";
    const username = user.username || user.user || "";
    const role = user.userLevel || user.role || user.userRole || "Admin";

    const tr = document.createElement("tr");
    tr.dataset.id = userId || username || ""; // store identifier for edits/deletes
    tr.innerHTML = `
      <td>${escapeHtml(userId)}</td>
      <td>${escapeHtml(displayName)}</td>
      <td>${escapeHtml(username)}</td>
      <td><span class="badge ${role === 'Admin' ? 'bg-dark' : role === 'Officer' ? 'bg-warning text-dark' : 'bg-secondary'}">${escapeHtml(role)}</span></td>
      <td>
        <button class="btn btn-sm btn-outline-primary edit-user-btn">Edit</button>
        <button class="btn btn-sm btn-outline-danger delete-user-btn ms-1">Delete</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// Helper to persist/modify the mockdata.userAccounts in localStorage
function readMockdata() {
  const raw = localStorage.getItem("mockdata");
  return raw ? JSON.parse(raw) : {};
}
function writeMockdata(obj) {
  localStorage.setItem("mockdata", JSON.stringify(obj));
}

// Update existing setupAdminUserHandlers to persist new users and re-render
function setupAdminUserHandlers() {
  const addUserBtn = document.getElementById("addUserBtn");
  const addUserModalEl = document.getElementById("addUserModal");
  const addUserForm = document.getElementById("addUserForm");
  const adminTableTbody = document.getElementById("adminUsersTbody"); // changed to id

  if (!addUserBtn || !addUserModalEl || !addUserForm || !adminTableTbody) return;

  const bootstrapModal = new bootstrap.Modal(addUserModalEl);

  addUserBtn.addEventListener("click", () => {
    addUserForm.reset();
    bootstrapModal.show();
  });

  addUserForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const userId = (document.getElementById("userId").value || `USR-${Date.now()}`).trim();
    const fullName = document.getElementById("fullName").value.trim();
    const username = document.getElementById("username").value.trim();
    const roleLevel = document.getElementById("roleLevel").value;
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirmPassword").value;

    // Basic validation
    if (!fullName || !username) {
      alert("Please fill in Full Name and Username.");
      return;
    }
    if (password !== confirmPassword) {
      alert("Passwords do not match.");
      return;
    }

    // Build user object to match mockdata shape
    const newUser = {
      userID: userId,
      userLevel: roleLevel,
      name: fullName,
      email: "", // optionally collect email in modal if you want
      username,
      password: "local-only" // placeholder
    };

    // Persist to local mockdata.userAccounts
    const mock = readMockdata();
    mock.userAccounts = Array.isArray(mock.userAccounts) ? mock.userAccounts : [];
    mock.userAccounts.push(newUser);
    writeMockdata(mock);

    // Re-render admin users
    renderAdminUsers();

    // Close modal
    bootstrapModal.hide();
  });

 
}




// API helper: put this near top of js/home.js or in a new js/api.js and import
async function createUserOnServer(user, { baseUrl = "" } = {}) {
  // Optional: include auth token if you have one
  const token = localStorage.getItem("authToken"); // adjust key as needed

  const res = await fetch(`${baseUrl}/api/users`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(user),
  });

  const body = await res.json().catch(() => null);
  if (!res.ok) {
    const msg = (body && (body.error || body.message)) || `Request failed (${res.status})`;
    const err = new Error(msg);
    err.status = res.status;
    err.body = body;
    throw err;
  }
  return body; // created user object
}


function setupEditUserHandlers() {
  const adminTableTbody = document.querySelector("#adminSection table tbody");
  const editModalEl = document.getElementById("editUserModal");
  const editForm = document.getElementById("editUserForm");

  if (!adminTableTbody || !editModalEl || !editForm) return;

  const editModal = new bootstrap.Modal(editModalEl);

  // Delegated handler: open edit modal and populate fields
  adminTableTbody.addEventListener("click", (e) => {
    const editBtn = e.target.closest(".edit-user-btn, .btn-outline-primary");
    if (!editBtn) return;

    const row = editBtn.closest("tr");
    if (!row) return;

    // Extract values from the row cells (assumes column order matches table header)
    const cells = row.querySelectorAll("td");
    // Safe guards: adjust indexes if the table layout changes
    const userId = (cells[0] && cells[0].textContent.trim()) || "";
    const fullName = (cells[1] && cells[1].textContent.trim()) || "";
    const username = (cells[2] && cells[2].textContent.trim()) || "";
    const roleBadge = cells[3] && cells[3].querySelector("span");
    const role = roleBadge ? roleBadge.textContent.trim() : "";

    // Store row index so we can update it after successful edit
    const rowIndex = Array.from(adminTableTbody.querySelectorAll("tr")).indexOf(row);

    // Populate form fields
    document.getElementById("editRowIndex").value = rowIndex;
    document.getElementById("editUserInternalId").value = userId; // use as identifier; replace with real id when available
    document.getElementById("editUserId").value = userId;
    document.getElementById("editFullName").value = fullName;
    document.getElementById("editUsername").value = username;
    document.getElementById("editRoleLevel").value = role || "Officer";
    document.getElementById("editPassword").value = ""; // leave empty by default

    editModal.show();
  });

  // Submit handler: validate and apply changes to the row (slot for API)
  editForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const rowIndex = parseInt(document.getElementById("editRowIndex").value, 10);
    const internalId = document.getElementById("editUserInternalId").value;
    const newFullName = document.getElementById("editFullName").value.trim();
    const newUsername = document.getElementById("editUsername").value.trim();
    const newRole = document.getElementById("editRoleLevel").value;
    const newPassword = document.getElementById("editPassword").value;

    if (!newFullName || !newUsername) {
      alert("Full Name and Username are required.");
      return;
    }

    // Optional: Call backend API to update user here (replace with your endpoint)
    // Example stub (uncomment and implement when backend is ready)
    try {
      const updated = await updateUserOnServer(internalId, {
        fullName: newFullName,
        username: newUsername,
        role: newRole,
        ...(newPassword ? { password: newPassword } : {})
      });
      // use returned 'updated' object if server returns finalized fields
    } catch (err) {
      alert("Failed to update user: " + (err.message || err));
      return;
    }

    // Update the table row locally
    const rows = adminTableTbody.querySelectorAll("tr");
    const targetRow = rows[rowIndex];
    if (targetRow) {
      const cells = targetRow.querySelectorAll("td");
      if (cells[1]) cells[1].textContent = newFullName;
      if (cells[2]) cells[2].textContent = newUsername;
      if (cells[3]) {
        const badge = cells[3].querySelector("span");
        if (badge) {
          // update badge text & classes
          badge.textContent = newRole;
          badge.className = "badge " + (newRole === "Admin" ? "bg-dark" : newRole === "Officer" ? "bg-warning text-dark" : newRole === "Secretary" ? "bg-success" : "bg-info text-dark");
        } else {
          cells[3].innerHTML = `<span class="badge ${newRole === "Admin" ? "bg-dark" : newRole === "Officer" ? "bg-warning text-dark" : newRole === "Secretary" ? "bg-success" : "bg-info text-dark"}">${newRole}</span>`;
        }
      }
    }

    // Hide modal after local update
    editModal.hide();
    editForm.reset();
  });
}

// Optional API stub to call later
async function updateUserOnServer(internalId, payload, { baseUrl = "" } = {}) {
  // Replace with real implementation when backend is available.
  // Example:
  // const res = await fetch(`${baseUrl}/api/users/${encodeURIComponent(internalId)}`, {
  //   method: "PATCH",
  //   headers: { "Content-Type": "application/json" },
  //   body: JSON.stringify(payload)
  // });
  // if (!res.ok) throw new Error('Update failed');
  // return res.json();
  return Promise.resolve({ ok: true, ...payload });
}

// Call setupDeleteUserHandlers() from initHome() (e.g., next to setupEditUserHandlers())
function setupDeleteUserHandlers() {
  const adminTableTbody = document.getElementById("adminUsersTbody");
  const deleteModalEl = document.getElementById("deleteUserModal");
  const deleteModal = deleteModalEl ? new bootstrap.Modal(deleteModalEl) : null;
  const deleteUserNameEl = document.getElementById("deleteUserName");
  const deleteUserIdentifierEl = document.getElementById("deleteUserIdentifier");
  const deleteErrorEl = document.getElementById("deleteErrorMsg");
  const confirmDeleteBtn = document.getElementById("confirmDeleteUserBtn");

  if (!adminTableTbody || !deleteModalEl || !confirmDeleteBtn) return;

  let pendingRow = null;
  let pendingUserId = null;

  // Open modal when the delete button is clicked (no confirm())
  adminTableTbody.addEventListener("click", (e) => {
    const deleteBtn = e.target.closest(".delete-user-btn, .btn-outline-danger");
    if (!deleteBtn) return;

    const row = deleteBtn.closest("tr");
    if (!row) return;

    pendingUserId = row.dataset.id || (row.cells[0] ? row.cells[0].textContent.trim() : null);
    const fullName = row.cells[1] ? row.cells[1].textContent.trim() : "";
    const username = row.cells[2] ? row.cells[2].textContent.trim() : "";
    const identifierText = (pendingUserId ? pendingUserId : (username || "—")) + (username ? ` · ${username}` : "");

    pendingRow = row;

    if (deleteUserNameEl) deleteUserNameEl.textContent = fullName || "Unnamed user";
    if (deleteUserIdentifierEl) deleteUserIdentifierEl.textContent = identifierText;
    if (deleteErrorEl) {
      deleteErrorEl.classList.add("d-none");
      deleteErrorEl.textContent = "";
    }

    deleteModal.show();
  });

  // Confirm delete: removes row (and persist change)
  confirmDeleteBtn.addEventListener("click", async () => {
    if (!pendingRow) {
      deleteModal.hide();
      return;
    }

    confirmDeleteBtn.disabled = true;
    const originalText = confirmDeleteBtn.textContent;
    confirmDeleteBtn.textContent = "Deleting...";

    try {
      // If you have a backend, call it here (DELETE /api/users/:id)
      // await deleteUserOnServer(pendingUserId);

      // Remove from local mockdata.userAccounts
      const mock = readMockdata();
      mock.userAccounts = (mock.userAccounts || []).filter(u => {
        const idCandidates = [u.userID, u.userId, u.id, u.username].filter(Boolean);
        return !idCandidates.includes(pendingUserId);
      });
      writeMockdata(mock);

      // Remove row from UI
      pendingRow.remove();

      deleteModal.hide();
    } catch (err) {
      if (deleteErrorEl) {
        deleteErrorEl.textContent = (err && (err.message || err.toString())) || "Failed to delete user";
        deleteErrorEl.classList.remove("d-none");
      } else {
        alert("Failed to delete user: " + (err && err.message ? err.message : err));
      }
    } finally {
      confirmDeleteBtn.disabled = false;
      confirmDeleteBtn.textContent = originalText;
      pendingRow = null;
      pendingUserId = null;
    }
  });
}

// Stub function placeholder for when your backend is ready.
// Replace baseUrl and implement authentication as needed.
async function deleteUserOnServer(internalId, { baseUrl = "" } = {}) {
  // Example:
  // const token = localStorage.getItem('authToken');
  // const res = await fetch(`${baseUrl}/api/users/${encodeURIComponent(internalId)}`, {
  //   method: 'DELETE',
  //   headers: { 'Authorization': `Bearer ${token}` }
  // });
  // if (!res.ok) throw new Error('Delete failed: ' + res.status);
  // return res.json();
  return Promise.resolve({ ok: true });
}




// -- helper: safe text escape (if not present) --
function escapeHtml(text) {
  if (!text) return "";
  return String(text).replace(/[&<>"']/g, (m) => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[m]));
}
// officer
// Load mockdata/mockdata.json into localStorage.mockdata (if not present)
// Call once on app startup so we have consistent local test data to work with
async function loadMockDataToLocalStorage() {
  try {
    const existing = localStorage.getItem("mockdata");
    if (existing) return; // don't overwrite if dev already has local changes

const res = await fetch("mockdata/mockdata.json", { cache: "no-store" });
if (!res.ok) return;
const data = await res.json();
// Optional transformation: convert older 'basicInfo' string to structured fields if needed
if (Array.isArray(data.members)) {
  data.members = data.members.map(m => {
    // if m.basicInfo is a string like "Male, Married, Citizen", try to parse it
    let parsedBasic = {};
    if (typeof m.basicInfo === "string") {
      const parts = m.basicInfo.split(",").map(p => p.trim());
      parsedBasic.gender = parts[0] || "";
      parsedBasic.civilStatus = parts[1] || "";
      parsedBasic.nationality = parts[2] || "";
    } else if (typeof m.basicInfo === "object") {
      parsedBasic = m.basicInfo;
    }
    // ensure contacts shape
    const contacts = m.contacts || {};
    return {
      memberID: m.memberID || m.memberId || (`MEM-${Date.now().toString().slice(-6)}`),
      controlNumber: m.controlNumber || "",
      name: m.name || { first: "", middle: "", last: "" },
      basicInfo: {
        gender: parsedBasic.gender || (m.gender || ""),
        birthdate: parsedBasic.birthdate || (m.birthdate || ""),
        civilStatus: parsedBasic.civilStatus || (m.civilStatus || ""),
        nationality: parsedBasic.nationality || (m.nationality || "")
      },
      contacts: {
        num: contacts.num || contacts.phone || "",
        email: contacts.email || "",
        addr: contacts.addr || contacts.address || ""
      },
      initialPaymentAmount: m.initialPaymentAmount || m.initialPayment || 0,
      income: m.income || { annual: 0, monthly: 0 },
      memberStatus: m.memberStatus || "Active",
      memberType: (m.memberType || "Associate"),
      // NEW: ensure a numeric sharedCapital exists (used for loan max)
      sharedCapital: (m.sharedCapital != null ? m.sharedCapital : (m.shared_capital != null ? m.shared_capital : 0)),
      createdAt: m.createdAt || new Date().toISOString()
    };
  });
}

// Ensure loanRequests exists so the pending-loans UI can read safely
if (!Array.isArray(data.loanRequests)) data.loanRequests = data.loanRequests || [];

localStorage.setItem("mockdata", JSON.stringify(data));
  } catch (err) {
    console.warn("Failed to load mockdata into localStorage:", err);
  }
}




// small helper to generate member IDs
function generateMemberId() {
  const year = new Date().getFullYear();
  const suffix = Date.now().toString().slice(-6);
  return `MEM-${year}-${suffix}`;
}

// Setup officer member registration form handling
function setupOfficerRegistrationForm() {
  const form = document.getElementById("memberRegistrationForm");
  if (!form) return;

  const memberTypeSelect = document.getElementById("memberTypeSelect");
  const initialPaymentInput = document.getElementById("initialPayment");

  // Auto-update initial payment based on member type
  if (memberTypeSelect && initialPaymentInput) {
    const updateInitialPayment = () => {
      const selectedType = memberTypeSelect.value;
      const feeMap = { Associate: 1000, Regular: 3000 };
      initialPaymentInput.value = feeMap[selectedType] || 1000;
    };
    memberTypeSelect.addEventListener("change", updateInitialPayment);
    updateInitialPayment();
  }

  form.addEventListener("submit", async function (event) {
    event.preventDefault();

    // Validate required fields
    const requiredFields = form.querySelectorAll("[required]");
    let valid = true;
    requiredFields.forEach((field) => {
      const val = field.value || "";
      if (!val.toString().trim()) {
        valid = false;
        field.classList.add("is-invalid");
      } else {
        field.classList.remove("is-invalid");
      }
    });
    if (!valid) {
      alert("Please complete all required fields.");
      return;
    }

    // Build structured payload
    const memberId = generateMemberId();
    const first = document.getElementById("firstName").value.trim();
    const middle = document.getElementById("middleName").value.trim();
    const last = document.getElementById("lastName").value.trim();

    const gender = document.getElementById("memberGender").value;
    const birthdate = document.getElementById("memberBirthdate").value;
    const civilStatus = document.getElementById("memberCivilStatus").value;
    const nationality = document.getElementById("memberNationality").value;

    const contactNum = document.getElementById("memberContact").value.trim();
    const email = document.getElementById("memberEmail").value.trim();
    const address = document.getElementById("memberAddress").value.trim();

    const monthlyIncome = parseFloat(document.getElementById("monthlyIncome").value) || 0;
    const memberType = memberTypeSelect?.value || "Associate";
    const controlNumber = document.getElementById("controlNumber").value.trim();
    const initialPayment = parseFloat(initialPaymentInput?.value || 0) || 0;

    const payload = {
      memberID: memberId,
      controlNumber: controlNumber || `COP-${new Date().getFullYear()}-${memberId.slice(-4)}`,
      name: { first, middle, last },
      basicInfo: {
        gender,
        birthdate,
        civilStatus,
        nationality
      },
      contacts: {
        num: contactNum,
        email,
        addr: address
      },
      initialPaymentAmount: initialPayment,
      income: {
        monthly: monthlyIncome,
        annual: Math.round(monthlyIncome * 12)
      },
      memberStatus: "Pending", // pending approval
      memberType,
      createdAt: new Date().toISOString()
    };

    // BACKEND SLOT:
    // Replace this localStorage section with a fetch() POST to your backend when ready:
    // e.g. await fetch('/api/member-registrations', { method: 'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) })
// Local fallback: save pending registration and also add to mockdata.members
try {
  // Persist to pendingRegistrations queue
  const pending = JSON.parse(localStorage.getItem("pendingRegistrations") || "[]");
  pending.push(payload);
  localStorage.setItem("pendingRegistrations", JSON.stringify(pending));

  // Attach current officer info to the stored member for future transactions/audit
  const currentUserId = localStorage.getItem('currentUser') || '';
  const currentUserName = localStorage.getItem('currentUserName') || '';

  const memberToStore = Object.assign({}, payload, {
    assignedOfficer: currentUserName || undefined,
    officerID: currentUserId || undefined
  });

  // Persist into mockdata.members (local test store)
  const mockdataRaw = JSON.parse(localStorage.getItem("mockdata") || "{}");
  mockdataRaw.members = Array.isArray(mockdataRaw.members) ? mockdataRaw.members : [];
  mockdataRaw.members.push(memberToStore);
  localStorage.setItem("mockdata", JSON.stringify(mockdataRaw));

  // Notify same-tab listeners to pick up the change (Officer view, select lists, etc.)
  window.dispatchEvent(new CustomEvent("mockdataUpdated", { detail: { memberId: memberToStore.memberID || memberToStore.memberId } }));
} catch (err) {
  console.error("Save failed:", err);
  alert("Failed to save registration locally. See console.");
  return;
}

    // UI feedback & reset
    alert("Registration submitted for approval (saved locally).");
    form.reset();
    if (memberTypeSelect && initialPaymentInput) {
      memberTypeSelect.value = "Associate";
      initialPaymentInput.value = "1000";
    }
  });
}

// API helper: create farm on server
async function createFarmOnServer(farm, { baseUrl = window.apiBaseUrl || "" } = {}) {
  if (!baseUrl) {
    // If no baseUrl configured, signal caller to use local fallback
    const err = new Error("No API base URL configured");
    err.noBase = true;
    throw err;
  }

  const token = localStorage.getItem("authToken"); // adjust key if needed
  const res = await fetch(`${baseUrl.replace(/\/$/, "")}/api/farms`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { "Authorization": `Bearer ${token}` } : {})
    },
    body: JSON.stringify(farm)
  });

  const body = await res.json().catch(() => null);
  if (!res.ok) {
    const msg = (body && (body.error || body.message)) || `Create farm failed (${res.status})`;
    const err = new Error(msg);
    err.status = res.status;
    err.body = body;
    throw err;
  }
  return body; // expect created farm object (with id/farmID and createdAt)
}

// Setup farm registration form with income support and API slot
function setupFarmRegistrationForm() {
  const form = document.getElementById("farmRegistrationForm");
  if (!form) return;


  const farmIdInput = document.getElementById("farmId");
  const memberIdInput = document.getElementById("farmMemberId");
  const coordsInput = document.getElementById("farmCoordinates");
  const areaInput = document.getElementById("farmArea");
  const barangayInput = document.getElementById("farmBarangay");
  const municipalityInput = document.getElementById("farmMunicipality");
  const provinceInput = document.getElementById("farmProvince");
  const ownershipTypeInput = document.getElementById("farmOwnershipType");
  const tenureStatusInput = document.getElementById("farmTenureStatus");
  const commoditiesInput = document.getElementById("farmCommodities");
  const assetsInput = document.getElementById("farmAssets");
  const monthlyIncomeInput = document.getElementById("farmMonthlyIncome");
  const annualIncomeInput = document.getElementById("farmAnnualIncome");
  const notesInput = document.getElementById("farmNotes");

  const farmsTableBody = document.querySelector("#farmsListTable tbody");


  function generateFarmId() {
    return `FARM-${Date.now().toString().slice(-6)}`;
  }

    if (farmIdInput && !farmIdInput.value) farmIdInput.value = generateFarmId();
  // Ensure the select is populated before rendering/validation
  // if populateMemberIdSelect is async, await it so options exist when user interacts
  (async () => {
    try {
      await populateMemberIdSelect();
    } catch (e) {
      console.warn("populateMemberIdSelect failed", e);
    }
    // Optionally preselect last chosen member
    try {
      const last = localStorage.getItem("loanLastMemberId") || localStorage.getItem("loanLastMemberId");
      if (last && memberIdSelect) memberIdSelect.value = last;
    } catch (e) {}
    // Render saved farms (was already below)
    renderRegisteredFarms();
  })();

  // ... rest of function unchanged except use memberIdSelect.value instead of .value on input ...
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const farm = {
      id: farmIdInput.value || generateFarmId(),
      memberID: (memberIdInput && memberIdInput.value.trim()) || "",
      coordinates: (coordsInput && coordsInput.value.trim()) || "",
      areaSqM: parseFloat((areaInput && areaInput.value) || 0) || 0,
      barangay: (barangayInput && barangayInput.value.trim()) || "",
      municipality: (municipalityInput && municipalityInput.value.trim()) || "",
      province: (provinceInput && provinceInput.value.trim()) || "",
      ownership: (ownershipTypeInput && ownershipTypeInput.value) || "Owned",
      tenureStatus: (tenureStatusInput && tenureStatusInput.value) || "Registered",
      commodities: (commoditiesInput && commoditiesInput.value.trim()) || "",
      assets: (assetsInput && assetsInput.value.trim()) || "",
      income: {
        monthly: parseFloat((monthlyIncomeInput && monthlyIncomeInput.value) || 0) || 0,
        annual: parseFloat((annualIncomeInput && annualIncomeInput.value) || 0) || 0
      },
      notes: (notesInput && notesInput.value.trim()) || "",
      createdAt: new Date().toISOString()
    };

    // Normalize: if monthly set but annual not, infer annual; vice versa
    if (!farm.income.annual && farm.income.monthly) farm.income.annual = Math.round(farm.income.monthly * 12);
    if (!farm.income.monthly && farm.income.annual) farm.income.monthly = Math.round(farm.income.annual / 12);

    // Validation: require memberID and barangay + (coordinates or area)
    const missing = [];
    if (!farm.memberID) missing.push("Member ID");
    if (!farm.barangay) missing.push("Barangay");
    if (!farm.coordinates && !farm.areaSqM) missing.push("Coordinates or Area");
    if (missing.length) {
      alert("Please provide: " + missing.join(", "));
      return;
    }
     // UI: disable submit while saving
    const submitBtn = form.querySelector("button[type='submit']");
    const origText = submitBtn ? submitBtn.textContent : null;
    if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = "Saving..."; }

    // Attempt server call first if api base is configured
    try {
      let createdFarm = null;
      try {
        createdFarm = await createFarmOnServer(farm); // will throw if baseUrl not configured or server error
      } catch (apiErr) {
        if (apiErr.noBase) {
          // No base set — fallback to local save
          createdFarm = null;
        } else {
          // API exists but returned error — show message and fallback/local decision
          console.error("API error creating farm:", apiErr);
          // Option: rethrow to show error to user — here we'll fall back to local save but show an alert
          alert("Failed to save to server: " + apiErr.message + "\nSaving locally instead.");
        }
      }

      if (createdFarm && (createdFarm.id || createdFarm.farmID || createdFarm._id)) {
        // Use server's id/timestamps
        const idFromServer = createdFarm.id || createdFarm.farmID || createdFarm._id;
        farm.id = idFromServer;
        farm.createdAt = createdFarm.createdAt || farm.createdAt;
      } else {
        // Local fallback: persist to localStorage
        const stored = JSON.parse(localStorage.getItem("registeredFarms") || "[]");
        stored.push(farm);
        localStorage.setItem("registeredFarms", JSON.stringify(stored));
      }

      // Update UI (append or update row)
      appendFarmRow(farm, farmsTableBody);

      // Reset form, generate a new id
      form.reset();
      if (farmIdInput) farmIdInput.value = generateFarmId();
      alert("Farm registered successfully (local or remote).");
    } catch (err) {
      console.error("Save farm error:", err);
      alert("Failed to save farm: " + (err.message || err));
    } finally {
      if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = origText; }
    }
  });


  if (farmsTableBody) {
    farmsTableBody.addEventListener("click", async (e) => {
      const btn = e.target.closest(".remove-farm-btn");
      if (!btn) return;
      const row = btn.closest("tr");
      const farmId = row && row.dataset.id;
      if (!farmId) return;
      if (!confirm("Remove this registered farm?")) return;

      // If server exists you should call DELETE /api/farms/:id and remove only on success.
      // For now remove local copy.
      const list = JSON.parse(localStorage.getItem("registeredFarms") || "[]");
      const filtered = list.filter(f => f.id !== farmId);
      localStorage.setItem("registeredFarms", JSON.stringify(filtered));
      row.remove();
    });
  }

  function renderRegisteredFarms() {
    if (!farmsTableBody) return;
    farmsTableBody.innerHTML = "";
    const list = JSON.parse(localStorage.getItem("registeredFarms") || "[]");
    list.forEach(farm => appendFarmRow(farm, farmsTableBody));
  }

  function appendFarmRow(farm, tbody) {
    if (!tbody) return;
    let existingRow = tbody.querySelector(`tr[data-id="${farm.id}"]`);
    const tr = existingRow || document.createElement("tr");
    tr.dataset.id = farm.id;

    tr.innerHTML = `
      <td>${escapeHtml(farm.id)}</td>
      <td>${escapeHtml(farm.memberID)}</td>
      <td>${escapeHtml(farm.coordinates)}</td>
      <td>${farm.areaSqM ? escapeHtml(String(farm.areaSqM)) : ""}</td>
      <td>${escapeHtml([farm.barangay, farm.municipality, farm.province].filter(Boolean).join(" / "))}</td>
      <td>${escapeHtml(farm.commodities)}</td>
      <td>${escapeHtml(farm.assets)}</td>
      <td>${escapeHtml(farm.ownership)}</td>
      <td>${escapeHtml(farm.tenureStatus)}</td>
      <td>${farm.income && farm.income.monthly ? escapeHtml(String(farm.income.monthly)) : ""}</td>
      <td class="small text-muted">${new Date(farm.createdAt).toLocaleString()}</td>
      <td><button class="btn btn-sm btn-outline-danger remove-farm-btn">Remove</button></td>
    `;

    if (!existingRow) tbody.appendChild(tr);
  }

}


// Populate #farmMemberId <select> from localStorage.mockdata.members (async, safe)
async function populateMemberIdSelect() {
  const sel = document.getElementById("farmMemberId");
  if (!sel) return;

  sel.innerHTML = '<option value="">Select member</option>';

  // Try localStorage.mockdata first
  let members = [];
  try {
    const raw = localStorage.getItem("mockdata");
    if (raw) {
      const mock = JSON.parse(raw);
      members = Array.isArray(mock.members) ? mock.members : [];
    }
  } catch (e) {
    members = [];
  }

  // Fallback: try reading mockdata/mockdata.json (non-blocking)
  if (!members.length) {
    try {
      const res = await fetch("mockdata/mockdata.json", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        members = Array.isArray(data.members) ? data.members : [];
      }
    } catch (e) { /* ignore network errors */ }
  }

  // Normalize and append options
  (members || []).forEach(m => {
    const id = String(m.memberID ?? m.memberId ?? m.id ?? "").trim();
    if (!id) return;
    let name = "";
    if (m.name) {
      name = typeof m.name === "string" ? m.name : `${m.name.first || ""} ${m.name.last || ""}`.trim();
    } else {
      name = m.fullName || m.memberName || "";
    }
    const label = name ? `${id} — ${name}` : id;
    const opt = document.createElement("option");
    opt.value = id;
    opt.textContent = label;
    sel.appendChild(opt);
  });
}


function lookupMemberById(memberId) {
  if (!memberId) return null;
  try {
    const raw = localStorage.getItem("mockdata");
    if (raw) {
      const mock = JSON.parse(raw);
      const members = Array.isArray(mock.members) ? mock.members : [];
      return members.find(m => String(m.memberID ?? m.memberId ?? m.id) === String(memberId)) || null;
    }
  } catch (e) { /* ignore */ }
  return null;
}

// OFFICER END

// SECRETARY
// Render pending registrations for Secretary view
async function getPendingRegistrations() {
  // Prefer localStorage queue (populated by officer form)
  try {
    const raw = localStorage.getItem("pendingRegistrations");
    if (raw) {
      return JSON.parse(raw);
    }
    // Fallback: if mockdata has a "pendingRegistrations" key
    const mockRaw = localStorage.getItem("mockdata");
    if (mockRaw) {
      const mock = JSON.parse(mockRaw);
      if (Array.isArray(mock.pendingRegistrations)) return mock.pendingRegistrations;
    }
    return [];
  } catch (err) {
    console.warn("Failed to read pending registrations:", err);
    return [];
  }
}

// Render pending registrations (ensures each <tr> has dataset.pendingId)
async function renderPendingRegistrations() {
  const tbody = document.getElementById("pendingRegistrationsTbody");
  if (!tbody) return;
  tbody.innerHTML = "";

  // Merge explicit pendingRegistrations with any mock members flagged Pending (non-destructive)
  const pendingList = await getPendingRegistrations(); // keep existing merge logic if present

  if (!pendingList.length) {
    tbody.innerHTML = `<tr><td colspan="5" class="text-muted small text-center">No pending registrations</td></tr>`;
    return;
  }

  pendingList.forEach((reg, idx) => {
    const coopId = reg.controlNumber || reg.memberID || "";
    const fullName = reg.name ? `${reg.name.first || ""} ${reg.name.middle || ""} ${reg.name.last || ""}`.trim() : (reg.fullName || "Unnamed");
    const memberType = reg.memberType || "Associate";
    const initialPay = reg.initialPaymentAmount != null ? `₱${Number(reg.initialPaymentAmount).toLocaleString()}` : "₱0";

    const tr = document.createElement("tr");
    // stable id: prefer memberID/controlNumber, else generate a pending id
    const pendingId = reg.memberID || reg.controlNumber || `PEND-${Date.now().toString().slice(-6)}-${idx}`;
    tr.dataset.pendingId = pendingId;

    tr.innerHTML = `
      <td>${escapeHtml(coopId)}</td>
      <td>${escapeHtml(fullName)}</td>
      <td><span class="badge ${memberType === 'Associate' ? 'bg-info' : 'bg-secondary'}">${escapeHtml(memberType)}</span></td>
      <td>${escapeHtml(initialPay)}</td>
      <td>
        <button class="btn btn-sm btn-success approve-registration-btn me-1">Approve</button>
        <button class="btn btn-sm btn-outline-danger deny-registration-btn">Deny</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// Setup handlers using the modal workflow (approve modal, reject modal, result modal)
function setupPendingRegistrationsHandlers() {
  const tbody = document.getElementById("pendingRegistrationsTbody");
  if (!tbody) return;

  // Modal elements
  const approveModalEl = document.getElementById("approveRegistrationModal");
  const approveModal = new bootstrap.Modal(approveModalEl);
  const approveCoopIdEl = document.getElementById("approveCoopId");
  const approveNameEl = document.getElementById("approveName");
  const approveErrorEl = document.getElementById("approveError");
  const confirmApproveBtn = document.getElementById("confirmApproveBtn");

  const rejectModalEl = document.getElementById("rejectRegistrationModal");
  const rejectModal = new bootstrap.Modal(rejectModalEl);
  const rejectCoopIdEl = document.getElementById("rejectCoopId");
  const rejectNameEl = document.getElementById("rejectName");
  const rejectForm = document.getElementById("rejectRegistrationForm");
  const confirmRejectBtn = document.getElementById("confirmRejectBtn"); // ensure this is selected once

  const resultModalEl = document.getElementById("actionResultModal");
  const resultModal = new bootstrap.Modal(resultModalEl);
  const resultIconEl = document.getElementById("actionResultIcon");
  const resultMsgEl = document.getElementById("actionResultMessage");

  // Local state to hold the selected pending record between modal open and confirm
  let currentPendingId = null;
  let currentPendingRecord = null;

  // Utility: find pending record by dataset id
  function findPendingById(pendingId) {
    const pending = JSON.parse(localStorage.getItem("pendingRegistrations") || "[]");
    if (pending.length) {
      const found = pending.find(p => (p.memberID || p.controlNumber || "") === pendingId);
      if (found) return { source: "pendingRegistrations", record: found };
    }
    const mockRaw = JSON.parse(localStorage.getItem("mockdata") || "{}");
    const members = Array.isArray(mockRaw.members) ? mockRaw.members : [];
    const foundMember = members.find(m => (m.memberID || m.controlNumber || "") === pendingId && (m.memberStatus || "").toLowerCase() === "pending");
    if (foundMember) return { source: "mockMembers", record: foundMember };
    return null;
  }

  // Show result modal helper
  function showResult(success, message) {
    resultIconEl.innerHTML = success ? '<span class="text-success">✓</span>' : '<span class="text-danger">✕</span>';
    resultMsgEl.textContent = message || (success ? "Action completed." : "Action failed.");
    resultModal.show();
  }

  // Click handler opens approver/reject modals
  tbody.addEventListener("click", (e) => {
    const approveBtn = e.target.closest(".approve-registration-btn");
    const denyBtn = e.target.closest(".deny-registration-btn");
    if (!approveBtn && !denyBtn) return;
    const row = (approveBtn || denyBtn).closest("tr");
    if (!row) return;

    currentPendingId = row.dataset.pendingId;
    const lookup = findPendingById(currentPendingId);
    currentPendingRecord = lookup ? lookup.record : null;

    const fullName = currentPendingRecord && currentPendingRecord.name
      ? `${currentPendingRecord.name.first || ""} ${currentPendingRecord.name.middle || ""} ${currentPendingRecord.name.last || ""}`.trim()
      : (currentPendingRecord && (currentPendingRecord.fullName || "")) || "Unnamed";

    const coopId = currentPendingRecord && (currentPendingRecord.controlNumber || currentPendingRecord.memberID) || "";

    if (approveBtn) {
      approveCoopIdEl.textContent = coopId;
      approveNameEl.textContent = fullName;
      approveErrorEl.classList.add("d-none");
      approveErrorEl.textContent = "";
      approveModal.show();
      return;
    }

    if (denyBtn) {
      rejectCoopIdEl.textContent = coopId;
      rejectNameEl.textContent = fullName;
      rejectModal.show();
      return;
    }
  });

  // Confirm Approve button click
  confirmApproveBtn.addEventListener("click", async () => {
    if (!currentPendingId) {
      approveErrorEl.classList.remove("d-none");
      approveErrorEl.textContent = "No item selected.";
      return;
    }

    confirmApproveBtn.disabled = true;
    confirmApproveBtn.textContent = "Approving...";

    try {
      // BACKEND SLOT:
      // await createMemberOnServer(currentPendingRecord);

      // Local fallback: move from pendingRegistrations -> mockdata.members and mark Active
      const pending = JSON.parse(localStorage.getItem("pendingRegistrations") || "[]");
      const idx = pending.findIndex(p => (p.memberID || p.controlNumber || "") === currentPendingId);
      let record = null;
      if (idx !== -1) {
        record = pending.splice(idx, 1)[0];
        localStorage.setItem("pendingRegistrations", JSON.stringify(pending));
      } else {
        const mockRaw = JSON.parse(localStorage.getItem("mockdata") || "{}");
        const members = Array.isArray(mockRaw.members) ? mockRaw.members : [];
        record = members.find(m => (m.memberID || m.controlNumber || "") === currentPendingId) || currentPendingRecord;
      }

      if (record) {
        const mockRaw = JSON.parse(localStorage.getItem("mockdata") || "{}");
        mockRaw.members = Array.isArray(mockRaw.members) ? mockRaw.members : [];
        const memberToAdd = Object.assign({}, record, { memberStatus: "Active" });
        if (!memberToAdd.memberID) memberToAdd.memberID = generateMemberId();
        mockRaw.members.push(memberToAdd);
        localStorage.setItem("mockdata", JSON.stringify(mockRaw));
      }

      await renderPendingRegistrations();
      await (typeof renderAdminUsers === "function" ? renderAdminUsers() : Promise.resolve());

      approveModal.hide();
      showResult(true, "Registration approved successfully.");
    } catch (err) {
      console.error("Approve failed:", err);
      approveErrorEl.classList.remove("d-none");
      approveErrorEl.textContent = err && err.message ? err.message : "Failed to approve.";
    } finally {
      confirmApproveBtn.disabled = false;
      confirmApproveBtn.textContent = "Confirm Approve";
      currentPendingId = null;
      currentPendingRecord = null;
    }
  });

  // Reject form submit (no reason required)
  rejectForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (!confirmRejectBtn) {
      // fallback: try to select the button
      // (shouldn't be necessary if HTML has the button with id="confirmRejectBtn")
      // eslint-disable-next-line no-unused-vars
      confirmRejectBtn = document.getElementById("confirmRejectBtn");
    }
    confirmRejectBtn.disabled = true;
    const origText = confirmRejectBtn.textContent;
    confirmRejectBtn.textContent = "Rejecting...";

    try {
      // BACKEND SLOT:
      // await denyRegistrationOnServer(currentPendingId);

      // Local fallback: remove from pending and store in deniedRegistrations log
      const pending = JSON.parse(localStorage.getItem("pendingRegistrations") || "[]");
      const idx = pending.findIndex(p => (p.memberID || p.controlNumber || "") === currentPendingId);
      let record = null;
      if (idx !== -1) {
        record = pending.splice(idx, 1)[0];
        localStorage.setItem("pendingRegistrations", JSON.stringify(pending));
      } else {
        const mockRaw = JSON.parse(localStorage.getItem("mockdata") || "{}");
        const members = Array.isArray(mockRaw.members) ? mockRaw.members : [];
        const mIdx = members.findIndex(m => (m.memberID || m.controlNumber || "") === currentPendingId && (m.memberStatus || "").toLowerCase() === "pending");
        if (mIdx !== -1) {
          record = members.splice(mIdx, 1)[0];
          mockRaw.members = members;
          localStorage.setItem("mockdata", JSON.stringify(mockRaw));
        } else {
          record = currentPendingRecord;
        }
      }

      // Append to denied log (reason not used)
      const deniedLog = JSON.parse(localStorage.getItem("deniedRegistrations") || "[]");
      const deniedEntry = Object.assign({}, record || {}, {
        deniedAt: new Date().toISOString(),
        deniedReason: "", // no reason collected in current UI
        deniedBy: localStorage.getItem("currentUser") || "local"
      });
      deniedLog.push(deniedEntry);
      localStorage.setItem("deniedRegistrations", JSON.stringify(deniedLog));

      await renderPendingRegistrations();
      rejectModal.hide();
      showResult(true, "Registration rejected successfully.");
    } catch (err) {
      console.error("Reject failed:", err);
      // You can show an inline error in the modal if desired
    } finally {
      confirmRejectBtn.disabled = false;
      confirmRejectBtn.textContent = origText || "Confirm Reject";
      currentPendingId = null;
      currentPendingRecord = null;
    }
  });
}

function getPendingLoanRequests() {
  try {
    const all = readTransactionRecords(); // canonical store helper
    if (!Array.isArray(all)) return [];
    // Filter loan transactions that are pending
    const pendingLoans = all.filter(t => (t.paymentType === 'loan') && (!t.loanStatus || t.loanStatus.toLowerCase() === 'pending' || t.loanStatus.toLowerCase() === 'new'));
    return pendingLoans;
  } catch (err) {
    console.warn('getPendingLoanRequests error', err);
    return [];
  }
}

// --- Render using the normalized fields (loanID || id, memberName resolved where possible) ---
function renderPendingLoanRequests() {
  const tbody = document.getElementById("pendingLoanRequestsTbody");
  if (!tbody) return;

  tbody.innerHTML = "";
  const list = getPendingLoanRequests();

  if (!list.length) {
    tbody.innerHTML = `<tr><td colspan="7" class="text-muted small text-center">No pending loan requests</td></tr>`;
    return;
  }

  list.forEach((loan) => {
    const loanId = loan.transactionID || loan.transactionId || loan.loanID || loan.id || '';
    const memberName = loan.name || loan.memberName || 'Unknown Member';
    const loanType = loan.memberType || loan.loanType || 'Associate';
    const capital = loan.sharedCapital || loan.capital || '₱0';
    const requestedAmount = Number(loan.requestedAmount || loan.requestedAmount || loan.loanAmount || 0);
    const term = loan.loanDurationMonths || loan.loanDuration || 'N/A';

    const tr = document.createElement("tr");
    tr.dataset.loanId = loanId;
    tr.innerHTML = `
      <td>${escapeHtml(loanId)}</td>
      <td>${escapeHtml(memberName)}</td>
      <td>${escapeHtml(loanType)}</td>
      <td>${escapeHtml(capital)}</td>
      <td>₱${Number(requestedAmount || 0).toLocaleString()}</td>
      <td>${escapeHtml(String(term))}</td>
      <td>
        <button class="btn btn-sm btn-success approve-loan-btn me-1">Approve</button>
        <button class="btn btn-sm btn-outline-danger deny-loan-btn">Deny</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// Update transaction record by transactionID (mutate fields & persist)
function updateTransactionById(txnId, updates = {}) {
  try {
    const arr = readTransactionRecords();
    const idx = arr.findIndex(t => (t.transactionID || t.transactionId || t.id) === txnId);
    if (idx === -1) return false;
    Object.assign(arr[idx], updates);
    // Ensure loanStatus normalization if provided
    if (updates.loanStatus) arr[idx].loanStatus = updates.loanStatus;
    writeTransactionRecords(arr);
    return true;
  } catch (e) {
    console.error('updateTransactionById error', e);
    return false;
  }
}


function setupPendingLoanRequestsHandlers() {
  const tbody = document.getElementById("pendingLoanRequestsTbody");
  if (!tbody) return;

  const approveModalEl = document.getElementById("approveLoanModal");
  const approveModal = new bootstrap.Modal(approveModalEl);
  const approveLoanIdEl = document.getElementById("approveLoanId");
  const approveLoanMemberEl = document.getElementById("approveLoanMember");
  const approveLoanAmountEl = document.getElementById("approveLoanAmount");
  const approveLoanErrorEl = document.getElementById("approveLoanError");
  const confirmApproveLoanBtn = document.getElementById("confirmApproveLoanBtn");

  const rejectModalEl = document.getElementById("rejectLoanModal");
  const rejectModal = new bootstrap.Modal(rejectModalEl);
  const rejectLoanIdEl = document.getElementById("rejectLoanId");
  const rejectLoanMemberEl = document.getElementById("rejectLoanMember");
  const rejectLoanAmountEl = document.getElementById("rejectLoanAmount");
  const rejectLoanErrorEl = document.getElementById("rejectLoanError");
  const confirmRejectLoanBtn = document.getElementById("confirmRejectLoanBtn");

  const resultModalEl = document.getElementById("loanActionResultModal");
  const resultModal = new bootstrap.Modal(resultModalEl);
  const resultIconEl = document.getElementById("loanActionResultIcon");
  const resultMsgEl = document.getElementById("loanActionResultMessage");

  let selectedLoanId = null;

  function showLoanResult(success, message) {
    resultIconEl.innerHTML = success ? '<span class="text-success">✓</span>' : '<span class="text-danger">✕</span>';
    resultMsgEl.textContent = message || (success ? "Loan request updated successfully." : "Loan request update failed.");
    resultModal.show();
  }

  tbody.addEventListener("click", (e) => {
    const approveBtn = e.target.closest(".approve-loan-btn");
    const denyBtn = e.target.closest(".deny-loan-btn");
    if (!approveBtn && !denyBtn) return;

    const row = (approveBtn || denyBtn).closest("tr");
    if (!row) return;

    const loanId = row.dataset.loanId;
    if (!loanId) return;

    const loans = readTransactionRecords().filter(t => t.paymentType === 'loan');
    const loan = loans.find(item => (item.transactionID || item.id || item.loanID) === loanId);

    if (!loan) return;

    selectedLoanId = loanId;

    if (approveBtn) {
      approveLoanIdEl.textContent = loan.loanID || loan.id;
      approveLoanMemberEl.textContent = loan.name || "Unknown Member";
      approveLoanAmountEl.textContent = `₱${Number(loan.loanAmount || 0).toLocaleString()}`;
      approveLoanErrorEl.classList.add("d-none");
      approveLoanErrorEl.textContent = "";
      approveModal.show();
      return;
    }

    if (denyBtn) {
      rejectLoanIdEl.textContent = loan.loanID || loan.id;
      rejectLoanMemberEl.textContent = loan.name || "Unknown Member";
      rejectLoanAmountEl.textContent = `₱${Number(loan.loanAmount || 0).toLocaleString()}`;
      rejectLoanErrorEl.classList.add("d-none");
      rejectLoanErrorEl.textContent = "";
      rejectModal.show();
    }
  });

  confirmApproveLoanBtn.addEventListener("click", async () => {
    if (!selectedLoanId) return;

    confirmApproveLoanBtn.disabled = true;
    confirmApproveLoanBtn.textContent = "Approving...";

    try {
      // BACKEND SLOT:
      // await approveLoanRequestOnServer(selectedLoanId);

      // Local fallback:
      const loans = readTransactionRecords().filter(t => t.paymentType === 'loan');
      const idx = loans.findIndex(item => (item.transactionID || item.id || item.loanID) === selectedLoanId);
      const loan = loans[idx];

      if (idx !== -1) {
        loans[idx].loanStatus = "Approved";
        loans[idx].approvedAt = new Date().toISOString();
      }
      const ok = updateTransactionById(selectedLoanId, { loanStatus: 'Approved', approvedAt: new Date().toISOString() });
      if (!ok) throw new Error('Loan record not found');

      renderPendingLoanRequests();
      approveModal.hide();
      showLoanResult(true, "Loan approved successfully.");
    } catch (err) {
      approveLoanErrorEl.classList.remove("d-none");
      approveLoanErrorEl.textContent = err && err.message ? err.message : "Failed to approve loan";
    } finally {
      confirmApproveLoanBtn.disabled = false;
      confirmApproveLoanBtn.textContent = "Confirm Approve";
      selectedLoanId = null;
    }
  });

  confirmRejectLoanBtn.addEventListener("click", async () => {
    if (!selectedLoanId) return;

    confirmRejectLoanBtn.disabled = true;
    confirmRejectLoanBtn.textContent = "Rejecting...";

    try {
      // BACKEND SLOT:
      // await rejectLoanRequestOnServer(selectedLoanId);

      // Local fallback:
        const loans = readTransactionRecords().filter(t => t.paymentType === 'loan');
        const idx = loans.findIndex(item => (item.transactionID || item.id || item.loanID) === selectedLoanId);
        const loan = loans[idx];

        if (idx !== -1) {
          loans[idx].loanStatus = "Denied";
          loans[idx].deniedAt = new Date().toISOString();
        }
        const mock = JSON.parse(localStorage.getItem("mockdata") || "{}");
        mock.loanRequests = loans;
        localStorage.setItem("mockdata", JSON.stringify(mock));

      renderPendingLoanRequests();
      rejectModal.hide();
      showLoanResult(true, "Loan rejected successfully.");
    } catch (err) {
      rejectLoanErrorEl.classList.remove("d-none");
      rejectLoanErrorEl.textContent = err && err.message ? err.message : "Failed to reject loan";
    } finally {
      confirmRejectLoanBtn.disabled = false;
      confirmRejectLoanBtn.textContent = "Confirm Reject";
      selectedLoanId = null;
    }
  });
}

// Call this once from initHome()
function setupCashierTabs() {
  // Ensure the Bootstrap Tab/Pill plugin works (already included via bootstrap.bundle)
  const cashierTabsEl = document.getElementById('cashierTabs');
  if (!cashierTabsEl) return;

  // Keep flags so forms initialize only once
  let paymentFormInitialized = false;
  let loanFormInitialized = false;

  // Bootstrap provides 'shown.bs.tab' event on tab toggles
  cashierTabsEl.addEventListener('shown.bs.tab', (e) => {
    const target = e.target.getAttribute('data-bs-target');
    if (target === '#processPaymentTab' && !paymentFormInitialized) {
      paymentFormInitialized = true;
      // call your existing payment setup (create if missing)
      if (typeof setupPaymentForm === 'function') setupPaymentForm();
      else initializeInlinePaymentHandler(); // fallback helper below
    }
    if (target === '#loanCalculatorTab' && !loanFormInitialized) {
      loanFormInitialized = true;
      if (typeof setupLoanRequestForm === 'function') setupLoanRequestForm();
      else initLoanCalculator(); // fallback helper below
    }
  });

  // Trigger init for the active tab immediately
  const activeBtn = cashierTabsEl.querySelector('.nav-link.active');
  if (activeBtn) {
    const target = activeBtn.getAttribute('data-bs-target');
    if (target === '#processPaymentTab') {
      paymentFormInitialized = true;
      if (typeof setupPaymentForm === 'function') setupPaymentForm();
      else initializeInlinePaymentHandler();
    } else if (target === '#loanCalculatorTab') {
      loanFormInitialized = true;
      if (typeof setupLoanRequestForm === 'function') setupLoanRequestForm();
      else initLoanCalculator();
    }
  }
}



// Insert into js/home.js (near other setup* functions)
async function setupPaymentForm() {
  const form = document.getElementById("paymentForm");
  if (!form) return;
  populatePaymentMembers(); // ensure the member select is populated
  

  const memberIdEl = document.getElementById("paymentMemberId");
  const typeEl = document.getElementById("paymentTypeSelect");
  const amountEl = document.getElementById("paymentAmount");
  const resultModalEl = document.getElementById("actionResultModal");
  const resultModal = resultModalEl ? new bootstrap.Modal(resultModalEl) : null;
  const iconEl = document.getElementById("actionResultIcon");
  const msgEl = document.getElementById("actionResultMessage");

  async function lookupMember(memberId) {
    if (!memberId) return null;
    if (typeof validateMemberId === "function") {
      return await validateMemberId(memberId);
    }
    const mockRaw = JSON.parse(localStorage.getItem("mockdata") || "{}");
    const members = Array.isArray(mockRaw.members) ? mockRaw.members : [];
    return members.find(m => (m.memberID || m.memberId) === memberId) || null;
  }

  function updateMemberSharedCapital(memberId, amount) {
    const mockRaw = JSON.parse(localStorage.getItem("mockdata") || "{}");
    mockRaw.members = Array.isArray(mockRaw.members) ? mockRaw.members : [];
    const idx = mockRaw.members.findIndex(m => (m.memberID || m.memberId) === memberId);
    if (idx !== -1) {
      const current = Number(mockRaw.members[idx].sharedCapital || 0);
      mockRaw.members[idx].sharedCapital = current + Number(amount || 0);
      localStorage.setItem("mockdata", JSON.stringify(mockRaw));
      return true;
    }
    return false;
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const memberId = (memberIdEl.value || "").trim();
    const type = (typeEl.value || "").trim();
    const amount = parseFloat(amountEl.value) || 0;

    if (!memberId) { memberIdEl.classList.add("is-invalid"); return; } else memberIdEl.classList.remove("is-invalid");
    if (!amount || amount <= 0) { amountEl.classList.add("is-invalid"); return; } else amountEl.classList.remove("is-invalid");

    const member = await lookupMember(memberId);
    if (!member) { memberIdEl.classList.add("is-invalid"); return; } else memberIdEl.classList.remove("is-invalid");

    const submitBtn = form.querySelector("button[type='submit']");
    const origText = submitBtn ? submitBtn.textContent : "";
    if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = "Saving..."; }

    try {
      const txn = {
        transactionID: `TXN-${Date.now().toString().slice(-6)}`,
        memberID: memberId,
        name: member.name ? `${member.name.first || ""} ${member.name.last || ""}`.trim() : (member.name || ""),
        paymentType: type,
        paymentAmount: amount,
        date: new Date().toISOString(),
        recordedBy: localStorage.getItem("currentUser") || "local"
      };

      if (window.apiBaseUrl) {
        const token = localStorage.getItem("authToken");
        const res = await fetch(`${window.apiBaseUrl.replace(/\/$/, "")}/api/transactions`, {
          method: "POST",
          headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
          body: JSON.stringify(txn)
        });
        if (!res.ok) throw new Error(`Server returned ${res.status}`);
        } else {
          // append via helper (normalizes schema + emits update event)
          appendTransaction({
            transactionID: txn.transactionID,
            memberID: txn.memberID,
            name: txn.name,
            memberStatus: (member.memberStatus || '') ,
            paymentType: txn.paymentType,
            paymentAmount: txn.paymentAmount,
            date: txn.date,
            assignedOfficer: localStorage.getItem('currentUserName') || '',
            officerID: localStorage.getItem('currentUser') || '',
            recordedBy: txn.recordedBy
          });
        }

      if (type === "initial" || type === "monthly") {
        updateMemberSharedCapital(memberId, amount);
      }

      if (resultModal) {
        if (iconEl) iconEl.innerHTML = '<span class="text-success">✓</span>';
        if (msgEl) msgEl.textContent = 'Payment recorded successfully.';
        resultModal.show();
      } else {
        alert("Payment recorded.");
      }

      form.reset();
    } catch (err) {
      console.error("Record payment failed:", err);
      alert("Failed to record payment: " + (err.message || err));
    } finally {
      if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = origText; }
    }
  });
}


// Populate #paymentMemberId <select> from localStorage.mockdata.members (fallback fetch)
function populatePaymentMembers() {
  try {
    // Read members from localStorage.mockdata if present
    let members = [];
    const raw = localStorage.getItem('mockdata');
    if (raw) {
      try {
        const mock = JSON.parse(raw || '{}');
        members = Array.isArray(mock.members) ? mock.members : [];
      } catch (e) {
        members = [];
      }
    }

    // If nothing in storage, try fetching mock file (non-blocking)
    if (!members.length) {
      fetch('mockdata/mockdata.json', { cache: 'no-store' })
        .then(r => r.ok ? r.json() : null)
        .then(data => {
          if (!data) return;
          const fetchedMembers = Array.isArray(data.members) ? data.members : [];
          fillSelect(fetchedMembers);
        })
        .catch(() => {});
    }

    // Fill with whatever we currently have
    fillSelect(members);

    function fillSelect(membersList) {
      const sel = document.getElementById('paymentMemberId');
      if (!sel) return;

      // keep the placeholder option
      sel.innerHTML = '<option value="">Select member</option>';

      (membersList || []).forEach(m => {
        const id = String(m.memberID ?? m.memberId ?? m.id ?? '').trim();
        if (!id) return; // skip invalid
        let name = '';
        if (m.name) {
          name = typeof m.name === 'string' ? m.name : `${m.name.first || ''} ${m.name.last || ''}`.trim();
        } else {
          name = m.fullName || m.memberName || '';
        }
        const label = name ? `${id} — ${name}` : id;
        const opt = document.createElement('option');
        opt.value = id;
        opt.textContent = label;
        sel.appendChild(opt);
      });
    }

  } catch (err) {
    console.warn('populatePaymentMembers error', err);
  }
}


function initializeInlinePaymentHandler() {
  const form = document.getElementById('paymentForm');
  if (!form) return;
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const memberId = document.getElementById('paymentMemberId').value.trim();
    const type = document.getElementById('paymentTypeSelect').value;
    const amount = parseFloat(document.getElementById('paymentAmount').value) || 0;
    if (!memberId || amount <= 0) {
      alert('Please provide Member ID and valid amount.');
      return;
    }
    // local dev save: transaction record
    appendTransaction({
      memberID: memberId,
      name: '', // optional: look up and fill name if desired
      paymentType: type,
      paymentAmount: amount
    });
    // quick feedback
    const modal = new bootstrap.Modal(document.getElementById('actionResultModal'));
    document.getElementById('actionResultIcon').innerHTML = '<span class="text-success">✓</span>';
    document.getElementById('actionResultMessage').textContent = 'Payment recorded.';
    modal.show();
    form.reset();
  });
}

// ---------- Transactions storage helpers ----------

function readTransactionRecords() {
  try {
    const raw = localStorage.getItem('transactionRecords');
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.warn('readTransactionRecords parse error', e);
    return [];
  }
}

function writeTransactionRecords(arr) {
  try {
    localStorage.setItem('transactionRecords', JSON.stringify(Array.isArray(arr) ? arr : []));
    // notify same-tab listeners
    window.dispatchEvent(new CustomEvent('transactionsUpdated', { detail: { count: (arr || []).length } }));
  } catch (e) {
    console.warn('writeTransactionRecords error', e);
  }
}

function makeTransactionID() {
  // TXN-<YYYYMMDD>-<last6ms> for readability
  const d = new Date();
  const datePart = d.toISOString().slice(0,10).replace(/-/g,'');
  const suffix = String(Date.now()).slice(-6);
  return `TXN-${datePart}-${suffix}`;
}

/*
  payload: {
    memberID, name, memberStatus, paymentType, monthlyPayment, loanStatus,
    paymentAmount, assignedOfficer, officerID, note
  }
*/
function appendTransaction(payload = {}) {
  try {
    const base = {
      transactionID: payload.transactionID || makeTransactionID(),
      memberID: payload.memberID || payload.memberId || '',
      name: payload.name || payload.memberName || '',
      memberStatus: payload.memberStatus || '',
      paymentType: payload.paymentType || '',           // "monthly", "initial", "loan"
      monthlyPayment: payload.monthlyPayment != null ? Number(payload.monthlyPayment) : undefined,
      // Preserve requestedAmount for loan requests
      requestedAmount: payload.requestedAmount != null ? Number(payload.requestedAmount) : undefined,
      // Preserve paymentAmount for actual payments / repayments
      paymentAmount: payload.paymentAmount != null ? Number(payload.paymentAmount) : (payload.requestedAmount != null ? Number(payload.requestedAmount) : 0),
      // Loan-specific fields
      loanDurationMonths: payload.loanDurationMonths != null ? Number(payload.loanDurationMonths) : (payload.loanDuration != null ? Number(payload.loanDuration) : undefined),
      maxAllowed: payload.maxAllowed != null ? Number(payload.maxAllowed) : undefined,
      loanStatus: payload.loanStatus || '',
      date: payload.date || new Date().toISOString(),
      assignedOfficer: payload.assignedOfficer || '',
      officerID: payload.officerID || payload.recordedBy || '',
      recordedBy: payload.recordedBy || (localStorage.getItem('currentUser') || 'local'),
      note: payload.note || ''
    };

    const arr = readTransactionRecords();
    arr.push(base);
    writeTransactionRecords(arr);
    return base;
  } catch (err) {
    console.error('appendTransaction error', err);
    return null;
  }
}





// Add to home.js and call initLoanCalculator() in your existing setup/init code.
// IMPORTANT: This reads members from localStorage key "members" and WILL NOT create mock members.

function initLoanCalculator() {
  // Elements used by the loan calculator HTML
  const els = {
    memberSelect: document.getElementById('loanMemberSelect'),
    loanMemberType: document.getElementById('loanMemberType'),
    sharedCapital: document.getElementById('sharedCapital'),
    requestedLoanAmount: document.getElementById('requestedLoanAmount'),
    requestedAmountFeedback: document.getElementById('requestedAmountFeedback'),
    loanDuration: document.getElementById('loanDuration'),
    maxLoanLimit: document.getElementById('maxLoanLimit'),
    loanRequestForm: document.getElementById('loanRequestForm'),
    createLoanBtn: document.getElementById('createLoanBtn'),
    loanActionResultModal: document.getElementById('loanActionResultModal'),
    loanActionResultIcon: document.getElementById('loanActionResultIcon'),
    loanActionResultMessage: document.getElementById('loanActionResultMessage')
  };

  // Internal cache
  let membersCache = [];

  if (els.loanMemberType) {
    els.loanMemberType.disabled = true; // show the member type but prevent changes
    els.loanMemberType.setAttribute('aria-readonly', 'true');
  }
  if (els.sharedCapital) {
    els.sharedCapital.readOnly = true;
    els.sharedCapital.setAttribute('aria-readonly', 'true');
  }
  if (els.maxLoanLimit) {
    els.maxLoanLimit.readOnly = true;
    els.maxLoanLimit.setAttribute('aria-readonly', 'true');
  }


  // Utility: format currency for display in the calculated max field
  function formatCurrency(num) {
    if (num == null || isNaN(num)) return '';
    return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', maximumFractionDigits: 2 }).format(num);
  }


  // OPTIONAL FALLBACK: placeholder fetch slot - used only if localStorage is empty.
  // Replace '/api/members' with your real endpoint if you want server sync later.
  async function fetchMembersPlaceholder() {
    const url = '/api/members';
    try {
      const resp = await fetch(url, { cache: 'no-store' });
      if (!resp.ok) throw new Error('network');
      const data = await resp.json();
      if (!Array.isArray(data)) throw new Error('invalid');
      return data;
    } catch (err) {
      return null; // caller decides fallback behavior
    }
  }

  // Populate the member select using members array of { id, name, memberType, sharedCapital }
// ---- Normalization + populate (replace existing populateMemberSelect & duplicated handlers) ----

// Normalize members to a predictable shape and populate the select
function populateMemberSelect(members) {
  // Normalize and cache
  membersCache = (Array.isArray(members) ? members : []).map(m => {
    const id = String(m.memberID ?? m.memberId ?? m.id ?? '').trim();
    // resolve name to string "First Last"
    let first = '', last = '';
    if (m.name && typeof m.name === 'object') {
      first = (m.name.first ?? '').toString().trim();
      last  = (m.name.last  ?? '').toString().trim();
    } else if (typeof m.name === 'string') {
      const parts = m.name.trim().split(/\s+/);
      first = parts[0] || '';
      last  = parts.length > 1 ? parts.slice(-1).join(' ') : '';
    } else {
      first = (m.firstName ?? '').toString().trim();
      last  = (m.lastName  ?? '').toString().trim();
    }
    const name = [first, last].filter(Boolean).join(' ') || '';
    const memberType = (m.memberType ?? m.type ?? '').toString();
    const sharedCapital = Number(m.sharedCapital ?? m.shared_capital ?? m.initialPayment ?? m.initialPaymentAmount ?? 0) || 0;
    return Object.assign({}, m, { id, name, memberType, sharedCapital });
  });

  const sel = els.memberSelect;
  if (!sel) return;
  sel.innerHTML = '';
  sel.appendChild(new Option('Select member', ''));

  membersCache.forEach(m => {
    // skip entries without id (optional)
    if (!m.id) return;
    const label = m.name ? `${m.id} - ${m.name}` : m.id;
    const opt = new Option(label, m.id);
    // keep small debug info
    try { opt.dataset.raw = JSON.stringify({ id: m.id, name: m.name }).slice(0, 200); } catch(_) {}
    sel.appendChild(opt);
  });

  console.log('populateMemberSelect: appended', membersCache.length, 'members');
}

// Single function to apply a selected member into readonly fields
function applySelectedMember(memberId) {
  if (!memberId) {
    if (els.loanMemberType) els.loanMemberType.value = 'regular';
    if (els.sharedCapital) els.sharedCapital.value = '';
    if (els.maxLoanLimit) els.maxLoanLimit.value = '';
    return;
  }

  const m = membersCache.find(x => x.id === memberId);
  if (!m) {
    console.warn('applySelectedMember: member not found for id', memberId);
    if (els.loanMemberType) els.loanMemberType.value = 'regular';
    if (els.sharedCapital) els.sharedCapital.value = '';
    if (els.maxLoanLimit) els.maxLoanLimit.value = '';
    return;
  }

  // Use normalized fields
  const rawType = m.memberType || 'Regular';
  const normalizedType = rawType.toString().toLowerCase() === 'associate' ? 'Associate' : 'Regular';
  if (els.loanMemberType) els.loanMemberType.value = normalizedType;

  if (els.sharedCapital) els.sharedCapital.value = m.sharedCapital || 0;

  const multiplier = (normalizedType.toLowerCase() === 'associate') ? 2 : 3;
  const max = (Number(m.sharedCapital) || 0) * multiplier;
  if (els.maxLoanLimit) els.maxLoanLimit.value = isNaN(max) ? '' : formatCurrency(max);
}

// ---- Wiring (inside your boot IIFE, after populateMemberSelect has been called) ----
if (els.memberSelect) {
  // remove any previous listeners in dev if you suspect duplicates (optional)
  // els.memberSelect.replaceWith(els.memberSelect.cloneNode(true)); // heavy-handed; only if needed

  els.memberSelect.addEventListener('change', (ev) => {
    const id = ev.target.value;
    applySelectedMember(id);
    try { localStorage.setItem('loanLastMemberId', id); } catch (e) {}
  });
}

// preselect last ID AFTER populate
try {
  const lastId = localStorage.getItem('loanLastMemberId');
  if (lastId && els.memberSelect && Array.from(els.memberSelect.options).some(o => o.value === lastId)) {
    els.memberSelect.value = lastId;
    applySelectedMember(lastId);
  }
} catch (e) { /* ignore */ }

// ---- Use normalized member name in payload when submitting ----
// Replace the payload memberName line in submit with:
memberName: (membersCache.find(m => m.id === els.memberSelect.value) || {}).name || '',
// Call this when a member id is selected. Fills fields and computes max.
function applySelectedMember(memberId) {
  if (!memberId) {
    // clear fields
    const rawTypeRaw = (m.memberType ?? m.type ?? '').toString();
    const rawType = rawTypeRaw.toLowerCase(); // normalize to lowercase
    const normalizedTypeValue = (rawType === 'associate') ? 'associate' : 'regular';
    if (els.loanMemberType) els.loanMemberType.value = normalizedTypeValue;
    if (els.sharedCapital) els.sharedCapital.value = '';
    if (els.maxLoanLimit) els.maxLoanLimit.value = '';
    return;
  }

  const m = membersCache.find(x => (x.memberID ?? x.memberId ?? x.id) === memberId);
  if (!m) {
    console.warn('applySelectedMember: member not found for id', memberId);
    if (els.loanMemberType) els.loanMemberType.value = 'regular';
    if (els.sharedCapital) els.sharedCapital.value = '';
    if (els.maxLoanLimit) els.maxLoanLimit.value = '';
    return;
  }

  // set member type (normalize to lowercase for logic, but keep original casing if present)
  const rawType = (m.memberType ?? m.type ?? '').toString();
  const memberTypeNormalized = rawType ? rawType.toLowerCase() : (m.memberType || 'regular').toString().toLowerCase();
  // write a friendly value (preserve original if present)
  if (els.loanMemberType) els.loanMemberType.value = rawType || (memberTypeNormalized === 'associate' ? 'Associate' : 'Regular');

  // shared capital
  const sc = Number(m.sharedCapital ?? m.shared_capital ?? m.initialPayment ?? m.initialPaymentAmount ?? 0) || 0;
  if (els.sharedCapital) els.sharedCapital.value = sc;

  // compute max limit: associate = 2x, regular = 3x
  const multiplier = (memberTypeNormalized === 'associate') ? 2 : 3;
  const max = sc * multiplier;
  if (els.maxLoanLimit) {
    els.maxLoanLimit.value = isNaN(max) ? '' : new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', maximumFractionDigits: 2 }).format(max);
  }
}

// --- wiring: replace your current select change handler with this (inside boot IIFE) ---
if (els.memberSelect) {
  els.memberSelect.addEventListener('change', (ev) => {
    const id = ev.target.value;
    // populate readonly fields and calculated max
    applySelectedMember(id);
    // store last selected id if needed elsewhere
    try { localStorage.setItem('loanLastMemberId', id); } catch (e) {}
  });
}

// Optionally preselect saved id after populate:
try {
  const lastId = localStorage.getItem('loanLastMemberId');
  if (lastId && els.memberSelect && Array.from(els.memberSelect.options).some(o => o.value === lastId)) {
    els.memberSelect.value = lastId;
    // call applySelectedMember to populate fields
    applySelectedMember(lastId);
  }
} catch (e) { /* ignore */ }
  // Fill member type and shared capital on selection and compute max
  function setMemberFieldsById(memberId) {
    if (!memberId) {
      els.loanMemberType.value = 'regular';
      els.sharedCapital.value = '';
      els.maxLoanLimit.value = '';
      return;
    }
    const member = membersCache.find(m => (m.id || m.memberId) === memberId);
    if (!member) {
      els.loanMemberType.value = 'regular';
      els.sharedCapital.value = '';
      els.maxLoanLimit.value = '';
      return;
    }
    const _raw = (member.memberType ?? member.type ?? '').toString().toLowerCase();
    els.loanMemberType.value = (_raw === 'associate') ? 'associate' : 'regular';    // sharedCapital should be numeric; keep blank if unavailable
    els.sharedCapital.value = (member.sharedCapital != null) ? member.sharedCapital : '';
    computeMaxLimit();
  }

  // Calculated Max Limit: Associate = 2x, Regular = 3x
  function computeMaxLimit() {
    const sc = parseFloat(els.sharedCapital.value);
    const type = els.loanMemberType.value;
    if (isNaN(sc)) {
      els.maxLoanLimit.value = '';
      return NaN;
    }
    const multiplier = (type === 'associate') ? 2 : 3;
    const max = sc * multiplier;
    els.maxLoanLimit.value = formatCurrency(max);
    return max;
  }

  // Validate requested amount against computed max
  function validateRequestedAmount() {
    const requested = parseFloat(els.requestedLoanAmount.value);
    const maxText = els.maxLoanLimit.value || '';
    const max = maxText ? Number(maxText.replace(/[^0-9.-]+/g, '')) : NaN;

    if (isNaN(requested) || requested <= 0) {
      els.requestedLoanAmount.classList.add('is-invalid');
      if (els.requestedAmountFeedback) els.requestedAmountFeedback.textContent = 'Enter a valid requested amount.';
      return false;
    }
    if (!isNaN(max) && requested > max) {
      els.requestedLoanAmount.classList.add('is-invalid');
      if (els.requestedAmountFeedback) els.requestedAmountFeedback.textContent = `Requested amount exceeds calculated max limit (${formatCurrency(max)}).`;
      return false;
    }
    els.requestedLoanAmount.classList.remove('is-invalid');
    if (els.requestedAmountFeedback) els.requestedAmountFeedback.textContent = 'Enter a valid requested amount.';
    return true;
  }

  // Placeholder submit: either call backend or store locally. This code will store in localStorage 'loanRequests' as a fallback.
// Replace current submitLoanRequest implementation with this
async function submitLoanRequest(payload) {
  try {
    // resolve memberStatus if possible
    let memberStatus = payload.memberStatus || '';
    try {
      const mock = JSON.parse(localStorage.getItem('mockdata') || '{}');
      const mm = Array.isArray(mock.members) ? mock.members.find(m => (m.memberID || m.memberId || m.id) === (payload.memberId || payload.memberID)) : null;
      if (mm) memberStatus = memberStatus || mm.memberStatus || '';
    } catch(e){}

    const txnPayload = {
      transactionID: payload.transactionID || makeTransactionID(),
      memberID: payload.memberId || payload.memberID || '',
      name: payload.memberName || '',
      paymentType: 'loan',
      requestedAmount: Number(payload.requestedAmount || payload.loanAmount || 0),
      loanDurationMonths: Number(payload.loanDurationMonths || payload.loanDuration || 0),
      maxAllowed: Number(payload.maxAllowed || 0),
      loanStatus: 'pending',
      memberStatus,
      date: payload.createdAt || new Date().toISOString(),
      recordedBy: payload.recordedBy || (localStorage.getItem('currentUser') || 'local'),
      note: payload.note || ''
    };

    const recorded = appendTransaction(txnPayload);
    // re-render where needed
    try { renderPendingLoanRequests(); } catch (e) {}
    return recorded ? { ok: true, id: recorded.transactionID } : { ok: false };
  } catch (err) {
    console.error('submitLoanRequest error', err);
    return { ok: false };
  }
}
  // UI modal helper (uses existing modal in your HTML and bootstrap if available)
  function showModalResult(success, message) {
    if (!els.loanActionResultModal) {
      alert(message);
      return;
    }
    if (els.loanActionResultIcon) els.loanActionResultIcon.textContent = success ? '✅' : '❌';
    if (els.loanActionResultMessage) els.loanActionResultMessage.textContent = message;
    try {
      const modal = new bootstrap.Modal(els.loanActionResultModal);
      modal.show();
    } catch (e) {
      // fallback
      alert(message);
    }
  }

  // load members (localStorage first). If empty, optionally attempt placeholder fetch.
  (async function boot() {
    let members = await getMockMembers();


    populateMemberSelect(members);

    // Wire events (defensive null checks in case DOM ids changed)
    if (els.memberSelect) {
      els.memberSelect.addEventListener('change', (ev) => {
        const id = ev.target.value;
        setMemberFieldsById(id);
        // Keep last member if other code expects it
        try { localStorage.setItem('loanLastMemberId', id); } catch (e) { /* ignore */ }
      });
    }

    if (els.loanMemberType) {
      els.loanMemberType.addEventListener('change', () => {
        computeMaxLimit();
        validateRequestedAmount();
      });
    }

    if (els.requestedLoanAmount) {
      els.requestedLoanAmount.addEventListener('input', validateRequestedAmount);
    }

    if (els.loanRequestForm) {
      els.loanRequestForm.addEventListener('submit', async (ev) => {
        ev.preventDefault();
        if (!els.memberSelect || !els.memberSelect.value) {
          showModalResult(false, 'Please select a member.');
          return;
        }
        if (!validateRequestedAmount()) {
          showModalResult(false, 'Please correct the requested amount before submitting.');
          return;
        }

        const requested = Number(els.requestedLoanAmount.value) || 0;
        const max = Number((els.maxLoanLimit.value || '').replace(/[^0-9.-]+/g, '')) || 0;

        const payload = {
          memberId: els.memberSelect.value,
          memberName: (membersCache.find(m => (m.id || m.memberId) === els.memberSelect.value) || {}).name || '',
          memberType: els.loanMemberType.value,
          sharedCapital: Number(els.sharedCapital.value) || 0,
          requestedAmount: requested,
          loanDurationMonths: Number(els.loanDuration.value) || 0,
          maxAllowed: max,
          createdAt: new Date().toISOString()
        };

        // Disable UI while "submitting"
        if (els.createLoanBtn) {
          els.createLoanBtn.disabled = true;
          els.createLoanBtn.textContent = 'Requesting...';
        }

        try {
          const resp = await submitLoanRequest(payload);
          if (resp && resp.ok) {
            showModalResult(true, 'Loan request submitted successfully.');
            // keep the member selected, clear requested amount
            if (els.requestedLoanAmount) els.requestedLoanAmount.value = '';
          } else {
            showModalResult(false, 'Failed to submit loan request.');
          }
        } catch (err) {
          console.error(err);
          showModalResult(false, 'Error submitting loan request.');
        } finally {
          if (els.createLoanBtn) {
            els.createLoanBtn.disabled = false;
            els.createLoanBtn.textContent = 'Request Loan';
          }
        }
      });
    }
  })();
}


// Render transactionRecords into all elements with class "transactions-container"
function renderTransactionContainers() {
  try {
    const containers = Array.from(document.querySelectorAll('.transactions-container'));
    if (!containers.length) return;

    // Prefer canonical helper if available
    const txns = (typeof readTransactionRecords === 'function')
      ? readTransactionRecords()
      : JSON.parse(localStorage.getItem('transactionRecords') || '[]');

    if (!txns || !txns.length) {
      const emptyHtml = `
        <div class="card mt-3">
          <div class="card-body small text-muted">No transactions yet</div>
        </div>`;
      containers.forEach(el => el.innerHTML = emptyHtml);
      return;
    }

    // Build rows (show paymentAmount, fallback to requestedAmount for loans)
    const rowsHtml = txns.map(t => {
      const date = t.date ? new Date(t.date).toLocaleString() : '';
      const displayAmount = (t.paymentAmount != null && Number(t.paymentAmount) !== 0)
        ? Number(t.paymentAmount)
        : (t.requestedAmount != null ? Number(t.requestedAmount) : 0);
      const amt = isNaN(displayAmount) ? 0 : displayAmount;
      const member = t.memberID || '';
      const name = t.name || '';
      const memberStatus = t.memberStatus || '';
      const type = t.paymentType || '';
      const loanStatus = t.loanStatus || '';
      const officer = t.assignedOfficer || t.officerID || (t.recordedBy || '');
      return `
        <tr data-transaction-id="${escapeHtml(t.transactionID || '')}">
          <td class="small text-muted">${escapeHtml(t.transactionID || '')}</td>
          <td>${escapeHtml(member)}</td>
          <td>${escapeHtml(name)}</td>
          <td>${escapeHtml(memberStatus)}</td>
          <td>${escapeHtml(type)}</td>
          <td class="text-end">₱${Number(amt).toLocaleString()}</td>
          <td>${escapeHtml(loanStatus)}</td>
          <td class="small text-muted">${escapeHtml(officer)}</td>
          <td class="small text-muted">${escapeHtml(date)}</td>
        </tr>`;
    }).join('');

    const tableHtml = `
      <div class="card mt-3">
        <div class="card-header small">Recent Transaction Records</div>
        <div class="table-responsive">
          <table class="table table-striped table-sm mb-0">
            <thead class="small">
              <tr>
                <th>Txn ID</th>
                <th>Member ID</th>
                <th>Name</th>
                <th>Member Status</th>
                <th>Type</th>
                <th class="text-end">Amount</th>
                <th>Loan Status</th>
                <th>Officer</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
        </div>
      </div>`;

    containers.forEach(el => el.innerHTML = tableHtml);
  } catch (err) {
    console.warn('renderTransactionContainers error', err);
  }
}


// Read members from localStorage.mockdata with safe fallback
function getMembersFromLocalStorage() {
  try {
    const raw = localStorage.getItem('mockdata');
    if (!raw) return [];
    const mock = JSON.parse(raw || '{}');
    return Array.isArray(mock.members) ? mock.members : [];
  } catch (e) {
    console.warn('getMembersFromLocalStorage parse error', e);
    return [];
  }
}

  // Helper to find a loan by id across mockdata.loanRequests and transactionRecords
  function getLoanById(loanId) {
    try {
      // 1) check mockdata.loanRequests (existing code path)
      const mockRaw = localStorage.getItem('mockdata');
      const mock = mockRaw ? JSON.parse(mockRaw) : {};
      const loansMock = Array.isArray(mock.loanRequests) ? mock.loanRequests : [];
      const foundMock = loansMock.find(item => {
        const idCandidates = [item.loanID, item.id, (item.loanId || null)].filter(Boolean);
        return idCandidates.some(id => String(id) === String(loanId));
      });
      if (foundMock) return { source: 'mock', loan: foundMock, container: loansMock };

      // 2) check canonical transactionRecords (loan entries)
      const txRaw = localStorage.getItem('transactionRecords');
      const txns = txRaw ? JSON.parse(txRaw) : [];
      const foundTxn = txns.find(t => {
        // loan entries may be marked by paymentType === 'loan' or similar
        if ((t.paymentType || '').toString().toLowerCase() !== 'loan') return false;
        const idCandidates = [t.transactionID, t.transactionId, t.id].filter(Boolean);
        // also consider loanID or loanId fields on txn object
        if (t.loanID) idCandidates.push(t.loanID);
        if (t.loanId) idCandidates.push(t.loanId);
        return idCandidates.some(id => String(id) === String(loanId));
      });
      if (foundTxn) return { source: 'txn', loan: foundTxn, container: txns };

      // 3) Not found
      return null;
    } catch (e) {
      console.warn('getLoanById error', e);
      return null;
    }
  }

  // when a row is clicked, find the loan across sources and show the modal
  tbody.addEventListener('click', (e) => {
    const approveBtn = e.target.closest('.approve-loan-btn');
    const denyBtn = e.target.closest('.deny-loan-btn');
    if (!approveBtn && !denyBtn) return;

    const row = (approveBtn || denyBtn).closest('tr');
    if (!row) return;

    const rawLoanId = row.dataset.loanId || row.dataset.transactionId || row.dataset.id || row.cells && row.cells[0] && row.cells[0].textContent.trim();
    if (!rawLoanId) {
      console.warn('No loan id found on row');
      return;
    }

    const found = getLoanById(rawLoanId);
    if (!found || !found.loan) {
      console.warn('Loan not found for id', rawLoanId);
      // fallback: still set selectedLoanId so confirm handlers gracefully noop
      selectedLoanId = rawLoanId;
      selectedLoanSource = null;
      selectedLoanRecord = null;
      return;
    }

    selectedLoanSource = found.source;     // 'mock' | 'txn'
    selectedLoanRecord = found.loan;
    selectedLoanId = rawLoanId;

    // normalize display values for modal
    const displayId = found.loan.loanID || found.loan.transactionID || found.loan.id || rawLoanId;
    const displayName = found.loan.name || found.loan.memberName || found.loan.member || 'Unknown Member';
    const displayAmount = Number(found.loan.requestedAmount ?? found.loan.loanAmount ?? found.loan.paymentAmount ?? 0) || 0;

    if (approveBtn) {
      approveLoanIdEl.textContent = displayId;
      approveLoanMemberEl.textContent = displayName;
      approveLoanAmountEl.textContent = `₱${displayAmount.toLocaleString()}`;
      approveLoanErrorEl.classList.add('d-none');
      approveLoanErrorEl.textContent = '';
      approveModal.show();
      return;
    }

    if (denyBtn) {
      rejectLoanIdEl.textContent = displayId;
      rejectLoanMemberEl.textContent = displayName;
      rejectLoanAmountEl.textContent = `₱${displayAmount.toLocaleString()}`;
      rejectLoanErrorEl.classList.add('d-none');
      rejectLoanErrorEl.textContent = '';
      rejectModal.show();
    }
  });

  // Approve handler: update either mockdata.loanRequests or transactionRecords depending on source
  confirmApproveLoanBtn.addEventListener('click', async () => {
    if (!selectedLoanId) return;

    confirmApproveLoanBtn.disabled = true;
    confirmApproveLoanBtn.textContent = 'Approving...';

    try {
      if (selectedLoanSource === 'mock') {
        // update mockdata.loanRequests item
        const mockRaw = localStorage.getItem('mockdata');
        const mock = mockRaw ? JSON.parse(mockRaw) : { loanRequests: [] };
        const loans = Array.isArray(mock.loanRequests) ? mock.loanRequests : [];
        const idx = loans.findIndex(item => (item.loanID || item.id || item.loanId) && String(item.loanID || item.id || item.loanId) === String(selectedLoanId));
        if (idx !== -1) {
          loans[idx].loanStatus = 'Approved';
          loans[idx].approvedAt = new Date().toISOString();
          mock.loanRequests = loans;
          localStorage.setItem('mockdata', JSON.stringify(mock));
        } else {
          throw new Error('Loan not found in mockdata');
        }
      } else if (selectedLoanSource === 'txn') {
        // update transactionRecords item
        const txRaw = localStorage.getItem('transactionRecords');
        const txns = txRaw ? JSON.parse(txRaw) : [];
        const idx = txns.findIndex(t => {
          const ids = [t.transactionID, t.transactionId, t.id, t.loanID, t.loanId].filter(Boolean);
          return ids.some(id => String(id) === String(selectedLoanId));
        });
        if (idx !== -1) {
          txns[idx].loanStatus = 'Approved';
          txns[idx].approvedAt = new Date().toISOString();
          localStorage.setItem('transactionRecords', JSON.stringify(txns));
          // notify any listeners
          window.dispatchEvent(new CustomEvent('transactionsUpdated', { detail: { transactionID: txns[idx].transactionID || selectedLoanId } }));
        } else {
          throw new Error('Loan not found in transactionRecords');
        }
      } else {
        // unknown source: log and do nothing
        console.warn('approve: unknown loan source for', selectedLoanId);
      }

      renderPendingLoanRequests();
      approveModal.hide();
      showLoanResult(true, 'Loan approved successfully.');
    } catch (err) {
      approveLoanErrorEl.classList.remove('d-none');
      approveLoanErrorEl.textContent = err && err.message ? err.message : 'Failed to approve loan';
      console.error('approve error', err);
    } finally {
      confirmApproveLoanBtn.disabled = false;
      confirmApproveLoanBtn.textContent = 'Confirm Approve';
      selectedLoanId = null;
      selectedLoanSource = null;
      selectedLoanRecord = null;
    }
  });

  // Reject handler: similar to approve but set Denied
  confirmRejectLoanBtn.addEventListener('click', async () => {
    if (!selectedLoanId) return;

    confirmRejectLoanBtn.disabled = true;
    confirmRejectLoanBtn.textContent = 'Rejecting...';

    try {
      if (selectedLoanSource === 'mock') {
        const mockRaw = localStorage.getItem('mockdata');
        const mock = mockRaw ? JSON.parse(mockRaw) : { loanRequests: [] };
        const loans = Array.isArray(mock.loanRequests) ? mock.loanRequests : [];
        const idx = loans.findIndex(item => (item.loanID || item.id || item.loanId) && String(item.loanID || item.id || item.loanId) === String(selectedLoanId));
        if (idx !== -1) {
          loans[idx].loanStatus = 'Denied';
          loans[idx].deniedAt = new Date().toISOString();
          mock.loanRequests = loans;
          localStorage.setItem('mockdata', JSON.stringify(mock));
        } else {
          throw new Error('Loan not found in mockdata');
        }
      } else if (selectedLoanSource === 'txn') {
        const txRaw = localStorage.getItem('transactionRecords');
        const txns = txRaw ? JSON.parse(txRaw) : [];
        const idx = txns.findIndex(t => {
          const ids = [t.transactionID, t.transactionId, t.id, t.loanID, t.loanId].filter(Boolean);
          return ids.some(id => String(id) === String(selectedLoanId));
        });
        if (idx !== -1) {
          txns[idx].loanStatus = 'Denied';
          txns[idx].deniedAt = new Date().toISOString();
          localStorage.setItem('transactionRecords', JSON.stringify(txns));
          window.dispatchEvent(new CustomEvent('transactionsUpdated', { detail: { transactionID: txns[idx].transactionID || selectedLoanId } }));
        } else {
          throw new Error('Loan not found in transactionRecords');
        }
      } else {
        console.warn('reject: unknown loan source for', selectedLoanId);
      }

      renderPendingLoanRequests();
      rejectModal.hide();
      showLoanResult(true, 'Loan rejected successfully.');
    } catch (err) {
      rejectLoanErrorEl.classList.remove('d-none');
      rejectLoanErrorEl.textContent = err && err.message ? err.message : 'Failed to reject loan';
      console.error('reject error', err);
    } finally {
      confirmRejectLoanBtn.disabled = false;
      confirmRejectLoanBtn.textContent = 'Confirm Reject';
      selectedLoanId = null;
      selectedLoanSource = null;
      selectedLoanRecord = null;
    }
  });


// escapeHtml helper reused (if you have multiple definitions ensure it is single)
function escapeHtml(text) {
  if (text === null || text === undefined) return '';
  return String(text).replace(/[&<>"']/g, (m) =>
    ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[m])
  );
}

// Subscribe to updates so the list refreshes immediately when transactions change
window.addEventListener('transactionsUpdated', function () {
  try { renderTransactionContainers(); } catch(e) { /* ignore */ }
});

window.addEventListener("mockdataUpdated", () => {
  try { renderOfficerMembers(); } catch (e) {}
  populateMemberIdSelect().catch(()=>{});

});

window.addEventListener("storage", (e) => {
  if (e.key === "mockdata") {
    try { renderOfficerMembers(); } catch (e) {}
  }
});

// Basic escaping helper to avoid injecting HTML
function escapeHtml(text) {
  // Only treat null/undefined as "missing"
  if (text === null || text === undefined) return "";
  return String(text).replace(/[&<>"']/g, (m) =>
    ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[m])
  );
}

