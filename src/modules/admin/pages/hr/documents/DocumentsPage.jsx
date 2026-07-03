import { useState, useEffect } from 'react';

function getApiBase() {
  return window.EMS_API?.HR || window.location.origin;
}

function getHeaders() {
  const t = (() => { try { return localStorage.getItem('ems_token') || sessionStorage.getItem('ems_token'); } catch (_) { return ''; } })();
  return { 'Content-Type': 'application/json', ...(t ? { 'Authorization': `Bearer ${t}` } : {}) };
}

function escapeHtml(v) {
  if (v == null) return '';
  return String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

const typeColors = { policy: 'bg-blue-100 text-blue-700', contract: 'bg-green-100 text-green-700', certificate: 'bg-amber-100 text-amber-700', id: 'bg-purple-100 text-purple-700' };
const statusColors = { verified: 'present', pending: 'pending', expired: 'absent' };

export default function DocumentsPage() {
  const [docs, setDocs] = useState([]);
  const [stats, setStats] = useState({ total: 0, verified: 0, pending: 0, expiring: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ title: '', type: '', employeeCode: '', notes: '', file: null });
  const [submitting, setSubmitting] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  async function loadDocs() {
    try {
      const [statRes, docRes] = await Promise.all([
        fetch(`${getApiBase()}/api/documents/stats`, { headers: getHeaders() }),
        fetch(`${getApiBase()}/api/documents`, { headers: getHeaders() }),
      ]);
      if (statRes.ok) {
        const s = await statRes.json();
        setStats({ total: s.totalDocuments ?? s.total ?? 0, verified: s.verified ?? 0, pending: s.pending ?? 0, expiring: s.expiring ?? 0 });
      }
      if (docRes.ok) setDocs(await docRes.json());
    } catch (_) {}
    setLoading(false);
  }

  useEffect(() => { loadDocs(); }, []);

  const filtered = docs.filter(d => {
    if (search) {
      const q = search.toLowerCase();
      const title = (d.title || d.documentName || '').toLowerCase();
      const desc = (d.description || '').toLowerCase();
      if (!title.includes(q) && !desc.includes(q)) return false;
    }
    if (typeFilter && (d.type || d.documentType || '').toLowerCase() !== typeFilter.toLowerCase()) return false;
    if (statusFilter && (d.status || '').toLowerCase() !== statusFilter.toLowerCase()) return false;
    return true;
  });

  function openUploadModal() { setShowModal(true); }
  function closeModal() { setShowModal(false); setForm({ title: '', type: '', employeeCode: '', notes: '', file: null }); setDragOver(false); }

  function handleChange(e) {
    const { name, value, files } = e.target;
    if (name === 'file') setForm(f => ({ ...f, file: files?.[0] || null }));
    else setForm(f => ({ ...f, [name]: value }));
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer?.files?.[0];
    if (file) setForm(f => ({ ...f, file }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.title.trim() || !form.type) return;
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('documentName', form.title);
      fd.append('documentType', form.type);
      if (form.employeeCode) fd.append('employeeCode', form.employeeCode);
      if (form.notes) fd.append('notes', form.notes);
      if (form.file) fd.append('file', form.file);
      const res = await fetch(`${getApiBase()}/api/documents`, {
        method: 'POST',
        headers: { Authorization: getHeaders().Authorization },
        body: fd,
      });
      if (res.ok) { closeModal(); await loadDocs(); }
    } catch (_) {}
    setSubmitting(false);
  }

  return (
    <div className="corporate-content">
      <div className="page-header">
        <div className="page-header-content">
          <h1>Document Management</h1>
          <p>Upload, verify, and track employee and company documents</p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-secondary"><span className="material-symbols-outlined">download</span> Export</button>
          <button className="btn btn-primary" onClick={openUploadModal}><span className="material-symbols-outlined">upload</span> Upload Document</button>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-card-header"><span className="stat-card-icon bg-blue-50 text-blue-600"><span className="material-symbols-outlined">description</span></span></div>
          <p className="stat-card-label">Total Documents</p>
          <h3 className="stat-card-value">{stats.total}</h3>
        </div>
        <div className="stat-card">
          <div className="stat-card-header"><span className="stat-card-icon bg-green-50 text-green-600"><span className="material-symbols-outlined">verified</span></span></div>
          <p className="stat-card-label">Verified</p>
          <h3 className="stat-card-value">{stats.verified}</h3>
        </div>
        <div className="stat-card">
          <div className="stat-card-header"><span className="stat-card-icon bg-amber-50 text-amber-600"><span className="material-symbols-outlined">pending_actions</span></span></div>
          <p className="stat-card-label">Pending Verification</p>
          <h3 className="stat-card-value">{stats.pending}</h3>
        </div>
        <div className="stat-card">
          <div className="stat-card-header"><span className="stat-card-icon bg-red-50 text-red-600"><span className="material-symbols-outlined">error</span></span></div>
          <p className="stat-card-label">Expiring Soon</p>
          <h3 className="stat-card-value">{stats.expiring}</h3>
        </div>
      </div>

      {stats.expiring > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6 flex items-center gap-3 text-amber-800">
          <span className="material-symbols-outlined">warning</span>
          <span className="text-sm font-medium">{stats.expiring} document(s) need attention before expiry</span>
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm px-5 py-4 flex items-center gap-3 flex-wrap mb-6">
        <span className="material-symbols-outlined text-slate-400 text-xl">search</span>
        <input type="text" placeholder="Search by title or description..." className="flex-1 bg-transparent border-none outline-none text-sm min-w-[150px]"
          value={search} onChange={e => setSearch(e.target.value)} />
        <select className="px-4 py-2 rounded-xl border border-slate-200 text-sm" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
          <option value="">All Types</option>
          <option value="Policy">Policy</option>
          <option value="Contract">Contract</option>
          <option value="Certificate">Certificate</option>
          <option value="ID Document">ID Document</option>
          <option value="Other">Other</option>
        </select>
        <select className="px-4 py-2 rounded-xl border border-slate-200 text-sm" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">All Status</option>
          <option value="Verified">Verified</option>
          <option value="Pending">Pending</option>
          <option value="Expired">Expired</option>
        </select>
      </div>

      {loading ? (
        <div className="text-center py-16 text-slate-400">
          <span className="material-symbols-outlined text-4xl animate-spin inline-block">progress_activity</span>
          <p className="text-sm mt-3">Loading documents...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <span className="material-symbols-outlined text-5xl mb-4 block">folder</span>
          <p>No documents found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filtered.map((d, i) => {
            const typeColor = typeColors[(d.type || '').toLowerCase().replace(' ', '')] || 'bg-slate-100 text-slate-700';
            const statusClass = statusColors[(d.status || '').toLowerCase()] || 'pending';
            return (
              <div key={d.id || i} className="bg-white rounded-2xl border border-slate-100 overflow-hidden hover:shadow-md transition-shadow">
                <div className="p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                      <span className="material-symbols-outlined text-blue-600">description</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded ${typeColor}`}>{d.type || d.documentType || 'Other'}</span>
                    </div>
                    <span className={`status-badge ${statusClass}`}>{d.status || 'Pending'}</span>
                  </div>
                  <h4 className="font-semibold text-slate-800 truncate">{escapeHtml(d.title || d.documentName)}</h4>
                  {d.description && <p className="text-xs text-slate-500 mt-1 line-clamp-2">{escapeHtml(d.description)}</p>}
                  <p className="text-xs text-slate-400 mt-2">Employee: {escapeHtml(d.employeeName || d.employee || '—')}</p>
                  <p className="text-xs text-slate-400">{d.uploadDate || d.createdAt || d.uploadedAt || ''}</p>
                </div>
                <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex gap-2">
                  <button className="text-xs font-semibold text-blue-600 hover:text-blue-800">View</button>
                  <button className="text-xs font-semibold text-slate-500 hover:text-slate-700">Download</button>
                  <button className="text-xs font-semibold text-red-500 hover:text-red-700 ml-auto">Delete</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay show" onClick={closeModal}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Upload Document</h3>
              <button className="modal-close-btn" onClick={closeModal}><span className="material-symbols-outlined">close</span></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body space-y-4">
                <div className="form-group">
                  <label className="form-label">Document Title</label>
                  <input type="text" name="title" className="form-input" required value={form.title} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label className="form-label">Type</label>
                  <select name="type" className="form-select" required value={form.type} onChange={handleChange}>
                    <option value="">Select type...</option>
                    <option value="Policy">Policy</option>
                    <option value="Contract">Contract</option>
                    <option value="Certificate">Certificate</option>
                    <option value="ID Document">ID Document</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Employee Code (optional)</label>
                  <input type="text" name="employeeCode" className="form-input" value={form.employeeCode} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label className="form-label">File</label>
                  <div className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-colors ${dragOver ? 'border-blue-400 bg-blue-50' : 'border-slate-300 hover:border-slate-400'}`}
                    onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                    onClick={() => document.getElementById('fileInput')?.click()}>
                    <span className="material-symbols-outlined text-4xl text-slate-300 mb-2 block">cloud_upload</span>
                    <p className="text-sm text-slate-500">{form.file ? form.file.name : 'Drag & drop or click to browse'}</p>
                    <p className="text-xs text-slate-400 mt-1">PDF, DOC, DOCX, PNG, JPG, WEBP (max 10MB)</p>
                    <input id="fileInput" type="file" name="file" className="hidden" accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.webp" onChange={handleChange} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Notes (optional)</label>
                  <textarea name="notes" rows="2" className="form-textarea" value={form.notes} onChange={handleChange} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? 'Uploading...' : 'Upload'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

DocumentsPage.pageTitle = "Document Management";
