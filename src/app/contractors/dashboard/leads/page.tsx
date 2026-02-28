'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils/cn';

interface Lead {
  id: number;
  leadId: number;
  name: string;
  email: string;
  phone: string | null;
  message: string | null;
  workType: string | null;
  status: string;
  priceCharged: string | null;
  createdAt: string;
  viewedAt: string | null;
  contactedAt: string | null;
}

const statusColors: Record<string, string> = {
  paid: 'bg-green-500/10 text-green-500 border-green-500/20',
  pending: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  payment_failed: 'bg-red-500/10 text-red-500 border-red-500/20',
  contacted: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  won: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  lost: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
};

export default function ContractorLeadsPage() {
  const router = useRouter();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    async function loadLeads() {
      try {
        const res = await fetch('/api/contractors/dashboard/leads');
        if (!res.ok) {
          if (res.status === 401) {
            router.push('/contractors/login');
            return;
          }
          throw new Error('Failed to load leads');
        }
        const data = await res.json();
        setLeads(data.leads);
      } catch (error) {
        console.error('Failed to load leads:', error);
      } finally {
        setLoading(false);
      }
    }

    loadLeads();
  }, [router]);

  async function markAsContacted(assignmentId: number) {
    try {
      await fetch(`/api/contractors/dashboard/leads/${assignmentId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'contacted' }),
      });

      setLeads((prev) =>
        prev.map((lead) =>
          lead.id === assignmentId
            ? { ...lead, status: 'contacted', contactedAt: new Date().toISOString() }
            : lead
        )
      );
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  }

  const filteredLeads = filter === 'all' ? leads : leads.filter((l) => l.status === filter);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">My Leads</h1>
        <p className="mt-1 text-muted-foreground">
          View and manage leads assigned to you
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {['all', 'paid', 'contacted', 'won', 'lost'].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={cn(
              'rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
              filter === status
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            )}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {filteredLeads.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <InboxIcon className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="mt-4 text-lg font-semibold">No leads yet</h3>
            <p className="mt-1 text-center text-muted-foreground">
              {filter === 'all'
                ? "You haven't received any leads yet. Make sure your profile is complete and you have a payment method on file."
                : `No leads with status "${filter}"`}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredLeads.map((lead) => (
            <Card key={lead.id}>
              <CardContent className="p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold">{lead.name}</h3>
                      <Badge className={cn('border', statusColors[lead.status] || statusColors.pending)}>
                        {lead.status.replace('_', ' ')}
                      </Badge>
                    </div>

                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      <a href={`mailto:${lead.email}`} className="flex items-center gap-1 hover:text-foreground">
                        <MailIcon className="h-4 w-4" />
                        {lead.email}
                      </a>
                      {lead.phone && (
                        <a href={`tel:${lead.phone}`} className="flex items-center gap-1 hover:text-foreground">
                          <PhoneIcon className="h-4 w-4" />
                          {lead.phone}
                        </a>
                      )}
                    </div>

                    {lead.workType && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Project type:</span>
                        <span className="text-sm font-medium capitalize">{lead.workType.replace('-', ' ')}</span>
                      </div>
                    )}

                    {lead.message && (
                      <p className="mt-2 rounded-lg bg-muted/50 p-3 text-sm">{lead.message}</p>
                    )}

                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>Received {new Date(lead.createdAt).toLocaleDateString()}</span>
                      {lead.priceCharged && <span>Charged ${lead.priceCharged}</span>}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 sm:items-end">
                    {lead.status === 'paid' && !lead.contactedAt && (
                      <Button size="sm" onClick={() => markAsContacted(lead.id)}>
                        Mark as Contacted
                      </Button>
                    )}
                    {lead.status === 'contacted' && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            fetch(`/api/contractors/dashboard/leads/${lead.id}/status`, {
                              method: 'PATCH',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ status: 'won' }),
                            }).then(() => {
                              setLeads((prev) =>
                                prev.map((l) => (l.id === lead.id ? { ...l, status: 'won' } : l))
                              );
                            });
                          }}
                        >
                          Won
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            fetch(`/api/contractors/dashboard/leads/${lead.id}/status`, {
                              method: 'PATCH',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ status: 'lost' }),
                            }).then(() => {
                              setLeads((prev) =>
                                prev.map((l) => (l.id === lead.id ? { ...l, status: 'lost' } : l))
                              );
                            });
                          }}
                        >
                          Lost
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function InboxIcon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
      <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
    </svg>
  );
}

function MailIcon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="16" x="2" y="4" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  );
}

function PhoneIcon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}
