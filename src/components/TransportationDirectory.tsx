import { useEffect, useMemo, useState } from 'react';
import { TransportationCompany } from '../types';
import { apiFetch } from '../api/apiClient';

const emptyCompany: Partial<TransportationCompany> = {
  name: '',
  phone: '',
  address: '',
  notes: '',
  active: true,
};

export function TransportationDirectory() {
  const facilityId = localStorage.getItem('currentFacilityId') || '';
  const [companies, setCompanies] = useState<TransportationCompany[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<TransportationCompany>>(emptyCompany);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const activeCompanies = useMemo(
    () => companies.filter((company) => company.active !== false && company.active !== 0),
    [companies],
  );

  const loadCompanies = async () => {
    if (!facilityId) return;
    setIsLoading(true);
    setError('');
    try {
      const data = await apiFetch<TransportationCompany[]>(
        `/api/transportation-companies?facilityId=${encodeURIComponent(facilityId)}`,
      );
      setCompanies(data);
    } catch (err) {
      console.error(err);
      setError('Unable to load transportation directory. Please verify database setup.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCompanies();
  }, [facilityId]);

  const resetForm = () => {
    setEditingId(null);
    setForm(emptyCompany);
  };

  const handleSave = async () => {
    if (!facilityId || !form.name?.trim()) return;
    setError('');

    const payload = {
      id: editingId || crypto.randomUUID(),
      facilityId,
      name: form.name?.trim() || '',
      phone: form.phone?.trim() || '',
      address: form.address?.trim() || '',
      notes: form.notes?.trim() || '',
      active: form.active !== false,
    } as TransportationCompany & { facilityId: string };

    try {
      if (editingId) {
        await apiFetch(`/api/transportation-companies/${editingId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        await apiFetch('/api/transportation-companies', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }
      resetForm();
      await loadCompanies();
    } catch (err) {
      console.error(err);
      setError('Transportation company was not saved. Please try again.');
    }
  };

  const handleEdit = (company: TransportationCompany) => {
    setEditingId(company.id);
    setForm({
      name: company.name,
      phone: company.phone,
      address: company.address || '',
      notes: company.notes || '',
      active: company.active !== false && company.active !== 0,
    });
  };

  const handleDeactivate = async (company: TransportationCompany) => {
    try {
      await apiFetch(`/api/transportation-companies/${company.id}`, { method: 'DELETE' });
      await loadCompanies();
    } catch (err) {
      console.error(err);
      setError('Transportation company was not removed. Please try again.');
    }
  };

  return (
    <section className="transport-card overflow-hidden">
      <div className="border-b border-[#d6deeb] bg-white p-5">
        <h3 className="text-lg font-black text-[#0b2a6f]">Transportation Directory</h3>
        <p className="mt-1 text-xs font-semibold text-slate-500">
          Shared database list used to auto-fill transportation company details in appointment requests.
        </p>
      </div>

      <div className="grid gap-5 p-5 lg:grid-cols-3">
        <div className="rounded-2xl border border-[#d6deeb] bg-[#f8fbff] p-4">
          <h4 className="mb-3 text-sm font-black text-[#0b2a6f]">
            {editingId ? 'Edit Company' : 'Add Company'}
          </h4>

          <div className="space-y-3">
            <input
              className="w-full rounded-xl border border-[#d6deeb] bg-white px-4 py-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-brand-2/20"
              placeholder="Transportation company name"
              value={form.name || ''}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <input
              className="w-full rounded-xl border border-[#d6deeb] bg-white px-4 py-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-brand-2/20"
              placeholder="Contact phone #"
              value={form.phone || ''}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
            <input
              className="w-full rounded-xl border border-[#d6deeb] bg-white px-4 py-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-brand-2/20"
              placeholder="Address / service area"
              value={form.address || ''}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
            <textarea
              className="h-24 w-full rounded-xl border border-[#d6deeb] bg-white px-4 py-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-brand-2/20"
              placeholder="Notes"
              value={form.notes || ''}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleSave}
                className="rounded-full bg-[#0b2a6f] px-4 py-2 text-xs font-black text-white shadow-sm hover:bg-[#123a8c]"
              >
                {editingId ? 'Save Changes' : 'Add Company'}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-full border border-[#d6deeb] bg-white px-4 py-2 text-xs font-black text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          {error && (
            <div className="mb-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-800">
              {error}
            </div>
          )}

          <div className="overflow-x-auto rounded-2xl border border-[#d6deeb] bg-white">
            <table className="w-full text-left">
              <thead className="bg-[#f8fbff] text-[10px] font-black uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="border-b border-[#eef2f7] px-4 py-3">Company</th>
                  <th className="border-b border-[#eef2f7] px-4 py-3">Phone</th>
                  <th className="border-b border-[#eef2f7] px-4 py-3">Address</th>
                  <th className="border-b border-[#eef2f7] px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eef2f7]">
                {isLoading ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-sm font-bold text-slate-400">Loading directory...</td>
                  </tr>
                ) : activeCompanies.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-sm font-bold text-slate-400">No transportation companies saved yet.</td>
                  </tr>
                ) : (
                  activeCompanies.map((company) => (
                    <tr key={company.id} className="hover:bg-brand-light/20">
                      <td className="px-4 py-3 text-sm font-black text-slate-800">{company.name}</td>
                      <td className="px-4 py-3 text-xs font-bold text-slate-600">{company.phone || '—'}</td>
                      <td className="px-4 py-3 text-xs font-bold text-slate-600">{company.address || '—'}</td>
                      <td className="px-4 py-3 text-right">
                        <button type="button" onClick={() => handleEdit(company)} className="mr-2 text-xs font-black text-[#0b2a6f] hover:underline">Edit</button>
                        <button type="button" onClick={() => handleDeactivate(company)} className="text-xs font-black text-amber-700 hover:underline">Remove</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}
