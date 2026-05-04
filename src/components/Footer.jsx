import { Link } from 'react-router-dom'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function Footer() {
  const year = new Date().getFullYear()
  const navigate = useNavigate()
  const [clicks, setClicks] = useState(0)

  // Hidden admin: click copyright text 5 times quickly
  const handleCopyrightClick = () => {
    const next = clicks + 1
    setClicks(next)
    if (next >= 5) {
      setClicks(0)
      navigate('/admin')
    }
    setTimeout(() => setClicks(0), 3000)
  }

  return (
    <footer className="bg-forest-dark text-cream/70">

      {/* Main footer */}
      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">

        {/* Brand */}
        <div className="lg:col-span-2">
          <div className="font-display text-3xl text-cream font-light mb-1">Village Utopia</div>
          <div className="font-body text-[10px] tracking-[0.35em] uppercase text-gold mb-5">Cottages · Goa</div>
          <p className="font-body text-sm leading-relaxed text-cream/50 max-w-xs">
            A one-of-a-kind retreat where Goa's forest meets refined hospitality.
            9 boutique rooms and 4 private cottages on lush grounds with a lotus pond.
          </p>
          <div className="mt-6">
            <div className="font-body text-xs text-cream/40 tracking-wide mb-1">Address</div>
            <address className="not-italic font-body text-sm text-cream/60 leading-relaxed">
              Village Utopia Cottages<br />
              Goa, India — 403001
            </address>
          </div>
        </div>

        {/* Navigation */}
        <div>
          <div className="section-label mb-5">Explore</div>
          <nav className="flex flex-col gap-3">
            {[
              ['/', 'Home'],
              ['/about', 'About Us'],
              ['/rooms', 'Rooms & Cottages'],
              ['/gallery', 'Gallery'],
              ['/contact', 'Contact'],
              ['/policies', 'Cancellation Policy'],
            ].map(([to, label]) => (
              <Link
                key={to}
                to={to}
                className="font-body text-sm text-cream/50 hover:text-gold transition-colors duration-200"
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Contact */}
        <div>
          <div className="section-label mb-5">Get in Touch</div>
          <div className="flex flex-col gap-4">
            <a href="tel:+919876543210"
              className="flex items-center gap-3 font-body text-sm text-cream/50 hover:text-gold transition-colors duration-200">
              <span className="text-base">📞</span>+91 98765 43210
            </a>
            <a href="https://wa.me/919876543210" target="_blank" rel="noreferrer"
              className="flex items-center gap-3 font-body text-sm text-cream/50 hover:text-gold transition-colors duration-200">
              <span className="text-base">💬</span>WhatsApp Us
            </a>
            <a href="mailto:stay@villageutopia.in"
              className="flex items-center gap-3 font-body text-sm text-cream/50 hover:text-gold transition-colors duration-200">
              <span className="text-base">✉️</span>stay@villageutopia.in
            </a>
          </div>
          <div className="mt-8">
            <Link to="/booking" className="btn-gold text-center justify-center w-full">
              Book a Stay
            </Link>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-cream/10">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 py-5 flex flex-col sm:flex-row justify-between items-center gap-3">
          {/* Click 5 times to open admin — invisible to guests */}
          <p
            className="font-body text-[11px] text-cream/50 tracking-wide cursor-default select-none"
            onClick={handleCopyrightClick}
          >
            © {year} Village Utopia Cottages. All rights reserved.
          </p>
          <div className="flex gap-5">
            <Link to="/policies" className="font-body text-[11px] text-cream/30 hover:text-cream/60 transition-colors">
              Cancellation Policy
            </Link>
            <span className="text-cream/20">|</span>
            <Link to="/policies" className="font-body text-[11px] text-cream/30 hover:text-cream/60 transition-colors">
              Privacy Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}