// src/pages/admin/AdminDashboard.jsx
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAdmin } from '../../hooks/useAdmin'

export default function AdminDashboard() {
  const { apiCall } = useAdmin()
  const [stats,    setStats]    = useState(null)
  const [bookings, setBookings] = useState([])
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    async function load() {
      const [s, b] = await Promise.all([
        apiCall('/api/admin/stats'),
        apiCall('/api/admin/bookings?limit=5'),
      ])
      if (s) setStats(s)
      if (b) setBookings(b.bookings || [])
      setLoading(false)
    }
    load()
  }, [])

  const STATUS_COLOR = {
    PENDING:   'bg-yellow-100 text-yellow-800',
    CONFIRMED: 'bg-green-100 text-green-800',
    CANCELLED: 'bg-red-100 text-red-800',
    COMPLETED: 'bg-blue-100 text-blue-800',
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="font-display text-3xl text-forest-dark font-light">Dashboard</h1>
        <p className="font-body text-sm text-ink/50 mt-1">
          {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      {loading ? (
        <div className="text-center py-20 font-body text-ink/40">Loading...</div>
      ) : (
        <>
          {/* Stats cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Active Rooms',       value: stats?.totalRooms        || 0, icon: '🛏️', color: 'bg-forest-mid' },
              { label: 'Total Bookings',     value: stats?.totalBookings     || 0, icon: '📋', color: 'bg-gold-dark' },
              { label: 'Confirmed',          value: stats?.confirmedBookings || 0, icon: '✅', color: 'bg-green-600' },
              { label: 'Total Revenue',      value: `₹${(stats?.totalRevenue || 0).toLocaleString('en-IN')}`, icon: '💰', color: 'bg-maroon' },
            ].map(({ label, value, icon, color }) => (
              <div key={label} className="bg-white border border-cream-dark p-5">
                <div className={`w-9 h-9 ${color} text-white flex items-center justify-center text-lg mb-3`}>
                  {icon}
                </div>
                <div className="font-display text-2xl text-forest-dark font-light">{value}</div>
                <div className="font-body text-xs text-ink/50 tracking-wide mt-0.5">{label}</div>
              </div>
            ))}
          </div>

          {/* Quick actions */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <Link
              to="/admin/rooms"
              className="bg-forest-mid text-cream p-5 flex items-center gap-4 hover:bg-forest-dark transition-colors"
            >
              <span className="text-2xl">➕</span>
              <div>
                <div className="font-body font-medium text-sm">Add New Room / Cottage</div>
                <div className="font-body text-xs text-cream/60 mt-0.5">Create a new listing</div>
              </div>
            </Link>
            <Link
              to="/admin/bookings"
              className="bg-white border border-cream-dark p-5 flex items-center gap-4 hover:border-forest-mid transition-colors"
            >
              <span className="text-2xl">📋</span>
              <div>
                <div className="font-body font-medium text-sm text-ink">
                  Pending Bookings
                  {stats?.pendingBookings > 0 && (
                    <span className="ml-2 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                      {stats.pendingBookings}
                    </span>
                  )}
                </div>
                <div className="font-body text-xs text-ink/40 mt-0.5">Review and confirm</div>
              </div>
            </Link>
          </div>

          {/* Recent bookings */}
          <div className="bg-white border border-cream-dark">
            <div className="px-6 py-4 border-b border-cream-dark flex justify-between items-center">
              <h2 className="font-body font-medium text-sm text-ink">Recent Bookings</h2>
              <Link to="/admin/bookings" className="font-body text-xs text-forest-mid hover:underline">
                View all →
              </Link>
            </div>
            {bookings.length === 0 ? (
              <div className="px-6 py-10 text-center font-body text-sm text-ink/40">
                No bookings yet
              </div>
            ) : (
              <div className="divide-y divide-cream-dark">
                {bookings.map(b => (
                  <div key={b.id} className="px-6 py-4 flex items-center justify-between">
                    <div>
                      <div className="font-body text-sm font-medium text-ink">{b.guestName}</div>
                      <div className="font-body text-xs text-ink/50 mt-0.5">
                        {b.room?.name} · {new Date(b.checkIn).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} →{' '}
                        {new Date(b.checkOut).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-body text-sm font-medium text-ink">
                        ₹{b.totalAmount?.toLocaleString('en-IN')}
                      </span>
                      <span className={`font-body text-[10px] px-2 py-0.5 ${STATUS_COLOR[b.status] || 'bg-gray-100 text-gray-700'}`}>
                        {b.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}