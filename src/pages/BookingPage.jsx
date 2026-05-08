import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { ADDONS } from '../data/rooms'

// ✅ No ALL_UNITS static import — loads from API
const API = import.meta.env.VITE_API_URL || 'http://localhost:3001'
const STEPS = ['Select Room', 'Add-ons', 'Guest Details', 'Payment']

export default function BookingPage() {
  const [searchParams] = useSearchParams()
  const navigate       = useNavigate()

  const today    = new Date()
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1)

  const [step,     setStep]    = useState(0)
  const [checkIn,  setCheckIn] = useState(today)
  const [checkOut, setCheckOut]= useState(tomorrow)
  const [guests,   setGuests]  = useState(2)
  const [roomId,   setRoomId]  = useState(searchParams.get('room') || '')
  const [addons,   setAddons]  = useState([])
  const [payType,  setPayType] = useState('full')
  const [form,     setForm]    = useState({ name: '', email: '', phone: '', special: '' })
  const [errors,   setErrors]  = useState({})

  // ── Load all rooms from API ────────────────────────────
  const [allUnits, setAllUnits] = useState([])
  const [loadingRooms, setLoadingRooms] = useState(true)

  useEffect(() => {
    fetch(`${API}/api/rooms`)
      .then(r => r.json())
      .then(data => {
        if (data?.rooms) setAllUnits(data.rooms.filter(r => r.active !== false))
      })
      .catch(() => {})
      .finally(() => setLoadingRooms(false))
  }, [])

  const nights   = Math.max(1, Math.ceil((checkOut - checkIn) / 86400000))
  const room     = allUnits.find(u => u.id === roomId)
  const roomCost = room ? room.price * nights : 0
  const addonCost = addons.reduce((sum, id) => {
    const a = ADDONS.find(x => x.id === id)
    return sum + (a ? a.price * (id === 'extra-bed' ? 1 : guests) * nights : 0)
  }, 0)
  const total  = roomCost + addonCost
  const payNow = payType === 'full' ? total : Math.round(total * 0.3)

  const toggleAddon = id =>
    setAddons(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])

  const validateStep = () => {
    if (step === 0 && !roomId) { alert('Please select a room or cottage.'); return false }
    if (step === 2) {
      const e = {}
      if (!form.name.trim())  e.name  = 'Required'
      if (!form.email.trim()) e.email = 'Required'
      if (!form.phone.trim()) e.phone = 'Required'
      setErrors(e)
      return Object.keys(e).length === 0
    }
    return true
  }

  const handleNext = () => { if (validateStep()) setStep(s => Math.min(s + 1, STEPS.length - 1)) }
  const handleBack = () => setStep(s => Math.max(s - 1, 0))
  const handlePayment = async () => {
    try {
      // 1. Create order on backend
      const res = await fetch(`${API}/api/bookings/create-order`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId:          roomId,
          checkin:         checkIn.toISOString().split('T')[0],
          checkout:        checkOut.toISOString().split('T')[0],
          guests:          guests,
          guestName:       form.name,
          guestEmail:      form.email,
          guestPhone:      form.phone,
          specialRequests: form.special,
          addons:          addons,
          paymentType:     payType.toUpperCase(),
        }),
      })
      const data = await res.json()
      if (!res.ok) { alert(data.error || 'Booking create karne mein problem'); return }

      // 2. Open Razorpay checkout
      const options = {
        key:      import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount:   data.amount * 100,
        currency: 'INR',
        name:     'Village Utopia Cottages',
        order_id: data.razorpayOrderId,
        handler: async (response) => {
          // 3. Verify payment on backend
          const vRes = await fetch(`${API}/api/bookings/verify-payment`, {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              razorpay_order_id:   response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature:  response.razorpay_signature,
              bookingId:           data.bookingId,
            }),
          })
          const vData = await vRes.json()
          if (vData.success) {
            alert(`✅ Booking Confirmed!\n\nRef: ${vData.bookingRef}\n\nThank you for booking with Village Utopia Cottages!`)
            navigate('/')
          } else {
            alert('Payment verification failed. Contact us at stay@villageutopia.in')
          }
        },
        prefill: {
          name:    form.name,
          email:   form.email,
          contact: form.phone,
        },
        theme: { color: '#C9A96E' },
        modal: {
          ondismiss: () => console.log('Payment modal closed')
        }
      }

      const rzp = new window.Razorpay(options)
      rzp.open()

    } catch (err) {
      alert('Error: ' + err.message)
    }
  }

  return (
    <main className="pt-20 bg-cream min-h-screen">
      <section className="bg-forest-dark py-16 text-center">
        <span className="section-label text-gold/70">Secure Booking</span>
        <h1 className="font-display text-4xl text-cream font-light">Book Your Stay</h1>
      </section>

      {/* Steps */}
      <div className="bg-white border-b border-cream-dark sticky top-20 z-20">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-body font-medium ${
                i < step ? 'bg-forest-mid text-cream' : i === step ? 'bg-gold text-forest-dark' : 'bg-cream-dark text-ink/40'
              }`}>
                {i < step ? '✓' : i + 1}
              </div>
              <span className={`font-body text-xs tracking-wide hidden sm:block ${i === step ? 'text-forest-dark font-medium' : 'text-ink/40'}`}>{s}</span>
              {i < STEPS.length - 1 && <div className={`flex-1 h-[1px] mx-2 ${i < step ? 'bg-forest-mid' : 'bg-cream-dark'}`} />}
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 lg:px-12 py-10 grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">

          {/* STEP 0 — Select Room */}
          {step === 0 && (
            <div>
              <h2 className="font-display text-2xl text-forest-dark font-light mb-6">Choose dates & room</h2>
              <div className="grid sm:grid-cols-3 gap-5 mb-8 p-5 bg-white border border-cream-dark">
                <div>
                  <label className="block text-[10px] tracking-[0.2em] uppercase font-body text-ink/50 mb-2">Check-in</label>
                  <DatePicker selected={checkIn}
                    onChange={d => { setCheckIn(d); if (d >= checkOut) { const n = new Date(d); n.setDate(d.getDate()+1); setCheckOut(n) } }}
                    minDate={today} dateFormat="dd MMM yyyy" className="input-field text-sm" />
                </div>
                <div>
                  <label className="block text-[10px] tracking-[0.2em] uppercase font-body text-ink/50 mb-2">Check-out</label>
                  <DatePicker selected={checkOut} onChange={setCheckOut}
                    minDate={new Date(checkIn.getTime() + 86400000)} dateFormat="dd MMM yyyy" className="input-field text-sm" />
                </div>
                <div>
                  <label className="block text-[10px] tracking-[0.2em] uppercase font-body text-ink/50 mb-2">Guests</label>
                  <select value={guests} onChange={e => setGuests(Number(e.target.value))} className="input-field text-sm">
                    {[1,2,3,4].map(n => <option key={n} value={n}>{n} Guest{n>1?'s':''}</option>)}
                  </select>
                </div>
              </div>

              <div className="mb-6">
                <span className="inline-block bg-gold/20 text-gold-dark font-body text-xs px-3 py-1">
                  {nights} night{nights > 1 ? 's' : ''} selected
                </span>
              </div>

              {/* ✅ Dynamic rooms from API */}
              {loadingRooms ? (
                <div className="text-center py-10 font-body text-ink/40">Loading rooms...</div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-4">
                  {allUnits.map(u => (
                    <div key={u.id} onClick={() => setRoomId(u.id)}
                      className={`cursor-pointer border-2 transition-all duration-200 overflow-hidden ${
                        roomId === u.id ? 'border-gold' : 'border-transparent hover:border-cream-dark'}`}>
                      <div className="relative h-40 overflow-hidden">
                        <img src={u.images?.[0]} alt={u.name} className="w-full h-full object-cover"
                          onError={e => e.target.src = `https://placehold.co/400x200/2D4A32/C9A96E?text=${encodeURIComponent(u.name)}`} />
                        {roomId === u.id && (
                          <div className="absolute top-2 right-2 bg-gold text-forest-dark w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">✓</div>
                        )}
                        {u.badge && (
                          <div className="absolute top-2 left-2 bg-gold/90 text-forest-dark font-body text-[9px] tracking-wide uppercase px-2 py-0.5">{u.badge}</div>
                        )}
                      </div>
                      <div className="p-4 bg-white">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-display text-base text-forest-dark">{u.name}</p>
                            <p className="font-body text-xs text-ink/40 mt-0.5">Up to {u.capacity} guests</p>
                          </div>
                          <div className="text-right">
                            <p className="font-display text-lg text-forest-mid">₹{(u.price * nights).toLocaleString()}</p>
                            <p className="font-body text-[9px] text-ink/40">{nights} night{nights>1?'s':''}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* STEP 1 — Add-ons */}
          {step === 1 && (
            <div>
              <h2 className="font-display text-2xl text-forest-dark font-light mb-2">Enhance your stay</h2>
              <p className="font-body text-sm text-ink/50 mb-6">Optional — can also be arranged at the property.</p>
              <div className="grid sm:grid-cols-2 gap-4">
                {ADDONS.map(a => {
                  const selected = addons.includes(a.id)
                  const price    = a.id === 'extra-bed' ? a.price : a.price * guests
                  return (
                    <div key={a.id} onClick={() => toggleAddon(a.id)}
                      className={`cursor-pointer p-5 border-2 transition-all duration-200 bg-white flex items-center gap-4 ${
                        selected ? 'border-gold' : 'border-cream-dark hover:border-forest-mid/40'}`}>
                      <span className="text-3xl">{a.icon}</span>
                      <div className="flex-1">
                        <p className="font-body text-sm font-medium text-ink">{a.label}</p>
                        <p className="font-body text-xs text-ink/40 mt-0.5">₹{price.toLocaleString()} per night</p>
                      </div>
                      <div className={`w-5 h-5 border-2 rounded-full flex items-center justify-center transition-colors ${
                        selected ? 'bg-gold border-gold text-forest-dark text-xs' : 'border-ink/30'}`}>
                        {selected && '✓'}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* STEP 2 — Guest Details */}
          {step === 2 && (
            <div>
              <h2 className="font-display text-2xl text-forest-dark font-light mb-6">Your details</h2>
              <div className="grid sm:grid-cols-2 gap-6 bg-white p-6 border border-cream-dark">
                {[
                  { name: 'name',  label: 'Full Name',     type: 'text',  placeholder: 'Rahul Sharma' },
                  { name: 'email', label: 'Email Address', type: 'email', placeholder: 'rahul@email.com' },
                  { name: 'phone', label: 'Phone Number',  type: 'tel',   placeholder: '+91 98765 43210' },
                ].map(({ name, label, type, placeholder }) => (
                  <div key={name} className={name === 'name' ? 'sm:col-span-2' : ''}>
                    <label className="block text-[10px] tracking-[0.2em] uppercase font-body text-ink/50 mb-2">{label}</label>
                    <input type={type} placeholder={placeholder} value={form[name]}
                      onChange={e => setForm(f => ({ ...f, [name]: e.target.value }))}
                      className={`input-field ${errors[name] ? 'border-red-400' : ''}`} />
                    {errors[name] && <p className="font-body text-xs text-red-500 mt-1">{errors[name]}</p>}
                  </div>
                ))}
                <div className="sm:col-span-2">
                  <label className="block text-[10px] tracking-[0.2em] uppercase font-body text-ink/50 mb-2">Special Requests (optional)</label>
                  <textarea rows={3} placeholder="Early check-in, dietary requirements, etc."
                    value={form.special} onChange={e => setForm(f => ({ ...f, special: e.target.value }))}
                    className="input-field resize-none" />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3 — Payment */}
          {step === 3 && (
            <div>
              <h2 className="font-display text-2xl text-forest-dark font-light mb-6">Review & Pay</h2>
              <div className="bg-white border border-cream-dark p-6 mb-6">
                <div className="flex gap-4 mb-4">
                  <img src={room?.images?.[0]} alt={room?.name} className="w-24 h-20 object-cover"
                    onError={e => e.target.src = 'https://placehold.co/100x80/2D4A32/C9A96E?text=Room'} />
                  <div>
                    <p className="font-body font-medium text-ink">{room?.name}</p>
                    <p className="font-body text-sm text-ink/50 mt-1">
                      {checkIn.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} →{' '}
                      {checkOut.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                    <p className="font-body text-sm text-ink/50">{nights} nights · {guests} guests</p>
                  </div>
                </div>
                <div className="border-t border-cream-dark pt-4 space-y-2">
                  <div className="flex justify-between font-body text-sm"><span className="text-ink/60">Room cost</span><span>₹{roomCost.toLocaleString()}</span></div>
                  {addons.map(id => {
                    const a = ADDONS.find(x => x.id === id)
                    const p = a.id === 'extra-bed' ? a.price * nights : a.price * guests * nights
                    return <div key={id} className="flex justify-between font-body text-sm"><span className="text-ink/60">{a.label}</span><span>₹{p.toLocaleString()}</span></div>
                  })}
                  <div className="flex justify-between font-display text-lg border-t border-cream-dark pt-2">
                    <span>Total</span><span className="text-forest-mid">₹{total.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-cream-dark p-6 mb-6">
                <div className="grid sm:grid-cols-2 gap-4">
                  {[
                    { val: 'full',    label: 'Full Payment',  desc: `Pay ₹${total.toLocaleString()} now` },
                    { val: 'partial', label: 'Partial (30%)', desc: `Pay ₹${Math.round(total*0.3).toLocaleString()} now, rest on arrival` },
                  ].map(({ val, label, desc }) => (
                    <div key={val} onClick={() => setPayType(val)}
                      className={`cursor-pointer p-4 border-2 transition-all ${payType === val ? 'border-gold bg-gold/5' : 'border-cream-dark hover:border-forest-mid/40'}`}>
                      <p className="font-body font-medium text-sm text-ink">{label}</p>
                      <p className="font-body text-xs text-ink/50 mt-1">{desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              <button onClick={handlePayment}
                className="w-full bg-gold text-forest-dark font-body font-medium text-sm tracking-[0.15em] uppercase py-4 hover:bg-gold-dark transition-colors">
                Pay ₹{payNow.toLocaleString()} Securely
              </button>
            </div>
          )}

          {/* Nav buttons */}
          <div className="flex justify-between mt-8">
            <button onClick={handleBack} disabled={step === 0}
              className="font-body text-xs tracking-[0.15em] uppercase px-6 py-3 border border-ink/20 text-ink/50
                         hover:border-forest-mid hover:text-forest-mid transition-all disabled:opacity-30 disabled:cursor-not-allowed">
              ← Back
            </button>
            {step < STEPS.length - 1 && (
              <button onClick={handleNext} className="btn-primary">Continue →</button>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="sticky top-36 bg-white border border-cream-dark p-6">
            <h3 className="font-display text-xl text-forest-dark font-light mb-4">Booking Summary</h3>
            {room ? (
              <>
                <img src={room.images?.[0]} alt={room.name} className="w-full h-36 object-cover mb-4"
                  onError={e => e.target.src = 'https://placehold.co/300x150/2D4A32/C9A96E?text=Room'} />
                <p className="font-body font-medium text-sm text-ink">{room.name}</p>
                <p className="font-body text-xs text-ink/50 mt-1">
                  {checkIn.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} →{' '}
                  {checkOut.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
                <div className="border-t border-cream-dark mt-4 pt-4 space-y-2">
                  <div className="flex justify-between font-body text-xs text-ink/60"><span>Room</span><span>₹{roomCost.toLocaleString()}</span></div>
                  {addons.length > 0 && <div className="flex justify-between font-body text-xs text-ink/60"><span>Add-ons</span><span>₹{addonCost.toLocaleString()}</span></div>}
                  <div className="flex justify-between font-display text-base border-t border-cream-dark pt-2">
                    <span>Total</span><span className="text-forest-mid font-medium">₹{total.toLocaleString()}</span>
                  </div>
                </div>
              </>
            ) : (
              <p className="font-body text-sm text-ink/40 text-center py-6">Select a room or cottage to see pricing.</p>
            )}
            <div className="mt-5 pt-4 border-t border-cream-dark">
              <p className="font-body text-[10px] text-ink/40 leading-relaxed">
                ✓ Free cancellation up to 48 hours before check-in<br />
                ✓ Secure payment via Razorpay<br />
                ✓ Invoice sent after booking confirmation
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}