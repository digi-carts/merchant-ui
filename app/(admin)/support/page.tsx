'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Plus, X, ChevronDown, ChevronUp } from 'lucide-react';

type TicketType = 'DEFECT' | 'ENHANCE' | 'QUERY';
type TicketStatus = 'OPEN' | 'PENDING' | 'INPROGRESS' | 'FIXED' | 'VERIFIED' | 'CLOSED';

interface Comment {
  id: string;
  authorRole: string;
  authorEmail: string;
  body: string;
  createdAt: string;
}

interface Ticket {
  id: string;
  type: TicketType;
  description: string;
  status: TicketStatus;
  label?: string | null;
  createdAt: string;
  comments: Comment[];
}

const TYPE_LABELS: Record<TicketType, string> = { DEFECT: 'Defect', ENHANCE: 'Enhancement', QUERY: 'Query' };
const STATUS_COLORS: Record<TicketStatus, string> = {
  OPEN: 'bg-blue-100 text-blue-800',
  PENDING: 'bg-yellow-100 text-yellow-800',
  INPROGRESS: 'bg-purple-100 text-purple-800',
  FIXED: 'bg-green-100 text-green-800',
  VERIFIED: 'bg-emerald-100 text-emerald-800',
  CLOSED: 'bg-neutral-100 text-neutral-600',
};

// Statuses admin can move to from current
const ADMIN_NEXT: Partial<Record<TicketStatus, TicketStatus>> = {
  FIXED: 'VERIFIED',
};

