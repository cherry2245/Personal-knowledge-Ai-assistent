import { useCallback, useEffect, useRef, useState } from 'react'
import { AudioLines, FileImage, Film, FolderOpen, Search, Trash2, Upload, X } from 'lucide-react'
import { api, Evidence, evidenceFileUrl, formatBytes } from '../services/api'

const iconFor = (type: Evidence['media_type']) => type === 'image' ? FileImage : type === 'video' ? Film : AudioLines
const EvidenceVault = () => {
  const [items, setItems] = useState<Evidence[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const input = useRef<HTMLInputElement>(null)
  const refresh = useCallback(async () => {
    setLoading(true)
    try { setItems((await api.evidence()).evidence); setError('') }
    catch (e) { setError(e instanceof Error ? e.message : 'Could not load evidence.') }
    finally { setLoading(false) }
  }, [])
  useEffect(() => { void refresh() }, [refresh])

  const upload = async (file?: File) => {
    if (!file) return
    setBusy(true); setError('')
    try { await api.upload(file); await refresh() }
    catch (e) { setError(e instanceof Error ? e.message : 'Upload failed.') }
    finally { setBusy(false); if (input.current) input.current.value = '' }
  }
  const remove = async (item: Evidence) => {
    if (!window.confirm(`Delete “${item.original_filename}” and its analysis history?`)) return
    try { await api.removeEvidence(item.id); setItems(current => current.filter(row => row.id !== item.id)); setError('') }
    catch (e) { setError(e instanceof Error ? e.message : 'Could not delete this file.') }
  }
  const visible = items.filter(item => item.original_filename.toLowerCase().includes(query.toLowerCase()))

  return <div className="mx-auto max-w-7xl space-y-6">
    <header className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-medium uppercase tracking-[0.2em] text-cyan-300">Case workspace</p><h1 className="mt-2 text-3xl font-semibold text-white">Evidence vault</h1><p className="mt-2 text-sm text-slate-400">Secure intake and integrity tracking for your media files.</p></div><button onClick={() => input.current?.click()} disabled={busy} className="inline-flex items-center gap-2 rounded-lg bg-cyan-500 px-4 py-2.5 text-sm font-semibold text-slate-950 hover:bg-cyan-400 disabled:opacity-50"><Upload size={16}/>{busy ? 'Uploading…' : 'Add evidence'}</button><input ref={input} type="file" className="hidden" accept=".jpg,.jpeg,.png,.gif,.bmp,.webp,.mp4,.avi,.mov,.mkv,.webm,.wav,.mp3,.m4a,.flac,.ogg,.aac" onChange={e => void upload(e.target.files?.[0])}/></header>
    <div onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); void upload(e.dataTransfer.files[0]) }} className="rounded-xl border border-dashed border-slate-700 bg-slate-900/50 px-5 py-7 text-center"><FolderOpen className="mx-auto text-cyan-300" size={26}/><p className="mt-2 text-sm font-medium text-slate-200">Drop evidence files here</p><p className="mt-1 text-xs text-slate-500">Images, video, and audio · Files are hashed on upload</p></div>
    {error && <div role="alert" className="flex items-center justify-between rounded-lg border border-rose-900/60 bg-rose-950/30 px-4 py-3 text-sm text-rose-200">{error}<button onClick={() => setError('')} aria-label="Dismiss error"><X size={16}/></button></div>}
    <section className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/70"><div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 p-4"><div><h2 className="font-semibold text-white">All evidence <span className="ml-1 text-sm font-normal text-slate-500">{items.length}</span></h2><p className="mt-1 text-xs text-slate-400">Files remain on this machine in local storage.</p></div><label className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2"><Search size={15} className="text-slate-500"/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search filenames" className="w-44 bg-transparent text-sm text-slate-200 outline-none placeholder:text-slate-600"/></label></div>
      {loading ? <div className="p-10 text-center text-sm text-slate-400">Loading evidence…</div> : visible.length === 0 ? <div className="p-12 text-center"><FolderOpen className="mx-auto text-slate-600" size={30}/><p className="mt-3 text-sm text-slate-300">{query ? 'No files match your search.' : 'No evidence yet. Add a file to start your vault.'}</p></div> : <div className="divide-y divide-slate-800">{visible.map(item => { const Icon = iconFor(item.media_type); const isImage = item.media_type === 'image'; return <article key={item.id} className="flex flex-wrap items-center gap-4 px-4 py-4"><div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-slate-800 text-cyan-300">{isImage ? <img src={evidenceFileUrl(item.id)} alt="" className="h-full w-full object-cover"/> : <Icon size={19}/>}</div><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium text-slate-100">{item.original_filename}</p><p className="mt-1 text-xs text-slate-500">{item.media_type} · {formatBytes(item.file_size)} · {new Date(item.upload_timestamp).toLocaleString()}</p><p className="mt-1 truncate font-mono text-[11px] text-slate-600">SHA-256 {item.file_hash ?? 'not available'}</p></div><span className="rounded-full border border-slate-700 bg-slate-800/70 px-2.5 py-1 text-xs text-slate-300">{item.processing_status}</span><a href={evidenceFileUrl(item.id)} target="_blank" rel="noreferrer" className="text-xs text-cyan-300 hover:text-cyan-200">Open</a><button onClick={() => void remove(item)} aria-label={`Delete ${item.original_filename}`} className="rounded-md p-2 text-slate-500 hover:bg-rose-950/40 hover:text-rose-300"><Trash2 size={16}/></button></article> })}</div>}</section>
  </div>
}
export default EvidenceVault
