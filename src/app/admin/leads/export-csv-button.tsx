'use client';

import { useState } from 'react';

export function ExportCSVButton() {
  const [loading, setLoading] = useState(false);

  async function handleExport() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/leads?pageSize=10000');
      const data = await res.json();
      const leads = data.items || [];

      if (leads.length === 0) {
        alert('No leads to export');
        return;
      }

      const headers = ['Name', 'Email', 'Phone', 'City', 'Work Type', 'Status', 'Message', 'Source URL', 'Created'];
      const rows = leads.map((lead: any) => [
        lead.name,
        lead.email,
        lead.phone || '',
        lead.cityName || '',
        lead.workType || '',
        lead.status,
        (lead.message || '').replace(/"/g, '""'),
        lead.sourceUrl || '',
        lead.createdAt ? new Date(lead.createdAt).toISOString() : '',
      ]);

      const csv = [
        headers.join(','),
        ...rows.map((row: string[]) => row.map(cell => `"${cell}"`).join(',')),
      ].join('\n');

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `leads-${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleExport}
      disabled={loading}
      className="inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-card px-4 text-sm font-medium text-foreground transition-colors hover:bg-accent disabled:opacity-50"
    >
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
      </svg>
      {loading ? 'Exporting...' : 'Export CSV'}
    </button>
  );
}
