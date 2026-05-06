import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navbar       from './components/Navbar'
import Footer       from './components/Footer'
import Home         from './pages/Home'
import RoomsPage    from './pages/Rooms'
import GalleryPage  from './pages/GalleryPage'
import BookingPage  from './pages/BookingPage'
import { About, Contact, Policies } from './pages/OtherPages'
import RoomDetail from './pages/RoomDetail'

// Admin
import AdminLogin     from './pages/admin/AdminLogin'
import AdminLayout    from './pages/admin/AdminLayout'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminRooms     from './pages/admin/AdminRooms'
import AdminBookings  from './pages/admin/AdminBookings'

// Public layout wrapper
function PublicLayout({ children }) {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <div className="flex-1">{children}</div>
      <Footer />
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* ── Public routes ── */}
        <Route path="/" element={<PublicLayout><Home /></PublicLayout>} />
        <Route path="/about"    element={<PublicLayout><About /></PublicLayout>} />
        <Route path="/rooms"    element={<PublicLayout><RoomsPage /></PublicLayout>} />
        <Route path="/gallery"  element={<PublicLayout><GalleryPage /></PublicLayout>} />
        <Route path="/booking"  element={<PublicLayout><BookingPage /></PublicLayout>} />
        <Route path="/contact"  element={<PublicLayout><Contact /></PublicLayout>} />
        <Route path="/policies" element={<PublicLayout><Policies /></PublicLayout>} />
        <Route path="/rooms/:slug" element={<PublicLayout><RoomDetail /></PublicLayout>} />

        {/* ── Admin routes (no navbar/footer) ── */}
        <Route path="/admin" element={<AdminLogin />} />
        <Route path="/admin" element={<AdminLayout />}>
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="rooms"     element={<AdminRooms />} />
          <Route path="bookings"  element={<AdminBookings />} />
        </Route>

      </Routes>
    </BrowserRouter>
  )
}