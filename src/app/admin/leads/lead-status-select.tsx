'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils/cn';

const STATUS_OPTIONS = ['new', 'contacted', 'converted', 'archived'] as const;

const statusColors: Record<string, string> = {
  new: 'text-warning',
  contacted: 'text-primary',
  converted: 'text-success',
  archived: 'text-muted-foreground',
};

export function LeadStatusSelect({
  leadId,
  currentStatus,
}: {
  leadId: number;
  currentStatus: string;
}) {
  const [status, setStatus] = useState(currentStatus);
  const [saving, setSaving] = useState(false);

  async function handleChange(newStatus: string) {
    if (newStatus === status) return;
    setSaving(true);

    try {
      const res = await fetch('/api/admin/leads', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: leadId, status: newStatus }),
      });

      if (res.ok) {
        setStatus(newStatus);
      }
    } catch {
      // Silently fail — status reverts visually
    } finally {
      setSaving(false);
    }
  }

  return (
    <select
      value={status}
      onChange={(e) => handleChange(e.target.value)}
      disabled={saving}
      className={cn(
        'rounded-lg border border-border bg-card px-2 py-1 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50',
        statusColors[status] ?? 'text-foreground',
        saving && 'opacity-50'
      )}
    >
      {STATUS_OPTIONS.map((opt) => (
        <option key={opt} value={opt}>
          {opt.charAt(0).toUpperCase() + opt.slice(1)}
        </option>
      ))}
    </select>
  );
}
