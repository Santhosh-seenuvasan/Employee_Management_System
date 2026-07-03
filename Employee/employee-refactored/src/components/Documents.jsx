import { useCallback, useEffect, useState } from "react";
import { CorporateShell, Icon } from "./CorporateShell.jsx";

  function apiBase() {
    return window.EMS_API?.LOGIN || window.location.origin;
  }

  function authHeaders() {
    return window.Auth?.headers ? window.Auth.headers() : { "Content-Type": "application/json" };
  }

  const DEV_EMPLOYEE_CODE = "EMP-IT-001"; // fallback when no login session

  function employeeCode() {
    return (window.Auth?.employeeCode ? window.Auth.employeeCode() : "")
      || DEV_EMPLOYEE_CODE;
  }

  function badgeClass(status) {
    const s = String(status || "").toLowerCase();
    if (s === "pending" || s === "expiring soon") return "pending";
    if (s === "rejected") return "rejected";
    return "present";
  }

  function docIcon(type) {
    const t = String(type || "").toLowerCase();
    if (t.includes("contract")) return "description";
    if (t.includes("offer")) return "mail";
    if (t.includes("nda") || t.includes("disclosure")) return "lock";
    if (t.includes("passport")) return "badge";
    if (t.includes("license") || t.includes("licence")) return "badge";
    if (t.includes("permit")) return "work";
    if (t.includes("cert")) return "workspace_premium";
    return "folder";
  }

  function docColor(type) {
    const t = String(type || "").toLowerCase();
    if (t.includes("contract") || t.includes("cert")) return "emerald";
    if (t.includes("offer") || t.includes("license")) return "blue";
    if (t.includes("nda") || t.includes("disclosure")) return "purple";
    if (t.includes("passport")) return "amber";
    if (t.includes("permit")) return "emerald";
    return "blue";
  }

  function DocumentCard({ doc, onDownload }) {
    const color = doc.color || docColor(doc.document_type || doc.documentType || doc.title || "");
    const icon = doc.icon || docIcon(doc.document_type || doc.documentType || doc.title || "");
    const title = doc.title || doc.document_type || doc.documentType || "Document";
    const status = doc.status || "Verified";
    const subText = doc.text || (doc.uploaded_at ? `Uploaded: ${new Date(doc.uploaded_at).toLocaleDateString("en-IN")}` : "");

    return (
      <div className="info-card doc-card">
        <div className="flex items-start justify-between mb-3">
          <div className={`w-10 h-10 rounded-xl bg-${color}-100 flex items-center justify-center`}>
            <Icon className={`text-${color}-600`}>{icon}</Icon>
          </div>
          <span className={`status-badge ${badgeClass(status)}`}>{status}</span>
        </div>
        <h3 className="info-card-title">{title}</h3>
        <p className="text-slate-500 text-sm mt-1">{subText}</p>
        <div className="mt-4 flex gap-2">
          <button className="btn btn-secondary btn-sm flex-1"><Icon>visibility</Icon> View</button>
          <button className="btn btn-secondary btn-sm flex-1" onClick={() => onDownload(doc)}>
            <Icon>download</Icon> Download
          </button>
        </div>
      </div>
    );
  }

  function DocumentsApp() {
    const [documents, setDocuments] = useState([]);
    const [recentPayslips, setRecentPayslips] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ total: 0, verified: 0, pending: 0, expiring: 0 });

    const loadDocuments = useCallback(async () => {
      const code = employeeCode();
      if (!code) { setLoading(false); return; }

      try {
        /* GET /api/employees/{code}/profile returns { profile, documents, preferences } */
        const res = await fetch(
          `${apiBase()}/api/employees/${encodeURIComponent(code)}/profile`,
          { headers: authHeaders() }
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const docs = Array.isArray(data.documents) ? data.documents : [];
        setDocuments(docs);

        /* Compute stats */
        const verified = docs.filter(d => String(d.status || "").toLowerCase() === "verified").length;
        const pending  = docs.filter(d => String(d.status || "").toLowerCase() === "pending").length;
        const expiring = docs.filter(d => String(d.status || "").toLowerCase() === "expiring soon").length;
        setStats({ total: docs.length, verified, pending, expiring });
      } catch (err) {
        console.error("Failed to load documents", err);
      } finally {
        setLoading(false);
      }
    }, []);

    const loadPayslips = useCallback(async () => {
      const code = employeeCode();
      if (!code) return;
      try {
        const res = await fetch(
          `${apiBase()}/api/employees/${encodeURIComponent(code)}/payslips`,
          { headers: authHeaders() }
        );
        if (!res.ok) return;
        const slips = await res.json();
        setRecentPayslips((Array.isArray(slips) ? slips : []).slice(0, 3));
      } catch {
        /* Payslips are optional here — ignore errors */
      }
    }, []);

    useEffect(() => {
      loadDocuments();
      loadPayslips();
    }, [loadDocuments, loadPayslips]);

    function handleDownload(doc) {
      const url = doc.file_path || doc.filePath;
      if (!url) return;
      const full = String(url).startsWith("http") ? url : apiBase() + url;
      window.open(full, "_blank", "noopener");
    }

    /* Group docs by category */
    const employment = documents.filter(d => {
      const t = String(d.document_type || d.documentType || d.title || "").toLowerCase();
      return t.includes("contract") || t.includes("offer") || t.includes("nda") || t.includes("disclosure") || t.includes("appointment");
    });
    const personal = documents.filter(d => {
      const t = String(d.document_type || d.documentType || d.title || "").toLowerCase();
      return t.includes("passport") || t.includes("license") || t.includes("permit") || t.includes("id") || t.includes("aadhar") || t.includes("pan");
    });
    const certs = documents.filter(d => {
      const t = String(d.document_type || d.documentType || d.title || "").toLowerCase();
      return t.includes("cert") || t.includes("degree") || t.includes("diploma");
    });
    const other = documents.filter(d => !employment.includes(d) && !personal.includes(d) && !certs.includes(d));

    return (
      <CorporateShell title="My Documents">
        <div className="page-header">
          <div className="page-header-content">
            <h1>My Documents</h1>
            <p>View and manage your personal and employment documents</p>
          </div>
          <div className="page-header-actions">
            <button className="btn btn-secondary" onClick={loadDocuments}><Icon>refresh</Icon> Refresh</button>
          </div>
        </div>

        <div className="stats-grid">
          <div className="stat-card"><div className="stat-card-header"><span className="stat-card-icon blue"><Icon>description</Icon></span></div><p className="stat-card-label">Total Documents</p><h3 className="stat-card-value">{loading ? "..." : stats.total}</h3></div>
          <div className="stat-card"><div className="stat-card-header"><span className="stat-card-icon green"><Icon>verified</Icon></span></div><p className="stat-card-label">Verified</p><h3 className="stat-card-value">{loading ? "..." : stats.verified}</h3></div>
          <div className="stat-card"><div className="stat-card-header"><span className="stat-card-icon amber"><Icon>pending_actions</Icon></span></div><p className="stat-card-label">Pending Review</p><h3 className="stat-card-value">{loading ? "..." : stats.pending}</h3></div>
          <div className="stat-card"><div className="stat-card-header"><span className="stat-card-icon red"><Icon>error</Icon></span></div><p className="stat-card-label">Expiring Soon</p><h3 className="stat-card-value">{loading ? "..." : stats.expiring}</h3></div>
        </div>

        {loading && (
          <div className="content-card p-8 text-center text-slate-500">Loading your documents...</div>
        )}

        {!loading && documents.length === 0 && (
          <div className="content-card p-8 text-center text-slate-500">
            <Icon className="text-4xl text-slate-300">folder_open</Icon>
            <p className="mt-3 font-medium">No documents found</p>
            <p className="text-sm mt-1">Documents uploaded by HR will appear here.</p>
          </div>
        )}

        {!loading && employment.length > 0 && (
          <div className="mb-8">
            <h2 className="section-title mb-4">Employment Documents</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {employment.map((doc) => <DocumentCard doc={doc} key={doc.id || doc.title} onDownload={handleDownload} />)}
            </div>
          </div>
        )}

        {!loading && personal.length > 0 && (
          <div className="mb-8">
            <h2 className="section-title mb-4">Personal Documents</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {personal.map((doc) => <DocumentCard doc={doc} key={doc.id || doc.title} onDownload={handleDownload} />)}
            </div>
          </div>
        )}

        {!loading && certs.length > 0 && (
          <div className="mb-8">
            <h2 className="section-title mb-4">Certificates</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {certs.map((doc) => <DocumentCard doc={doc} key={doc.id || doc.title} onDownload={handleDownload} />)}
            </div>
          </div>
        )}

        {!loading && other.length > 0 && (
          <div className="mb-8">
            <h2 className="section-title mb-4">Other Documents</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {other.map((doc) => <DocumentCard doc={doc} key={doc.id || doc.title} onDownload={handleDownload} />)}
            </div>
          </div>
        )}

        {/* Recent Payslips */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title">Recent Payslips</h2>
          </div>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Payslip</th>
                  <th>Date</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {recentPayslips.length === 0 && (
                  <tr><td colSpan="3" className="px-6 py-6 text-center text-slate-500">No payslips available.</td></tr>
                )}
                {recentPayslips.map((slip, i) => {
                  const date = new Date(slip.paymentDate || slip.createdAt || Date.now());
                  const label = date.toLocaleDateString("en-IN", { month: "long", year: "numeric" }) + " Payslip";
                  const generated = "Generated: " + date.toLocaleDateString("en-IN");
                  return (
                    <tr key={slip.id || i}>
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-pink-100 flex items-center justify-center"><Icon className="text-pink-600">receipt</Icon></div>
                          <div><p className="font-semibold">{label}</p></div>
                        </div>
                      </td>
                      <td>{generated}</td>
                      <td className="text-right">
                        <button className="btn btn-secondary btn-sm" onClick={() => {
                          const url = slip.file_path || slip.filePath;
                          if (url) window.open(String(url).startsWith("http") ? url : apiBase() + url, "_blank", "noopener");
                        }}><Icon>download</Icon> Download</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </CorporateShell>
    );
  }
export default DocumentsApp;
