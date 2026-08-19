'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Sparkles, CheckCircle2, ExternalLink, Info } from 'lucide-react';
import { InfoModal } from '@/components/ui/info-modal';
import { useInfoContent } from '@/lib/use-info-content';

function A({ href, children }: Readonly<{ href: string; children: React.ReactNode }>) {
  return <a href={href} target="_blank" rel="noopener noreferrer" className="underline text-blue-600 inline-flex items-center gap-0.5">{children}</a>;
}

function Step({ n, children }: Readonly<{ n: number; children: React.ReactNode }>) {
  return (
    <div className="flex gap-3">
      <span className="shrink-0 w-5 h-5 rounded-full bg-black text-white text-xs flex items-center justify-center font-bold">{n}</span>
      <span>{children}</span>
    </div>
  );
}

const MODELS = [
  { value: 'gemini-3.5-flash-lite', label: 'Gemini 3.5 Flash Lite (recommended — fast & affordable)' },
  { value: 'gemini-3.5-flash', label: 'Gemini 3.5 Flash (high performance)' },
  { value: 'gemini-3.6-flash', label: 'Gemini 3.6 Flash (latest & most capable)' },
];

export default function AISettingsPage() {
  const info = useInfoContent();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [configured, setConfigured] = useState(false);
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [model, setModel] = useState('gemini-3.5-flash-lite');
  const [showKey, setShowKey] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [infoOpen, setInfoOpen] = useState(false);

  useEffect(() => {
    api.get('/store/ai-settings')
      .then(r => {
        setConfigured(r.data.configured as boolean);
        setModel((r.data.model as string) || 'gemini-3.5-flash-lite');
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true); setError(''); setSuccess('');
    try {
      const { data } = await api.patch('/store/ai-settings', { geminiApiKey: geminiApiKey || undefined, model });
      setConfigured(data.configured as boolean);
      setGeminiApiKey('');
      setSuccess('AI settings saved.');
    } catch (err: unknown) {
      setError((err as { response?: { data?: { error?: string } } }).response?.data?.error ?? 'Failed to save.');
    } finally { setSaving(false); }
  };

  const handleRemove = async () => {
    if (!confirm('Remove the Gemini API key? AI features will be disabled.')) return;
    setSaving(true); setError(''); setSuccess('');
    try {
      await api.patch('/store/ai-settings', { geminiApiKey: '' });
      setConfigured(false);
      setSuccess('API key removed.');
    } catch { setError('Failed to remove key.'); } finally { setSaving(false); }
  };

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="w-full max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-1">AI Settings</h1>
        <p className="text-sm text-neutral-500">Connect Google Gemini to auto-generate product listings from a simple description.</p>
      </div>

      {infoOpen && (
        <InfoModal title={info.ai?.title ?? 'How to get a Gemini API Key'} onClose={() => setInfoOpen(false)}>
          {(info.ai?.steps ?? []).map((s, i) => <Step key={i} n={i + 1}>{s}</Step>)}
          {info.ai?.note && <p className="text-xs text-neutral-500 pt-1">{info.ai.note}</p>}
          {info.ai?.youtubeUrl && (
            <div className="border-t pt-3 mt-2">
              <A href={info.ai.youtubeUrl}>▶ Watch tutorial on YouTube</A>
            </div>
          )}
        </InfoModal>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles size={16} />
            Gemini API
            {configured && <span className="flex items-center gap-1 text-green-600 text-xs font-normal ml-2"><CheckCircle2 size={13} /> Connected</span>}
            <button type="button" onClick={() => setInfoOpen(true)}
              className="text-neutral-400 hover:text-neutral-600 inline-flex items-center ml-1" aria-label="Gemini API key guide">
              <Info size={14} />
            </button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 text-xs text-blue-800 space-y-1 mb-4">
            <p className="font-medium">How to get a Gemini API key</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Go to <a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer" className="underline inline-flex items-center gap-0.5">Google AI Studio <ExternalLink size={11} /></a></li>
              <li>Click <strong>Create API Key</strong></li>
              <li>Copy the key and paste it below</li>
            </ol>
            <p className="pt-1 text-blue-700">The free tier includes generous quota — enough for most stores.</p>
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-1">
              <Label>Gemini API Key {configured && <span className="text-green-600 text-xs">(saved)</span>}</Label>
              <div className="flex gap-2">
                <Input
                  type={showKey ? 'text' : 'password'}
                  value={geminiApiKey}
                  onChange={e => setGeminiApiKey(e.target.value)}
                  placeholder={configured ? '••••••••••••••••  (leave blank to keep current)' : 'AIza...'}
                  autoComplete="new-password"
                  className="flex-1"
                />
                <Button type="button" variant="outline" size="sm" className="shrink-0"
                  onClick={() => setShowKey(v => !v)}>
                  {showKey ? 'Hide' : 'Show'}
                </Button>
              </div>
              <p className="text-xs text-neutral-400">Leave blank to keep the existing key. Enter a new key to replace it.</p>
            </div>

            <div className="space-y-1">
              <Label>Model</Label>
              <select value={model} onChange={e => setModel(e.target.value)}
                className="w-full border rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-black">
                {MODELS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}
            {success && <p className="text-sm text-green-600">{success}</p>}

            <div className="flex gap-2">
              <Button type="submit" disabled={saving} className="gap-2">
                {saving && <Loader2 size={14} className="animate-spin" />}
                Save
              </Button>
              {configured && (
                <Button type="button" variant="outline" className="text-red-500 hover:text-red-600" disabled={saving} onClick={handleRemove}>
                  Remove Key
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {configured && (
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              <Sparkles size={18} className="text-purple-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium">AI is active</p>
                <p className="text-xs text-neutral-500 mt-0.5">
                  When adding or editing products in your catalog, you'll see a <strong>✦ Generate</strong> button.
                  Describe your product in plain words and Gemini will fill in the name, price, description, and specs automatically.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
