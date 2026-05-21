'use client';

import { useState } from 'react';
import { useStore } from '@/store/useStore';
import { PageHeader } from '@/components/ui/PageHeader';
import { Settings, Plus, Trash2 } from 'lucide-react';
import type { HubConfig } from '@/types/workbook';

export default function SettingsPage() {
  const config = useStore(s => s.config);
  const addHub = useStore(s => s.addHub);
  const updateHub = useStore(s => s.updateHub);
  const removeHub = useStore(s => s.removeHub);

  const [newHub, setNewHub] = useState<Partial<HubConfig>>({
    hubId: '',
    hubName: '',
    driftThreshold: 0.1,
    baseOrderPayout: 40
  });

  const handleAddHub = () => {
    if (newHub.hubId && newHub.hubName) {
      addHub({
        hubId: newHub.hubId,
        hubName: newHub.hubName,
        driftThreshold: Number(newHub.driftThreshold),
        baseOrderPayout: Number(newHub.baseOrderPayout)
      });
      setNewHub({ hubId: '', hubName: '', driftThreshold: 0.1, baseOrderPayout: 40 });
    }
  };

  return (
    <div className="animate-fade-up">
      <PageHeader title="Hub Configuration" description="Manage regional hubs, drift thresholds, and base payouts." />

      <div className="card" style={{ padding: 24, marginBottom: 24 }}>
        <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Settings size={18} /> Global Hub Settings
        </div>

        <table className="data-table" style={{ fontSize: 13, marginBottom: 20 }}>
          <thead>
            <tr>
              <th>Hub ID</th>
              <th>Hub Name</th>
              <th>Drift Threshold (km)</th>
              <th>Base Payout (₹)</th>
              <th style={{ width: 60 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {config.hubs?.map(hub => (
              <tr key={hub.hubId}>
                <td style={{ fontWeight: 600 }}>{hub.hubId}</td>
                <td>
                  <input 
                    value={hub.hubName} 
                    onChange={e => updateHub(hub.hubId, { hubName: e.target.value })}
                    style={{ padding: '4px 8px', width: '100%', borderRadius: 4, border: '1px solid var(--border)', fontSize: 13 }}
                  />
                </td>
                <td>
                  <input 
                    type="number" step="0.01"
                    value={hub.driftThreshold} 
                    onChange={e => updateHub(hub.hubId, { driftThreshold: Number(e.target.value) })}
                    style={{ padding: '4px 8px', width: '100%', borderRadius: 4, border: '1px solid var(--border)', fontSize: 13 }}
                  />
                </td>
                <td>
                  <input 
                    type="number" step="1"
                    value={hub.baseOrderPayout} 
                    onChange={e => updateHub(hub.hubId, { baseOrderPayout: Number(e.target.value) })}
                    style={{ padding: '4px 8px', width: '100%', borderRadius: 4, border: '1px solid var(--border)', fontSize: 13 }}
                  />
                </td>
                <td>
                  <button className="btn btn-ghost" onClick={() => removeHub(hub.hubId)} style={{ color: '#DC2626' }}>
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
            {(!config.hubs || config.hubs.length === 0) && (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-faint)' }}>
                  No hubs configured.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        <div style={{ background: 'var(--bg-default)', padding: 16, borderRadius: 8, border: '1px solid var(--border)' }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Add New Hub</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr 1fr auto', gap: 12, alignItems: 'end' }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 500, marginBottom: 4, display: 'block', color: 'var(--text-muted)' }}>Hub ID</label>
              <input 
                placeholder="HUB-X"
                value={newHub.hubId} 
                onChange={e => setNewHub({ ...newHub, hubId: e.target.value })}
                style={{ padding: '8px 12px', width: '100%', borderRadius: 6, border: '1px solid var(--border)', fontSize: 13 }}
              />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 500, marginBottom: 4, display: 'block', color: 'var(--text-muted)' }}>Hub Name</label>
              <input 
                placeholder="Region Name"
                value={newHub.hubName} 
                onChange={e => setNewHub({ ...newHub, hubName: e.target.value })}
                style={{ padding: '8px 12px', width: '100%', borderRadius: 6, border: '1px solid var(--border)', fontSize: 13 }}
              />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 500, marginBottom: 4, display: 'block', color: 'var(--text-muted)' }}>Drift (km)</label>
              <input 
                type="number" step="0.01"
                value={newHub.driftThreshold} 
                onChange={e => setNewHub({ ...newHub, driftThreshold: Number(e.target.value) })}
                style={{ padding: '8px 12px', width: '100%', borderRadius: 6, border: '1px solid var(--border)', fontSize: 13 }}
              />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 500, marginBottom: 4, display: 'block', color: 'var(--text-muted)' }}>Base Payout (₹)</label>
              <input 
                type="number" step="1"
                value={newHub.baseOrderPayout} 
                onChange={e => setNewHub({ ...newHub, baseOrderPayout: Number(e.target.value) })}
                style={{ padding: '8px 12px', width: '100%', borderRadius: 6, border: '1px solid var(--border)', fontSize: 13 }}
              />
            </div>
            <button className="btn btn-primary" onClick={handleAddHub} style={{ height: 36, padding: '0 16px' }} disabled={!newHub.hubId || !newHub.hubName}>
              <Plus size={16} /> Add Hub
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
