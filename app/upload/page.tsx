'use client';

import { useCallback, useRef, useState } from 'react';
import { useStore } from '@/store/useStore';
import { PageHeader } from '@/components/ui/PageHeader';
import { getSheetPreview } from '@/lib/excelParser';
import { parseCompanyWorkbook } from '@/lib/companyWorkbookParserService';
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, X } from 'lucide-react';

type UploadState = 'idle' | 'uploading' | 'done' | 'error';

export default function UploadPage() {
  const importOrderPayouts = useStore(s => s.importOrderPayouts);
  const replaceOrderPayouts = useStore(s => s.replaceOrderPayouts);
  const resetToWorkbook     = useStore(s => s.resetToWorkbook);
  const hubConfigs          = useStore(s => s.config.hubs);
  const addNotification     = useStore(s => s.addNotification);
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploadMode, setUploadMode] = useState<'replace' | 'merge'>('replace');

  const [state, setState] = useState<UploadState>('idle');
  const [progress, setProgress] = useState(0);
  const [fileName, setFileName] = useState('');
  const [sheets, setSheets] = useState<string[]>([]);
  const [preview, setPreview] = useState<{ headers: string[]; rows: Record<string, unknown>[] } | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [summary, setSummary] = useState<{ skus: number; orders: number } | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const processFile = useCallback(async (file: File) => {
    setState('uploading');
    setFileName(file.name);
    setProgress(20);
    setErrors([]);
    setSummary(null);

    try {
      const buffer = await file.arrayBuffer();
      setProgress(40);
      const result = await parseCompanyWorkbook(file, hubConfigs);
      setSheets(result.sheets);
      setErrors(result.errors);
      setPreview(getSheetPreview(buffer, result.sheets[0] ?? '', 5));
      setProgress(75);

      if (result.orders.length || result.skus.length) {
        if (uploadMode === 'replace') {
          replaceOrderPayouts(result.orders, result.skus);
        } else {
          importOrderPayouts(result.orders, result.skus);
        }
      }

      // ── Notifications ────────────────────────────────
      if (result.orders.length > 0) {
        addNotification({
          type: 'excel_upload',
          title: 'Excel upload processed',
          body: `${result.orders.length} orders loaded from ${file.name}`,
        });

        // Fire cancelled-order notifications, capped at 10 to avoid flooding
        let cancCount = 0;
        for (const order of result.orders) {
          if (cancCount >= 10) break;
          const cls = order.orderClassification ?? '';
          const rider = order.riderName || order.riderId || 'Unknown';
          if (cls === 'Cancelled – Compensated') {
            addNotification({
              type: 'compensated',
              title: 'Cancellation compensated',
              body: `${order.orderId} — ${rider} — ₹${(order.finalOrderPayout ?? 0).toFixed(2)} paid`,
            });
            cancCount++;
          } else if (
            cls === 'Cancelled – No Payout' &&
            !String(order.cancelledBy ?? '').startsWith('Dashboard -')
          ) {
            addNotification({
              type: 'no_payout',
              title: 'Cancellation — no payout',
              body: `${order.orderId} — ${rider} — drift ${(order.driftDistance ?? 0).toFixed(2)} km exceeded threshold`,
            });
            cancCount++;
          }
        }
      }

      setSummary({ skus: result.skus.length, orders: result.orders.length });
      setProgress(100);
      setState(
        result.errors.length && !result.skus.length && !result.orders.length ? 'error' : 'done'
      );
    } catch (e) {
      setErrors([e instanceof Error ? e.message : 'Failed to parse file']);
      setState('error');
    }
  }, [importOrderPayouts]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, [processFile]);

  const reset = () => {
    setState('idle');
    setProgress(0);
    setFileName('');
    setSheets([]);
    setPreview(null);
    setErrors([]);
    setSummary(null);
  };

  return (
    <div className="animate-fade-up">
      <PageHeader title="Excel Upload Center" description="Import Order Payout & SKU Breakdown sheets into workbook dataset" />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div className="card" style={{ padding: 24 }}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 13, fontWeight: 600, marginRight: 12 }}>Upload Mode:</label>
            <select 
              value={uploadMode} 
              onChange={e => setUploadMode(e.target.value as 'replace' | 'merge')}
              style={{ padding: '6px 12px', fontSize: 13, borderRadius: 6, border: '1px solid var(--border)' }}
            >
              <option value="replace">Replace Existing Data</option>
              <option value="merge">Merge With Existing Data</option>
            </select>
          </div>
          <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" style={{ display: 'none' }}
            onChange={e => e.target.files?.[0] && processFile(e.target.files[0])} />
          <div
            className={`upload-zone ${dragOver ? 'active' : ''}`}
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            onClick={() => fileRef.current?.click()}
          >
            <Upload size={32} color="var(--ds-green-700)" style={{ margin: '0 auto 12px' }} />
            <div style={{ fontSize: 14, fontWeight: 600 }}>Drop Excel workbook here</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>.xlsx matching DS Group payout model</div>
          </div>

          {state !== 'idle' && (
            <div style={{ marginTop: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 12 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><FileSpreadsheet size={14} /> {fileName}</span>
                <button className="btn btn-ghost" onClick={reset}><X size={14} /></button>
              </div>
              <div className="progress-bar"><div className="progress-bar-fill" style={{ width: `${progress}%` }} /></div>
            </div>
          )}

          {summary && state === 'done' && (
            <div style={{ marginTop: 16, padding: 14, background: 'var(--ds-green-50)', borderRadius: 8, display: 'flex', gap: 10 }}>
              <CheckCircle size={18} color="var(--ds-green-800)" />
              <div style={{ fontSize: 13 }}>
                <strong>Imported & recalculated</strong>
                <div style={{ color: 'var(--text-muted)', marginTop: 4 }}>
                  {summary.orders} orders · {summary.skus} SKU rows merged
                </div>
              </div>
            </div>
          )}

          {errors.length > 0 && errors.slice(0, 5).map((err, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, fontSize: 12, color: '#DC2626', marginTop: 8 }}>
              <AlertCircle size={14} /> {err}
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card" style={{ padding: 24 }}>
            <div style={{ fontSize: 13.5, fontWeight: 600, marginBottom: 16 }}>Sheet Preview</div>
            {preview?.headers.length ? (
              <table className="data-table" style={{ fontSize: 12 }}>
                <thead><tr>{preview.headers.map(h => <th key={h}>{h}</th>)}</tr></thead>
                <tbody>
                  {preview.rows.map((row, i) => (
                    <tr key={i}>{preview.headers.map(h => <td key={h}>{String(row[h] ?? '')}</td>)}</tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-faint)' }}>Upload to preview columns</div>
            )}
            <p style={{ marginTop: 16, fontSize: 12, color: 'var(--text-muted)' }}>
              Sheets: Config · Order Payout · SKU Breakdown · Rider Summary
            </p>
          </div>

          <div className="card" style={{ padding: 24 }}>
            <div style={{ fontSize: 13.5, fontWeight: 600, marginBottom: 8, color: '#DC2626' }}>Danger Zone</div>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>
              Uploaded the wrong file? You can completely wipe the current dataset and restore the dashboard to its original factory state.
            </p>
            <button 
              className="btn btn-ghost"
              style={{ border: '1px solid #FCA5A5', color: '#DC2626', width: '100%' }}
              onClick={() => {
                if (window.confirm('Are you sure you want to discard all uploaded data and restore the factory dataset?')) {
                  resetToWorkbook();
                  reset();
                }
              }}
            >
              Restore Factory Dataset
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
