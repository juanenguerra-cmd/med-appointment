import { useEffect, useState } from 'react';
import { TransportationCompany } from '../types';
import {
  loadTransportationDirectory,
  saveTransportationDirectory,
} from '../utils/transportDirectory';

export function TransportationDirectory() {
  const [companies, setCompanies] = useState<TransportationCompany[]>([]);
  const [newCompany, setNewCompany] = useState<Partial<TransportationCompany>>({});

  useEffect(() => {
    setCompanies(loadTransportationDirectory());
  }, []);

  const handleAdd = () => {
    if (!newCompany.name) return;
    const updated = [
      ...companies,
      {
        id: crypto.randomUUID(),
        name: newCompany.name,
        phone: newCompany.phone || '',
        address: newCompany.address || '',
        notes: newCompany.notes || '',
        active: true,
      },
    ];
    setCompanies(updated);
    saveTransportationDirectory(updated);
    setNewCompany({});
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Transportation Directory</h2>

      <div style={{ marginBottom: 16 }}>
        <input
          placeholder="Company Name"
          value={newCompany.name || ''}
          onChange={(e) => setNewCompany({ ...newCompany, name: e.target.value })}
        />
        <input
          placeholder="Phone"
          value={newCompany.phone || ''}
          onChange={(e) => setNewCompany({ ...newCompany, phone: e.target.value })}
        />
        <button onClick={handleAdd}>Add</button>
      </div>

      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Phone</th>
          </tr>
        </thead>
        <tbody>
          {companies.map((c) => (
            <tr key={c.id}>
              <td>{c.name}</td>
              <td>{c.phone}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
