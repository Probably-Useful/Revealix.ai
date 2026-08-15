import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FaBars, FaTimes } from 'react-icons/fa';

const LINKS = [
  { to: '/', label: 'Home' },
  { to: '/live-feed', label: 'Analyze' },
  { to: '/text-analysis', label: 'Text / Voice' },
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/contact', label: 'Contact' },
];

const Header = () => {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => { setOpen(false); }, [pathname]);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  return (
    <>
      <style>{`
        /* ── fixed full-width bar, pill is the inner div ── */
        .hdr-outer {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 1000;
          display: flex;
          justify-content: center;
          padding: 14px 16px 0;
          pointer-events: none;        /* let clicks pass through outer */
        }
        .hdr-pill {
          pointer-events: all;         /* pill is clickable */
          width: 100%;
          max-width: 1100px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 1.5rem;
          height: 52px;
          border-radius: 16px;
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          background: rgba(12, 12, 22, 0.75);
          border: 1px solid rgba(255,255,255,0.08);
          transition: background 0.3s, box-shadow 0.3s;
        }
        .hdr-pill.scrolled {
          background: rgba(12, 12, 22, 0.97);
          box-shadow: 0 6px 40px rgba(0,0,0,0.55);
          border-color: rgba(255,255,255,0.11);
        }

        /* ── Logo ── */
        .hdr-logo {
          font-family: "Red Hat Display", sans-serif;
          font-weight: 900;
          font-size: 1.2rem;
          color: #fff;
          text-decoration: none;
          letter-spacing: -0.02em;
          flex-shrink: 0;
          line-height: 1;
        }
        .hdr-logo em { font-style: normal; color: #C73659; }

        /* ── Desktop nav ── */
        .hdr-nav {
          display: flex;
          align-items: center;
          gap: 2px;
        }
        .hdr-link {
          font-size: 0.875rem;
          font-weight: 500;
          color: rgba(255,255,255,0.5);
          text-decoration: none;
          padding: 0.4rem 0.9rem;
          border-radius: 10px;
          border: 1px solid transparent;
          white-space: nowrap;
          transition: color 0.18s, background 0.18s, border-color 0.18s;
        }
        .hdr-link:hover {
          color: #fff;
          background: rgba(255,255,255,0.06);
        }
        .hdr-link.active {
          color: #fff;
          background: rgba(199,54,89,0.15);
          border-color: rgba(199,54,89,0.35);
        }

        /* ── Hamburger (hidden on desktop) ── */
        .hdr-burger {
          display: none;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          background: rgba(255,255,255,0.07);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 9px;
          color: #fff;
          font-size: 0.95rem;
          cursor: pointer;
          flex-shrink: 0;
          transition: background 0.18s;
        }
        .hdr-burger:hover { background: rgba(255,255,255,0.13); }

        /* ── Mobile overlay ── */
        .hdr-overlay {
          position: fixed;
          inset: 0;
          z-index: 9999;
          background: rgba(8, 8, 16, 0.97);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: flex-start;
          padding: 3rem 2.5rem;
        }
        .hdr-close {
          position: absolute;
          top: 1.25rem;
          right: 1.25rem;
          width: 44px;
          height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255,255,255,0.07);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 12px;
          color: #fff;
          font-size: 1.1rem;
          cursor: pointer;
        }
        .hdr-m-label {
          font-size: 0.65rem;
          color: #C73659;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          font-weight: 700;
          margin-bottom: 2rem;
        }
        .hdr-m-link {
          font-family: "Red Hat Display", sans-serif;
          font-weight: 900;
          font-size: clamp(2rem, 9vw, 3rem);
          color: rgba(255,255,255,0.7);
          text-decoration: none;
          letter-spacing: -0.03em;
          line-height: 1.25;
          display: block;
          padding: 0.25rem 0;
          transition: color 0.18s;
        }
        .hdr-m-link:hover,
        .hdr-m-link.active { color: #C73659; }
        .hdr-branding {
          position: absolute;
          bottom: 2rem;
          left: 2.5rem;
          font-family: "Red Hat Display", sans-serif;
          font-weight: 900;
          font-size: 0.8rem;
          color: rgba(255,255,255,0.15);
        }
        .hdr-branding em { font-style: normal; color: #C73659; }

        /* ── Responsive ── */
        @media (max-width: 820px) {
          .hdr-nav    { display: none; }
          .hdr-burger { display: flex; }
        }
        @media (min-width: 821px) {
          .hdr-burger { display: none; }
        }
        @media (max-width: 480px) {
          .hdr-outer  { padding: 0; }
          .hdr-pill   {
            border-radius: 0 0 16px 16px;
            border-top: none;
          }
        }
      `}</style>

      {/* ── Pill bar ── */}
      <div className="hdr-outer">
        <motion.div
          className={`hdr-pill${scrolled ? ' scrolled' : ''}`}
          initial={{ y: -80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Logo */}
          <NavLink to="/" className="hdr-logo">
            Revealix<em>.ai</em>
          </NavLink>

          {/* Desktop links */}
          <nav className="hdr-nav">
            {LINKS.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) => `hdr-link${isActive ? ' active' : ''}`}
              >
                {label}
              </NavLink>
            ))}
          </nav>

          {/* Hamburger */}
          <button className="hdr-burger" onClick={() => setOpen(true)} aria-label="Open menu">
            <FaBars />
          </button>
        </motion.div>
      </div>

      {/* ── Mobile overlay ── */}
      <AnimatePresence>
        {open && (
          <motion.div
            className="hdr-overlay"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            <button className="hdr-close" onClick={() => setOpen(false)} aria-label="Close menu">
              <FaTimes />
            </button>

            <p className="hdr-m-label">Navigation</p>

            {LINKS.map(({ to, label }, i) => (
              <motion.div
                key={to}
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.07, duration: 0.35 }}
              >
                <NavLink
                  to={to}
                  end={to === '/'}
                  className={({ isActive }) => `hdr-m-link${isActive ? ' active' : ''}`}
                >
                  {label}
                </NavLink>
              </motion.div>
            ))}

            <div className="hdr-branding">
              Revealix<em>.ai</em>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Header;
