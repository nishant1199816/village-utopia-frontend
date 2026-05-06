import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001'

export default function RoomDetail() {
  const { slug }   = useParams()
  const navigate   = useNavigate()
  const [room,     setRoom]     = useState(null)
  const [loading,  setLoading]  = useState(true)
  const [imgIdx,   setImgIdx]   = useState(0)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    fetch(`${API}/api/rooms/${slug}`)
      .then(r => r.json())
      .then(data => {
        if (data?.room) setRoom(data.room)
        else setNotFound(true)
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [slug])

  if (loading) return (
    <div className="min-h-screen pt-20 flex items-center justify-center">
      <p className="font-display text-3xl text-ink/20 animate-pulse font-light">Loading...</p>
    </div>
  )

  if (notFound || !room) return (
    <div className="min-h-screen pt-20 flex flex-col items-center justify-center gap-4">
      <p className="font-display text-3xl text-ink/30 font-light">Room not found</p>
      <Link to="/rooms" className="btn-primary">← Back to Rooms</Link>
    </div>
  )

  const images = room.images || []

  return (
    <main className="pt-20">

      {/* Header */}
      <section className="bg-forest-dark py-16">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <button onClick={() => navigate(-1)}
            className="font-body text-xs text-cream/50 hover:text-gold transition-colors mb-4 flex items-center gap-2">
            ← Back
          </button>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-display text-4xl md:text-5xl text-cream font-light">{room.name}</h1>
            {room.badge && (
              <span className="bg-gold text-forest-dark font-body text-xs tracking-wide uppercase px-3 py-1">
                {room.badge}
              </span>
            )}
            <span className={`font-body text-xs tracking-widest uppercase px-3 py-1 ${
              room.type === 'COTTAGE' ? 'bg-gold/20 text-gold' : 'bg-cream/10 text-cream/70'}`}>
              {room.type === 'COTTAGE' ? 'Cottage' : 'Room'}
            </span>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-12 grid lg:grid-cols-3 gap-10">

        {/* ── Left — Images + Details ── */}
        <div className="lg:col-span-2">

          {/* Main image */}
          {images.length > 0 && (
            <div className="mb-4">
              <div className="relative overflow-hidden h-80 md:h-[420px]">
                <img src={images[imgIdx]} alt={room.name}
                  className="w-full h-full object-cover"
                  onError={e => e.target.src = `https://placehold.co/800x420/2D4A32/C9A96E?text=${encodeURIComponent(room.name)}`} />
              </div>

              {/* Thumbnails */}
              {images.length > 1 && (
                <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
                  {images.map((img, i) => (
                    <button key={i} onClick={() => setImgIdx(i)}
                      className={`shrink-0 w-20 h-16 overflow-hidden border-2 transition-all ${
                        i === imgIdx ? 'border-gold' : 'border-transparent opacity-60 hover:opacity-100'}`}>
                      <img src={img} alt="" className="w-full h-full object-cover"
                        onError={e => e.target.src = 'https://placehold.co/80x64/2D4A32/C9A96E?text=IMG'} />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Description */}
          <div className="mb-8">
            <h2 className="font-display text-2xl text-forest-dark font-light mb-3">About this stay</h2>
            <span className="gold-divider" />
            <p className="font-body text-ink/70 leading-relaxed mt-3">{room.description}</p>
          </div>

          {/* Highlights */}
          {room.highlights?.length > 0 && (
            <div className="mb-8">
              <h3 className="font-body text-xs tracking-[0.2em] uppercase text-forest-mid font-semibold mb-4">Highlights</h3>
              <div className="grid grid-cols-2 gap-2">
                {room.highlights.map(h => (
                  <div key={h} className="flex items-center gap-2 font-body text-sm text-ink/70">
                    <span className="text-gold text-base">›</span>{h}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Amenities */}
          {room.amenities?.length > 0 && (
            <div>
              <h3 className="font-body text-xs tracking-[0.2em] uppercase text-forest-mid font-semibold mb-4">Amenities</h3>
              <div className="flex flex-wrap gap-2">
                {room.amenities.map(a => (
                  <span key={a} className="font-body text-xs border border-forest-mid/30 text-forest-mid px-3 py-1">
                    {a}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Right — Book widget ── */}
        <div className="lg:col-span-1">
          <div className="sticky top-28 bg-white border border-cream-dark p-6">
            <div className="flex justify-between items-baseline mb-1">
              <span className="font-display text-3xl text-forest-mid font-light">
                ₹{room.price?.toLocaleString('en-IN')}
              </span>
              <span className="font-body text-xs text-ink/40">/ night</span>
            </div>
            <div className="flex gap-4 font-body text-xs text-ink/50 mb-5 pb-5 border-b border-cream-dark">
              <span>👥 Up to {room.capacity} guests</span>
              {room.size && <span>📐 {room.size}</span>}
            </div>

            <Link
              to={`/booking?room=${room.id}`}
              className="block w-full text-center bg-forest-mid text-cream font-body text-xs
                         tracking-[0.2em] uppercase py-3.5 hover:bg-forest-dark transition-colors mb-3">
              Book Now
            </Link>

            <Link
              to="/contact"
              className="block w-full text-center border border-forest-mid text-forest-mid font-body text-xs
                         tracking-[0.2em] uppercase py-3.5 hover:bg-forest-mid hover:text-cream transition-colors">
              Enquire
            </Link>

            <div className="mt-5 pt-5 border-t border-cream-dark space-y-1.5">
              <p className="font-body text-[10px] text-ink/40">✓ Free cancellation up to 48 hrs</p>
              <p className="font-body text-[10px] text-ink/40">✓ No hidden charges</p>
              <p className="font-body text-[10px] text-ink/40">✓ Best price guarantee</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}