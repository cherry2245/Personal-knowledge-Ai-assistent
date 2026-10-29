import { useEffect, useState } from 'react'
import { Download, FileText, ShieldAlert } from 'lucide-react'
import { api, Evidence } from '../services/api'
const Reports = () => {
  const [items, setItems] = useState<Evidence[]>([])
  const [error, setError] = useState('')
  useEffect(() => { api.evidence().then(({ evidence }) => setItems(evidence)).catch(e => setError(e instanceof Error ? e.message : 'Could not load inventory.')) }, [])
  const exportInventory = () => {
    const fields = ['id', 'original_filename', 'media_type', 'file_size', 'file_hash', 'upload_timestamp', 'processing_status'] as const
    const quote = (value: unknown) => {
      const text = String(value ?? '')
      const safe = /^[=+\-@\t\r]/.test(text) ? `'${text}` : text
      return `"${safe.replace(/"/g, '""')}"`
    }
    const csv = [fields.join(','), ...items.map(item => fields.map(field => quote(item[field])).join(','))].join('\r\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = 'crimevision-evidence-inventory.csv'; anchor.click(); URL.revokeObjectURL(url)
  }
  return <div className="mx-auto max-w-5xl space-y-6"><header><p className="text-xs font-medium uppercase tracking-[0.2em] text-cyan-300">Documentation</p><h1 className="mt-2 text-3xl font-semibold text-white">Reports & exports</h1><p className="mt-2 text-sm text-slate-400">Export the current evidence register with file integrity hashes.</p></header>
    <section className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-800 bg-slate-900/70 p-6"><div className="flex items-center gap-4"><span className="rounded-xl bg-cyan-400/10 p-3 text-cyan-300"><FileText size={22}/></span><div><h2 className="font-semibold text-white">Evidence inventory</h2><p className="mt-1 text-sm text-slate-400">CSV · {items.length} file{items.length === 1 ? '' : 's'} · includes SHA-256 hashes</p></div></div><button onClick={exportInventory} disabled={!!error} className="inline-flex items-center gap-2 rounded-lg bg-cyan-500 px-4 py-2.5 text-sm font-semibold text-slate-950 hover:bg-cyan-400 disabled:opacity-40"><Download size={16}/>Export CSV</button></section>
    <section className="rounded-xl border border-amber-900/40 bg-amber-950/20 p-5"><div className="flex gap-3"><ShieldAlert className="shrink-0 text-amber-300" size={19}/><div><h2 className="font-semibold text-amber-100">Report scope</h2><p className="mt-2 text-sm leading-6 text-amber-100/70">This export is an inventory of uploaded files only. PDF forensic reports and analysis summaries are not available because no validated analysis services are configured.</p></div></div></section>
    {error && <p role="alert" className="text-sm text-rose-300">{error}</p>}</div>
}
export default Reports