function StatusBadge({ status }: Readonly<{ status: TicketStatus }>) {
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[status]}`}>
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  );
}

export default function SupportPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newType, setNewType] = useState<TicketType>('QUERY');
  const [newDesc, setNewDesc] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [createError, setCreateError] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [commentText, setCommentText] = useState<Record<string, string>>({});
  const [commentSaving, setCommentSaving] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    api.get('/platform/support').then(r => setTickets(r.data.tickets ?? [])).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const submit = async () => {
    if (!newDesc.trim()) return;
    setSubmitting(true); setCreateError('');
    try {
      await api.post('/platform/support', { type: newType, description: newDesc });
      setNewDesc(''); setCreating(false);
      load();
    } catch { setCreateError('Failed to create ticket.'); }
    finally { setSubmitting(false); }
  };

  const addComment = async (ticketId: string) => {
    const body = commentText[ticketId]?.trim();
    if (!body) return;
    setCommentSaving(ticketId);
    try {
      await api.post(`/platform/support/${ticketId}/comments`, { body });
      setCommentText(t => ({ ...t, [ticketId]: '' }));
      load();
    } finally { setCommentSaving(null); }
  };

  const [statusError, setStatusError] = useState<Record<string, string>>({});

  const updateStatus = async (ticketId: string, status: TicketStatus) => {
    setStatusError(e => ({ ...e, [ticketId]: '' }));
    try {
      await api.patch(`/platform/support/${ticketId}/status`, { status });
      load();
    } catch {
      setStatusError(e => ({ ...e, [ticketId]: 'Failed to update status.' }));
    }
  };

  if (loading) return <p className="text-neutral-400">Loading…</p>;

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <MessageCircle size={22} className="text-neutral-400" />
          <div>
            <h1 className="text-2xl font-bold">Support</h1>
            <p className="text-sm text-neutral-500 mt-0.5">Raise tickets for bugs, feature requests, or questions.</p>
          </div>
        </div>
        <Button onClick={() => { setCreating(c => !c); setCreateError(''); }} variant={creating ? 'outline' : 'default'} size="sm">
          {creating ? <><X size={14} className="mr-1" />Cancel</> : <><Plus size={14} className="mr-1" />New Ticket</>}
        </Button>
      </div>

      {creating && (
        <Card>
          <CardHeader><CardTitle className="text-base">New Ticket</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <p className="text-sm font-medium">Type</p>
              <div className="flex gap-2">
                {(['DEFECT', 'ENHANCE', 'QUERY'] as TicketType[]).map(t => (
                  <button key={t} type="button"
                    onClick={() => setNewType(t)}
                    className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${newType === t ? 'bg-black text-white border-black' : 'border-neutral-300 hover:border-black'}`}>
                    {TYPE_LABELS[t]}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">Description</p>
              <Textarea rows={4} placeholder="Describe the issue or request…" value={newDesc}
                onChange={e => setNewDesc(e.target.value)} />
            </div>
            {createError && <p className="text-sm text-red-500">{createError}</p>}
            <Button onClick={submit} disabled={submitting || !newDesc.trim()} className="w-full">
              {submitting ? 'Submitting…' : 'Submit Ticket'}
            </Button>
          </CardContent>
        </Card>
      )}

      {tickets.length === 0 && (
        <p className="text-sm text-neutral-400">No tickets yet. Click <strong>New Ticket</strong> to get started.</p>
      )}

      {tickets.map(ticket => (
        <Card key={ticket.id}>
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className="text-xs">{TYPE_LABELS[ticket.type]}</Badge>
                  <StatusBadge status={ticket.status} />
                  {ticket.label === 'REGRESSION' && (
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">REGRESSION</span>
                  )}
                  <span className="text-xs text-neutral-400">{new Date(ticket.createdAt).toLocaleDateString()}</span>
                </div>
                <p className="text-sm text-neutral-700 mt-1 whitespace-pre-wrap">{ticket.description}</p>
              </div>
              <button type="button" onClick={() => setExpanded(e => e === ticket.id ? null : ticket.id)}
                className="text-neutral-400 hover:text-neutral-700 shrink-0 mt-0.5">
                {expanded === ticket.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
            </div>
          </CardHeader>

          {expanded === ticket.id && (
            <CardContent className="space-y-4 border-t pt-4">
              {/* Comments */}
              {ticket.comments.length > 0 && (
                <div className="space-y-3">
                  {ticket.comments.map(c => (
                    <div key={c.id} className={`rounded-lg px-3 py-2 text-sm ${c.authorRole === 'superadmin' ? 'bg-blue-50 border border-blue-100' : 'bg-neutral-50 border'}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-xs">{c.authorRole === 'superadmin' ? 'Support Team' : 'You'}</span>
                        <span className="text-xs text-neutral-400">{new Date(c.createdAt).toLocaleString()}</span>
                      </div>
                      <p className="whitespace-pre-wrap">{c.body}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Add comment */}
              {ticket.status !== 'CLOSED' && (
                <div className="space-y-2">
                  <Textarea rows={2} placeholder="Add a comment or reply…"
                    value={commentText[ticket.id] ?? ''}
                    onChange={e => setCommentText(t => ({ ...t, [ticket.id]: e.target.value }))} />
                  <div className="flex items-center justify-between gap-3">
                    <Button type="button" size="sm" variant="outline"
                      disabled={commentSaving === ticket.id || !commentText[ticket.id]?.trim()}
                      onClick={() => addComment(ticket.id)}>
                      {commentSaving === ticket.id ? 'Posting…' : 'Post Comment'}
                    </Button>
                    {ADMIN_NEXT[ticket.status] && (
                      <Button type="button" size="sm"
                        onClick={() => updateStatus(ticket.id, ADMIN_NEXT[ticket.status]!)}>
                        Mark as {ADMIN_NEXT[ticket.status]!.charAt(0) + ADMIN_NEXT[ticket.status]!.slice(1).toLowerCase()}
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {ticket.status === 'CLOSED' && (
                <div className="space-y-2">
                  <Button type="button" size="sm" variant="outline"
                    onClick={() => updateStatus(ticket.id, 'OPEN')}>
                    Reopen as Regression
                  </Button>
                  {statusError[ticket.id] && <p className="text-xs text-red-500">{statusError[ticket.id]}</p>}
                </div>
              )}
            </CardContent>
          )}
        </Card>
      ))}
    </div>
  );
}
