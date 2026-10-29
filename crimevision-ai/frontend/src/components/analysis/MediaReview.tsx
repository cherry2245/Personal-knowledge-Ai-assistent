import { useEffect, useState } from 'react'
import { AlertTriangle, AudioLines, FileImage, Film, Loader2, ScanSearch, ShieldCheck } from 'lucide-react'
import { api, AnalysisResult, Evidence, evidenceFileUrl } from '../../services/api'

type MediaType = Evidence['media_type']
const config: Record<MediaType, { title: string; icon: typeof FileImage; action: string; accept: string }> = {
  image: { title: 'Image review', icon: FileImage, action: 'Review image', accept: 'Image evidence' },
  audio: { title: 'Audio transcription', icon: AudioLines, action: 'Transcribe audio', accept: 'Audio evidence' },
  video: { title: 'Video review', icon: Film, action: 'Review video', accept: 'Video evidence' },
}

export default function MediaReview({ mediaType }: { mediaType: MediaType }) {
  const [items, setItems] = useState<Evidence[]>([])
  const [selectedId, setSelectedId] = useState('')
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const current = config[mediaType]
  const Icon = current.icon

  useEffect(() => {
    api.evidence().then(({ evidence }) => {
      const matching = evidence.filter(item => item.media_type === mediaType)
      setItems(matching)
      setSelectedId(matching[0]?.id ?? '')
    }).catch(e => setError(e instanceof Error ? e.message : 'Could not load evidence.'))
  }, [mediaType])

  const selected = items.find(item => item.id === selectedId)
  const run = async () => {
    if (!selected) return
    setBusy(true); setError(''); setAnalysis(null)
    try { setAnalysis(await api.analyze(mediaType, selected.id)) }
    catch (e) { setError(e instanceof Error ? e.message : 'Analysis failed.') }
    finally { setBusy(false) }
  }

  return <div className="mx-auto max-w-6xl space-y-6">
    <header><p className="text-xs font-medium uppercase tracking-[0.2em] text-cyan-300">Gemini multimodal review</p><h1 className="mt-2 text-3xl font-semibold text-white">{current.title}</h1><p className="mt-2 text-sm text-slate-400">Select an item from the vault and request a human-reviewable AI analysis.</p></header>
    <p className="rounded-lg border border-amber-900/40 bg-amber-950/20 p-3 text-xs leading-5 text-amber-100/70">When you run a review, the selected media file is sent to Google Gemini for processing. Confirm you are authorized to share it before continuing.</p>
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
      <section className="flex min-h-[360px] items-center justify-center overflow-hidden rounded-xl border border-slate-800 bg-slate-950 p-4">
        {!selected ? <div className="text-center"><Icon className="mx-auto text-slate-600" size={36}/><p className="mt-3 text-sm text-slate-400">Add {current.accept.toLowerCase()} in the Evidence Vault to begin.</p></div> : mediaType === 'image' ? <img src={evidenceFileUrl(selected.id)} alt={`Evidence preview: ${selected.original_filename}`} className="max-h-[65vh] max-w-full object-contain"/> : mediaType === 'video' ? <video key={selected.id} src={evidenceFileUrl(selected.id)} controls className="max-h-[65vh] max-w-full"/> : <audio key={selected.id} src={evidenceFileUrl(selected.id)} controls className="w-full max-w-lg"/>}
      </section>
      <aside className="space-y-4">
        <section className="rounded-xl border border-slate-800 bg-slate-900/70 p-5"><h2 className="font-semibold text-white">Analysis setup</h2><label htmlFor={`${mediaType}-evidence`} className="mt-4 block text-xs text-slate-400">Evidence</label><select id={`${mediaType}-evidence`} value={selectedId} onChange={e => { setSelectedId(e.target.value); setAnalysis(null) }} className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-200" disabled={!items.length}><option value="">Select evidence</option>{items.map(item => <option key={item.id} value={item.id}>{item.original_filename}</option>)}</select><button onClick={() => void run()} disabled={!selected || busy} className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-cyan-500 px-4 py-2.5 text-sm font-semibold text-slate-950 hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-40">{busy ? <Loader2 className="animate-spin" size={16}/> : <ScanSearch size={16}/>} {busy ? 'Analyzing…' : current.action}</button>{busy && <p className="mt-2 text-xs text-slate-500">Large media may take a few minutes to upload and process.</p>}</section>
        {error && <div role="alert" className="flex gap-3 rounded-lg border border-rose-900/60 bg-rose-950/30 p-4 text-sm text-rose-200"><AlertTriangle className="shrink-0" size={18}/><p>{error}</p></div>}
        {analysis && <section className="space-y-4 rounded-xl border border-slate-800 bg-slate-900/70 p-5"><div className="flex items-center gap-2 text-emerald-300"><ShieldCheck size={17}/><h2 className="font-semibold">Review complete</h2></div><p className="text-xs text-slate-500">{analysis.model_identifier} · {analysis.analysis_id.slice(0, 8)}</p>{analysis.result.summary && <p className="text-sm leading-6 text-slate-200">{analysis.result.summary}</p>}{analysis.result.transcript && <div><h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Transcript</h3><p className="mt-2 max-h-52 overflow-y-auto whitespace-pre-wrap text-sm leading-6 text-slate-200">{analysis.result.transcript}</p></div>}{analysis.result.observations && <ul className="list-disc space-y-1 pl-5 text-sm text-slate-200">{analysis.result.observations.map((item, i) => <li key={i}>{item}</li>)}</ul>}{analysis.result.events && analysis.result.events.length > 0 && <div><h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Video segments · approximate timestamps</h3><ol className="mt-2 space-y-2">{analysis.result.events.map((event, i) => <li key={i} className="rounded-lg bg-slate-950/70 p-3"><span className="font-mono text-xs text-cyan-300">{event.timestamp || 'Time unavailable'}</span><p className="mt-1 text-sm text-slate-200">{event.description}</p></li>)}</ol></div>}{analysis.result.limitations && analysis.result.limitations.length > 0 && <div className="border-t border-slate-800 pt-3"><h3 className="text-xs font-semibold text-amber-200">Limitations</h3><ul className="mt-1 list-disc space-y-1 pl-5 text-xs leading-5 text-slate-400">{analysis.result.limitations.map((item, i) => <li key={i}>{item}</li>)}</ul></div>}<p className="border-t border-slate-800 pt-3 text-xs leading-5 text-amber-200/70">{analysis.result.disclaimer}</p></section>}
      </aside>
    </div>
    {mediaType === 'video' && <p className="rounded-lg border border-slate-800 bg-slate-900/60 p-3 text-xs leading-5 text-slate-400">Video review produces AI-described segments with approximate media times. It does not perform continuous object tracking or verified frame-by-frame annotations.</p>}
    <p className="text-xs leading-5 text-slate-500">AI output is preliminary decision support. Verify every observation against the original file. The model does not identify people or establish guilt.</p>
  </div>
}
