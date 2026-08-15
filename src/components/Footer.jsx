import React from 'react';
import { NavLink } from 'react-router-dom';

const Footer = () => {
  return (
    <>
      <style>{`
        .ftr-root {
          border-top: 1px solid rgba(255,255,255,0.06);
          background: #0a0a14;
          padding: 2.5rem 1.5rem;
        }
        .ftr-inner {
          max-width: 1100px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 1.25rem;
        }
        .ftr-logo {
          font-family: "Red Hat Display", sans-serif;
          font-weight: 900;
          font-size: 1.05rem;
          color: #fff;
          text-decoration: none;
          letter-spacing: -0.02em;
        }
        .ftr-logo em { font-style: normal; color: #C73659; }
        .ftr-nav {
          display: flex;
          gap: 1.5rem;
          flex-wrap: wrap;
        }
        .ftr-link {
          font-size: 0.82rem;
          color: rgba(255,255,255,0.35);
          text-decoration: none;
          transition: color 0.18s;
        }
        .ftr-link:hover { color: rgba(255,255,255,0.8); }
        .ftr-copy {
          font-size: 0.75rem;
          color: rgba(255,255,255,0.2);
        }
        @media (max-width: 600px) {
          .ftr-inner { flex-direction: column; align-items: flex-start; gap: 1rem; }
          .ftr-nav { gap: 1rem; }
        }
      `}</style>

      <footer className="ftr-root">
        <div className="ftr-inner">
          <NavLink to="/" className="ftr-logo">
            Revealix<em>.ai</em>
          </NavLink>

          <nav className="ftr-nav">
            {[
              { to: '/', label: 'Home' },
              { to: '/live-feed', label: 'Analyze' },
              { to: '/text-analysis', label: 'Text / Voice' },
              { to: '/dashboard', label: 'Dashboard' },
              { to: '/contact', label: 'Contact' },
            ].map(({ to, label }) => (
              <NavLink key={to} to={to} className="ftr-link">{label}</NavLink>
            ))}
          </nav>

          <p className="ftr-copy">© {new Date().getFullYear()} Revealix.ai</p>
        </div>
      </footer>
    </>
  );
};

export default Footer;
