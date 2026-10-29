import { FormEvent, useEffect, useState } from 'react'
import { MessageSquare, Send, ShieldAlert } from 'lucide-react'
import { api, Evidence } from '../services/api'

type Message = { question: string; answer?: string; sources?: string[]; error?: string }
export default function Chat() {
  const [evidence, setEvidence] = useState<Evidence[]>([])
  const [selected, setSelected] = useState<string[]>([])
  const [question, setQuestion] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  useEffect(() => { api.evidence().then(({ evidence: rows }) => { setEvidence(rows); setSelected(rows.map(item => item.id)) }).catch(e => setError(e instanceof Error ? e.message : 'Could not load evidence.')) }, [])
  const send = async (event: FormEvent) => {
    event.preventDefault()
    if (!question.trim() || busy) return
    const prompt = question.trim(); setQuestion(''); setBusy(true); setError('')
    try {
      const result = await api.ask(prompt, selected)
      setMessages(current => [...current, { question: prompt, answer: result.answer, sources: result.source_evidence }])
    } catch (e) {
      setMessages(current => [...current, { question: prompt, error: e instanceof Error ? e.message : 'Could not get an answer.' }])
    } finally { setBusy(false) }
  }
  return <div className="mx-auto max-w-5xl space-y-6"><header><p className="text-xs font-medium uppercase tracking-[0.2em] text-cyan-300">Gemini evidence assistant</p><h1 className="mt-2 text-3xl font-semibold text-white">Investigation assistant</h1><p className="mt-2 text-sm text-slate-400">Ask questions grounded in selected evidence metadata and saved media reviews.</p></header>
    <section className="rounded-xl border border-slate-800 bg-slate-900/70 p-5"><div className="flex items-center justify-between gap-3"><div><h2 className="font-semibold text-white">Evidence context</h2><p className="mt-1 text-xs text-slate-400">Original media is not sent with chat questions; only catalog details and saved AI reviews are used.</p></div><button className="text-xs text-cyan-300" onClick={() => setSelected(selected.length === evidence.length ? [] : evidence.map(item => item.id))}>{selected.length === evidence.length ? 'Clear all' : 'Select all'}</button></div>
      {evidence.length ? <div className="mt-3 grid max-h-40 gap-2 overflow-y-auto sm:grid-cols-2">{evidence.map(item => <label key={item.id} className="flex min-w-0 items-center gap-2 rounded-lg bg-slate-950/60 p-2 text-xs text-slate-300"><input type="checkbox" checked={selected.includes(item.id)} onChange={e => setSelected(ids => e.target.checked ? [...ids, item.id] : ids.filter(id => id !== item.id))}/><span className="truncate">{item.original_filename}</span></label>)}</div> : <p className="mt-3 text-sm text-slate-500">Upload evidence to ask a grounded question.</p>}</section>
    {error && <p role="alert" className="text-sm text-rose-300">{error}</p>}
    <section className="min-h-72 space-y-4 rounded-xl border border-slate-800 bg-slate-900/70 p-5">{messages.length === 0 && <div className="flex min-h-60 flex-col items-center justify-center text-center"><MessageSquare className="text-slate-600" size={30}/><p className="mt-3 text-sm text-slate-400">Ask about evidence intake or saved review results.</p></div>}{messages.map((item, index) => <article key={index} className="space-y-3 border-b border-slate-800 pb-4 last:border-0"><p className="text-sm font-medium text-cyan-200">{item.question}</p>{item.error ? <p role="alert" className="text-sm text-rose-300">{item.error}</p> : <><p className="whitespace-pre-wrap text-sm leading-6 text-slate-200">{item.answer}</p>{item.sources && <p className="text-xs text-slate-500">Context evidence IDs: {item.sources.map(id => id.slice(0, 8)).join(', ')}</p>}</>}</article>)}</section>
    <form onSubmit={send} className="flex items-end gap-3 rounded-xl border border-slate-800 bg-slate-900/70 p-3"><textarea value={question} onChange={e => setQuestion(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) void send(e as unknown as FormEvent) }} rows={2} maxLength={4000} placeholder="Ask a question about the selected evidence…" className="min-h-12 flex-1 resize-y bg-transparent p-2 text-sm text-slate-100 outline-none placeholder:text-slate-600"/><button disabled={busy || !question.trim() || !selected.length} className="inline-flex items-center gap-2 rounded-lg bg-cyan-500 px-4 py-2.5 text-sm font-semibold text-slate-950 hover:bg-cyan-400 disabled:opacity-40"><Send size={15}/>{busy ? 'Thinking…' : 'Ask'}</button></form>
    <div className="flex gap-3 rounded-xl border border-amber-900/40 bg-amber-950/20 p-4"><ShieldAlert className="shrink-0 text-amber-300" size={18}/><p className="text-xs leading-5 text-amber-100/70">AI responses are preliminary, may be wrong, and are not findings of fact. Confirm every claim against the original evidence. Chat history is held in this browser session only.</p></div>
  </div>
}
