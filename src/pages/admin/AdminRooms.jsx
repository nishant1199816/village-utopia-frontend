// src/pages/admin/AdminRooms.jsx
import { useState, useEffect, useCallback } from 'react'
import { useAdmin } from '../../hooks/useAdmin'

const CLOUDINARY_CLOUD  = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME   || ''
const CLOUDINARY_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || ''

const EMPTY = {
  name: '', type: 'ROOM', price: '', capacity: 2,
  size: '', description: '', badge: '',
  highlights: '', amenities: '', images: '',
}

export default function AdminRooms() {
  const { apiCall } = useAdmin()
  const [rooms,     setRooms]     = useState([])
  const [loading,   setLoading]   = useState(true)
  const [modal,     setModal]     = useState(null)
  const [form,      setForm]      = useState(EMPTY)
  const [saving,    setSaving]    = useState(false)
  const [uploading, setUploading] = useState(false)
  const [msg,       setMsg]       = useState('')
  const [error,     setError]     = useState('')

  const load = useCallback(async () => {
    setLoading(true); setError('')
    const data = await apiCall('/api/admin/rooms')
    if (data?.rooms) setRooms(data.rooms)
    else setError('Could not load rooms. Check VITE_API_URL in Vercel.')
    setLoading(false)
  }, [apiCall])

  useEffect(() => { load() }, [load])

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }))

  function openAdd() { setForm(EMPTY); setMsg(''); setModal('add') }

  function openEdit(room) {
    setForm({
      ...room,
      highlights: (room.highlights || []).join('\n'),
      amenities:  (room.amenities  || []).join('\n'),
      images:     (room.images     || []).join('\n'),
    })
    setMsg(''); setModal('edit')
  }

  // ── Cloudinary upload ──────────────────────────────────────
  async function handleImageUpload(e) {
    const files = Array.from(e.target.files)
    if (!files.length) return

    if (!CLOUDINARY_CLOUD || !CLOUDINARY_PRESET) {
      setMsg('⚠️ Cloudinary env vars missing. Vercel mein add karo: VITE_CLOUDINARY_CLOUD_NAME aur VITE_CLOUDINARY_UPLOAD_PRESET')
      return
    }

    setUploading(true)
    const uploaded = []
    for (const file of files) {
      const fd = new FormData()
      fd.append('file',           file)
      fd.append('upload_preset',  CLOUDINARY_PRESET)
      fd.append('folder',         'village-utopia')
      try {
        const res  = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/image/upload`, {
          method: 'POST', body: fd,
        })
        const data = await res.json()
        if (data.secure_url) uploaded.push(data.secure_url)
      } catch { /* skip failed */ }
    }
    if (uploaded.length) {
      setForm(p => ({
        ...p,
        images: [p.images, ...uploaded].filter(Boolean).join('\n'),
      }))
      setMsg(`✅ ${uploaded.length} photo(s) uploaded!`)
    }
    setUploading(false)
    e.target.value = ''
  }

  // ── Save ──────────────────────────────────────────────────
  async function handleSave() {
    if (!form.name || !form.price || !form.capacity) {
      setMsg('❌ Name, price aur capacity required hain'); return
    }
    setSaving(true); setMsg('')

    const payload = {
      ...form,
      price:      parseInt(form.price),
      capacity:   parseInt(form.capacity),
      highlights: form.highlights.split('\n').map(s => s.trim()).filter(Boolean),
      amenities:  form.amenities.split('\n').map(s => s.trim()).filter(Boolean),
      images:     form.images.split('\n').map(s => s.trim()).filter(Boolean),
      badge:      form.badge || null,
    }

    const res = modal === 'add'
      ? await apiCall('/api/admin/rooms',        { method: 'POST', body: JSON.stringify(payload) })
      : await apiCall(`/api/admin/rooms/${form.id}`, { method: 'PUT',  body: JSON.stringify(payload) })

    if (res?.room) {
      await load()
      setTimeout(() => { setModal(null); setMsg('') }, 600)
    } else {
      setMsg('❌ ' + (res?.error || 'Save failed — check backend logs'))
    }
    setSaving(false)
  }

  async function handleDelete(room) {
    if (!confirm(`"${room.name}" delete karo? Undo nahi hoga.`)) return
    const res = await apiCall(`/api/admin/rooms/${room.id}`, { method: 'DELETE' })
    if (res?.message) await load()
    else alert(res?.error || 'Delete failed')
  }

  async function toggleActive(room) {
    await apiCall(`/api/admin/rooms/${room.id}`, {
      method: 'PUT', body: JSON.stringify({ active: !room.active }),
    })
    await load()
  }

  const imageList = form.images.split('\n').map(s => s.trim()).filter(Boolean)

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-3xl text-forest-dark font-light">Rooms & Cottages</h1>
          <p className="font-body text-sm text-ink/50 mt-1">{rooms.length} total listings</p>
        </div>
        <button onClick={openAdd}
          className="bg-forest-mid text-cream font-body text-xs tracking-[0.2em] uppercase px-5 py-2.5
                     hover:bg-forest-dark transition-colors">
          + Add New
        </button>
      </div>

      {/* Error banner */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 font-body text-sm px-4 py-3 mb-6">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-20 font-body text-ink/40">Loading...</div>
      ) : rooms.length === 0 ? (
        <div className="text-center py-20 bg-white border border-cream-dark">
          <p className="font-body text-ink/40">Koi room nahi mila.</p>
          <p className="font-body text-xs text-ink/30 mt-1">VITE_API_URL check karo Vercel mein.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {rooms.map(room => (
            <div key={room.id}
                 className={`bg-white border p-5 flex gap-4 items-start ${room.active !== false ? 'border-cream-dark' : 'border-red-200 opacity-60'}`}>
              {/* Thumbnail */}
              <div className="w-20 h-16 shrink-0 overflow-hidden bg-cream-dark">
                {room.images?.[0]
                  ? <img src={room.images[0]} alt={room.name} className="w-full h-full object-cover"
                         onError={e => { e.target.style.display='none' }} />
                  : <div className="w-full h-full flex items-center justify-center text-xl">🏠</div>
                }
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="font-body font-medium text-sm text-ink">{room.name}</span>
                  <span className={`font-body text-[9px] px-1.5 py-0.5 tracking-wide uppercase ${
                    room.type === 'COTTAGE' ? 'bg-gold/20 text-gold-dark' : 'bg-forest-mid/10 text-forest-mid'}`}>
                    {room.type}
                  </span>
                  {room.badge && (
                    <span className="font-body text-[9px] px-1.5 py-0.5 bg-maroon/10 text-maroon tracking-wide uppercase">
                      {room.badge}
                    </span>
                  )}
                  {room.active === false && (
                    <span className="font-body text-[9px] px-1.5 py-0.5 bg-red-100 text-red-600 uppercase">Hidden</span>
                  )}
                </div>
                <div className="flex gap-4 font-body text-xs text-ink/50">
                  <span>👥 {room.capacity} guests</span>
                  <span>📐 {room.size}</span>
                  <span className="font-medium text-forest-mid">₹{room.price?.toLocaleString('en-IN')}/night</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 shrink-0">
                <button onClick={() => openEdit(room)}
                  className="font-body text-xs px-3 py-1.5 border border-forest-mid text-forest-mid
                             hover:bg-forest-mid hover:text-cream transition-colors">
                  Edit
                </button>
                <button onClick={() => toggleActive(room)}
                  className={`font-body text-xs px-3 py-1.5 border transition-colors ${
                    room.active !== false
                      ? 'border-amber-400 text-amber-600 hover:bg-amber-400 hover:text-white'
                      : 'border-green-500 text-green-600 hover:bg-green-500 hover:text-white'}`}>
                  {room.active !== false ? 'Hide' : 'Show'}
                </button>
                <button onClick={() => handleDelete(room)}
                  className="font-body text-xs px-3 py-1.5 border border-red-300 text-red-500
                             hover:bg-red-500 hover:text-white transition-colors">
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Modal ── */}
      {modal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl max-h-[92vh] overflow-auto flex flex-col">

            {/* Header */}
            <div className="bg-forest-dark px-6 py-4 flex justify-between items-center sticky top-0 z-10">
              <h2 className="font-display text-xl text-cream font-light">
                {modal === 'add' ? 'Add New Room / Cottage' : `Edit — ${form.name}`}
              </h2>
              <button onClick={() => setModal(null)} className="text-cream/60 hover:text-cream text-2xl leading-none">✕</button>
            </div>

            <div className="p-6 space-y-5 overflow-auto">

              {/* Name + Type */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] tracking-[0.2em] uppercase font-body text-forest-mid font-semibold mb-1.5">
                    Room Name *
                  </label>
                  <input value={form.name} onChange={e => f('name', e.target.value)}
                    className="input-field" placeholder="Classic Deluxe Room" />
                </div>
                <div>
                  <label className="block text-[9px] tracking-[0.2em] uppercase font-body text-forest-mid font-semibold mb-1.5">
                    Type *
                  </label>
                  <select value={form.type} onChange={e => f('type', e.target.value)} className="input-field">
                    <option value="ROOM">Room</option>
                    <option value="COTTAGE">Cottage</option>
                  </select>
                </div>
              </div>

              {/* Price + Capacity + Size */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-[9px] tracking-[0.2em] uppercase font-body text-forest-mid font-semibold mb-1.5">
                    Price/Night (₹) *
                  </label>
                  <input type="number" value={form.price} onChange={e => f('price', e.target.value)}
                    className="input-field" placeholder="3500" />
                </div>
                <div>
                  <label className="block text-[9px] tracking-[0.2em] uppercase font-body text-forest-mid font-semibold mb-1.5">
                    Capacity *
                  </label>
                  <input type="number" value={form.capacity} onChange={e => f('capacity', e.target.value)}
                    className="input-field" placeholder="2" />
                </div>
                <div>
                  <label className="block text-[9px] tracking-[0.2em] uppercase font-body text-forest-mid font-semibold mb-1.5">
                    Size
                  </label>
                  <input value={form.size} onChange={e => f('size', e.target.value)}
                    className="input-field" placeholder="320 sq ft" />
                </div>
              </div>

              {/* Badge */}
              <div>
                <label className="block text-[9px] tracking-[0.2em] uppercase font-body text-forest-mid font-semibold mb-1.5">
                  Badge (optional)
                </label>
                <input value={form.badge} onChange={e => f('badge', e.target.value)}
                  className="input-field" placeholder="Most Popular / Premium / Best View" />
              </div>

              {/* Description */}
              <div>
                <label className="block text-[9px] tracking-[0.2em] uppercase font-body text-forest-mid font-semibold mb-1.5">
                  Description
                </label>
                <textarea value={form.description} onChange={e => f('description', e.target.value)}
                  rows={3} className="input-field resize-none"
                  placeholder="Write a short description..." />
              </div>

              {/* Highlights */}
              <div>
                <label className="block text-[9px] tracking-[0.2em] uppercase font-body text-forest-mid font-semibold mb-1.5">
                  Highlights (ek line = ek item)
                </label>
                <textarea value={form.highlights} onChange={e => f('highlights', e.target.value)}
                  rows={3} className="input-field resize-none font-mono text-xs"
                  placeholder={"Platform king bed\nMarble flooring\nWall sconces"} />
              </div>

              {/* Amenities */}
              <div>
                <label className="block text-[9px] tracking-[0.2em] uppercase font-body text-forest-mid font-semibold mb-1.5">
                  Amenities (ek line = ek item)
                </label>
                <textarea value={form.amenities} onChange={e => f('amenities', e.target.value)}
                  rows={3} className="input-field resize-none font-mono text-xs"
                  placeholder={"AC\nCeiling Fan\nTV\nAttached Bathroom"} />
              </div>

              {/* ── Images ── */}
              <div>
                <label className="block text-[9px] tracking-[0.2em] uppercase font-body text-forest-mid font-semibold mb-2">
                  Photos
                </label>

                {/* Upload button */}
                <label className={`flex items-center justify-center gap-2 w-full py-3 border-2 border-dashed cursor-pointer
                  transition-colors duration-200 font-body text-sm
                  ${uploading
                    ? 'border-gold/40 text-ink/40 cursor-not-allowed'
                    : 'border-forest-mid/30 text-forest-mid hover:border-forest-mid hover:bg-forest-mid/5'}`}>
                  {uploading ? (
                    <><span className="animate-spin">⏳</span> Uploading...</>
                  ) : (
                    <><span>📷</span> Click to upload photos</>
                  )}
                  <input type="file" accept="image/*" multiple className="hidden"
                    onChange={handleImageUpload} disabled={uploading} />
                </label>

                {/* Preview uploaded images */}
                {imageList.length > 0 && (
                  <div className="flex gap-2 flex-wrap mt-3">
                    {imageList.map((url, i) => (
                      <div key={i} className="relative group w-20 h-16">
                        <img src={url} alt="" className="w-full h-full object-cover"
                          onError={e => { e.target.src = 'https://placehold.co/80x64/2D4A32/C9A96E?text=IMG' }} />
                        <button
                          onClick={() => f('images', imageList.filter((_, idx) => idx !== i).join('\n'))}
                          className="absolute top-0.5 right-0.5 w-5 h-5 bg-red-500 text-white text-xs
                                     flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Manual URL fallback */}
                <p className="font-body text-[9px] text-ink/40 mt-2">
                  Ya manually URLs paste karo (ek line = ek image):
                </p>
                <textarea value={form.images} onChange={e => f('images', e.target.value)}
                  rows={2} className="input-field resize-none font-mono text-xs mt-1"
                  placeholder="/images/room-1a.jpg" />
              </div>

              {/* Status message */}
              {msg && (
                <div className={`font-body text-sm px-3 py-2.5 ${
                  msg.startsWith('✅') ? 'bg-green-50 text-green-700 border border-green-200' :
                  msg.startsWith('⚠️') ? 'bg-yellow-50 text-yellow-700 border border-yellow-200' :
                  'bg-red-50 text-red-600 border border-red-200'}`}>
                  {msg}
                </div>
              )}

              {/* Buttons */}
              <div className="flex gap-3 pt-2 sticky bottom-0 bg-white pb-1">
                <button onClick={handleSave} disabled={saving}
                  className="flex-1 bg-forest-mid text-cream font-body text-xs tracking-[0.2em] uppercase
                             py-3 hover:bg-forest-dark transition-colors disabled:opacity-50">
                  {saving ? 'Saving...' : modal === 'add' ? 'Create Room' : 'Save Changes'}
                </button>
                <button onClick={() => setModal(null)}
                  className="px-6 border border-ink/20 font-body text-xs text-ink/60 hover:border-ink/40 transition-colors">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}