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

export default function AssetsPage() {
  const [assets, setAssets] = useState([]);
  const [stats, setStats] = useState({ total: 0, available: 0, assigned: 0, maintenance: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [viewAsset, setViewAsset] = useState(null);
  const [form, setForm] = useState({ name: '', type: '', status: 'Available', assetTag: '', purchaseDate: '', cost: '' });
  const [submitting, setSubmitting] = useState(false);
  const [page, setPage] = useState(0);
  const perPage = 10;

  async function loadAssets() {
    try {
      const [statRes, assetRes] = await Promise.all([
        fetch(`${getApiBase()}/api/assets/stats`, { headers: getHeaders() }),
        fetch(`${getApiBase()}/api/assets`, { headers: getHeaders() }),
      ]);
      if (statRes.ok) {
        const raw = await statRes.json();
        setStats({ total: raw.totalAssets ?? raw.total ?? 0, available: raw.available ?? 0, assigned: raw.assigned ?? 0, maintenance: raw.maintenance ?? 0 });
      }
      if (assetRes.ok) setAssets(await assetRes.json());
    } catch (_) {}
    setLoading(false);
  }

  useEffect(() => { loadAssets(); }, []);

  const filtered = assets.filter(a => {
    if (search) {
      const q = search.toLowerCase();
      const name = (a.name || a.assetName || '').toLowerCase();
      const id = (a.assetId || a.id || '').toLowerCase();
      const emp = (a.assignedTo || '').toLowerCase();
      if (!name.includes(q) && !id.includes(q) && !emp.includes(q)) return false;
    }
    if (typeFilter && (a.category || a.type || '').toLowerCase() !== typeFilter.toLowerCase()) return false;
    if (statusFilter && (a.status || '').toLowerCase() !== statusFilter.toLowerCase()) return false;
    return true;
  });

  const paged = filtered.slice(page * perPage, (page + 1) * perPage);
  const totalPages = Math.ceil(filtered.length / perPage);

  function openAddModal() { setShowModal(true); setViewAsset(null); }
  function closeModal() { setShowModal(false); setForm({ name: '', type: '', status: 'Available', assetTag: '', purchaseDate: '', cost: '' }); }

  function handleChange(e) {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${getApiBase()}/api/assets`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ assetName: form.name, category: form.type, status: form.status, assetTag: form.assetTag, purchaseDate: form.purchaseDate, cost: form.cost }),
      });
      if (res.ok) { closeModal(); await loadAssets(); }
    } catch (_) {}
    setSubmitting(false);
  }

  const statusClass = s => {
    const map = { available: 'present', assigned: 'pending', maintenance: 'absent', retired: 'absent' };
    return map[(s || '').toLowerCase()] || 'present';
  };

  return (
    <div className="corporate-content">
      <div className="page-header">
        <div className="page-header-content">
          <h1>Asset Management</h1>
          <p>Track and manage company assets, assignments, and maintenance</p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-secondary"><span className="material-symbols-outlined">download</span> Export</button>
          <button className="btn btn-primary" onClick={openAddModal}><span className="material-symbols-outlined">add</span> Add Asset</button>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-card-header"><span className="stat-card-icon bg-blue-50 text-blue-600"><span className="material-symbols-outlined">inventory_2</span></span></div>
          <p className="stat-card-label">Total Assets</p>
          <h3 className="stat-card-value">{stats.total}</h3>
        </div>
        <div className="stat-card">
          <div className="stat-card-header"><span className="stat-card-icon bg-green-50 text-green-600"><span className="material-symbols-outlined">check_circle</span></span></div>
          <p className="stat-card-label">Available</p>
          <h3 className="stat-card-value">{stats.available}</h3>
        </div>
        <div className="stat-card">
          <div className="stat-card-header"><span className="stat-card-icon bg-amber-50 text-amber-600"><span className="material-symbols-outlined">person</span></span></div>
          <p className="stat-card-label">Assigned</p>
          <h3 className="stat-card-value">{stats.assigned}</h3>
        </div>
        <div className="stat-card">
          <div className="stat-card-header"><span className="stat-card-icon bg-red-50 text-red-600"><span className="material-symbols-outlined">build</span></span></div>
          <p className="stat-card-label">In Maintenance</p>
          <h3 className="stat-card-value">{stats.maintenance}</h3>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm px-5 py-4 flex items-center gap-3 flex-wrap mb-6">
        <span className="material-symbols-outlined text-slate-400 text-xl">search</span>
        <input type="text" placeholder="Search by name, ID, employee..." className="flex-1 bg-transparent border-none outline-none text-sm min-w-[150px]"
          value={search} onChange={e => { setSearch(e.target.value); setPage(0); }} />
        <select className="px-4 py-2 rounded-xl border border-slate-200 text-sm" value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setPage(0); }}>
          <option value="">All Types</option>
          <option value="Laptop">Laptop</option>
          <option value="Desktop">Desktop</option>
          <option value="Monitor">Monitor</option>
          <option value="Phone">Phone</option>
          <option value="Tablet">Tablet</option>
          <option value="Accessory">Accessory</option>
        </select>
        <select className="px-4 py-2 rounded-xl border border-slate-200 text-sm" value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(0); }}>
          <option value="">All Status</option>
          <option value="Available">Available</option>
          <option value="Assigned">Assigned</option>
          <option value="Maintenance">Maintenance</option>
          <option value="Retired">Retired</option>
        </select>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Asset ID</th>
              <th>Name</th>
              <th>Type</th>
              <th>Status</th>
              <th>Assigned To</th>
              <th>Purchase Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="7" className="text-center py-16 text-slate-400">Loading assets...</td></tr>
            ) : paged.length === 0 ? (
              <tr><td colSpan="7" className="text-center py-16 text-slate-400">No assets found</td></tr>
            ) : (
              paged.map((a, i) => (
                <tr key={a.id || i}>
                  <td className="px-6 py-4 font-mono text-sm">{a.assetId || a.id || '—'}</td>
                  <td className="px-6 py-4 font-medium">{a.name || a.assetName}</td>
                  <td className="px-6 py-4">{a.category || a.type || '—'}</td>
                  <td className="px-6 py-4">
                    <span className={`status-badge ${statusClass(a.status)}`}>{a.status || '—'}</span>
                  </td>
                  <td className="px-6 py-4 text-slate-500">{a.assignedTo || '—'}</td>
                  <td className="px-6 py-4 text-slate-500">{a.purchaseDate || a.purchase_date || '—'}</td>
                  <td className="px-6 py-4">
                    <button className="btn btn-sm btn-secondary" onClick={() => setViewAsset(a)}>View</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <div className="table-actions">
          <p className="text-sm text-slate-500">Showing {page * perPage + 1}-{Math.min((page + 1) * perPage, filtered.length)} of {filtered.length}</p>
          <div className="flex gap-2">
            <button className="btn btn-sm btn-secondary" disabled={page === 0} onClick={() => setPage(p => p - 1)}>Previous</button>
            <button className="btn btn-sm btn-primary" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>Next</button>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay show" onClick={closeModal}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Add Asset</h3>
              <button className="modal-close-btn" onClick={closeModal}><span className="material-symbols-outlined">close</span></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body space-y-4">
                <div className="form-group">
                  <label className="form-label">Asset Name</label>
                  <input type="text" name="name" className="form-input" required value={form.name} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label className="form-label">Type</label>
                  <select name="type" className="form-select" value={form.type} onChange={handleChange}>
                    <option value="">Select type...</option>
                    <option value="Laptop">Laptop</option>
                    <option value="Desktop">Desktop</option>
                    <option value="Monitor">Monitor</option>
                    <option value="Phone">Phone</option>
                    <option value="Tablet">Tablet</option>
                    <option value="Accessory">Accessory</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select name="status" className="form-select" value={form.status} onChange={handleChange}>
                    <option value="Available">Available</option>
                    <option value="Assigned">Assigned</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Retired">Retired</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Asset Tag (optional)</label>
                  <input type="text" name="assetTag" className="form-input" value={form.assetTag} onChange={handleChange} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="form-group">
                    <label className="form-label">Purchase Date</label>
                    <input type="date" name="purchaseDate" className="form-input" value={form.purchaseDate} onChange={handleChange} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Cost (INR)</label>
                    <input type="number" name="cost" className="form-input" value={form.cost} onChange={handleChange} />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? 'Adding...' : 'Add Asset'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {viewAsset && (
        <div className="modal-overlay show" onClick={() => setViewAsset(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Asset Details</h3>
              <button className="modal-close-btn" onClick={() => setViewAsset(null)}><span className="material-symbols-outlined">close</span></button>
            </div>
            <div className="modal-body">
              <div className="grid grid-cols-2 gap-4 text-sm">
                {[
                  ['Asset ID', viewAsset.assetId || viewAsset.id],
                  ['Name', viewAsset.name || viewAsset.assetName],
                  ['Type', viewAsset.category || viewAsset.type],
                  ['Status', viewAsset.status],
                  ['Assigned To', viewAsset.assignedTo || '—'],
                  ['Purchase Date', viewAsset.purchaseDate || viewAsset.purchase_date],
                  ['Cost', viewAsset.cost ? `₹${viewAsset.cost}` : '—'],
                  ['Added On', viewAsset.createdAt || viewAsset.created_at],
                ].map(([label, val]) => (
                  <div key={label}>
                    <p className="text-slate-500 text-xs uppercase tracking-wider">{label}</p>
                    <p className="font-medium mt-1">{escapeHtml(String(val ?? '—'))}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

AssetsPage.pageTitle = "Asset Management";
