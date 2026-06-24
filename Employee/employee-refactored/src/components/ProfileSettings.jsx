import { useCallback, useEffect, useMemo, useState, memo } from "react";
const DASH = "\u2014";

  function Icon({ children, className = "" }) {
    return <span className={`material-symbols-outlined ${className}`.trim()}>{children}</span>;
  }

  function apiUrl(path) {
    const base = window.EMS_API?.LOGIN || window.location.origin;
    return `${base}${path}`;
  }

  function assetUrl(path) {
    if (!path) return "";
    if (String(path).startsWith("http")) return path;
    const origin = window.EMS_API?.LOGIN || window.location.origin;
    return origin + (String(path).startsWith("/") ? path : `/${path}`);
  }

  function authHeaders() {
    return window.Auth?.headers ? window.Auth.headers() : { "Content-Type": "application/json" };
  }

  const DEV_EMPLOYEE_CODE = "EMP-IT-001"; // fallback when no login session

  function employeeCode() {
    return (window.Auth?.employeeCode ? window.Auth.employeeCode() : "")
      || DEV_EMPLOYEE_CODE;
  }

  function authEmail() {
    return window.Auth?.email ? window.Auth.email() : "";
  }

  function showToast(message, type = "success") {
    const toast = window.EMS_Toast;
    if (toast && typeof toast[type] === "function") {
      toast[type](message);
    }
  }

  function formatDateInput(value) {
    return value ? String(value).slice(0, 10) : "";
  }

  function formatDisplayDate(value) {
    if (!value) return DASH;
    try {
      return new Date(value).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric"
      });
    } catch (_) {
      return String(value);
    }
  }

  function initials(name) {
    return String(name || "AR")
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() || "")
      .join("") || "AR";
  }

  function documentIcon(type, name) {
    const lowerName = String(name || "").toLowerCase();
    if (lowerName.endsWith(".pdf")) return "picture_as_pdf";
    if (lowerName.endsWith(".doc") || lowerName.endsWith(".docx")) return "description";
    if (/image|photo|png|jpg/i.test(type)) return "image";
    return "folder";
  }

  const Header = memo(function Header() {
    return (
      <header className="corporate-header">
        <div className="header-left">
          <button id="sidebarToggle" className="header-toggle-btn" aria-label="Toggle sidebar">
            <Icon>menu</Icon>
          </button>
          <h1 className="header-title" id="page-header-title">My Profile</h1>
        </div>
        <div className="header-right">
          <div className="relative">
            <button id="notificationBtn" className="header-icon-btn" aria-label="Notifications" aria-haspopup="dialog" aria-expanded="false">
              <Icon>notifications</Icon>
              <span id="notificationBadge" className="header-badge" style={{ display: "none" }}>3</span>
            </button>
            <div id="notificationDropdown" className="notification-dropdown">
              <div className="notification-dropdown-header">
                <span className="notification-dropdown-title">Notifications</span>
                <button className="notification-dropdown-clear" id="markAllReadBtn">Mark all read</button>
              </div>
              <div className="notification-dropdown-list" id="notificationList"></div>
              <div className="notification-dropdown-footer">
                <a href="../notifications/code.html">View All Notifications</a>
              </div>
            </div>
          </div>
          <button className="header-icon-btn" aria-label="Help"><Icon>help</Icon></button>
          <div className="header-divider"></div>
          <div className="header-profile">
            <div className="header-profile-info">
              <p id="header-name" className="header-profile-name">{DASH}</p>
              <p id="header-role" className="header-profile-role">{DASH}</p>
            </div>
            <button id="profileBtn" className="header-profile-avatar" aria-label="Profile menu" aria-haspopup="menu" aria-expanded="false">{DASH}</button>
            <div id="profileDropdown" className="profile-dropdown">
              <div className="profile-dropdown-header">
                <div className="profile-dropdown-avatar" id="dropdownAvatar">{DASH}</div>
                <div>
                  <p id="dropdownName" className="font-bold text-slate-900">{DASH}</p>
                  <p id="dropdownRole" className="text-sm text-slate-500">{DASH}</p>
                </div>
              </div>
              <div className="profile-dropdown-menu">
                <a href="../profile_settings/code.html" className="profile-dropdown-item"><Icon>person</Icon>My Profile</a>
                <a href="../settings/code.html" className="profile-dropdown-item"><Icon>settings</Icon>Settings</a>
                <a href="../notifications/code.html" className="profile-dropdown-item"><Icon>notifications</Icon>Notifications</a>
                <div className="profile-dropdown-divider"></div>
                <button id="logoutBtn" className="profile-dropdown-item profile-dropdown-logout"><Icon>logout</Icon>Logout</button>
              </div>
            </div>
          </div>
        </div>
      </header>
    );
  });

  const Sidebar = memo(function Sidebar() {
    return (
      <>
        <aside id="sidebar" className="corporate-sidebar">
          <div className="sidebar-logo">
            <div className="sidebar-logo-icon"><Icon>business_center</Icon></div>
            <div className="sidebar-logo-text">
              <h2>Corporate EMS</h2>
              <p id="sidebar-role-label">Employee Portal</p>
            </div>
          </div>
          <ul className="sidebar-nav" id="sidebar-menu"></ul>
        </aside>
        <div id="sidebarOverlay" className="sidebar-overlay"></div>
      </>
    );
  });

  function ProfileHero({ profile, onPhotoChange }) {
    const name = profile.fullName || profile.full_name || "Loading...";
    const designation = profile.designation || "Employee";
    const department = profile.department || "Employee Portal";
    const photoUrl = profile.photo_url || profile.photoUrl;
    const resolvedPhoto = photoUrl ? assetUrl(photoUrl) : "";

    return (
      <div className="content-card mb-6">
        <div className="p-8 flex items-center gap-6">
          <div className="relative">
            {resolvedPhoto ? (
              <img id="profile-avatar" src={resolvedPhoto} alt="Profile" className="w-24 h-24 rounded-3xl object-cover border-4 border-blue-50 shadow-lg" />
            ) : (
              <div id="profile-avatar" className="w-24 h-24 rounded-3xl bg-blue-100 border-4 border-blue-50 flex items-center justify-center text-3xl font-bold text-blue-700">
                {initials(name)}
              </div>
            )}
            <label className="absolute inset-0 flex items-center justify-center bg-black/40 text-white rounded-3xl opacity-0 hover:opacity-100 cursor-pointer transition-opacity">
              <Icon>photo_camera</Icon>
              <input type="file" id="photoInput" className="hidden" accept="image/*" onChange={onPhotoChange} />
            </label>
          </div>
          <div>
            <h2 id="profile-hero-name" className="text-2xl font-bold">{name}</h2>
            <p id="profile-page-subtitle" className="text-slate-500 mt-1">{designation}</p>
            <div className="flex gap-3 mt-2">
              <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium">{department}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  function TabButton({ active, icon, label, onClick }) {
    return (
      <button className={`tab-btn btn btn-secondary justify-start ${active ? "active" : ""}`} onClick={onClick} type="button">
        <Icon>{icon}</Icon>{label}
      </button>
    );
  }

  function PersonalInfoTab({ form, setForm, onSave }) {
    function updateField(field, value) {
      setForm((current) => ({ ...current, [field]: value }));
    }

    return (
      <div id="tab-personal" className="tab-section active">
        <div className="content-card">
          <div className="content-card-header">
            <h3 className="content-card-title">Personal Information</h3>
          </div>
          <form id="profile-form" className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6" onSubmit={onSave}>
            <div>
              <label className="form-label">Employee Code</label>
              <input id="employeeCode" className="form-input mt-2 bg-slate-50" type="text" value={form.employeeCode} readOnly />
            </div>
            <div>
              <label className="form-label">Full Name</label>
              <input id="fullName" className="form-input mt-2" type="text" placeholder="Enter your name" value={form.fullName} onChange={(event) => updateField("fullName", event.target.value)} />
            </div>
            <div>
              <label className="form-label">Designation</label>
              <input id="designation" className="form-input mt-2 bg-slate-50" type="text" placeholder="Enter your designation" value={form.designation} readOnly />
            </div>
            <div>
              <label className="form-label">Department</label>
              <input id="department" className="form-input mt-2 bg-slate-50" type="text" placeholder="Enter your department" value={form.department} readOnly />
            </div>
            <div>
              <label className="form-label">Email</label>
              <input id="email" className="form-input mt-2" type="email" placeholder="email@company.com" value={form.email} onChange={(event) => updateField("email", event.target.value)} />
            </div>
            <div>
              <label className="form-label">Phone Number</label>
              <input id="phone" className="form-input mt-2" type="tel" placeholder="+1 (555) 012-3456" value={form.phone} onChange={(event) => updateField("phone", event.target.value)} />
            </div>
            <div>
              <label className="form-label">Date of Birth</label>
              <input id="dob" className="form-input mt-2" type="date" value={form.dob} onChange={(event) => updateField("dob", event.target.value)} />
            </div>
            <div>
              <label className="form-label">Date of Joining</label>
              <input id="dateOfJoining" className="form-input mt-2 bg-slate-50" type="date" value={form.dateOfJoining} readOnly />
            </div>
            <div>
              <label className="form-label">Work Location</label>
              <input id="workLocation" className="form-input mt-2 bg-slate-50" type="text" placeholder="Enter work location" value={form.workLocation} readOnly />
            </div>
            <div>
              <label className="form-label">Emergency Contact Name</label>
              <input id="emergencyContactName" className="form-input mt-2" type="text" placeholder="Emergency contact name" value={form.emergencyContactName} onChange={(event) => updateField("emergencyContactName", event.target.value)} />
            </div>
            <div>
              <label className="form-label">Emergency Contact Phone</label>
              <input id="emergencyContactPhone" className="form-input mt-2" type="tel" placeholder="Emergency contact phone" value={form.emergencyContactPhone} onChange={(event) => updateField("emergencyContactPhone", event.target.value)} />
            </div>
            <div className="md:col-span-2">
              <label className="form-label">Residential Address</label>
              <textarea id="address" className="form-textarea mt-2" placeholder="Your address" value={form.address} onChange={(event) => updateField("address", event.target.value)}></textarea>
            </div>
            <div className="md:col-span-2 flex justify-end gap-3 pt-4">
              <button type="button" className="btn btn-secondary">Cancel</button>
              <button id="savePersonalBtn" type="submit" className="btn btn-primary">Save Changes</button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  function DocumentsTab({ documents, onUpload, onDelete }) {
    return (
      <div id="tab-documents" className="tab-section active">
        <div className="content-card">
          <div className="content-card-header">
            <h3 className="content-card-title">Employee Documents</h3>
            <label className="btn btn-secondary cursor-pointer">
              <Icon>upload_file</Icon>Upload New
              <input type="file" id="docUpload" className="hidden" accept=".pdf,.doc,.docx,.png,.jpg,.jpeg" onChange={onUpload} />
            </label>
          </div>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Document Name</th>
                  <th>Type</th>
                  <th>Size</th>
                  <th>Uploaded</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody id="docTable">
                {documents.length ? documents.map((doc) => {
                  const type = doc.document_type || doc.documentType || "General";
                  const name = doc.document_name || doc.documentName || "Document";
                  const path = doc.file_path || doc.filePath || "";
                  const uploaded = formatDisplayDate(doc.uploaded_at || doc.uploadedAt);
                  return (
                    <tr className="hover:bg-surface-container-lowest transition-colors" data-type={type} data-id={doc.id} key={doc.id || name}>
                      <td className="px-lg py-4">
                        <div className="flex items-center gap-3">
                          <Icon className="text-blue-600">{documentIcon(type, name)}</Icon>
                          <span className="font-body-md font-medium">{name}</span>
                        </div>
                      </td>
                      <td className="px-lg py-4"><span className="px-2 py-1 bg-slate-100 text-slate-700 text-[11px] font-bold rounded uppercase">{type}</span></td>
                      <td className="px-lg py-4 text-on-surface-variant text-sm">{DASH}</td>
                      <td className="px-lg py-4 text-on-surface-variant text-sm">{uploaded}</td>
                      <td className="px-lg py-4 text-right flex items-center justify-end gap-3">
                        <a href={assetUrl(path)} target="_blank" rel="noopener" className="doc-download text-blue-600 hover:underline font-label-md text-sm">Download</a>
                        <button type="button" className="doc-delete text-red-400 hover:text-red-600 font-label-md text-sm" onClick={() => onDelete(doc.id)}>Delete</button>
                      </td>
                    </tr>
                  );
                }) : <tr><td colSpan="5" className="text-center py-8 text-slate-400">No documents found</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  function ProfileSettingsApp() {
    const code = useMemo(() => employeeCode(), []);
    const [activeTab, setActiveTab] = useState("personal");
    const [profile, setProfile] = useState({});
    const [documents, setDocuments] = useState([]);
    const [form, setForm] = useState({
      employeeCode: "",
      fullName: "",
      email: "",
      phone: "",
      dob: "",
      address: "",
      department: "",
      designation: "",
      dateOfJoining: "",
      workLocation: "",
      emergencyContactName: "",
      emergencyContactPhone: ""
    });

    const loadProfile = useCallback(async () => {
      if (!code) return;

      try {
        const response = await fetch(apiUrl(`/api/employees/${encodeURIComponent(code)}/profile`), {
          headers: authHeaders()
        });
        if (!response.ok) throw new Error(String(response.status));
        const data = await response.json();
        const p = data.profile || {};

        setProfile(p);
        setDocuments(data.documents || []);
        setForm({
          employeeCode: p.employee_code || p.employeeCode || code || "",
          fullName: p.full_name || p.fullName || "",
          email: p.email || p.username || authEmail(),
          phone: p.phone_number || p.phoneNumber || "",
          dob: formatDateInput(p.date_of_birth || p.dateOfBirth),
          address: p.residential_address || p.residentialAddress || "",
          department: p.department || "",
          designation: p.designation || "",
          dateOfJoining: formatDateInput(p.date_of_joining || p.dateOfJoining),
          workLocation: p.work_location || p.workLocation || "",
          emergencyContactName: p.emergency_contact_name || p.emergencyContactName || "",
          emergencyContactPhone: p.emergency_contact_phone || p.emergencyContactPhone || ""
        });
      } catch (error) {
        console.error(error);
        showToast("Could not load profile from server", "error");
      }
    }, [code]);

    useEffect(() => {
      loadProfile();
    }, [loadProfile]);

    async function savePersonal(event) {
      event.preventDefault();
      if (!code) return;

      const payload = {
        fullName: form.fullName.trim(),
        full_name: form.fullName.trim(),
        email: form.email.trim(),
        phoneNumber: form.phone.trim(),
        phone_number: form.phone.trim(),
        dateOfBirth: form.dob || null,
        date_of_birth: form.dob || null,
        residentialAddress: form.address.trim(),
        residential_address: form.address.trim(),
        department: form.department.trim(),
        designation: form.designation.trim(),
        dateOfJoining: form.dateOfJoining || null,
        date_of_joining: form.dateOfJoining || null,
        workLocation: form.workLocation.trim(),
        work_location: form.workLocation.trim(),
        emergencyContactName: form.emergencyContactName.trim(),
        emergency_contact_name: form.emergencyContactName.trim(),
        emergencyContactPhone: form.emergencyContactPhone.trim(),
        emergency_contact_phone: form.emergencyContactPhone.trim()
      };

      if (!payload.fullName) {
        showToast("Full name is required", "error");
        return;
      }

      try {
        const response = await fetch(apiUrl(`/api/employees/${encodeURIComponent(code)}/profile`), {
          method: "PUT",
          headers: authHeaders(),
          body: JSON.stringify(payload)
        });
        if (!response.ok) throw new Error(await response.text());
        showToast("Profile saved to database");
        await loadProfile();
        window.EMS_refreshHeader?.();
        window.dispatchEvent(new Event("ems-profile-updated"));
      } catch (_) {
        showToast("Save failed", "error");
      }
    }

    async function uploadPhoto(event) {
      const file = event.target.files?.[0];
      if (!file || !code) return;
      if (file.size > 5 * 1024 * 1024) {
        showToast("Photo max 5 MB", "error");
        return;
      }

      const upload = new FormData();
      upload.append("photo", file);

      try {
        const response = await fetch(apiUrl(`/api/employees/${encodeURIComponent(code)}/profile-photo`), {
          method: "POST",
          headers: { Authorization: authHeaders().Authorization },
          body: upload
        });
        if (!response.ok) throw new Error(String(response.status));
        showToast("Profile photo uploaded");
        await loadProfile();
        window.EMS_refreshHeader?.();
        window.dispatchEvent(new Event("ems-profile-updated"));
      } catch (_) {
        showToast("Photo upload failed", "error");
      }
    }

    async function uploadDocument(event) {
      const file = event.target.files?.[0];
      if (!file || !code) return;
      if (file.size > 10 * 1024 * 1024) {
        showToast("File max 10 MB", "error");
        return;
      }

      const type = prompt("Document type (Identity / Legal / Insurance / General)", "General") || "General";
      const upload = new FormData();
      upload.append("file", file);
      upload.append("documentType", type);

      try {
        const response = await fetch(apiUrl(`/api/employees/${encodeURIComponent(code)}/documents`), {
          method: "POST",
          headers: { Authorization: authHeaders().Authorization },
          body: upload
        });
        if (!response.ok) throw new Error(await response.text());
        showToast("Document uploaded");
        event.target.value = "";
        await loadProfile();
      } catch (_) {
        showToast("Upload failed - use PDF, DOC, DOCX, or image", "error");
      }
    }

    async function deleteDocument(id) {
      if (!id || !code || !confirm("Delete this document permanently?")) return;

      try {
        const response = await fetch(apiUrl(`/api/employees/${encodeURIComponent(code)}/documents/${id}`), {
          method: "DELETE",
          headers: authHeaders()
        });
        if (!response.ok) throw new Error(String(response.status));
        showToast("Document deleted");
        await loadProfile();
      } catch (_) {
        showToast("Delete failed", "error");
      }
    }

    return (
      <div className="corporate-page">
        <Sidebar />
        <div className="corporate-main" id="main-content">
          <Header />
          <div id="breadcrumb-container" data-breadcrumbs="true" className="breadcrumb" style={{ display: "none" }}></div>
          <div className="corporate-content">
            <div className="page-header">
              <div className="page-header-content">
                <h1>My Profile</h1>
                <p>Manage your personal information, security preferences, and documents.</p>
              </div>
            </div>

            <ProfileHero profile={profile} onPhotoChange={uploadPhoto} />

            <div className="flex flex-col lg:flex-row gap-6">
              <nav className="lg:w-64 flex lg:flex-col gap-2 overflow-x-auto pb-4 lg:pb-0">
                <TabButton active={activeTab === "personal"} icon="person_edit" label="Personal Info" onClick={() => setActiveTab("personal")} />
                <TabButton active={activeTab === "documents"} icon="description" label="Documents" onClick={() => setActiveTab("documents")} />
              </nav>

              <div className="flex-1 space-y-6">
                {activeTab === "personal" && <PersonalInfoTab form={form} setForm={setForm} onSave={savePersonal} />}
                {activeTab === "documents" && <DocumentsTab documents={documents} onUpload={uploadDocument} onDelete={deleteDocument} />}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
export default ProfileSettingsApp;
