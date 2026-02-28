'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

interface StatusFormProps {
  contractorId: number;
  currentStatus: string;
}

export function ContractorStatusForm({ contractorId, currentStatus }: StatusFormProps) {
  const router = useRouter();
  const [status, setStatus] = useState(currentStatus);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const res = await fetch(`/api/admin/contractors/${contractorId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      if (res.ok) {
        setMessage('Status updated successfully');
        router.refresh();
      } else {
        const data = await res.json();
        setMessage(data.error || 'Failed to update status');
      }
    } catch {
      setMessage('Network error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="status" className="text-sm font-medium">
          Account Status
        </label>
        <select
          id="status"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="mt-1 block w-full rounded-lg border border-border bg-card px-3 py-2 text-sm"
        >
          <option value="pending">Pending</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
        </select>
      </div>

      {message && (
        <p className={`text-sm ${message.includes('success') ? 'text-green-500' : 'text-destructive'}`}>
          {message}
        </p>
      )}

      <Button type="submit" disabled={loading || status === currentStatus} className="w-full">
        {loading ? 'Updating...' : 'Update Status'}
      </Button>
    </form>
  );
}
