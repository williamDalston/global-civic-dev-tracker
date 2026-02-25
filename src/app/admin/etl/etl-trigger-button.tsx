'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

export function EtlTriggerButton() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  async function handleTrigger() {
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch('/api/admin/etl/trigger', {
        method: 'POST',
      });

      const data = await res.json();

      if (res.ok && data.success) {
        const cityCount = data.results?.length ?? 0;
        const totalInserted = data.results?.reduce(
          (sum: number, r: { inserted: number }) => sum + r.inserted,
          0
        ) ?? 0;
        setResult({
          success: true,
          message: `ETL completed: ${cityCount} cities processed, ${totalInserted} records inserted.`,
        });
      } else {
        setResult({
          success: false,
          message: data.error || 'ETL trigger failed',
        });
      }
    } catch {
      setResult({ success: false, message: 'Network error' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-4">
      <Button onClick={handleTrigger} disabled={loading} variant="default" size="sm">
        {loading ? 'Running ETL...' : 'Trigger ETL Sync'}
      </Button>
      {result && (
        <span
          className={`text-sm ${result.success ? 'text-success' : 'text-destructive'}`}
        >
          {result.message}
        </span>
      )}
    </div>
  );
}
