import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Stepper from '../../../../shared/Stepper.jsx';

function getApiBase() {
  return window.EMS_API?.HR || window.location.origin;
}

function getHeaders() {
  const t = (() => { try { return localStorage.getItem('ems_token') || sessionStorage.getItem('ems_token'); } catch (_) { return ''; } })();
  return { 'Content-Type': 'application/json', ...(t ? { 'Authorization': `Bearer ${t}` } : {}) };
}

export default function DocumentsStep() {
  const navigate = useNavigate();
  const [docType, setDocType] = useState('');
  const [docTypes, setDocTypes] = useState([]);
  const [uploadedDocs, setUploadedDocs] = useState([]);
  const [requiredDocs, setRequiredDocs] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      fetch(`${getApiBase()}/api/onboarding/steps/documents`, { headers: getHeaders() }).then(r => r.ok ? r.json() : null),
      fetch(`${getApiBase()}/api/document-types`, { headers: getHeaders() }).then(r => r.ok ? r.json() : []),
      fetch(`${getApiBase()}/api/onboarding/required-documents`, { headers: getHeaders() }).then(r => r.ok ? r.json() : []),
    ])
      .then(([saved, types, required]) => {
        if (saved) {
          if (saved.uploadedDocs) setUploadedDocs(saved.uploadedDocs);
          if (saved.docType) setDocType(saved.docType);
        }
        setDocTypes(Array.isArray(types) ? types : []);
        setRequiredDocs(Array.isArray(required) ? required : []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleFileUpload(e) {
    const file = e.target.files?.[0];
    if (!file || !docType) return;
    setUploading(true);
    setError('');
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('documentType', docType);
      const r = await fetch(`${getApiBase()}/api/onboarding/steps/documents/upload`, { method: 'POST', headers: { ...getHeaders(), 'Content-Type': undefined }, body: fd });
      if (!r.ok) throw new Error('Upload failed');
      const result = await r.json();
      setUploadedDocs(prev => [...prev, result]);
      setRequiredDocs(prev => prev.map(rd => rd.name === docType ? { ...rd, uploaded: true } : rd));
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  }

  async function removeDoc(id) {
    try {
      await fetch(`${getApiBase()}/api/onboarding/steps/documents/${id}`, { method: 'DELETE', headers: getHeaders() });
      setUploadedDocs(prev => prev.filter(d => d.id !== id));
    } catch (_) {}
  }

  async function handleNext() {
    setError('');
    try {
      const r = await fetch(`${getApiBase()}/api/onboarding/steps/documents`, { method: 'POST', headers: getHeaders(), body: JSON.stringify({ docType, uploadedDocs }) });
      if (!r.ok) throw new Error('Save failed');
      navigate('/admin-dashboard/onboarding/review');
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleBack() {
    try {
      await fetch(`${getApiBase()}/api/onboarding/steps/documents`, { method: 'POST', headers: getHeaders(), body: JSON.stringify({ docType, uploadedDocs }) });
    } catch (_) {}
    navigate('/admin-dashboard/onboarding/payroll-benefits');
  }

  if (loading) {
    return (
      <div className="corporate-content">
        <div className="max-w-6xl mx-auto py-20 flex items-center justify-center">
          <div className="animate-spin w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="corporate-content">
      <div className="max-w-6xl mx-auto">
        <div className="page-header">
          <div className="page-header-content">
            <h1>Document Upload</h1>
            <p>Upload employee identification and verification documents.</p>
          </div>
        </div>

        <Stepper current={4} />

        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-3">
            <span className="material-symbols-outlined text-red-500">error</span>
            {error}
          </div>
        )}

        <div className="grid grid-cols-12 gap-8">
          <div className="col-span-12 lg:col-span-7">
            <div className="content-card">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-14 h-14 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
                  <span className="material-symbols-outlined text-3xl">upload_file</span>
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Upload Documents</h2>
                  <p className="text-slate-500">Select and upload required employee documents</p>
                </div>
              </div>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold uppercase tracking-wider text-slate-500 mb-3">Document Type</label>
                  <select className="w-full rounded-2xl border border-slate-300 px-5 py-4 focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none transition" value={docType} onChange={e => setDocType(e.target.value)}>
                    <option value="">Select document type</option>
                    {docTypes.map(dt => <option key={dt.value || dt} value={dt.value || dt}>{dt.label || dt}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold uppercase tracking-wider text-slate-500 mb-3">Upload File</label>
                  <div className="border-2 border-dashed border-slate-300 rounded-3xl p-8 text-center hover:border-blue-500 transition cursor-pointer" onClick={() => document.getElementById('docFileInput').click()}>
                    <div className="w-16 h-16 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-4">
                      <span className="material-symbols-outlined text-3xl">cloud_upload</span>
                    </div>
                    <p className="font-semibold text-slate-700">Drag and drop your file here, or <span className="text-blue-600 font-bold">browse</span></p>
                    <p className="text-sm text-slate-400 mt-2">PDF, DOC, DOCX, PNG, JPG (Max 10MB)</p>
                    <input id="docFileInput" type="file" accept=".pdf,.doc,.docx,.png,.jpg,.jpeg" className="hidden" onChange={handleFileUpload} disabled={uploading} />
                  </div>
                </div>
                <button className="w-full bg-blue-600 text-white px-6 py-4 rounded-2xl font-bold hover:bg-blue-700 transition flex items-center justify-center gap-3" onClick={() => document.getElementById('docFileInput').click()} disabled={uploading || !docType}>
                  {uploading ? (
                    <><svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>Uploading...</>
                  ) : (
                    <><span className="material-symbols-outlined">upload</span>Upload Document</>
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="col-span-12 lg:col-span-5">
            <div className="content-card sticky top-28">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <span className="material-symbols-outlined text-3xl">folder_zip</span>
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Uploaded Documents</h2>
                  <p className="text-slate-500">List of uploaded employee documents</p>
                </div>
              </div>
              <div className="space-y-4">
                {uploadedDocs.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-4">
                      <span className="material-symbols-outlined text-3xl">folder_open</span>
                    </div>
                    <p className="text-slate-500 font-semibold">No documents uploaded yet</p>
                    <p className="text-sm text-slate-400 mt-1">Upload documents using the form on the left</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {uploadedDocs.map((doc, i) => (
                      <div key={doc.id || i} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-200">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                            <span className="material-symbols-outlined text-lg">description</span>
                          </div>
                          <div>
                            <p className="font-semibold text-sm">{doc.name || doc.fileName}</p>
                            <p className="text-xs text-slate-400">{doc.type || doc.documentType} — {doc.size}</p>
                          </div>
                        </div>
                        <button className="text-red-400 hover:text-red-600" onClick={() => removeDoc(doc.id)}>
                          <span className="material-symbols-outlined text-lg">close</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="mt-8 pt-6 border-t border-slate-200">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-4">Required Documents</h3>
                <div className="space-y-3">
                  {requiredDocs.map(rd => (
                    <div key={rd.name} className="flex items-center gap-3">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${rd.uploaded ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                        <span className="material-symbols-outlined text-[14px]">{rd.uploaded ? 'check' : 'add'}</span>
                      </span>
                      <span className={`text-sm font-medium ${rd.uploaded ? 'text-slate-700' : 'text-slate-500'}`}>{rd.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 sticky bottom-0 z-40">
          <div className="content-card flex flex-col md:flex-row gap-5 items-center justify-between">
            <button className="flex items-center gap-2 px-6 py-3 rounded-2xl border border-slate-300 bg-white hover:bg-slate-50 transition font-semibold" onClick={handleBack}>
              <span className="material-symbols-outlined">arrow_back</span>Back to Payroll
            </button>
            <div className="flex items-center gap-4">
              <button className="btn btn-secondary">Save as Draft</button>
              <button className="btn btn-primary" onClick={handleNext}>
                Next Step
                <span className="material-symbols-outlined">arrow_forward</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

DocumentsStep.pageTitle = "Add Employee";
