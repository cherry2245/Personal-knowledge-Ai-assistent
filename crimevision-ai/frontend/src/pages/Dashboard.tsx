import { useEffect, useState } from 'react'
import { Activity, ArrowRight, AudioLines, FileImage, Film, FolderOpen, ShieldCheck, Upload } from 'lucide-react'
import { Link } from 'react-router-dom'
import { api, Evidence, formatBytes } from '../services/api'

const Dashboard = () => {
  const [items, setItems] = useState<Evidence[]>([])
  const [status, setStatus] = useState<'loading' | 'connected' | 'offline'>('loading')
  useEffect(() => {
    api.evidence().then(({ evidence }) => { setItems(evidence); setStatus('connected') })
      .catch(() => setStatus('offline'))
  }, [])

  const counts = ['image', 'video', 'audio'].map(type => items.filter(item => item.media_type === type).length)
  const cards = [
    { label: 'Image evidence', value: counts[0], icon: FileImage, color: 'text-cyan-300', bg: 'bg-cyan-400/10' },
    { label: 'Video evidence', value: counts[1], icon: Film, color: 'text-violet-300', bg: 'bg-violet-400/10' },
    { label: 'Audio evidence', value: counts[2], icon: AudioLines, color: 'text-amber-300', bg: 'bg-amber-400/10' },
    { label: 'Total stored', value: items.length, icon: FolderOpen, color: 'text-emerald-300', bg: 'bg-emerald-400/10' },
  ]

  return <div className="mx-auto max-w-7xl space-y-8">
    <section className="relative overflow-hidden rounded-2xl border border-cyan-900/50 bg-gradient-to-br from-[#12263b] via-[#111827] to-[#15192a] p-8 md:p-10">
      <div className="absolute -right-10 -top-24 h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl" />
      <div className="relative max-w-2xl">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-800/60 bg-cyan-950/50 px-3 py-1 text-xs text-cyan-200"><Activity size={14}/> INVESTIGATION WORKSPACE</div>
        <h1 className="text-3xl font-semibold tracking-tight text-white md:text-4xl">Evidence, organized.</h1>
        <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300">A focused workspace for securely cataloguing image, video, and audio evidence. Every file is hashed on intake for integrity tracking.</p>
        <Link to="/evidence" className="mt-6 inline-flex items-center gap-2 rounded-lg bg-cyan-500 px-4 py-2.5 text-sm font-semibold text-slate-950 hover:bg-cyan-400"><Upload size={16}/> Open evidence vault <ArrowRight size={16}/></Link>
      </div>
    </section>

    <section>
      <div className="mb-4 flex items-end justify-between"><div><h2 className="text-lg font-semibold text-white">Workspace summary</h2><p className="mt-1 text-sm text-slate-400">Current evidence inventory</p></div><span className={`flex items-center gap-2 text-xs ${status === 'connected' ? 'text-emerald-300' : status === 'offline' ? 'text-rose-300' : 'text-slate-400'}`}><span className="h-2 w-2 rounded-full bg-current"/>{status === 'loading' ? 'Connecting' : status === 'connected' ? 'Backend connected' : 'Backend unavailable'}</span></div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{cards.map(({ label, value, icon: Icon, color, bg }) => <div key={label} className="rounded-xl border border-slate-800 bg-slate-900/70 p-5"><div className="flex items-center justify-between"><span className="text-sm text-slate-400">{label}</span><span className={`rounded-lg p-2 ${bg} ${color}`}><Icon size={18}/></span></div><div className="mt-4 text-3xl font-semibold text-white">{status === 'loading' ? '—' : value}</div></div>)}</div>
    </section>

    <section className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
      <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5"><div className="mb-4 flex items-center justify-between"><div><h2 className="font-semibold text-white">Recently added</h2><p className="mt-1 text-xs text-slate-400">Latest files in the vault</p></div><Link to="/evidence" className="text-sm text-cyan-300 hover:text-cyan-200">View all <ArrowRight className="ml-1 inline" size={14}/></Link></div>
        {items.length === 0 ? <div className="rounded-lg border border-dashed border-slate-700 px-5 py-8 text-center text-sm text-slate-400">{status === 'offline' ? 'Start the backend to load your evidence inventory.' : 'Your evidence inventory is empty.'}</div> : <div className="divide-y divide-slate-800">{items.slice(0, 5).map(item => <div key={item.id} className="flex items-center justify-between gap-3 py-3"><div className="min-w-0"><p className="truncate text-sm text-slate-200">{item.original_filename}</p><p className="mt-1 text-xs text-slate-500">{item.media_type} · {formatBytes(item.file_size)}</p></div><span className="shrink-0 rounded-full bg-slate-800 px-2.5 py-1 text-xs text-slate-300">{item.processing_status}</span></div>)}</div>}</div>
      <div className="rounded-xl border border-amber-900/40 bg-amber-950/20 p-5"><div className="flex gap-3"><ShieldCheck className="mt-0.5 shrink-0 text-amber-300" size={19}/><div><h2 className="font-semibold text-amber-100">Decision support only</h2><p className="mt-2 text-sm leading-6 text-amber-100/70">This prototype records and organizes files. Analysis results require validated models and human review. Model output is not a finding of fact.</p></div></div></div>
    </section>
  </div>
}

export default Dashboard
