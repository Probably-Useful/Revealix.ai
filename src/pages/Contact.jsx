import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import emailjs from '@emailjs/browser';
import { FiSend, FiCheckCircle, FiAlertCircle, FiMail, FiUser, FiMessageSquare } from 'react-icons/fi';

/* EmailJS config — values come from env vars, never hardcoded */
const EJ_SERVICE  = import.meta.env.VITE_EMAILJS_SERVICE_ID  ?? '';
const EJ_TEMPLATE = import.meta.env.VITE_EMAILJS_TEMPLATE_ID ?? '';
const EJ_KEY      = import.meta.env.VITE_EMAILJS_PUBLIC_KEY  ?? '';

const InputField = ({ label, icon: Icon, error, ...props }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
    <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.06em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
      <Icon size={12} /> {label}
    </label>
    {props.textarea ? (
      <textarea
        {...props}
        rows={5}
        style={{
          background: 'var(--surface-2)', border: `1px solid ${error ? 'rgba(248,113,113,0.5)' : 'var(--border)'}`,
          borderRadius: 12, color: '#fff', padding: '0.85rem 1rem',
          fontSize: '0.9rem', outline: 'none', fontFamily: 'Inter, sans-serif',
          resize: 'vertical', lineHeight: 1.6,
          transition: 'border-color 0.2s',
        }}
        onFocus={e => e.target.style.borderColor = 'rgba(199,54,89,0.5)'}
        onBlur={e => e.target.style.borderColor = error ? 'rgba(248,113,113,0.5)' : 'var(--border)'}
      />
    ) : (
      <input
        {...props}
        style={{
          background: 'var(--surface-2)', border: `1px solid ${error ? 'rgba(248,113,113,0.5)' : 'var(--border)'}`,
          borderRadius: 12, color: '#fff', padding: '0.85rem 1rem',
          fontSize: '0.9rem', outline: 'none', fontFamily: 'Inter, sans-serif',
          transition: 'border-color 0.2s',
        }}
        onFocus={e => e.target.style.borderColor = 'rgba(199,54,89,0.5)'}
        onBlur={e => e.target.style.borderColor = error ? 'rgba(248,113,113,0.5)' : 'var(--border)'}
      />
    )}
    {error && <p style={{ fontSize: '0.72rem', color: '#f87171' }}>{error}</p>}
  </div>
);

const Contact = () => {
  const formRef = useRef(null);
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState('idle'); // idle | sending | success | error

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Name is required.';
    if (!form.email.trim()) e.email = 'Email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Enter a valid email address.';
    if (!form.subject.trim()) e.subject = 'Subject is required.';
    if (!form.message.trim()) e.message = 'Message cannot be empty.';
    else if (form.message.trim().length < 10) e.message = 'Message is too short.';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setStatus('sending');

    try {
      await emailjs.sendForm(EJ_SERVICE, EJ_TEMPLATE, formRef.current, EJ_KEY);
      setStatus('success');
      setForm({ name: '', email: '', subject: '', message: '' });
    } catch {
      setStatus('error');
    }
  };

  const handleChange = (field) => (e) => {
    setForm(f => ({ ...f, [field]: e.target.value }));
    if (errors[field]) setErrors(errs => { const c = { ...errs }; delete c[field]; return c; });
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', padding: '7rem 1.5rem 5rem', position: 'relative', overflow: 'hidden' }}>
      {/* Background grid */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 0,
        backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.025) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
        maskImage: 'radial-gradient(ellipse 70% 60% at 50% 30%, black 30%, transparent 100%)',
        WebkitMaskImage: 'radial-gradient(ellipse 70% 60% at 50% 30%, black 30%, transparent 100%)',
        pointerEvents: 'none',
      }} />
      <div style={{ position: 'absolute', top: '10%', left: '50%', transform: 'translateX(-50%)', width: 600, height: 400, background: 'radial-gradient(circle, rgba(199,54,89,0.07) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />

      <div style={{ maxWidth: 720, margin: '0 auto', position: 'relative', zIndex: 1 }}>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
          <p style={{ fontSize: '0.7rem', color: 'var(--crimson)', letterSpacing: '0.16em', textTransform: 'uppercase', fontWeight: 700, marginBottom: '0.75rem' }}>Get in Touch</p>
          <h1 style={{ fontFamily: '"Red Hat Display", sans-serif', fontWeight: 900, fontSize: 'clamp(2rem, 5vw, 3rem)', color: '#fff', lineHeight: 1.1, marginBottom: '1rem' }}>
            Let's talk
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.95rem', maxWidth: 440, margin: '0 auto', lineHeight: 1.7 }}>
            Have a question, collaboration idea, or feedback? Send a message and we'll get back to you.
          </p>
        </motion.div>

        {/* Card */}
        <motion.div initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '24px', padding: 'clamp(1.75rem, 4vw, 2.75rem)', position: 'relative', overflow: 'hidden' }}>

          <div style={{ position: 'absolute', top: 0, right: 0, width: 250, height: 250, background: 'radial-gradient(circle at 100% 0%, rgba(199,54,89,0.07) 0%, transparent 65%)', pointerEvents: 'none' }} />

          <AnimatePresence mode="wait">
            {status === 'success' ? (
              <motion.div key="success"
                initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', padding: '3rem 1rem', textAlign: 'center' }}>
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 240, delay: 0.1 }}
                  style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4ade80', fontSize: '1.75rem' }}>
                  <FiCheckCircle />
                </motion.div>
                <h2 style={{ fontFamily: '"Red Hat Display", sans-serif', fontWeight: 800, fontSize: '1.4rem', color: '#fff' }}>Message sent!</h2>
                <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.9rem', maxWidth: 320 }}>Thanks for reaching out. We'll get back to you as soon as possible.</p>
                <button onClick={() => setStatus('idle')}
                  style={{ marginTop: '0.5rem', padding: '0.6rem 1.4rem', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 10, color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem', cursor: 'pointer' }}>
                  Send another
                </button>
              </motion.div>
            ) : (
              <motion.form key="form" ref={formRef} onSubmit={handleSubmit} noValidate
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

                {/* Hidden field that routes to your email — never visible to users */}
                <input type="hidden" name="to_email" value="EMAILJS_HANDLES_ROUTING" />

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
                  <InputField label="Your Name" icon={FiUser} name="from_name" type="text"
                    value={form.name} onChange={handleChange('name')}
                    error={errors.name} placeholder="Alex Johnson" />
                  <InputField label="Email Address" icon={FiMail} name="reply_to" type="email"
                    value={form.email} onChange={handleChange('email')}
                    error={errors.email} placeholder="alex@example.com" />
                </div>

                <InputField label="Subject" icon={FiMessageSquare} name="subject" type="text"
                  value={form.subject} onChange={handleChange('subject')}
                  error={errors.subject} placeholder="What's this about?" />

                <InputField label="Message" icon={FiMessageSquare} name="message" textarea
                  value={form.message} onChange={handleChange('message')}
                  error={errors.message} placeholder="Tell us what's on your mind…" />

                {status === 'error' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1rem', background: 'rgba(248,113,113,0.07)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 10, color: '#f87171', fontSize: '0.83rem' }}>
                    <FiAlertCircle /> Failed to send. Check your EmailJS configuration in .env.
                  </div>
                )}

                <motion.button type="submit" disabled={status === 'sending'}
                  whileHover={{ scale: status === 'sending' ? 1 : 1.02 }}
                  whileTap={{ scale: status === 'sending' ? 1 : 0.98 }}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                    padding: '0.9rem 2rem', background: 'var(--crimson)', color: '#fff',
                    borderRadius: 12, fontSize: '0.95rem', fontWeight: 600,
                    boxShadow: '0 0 28px rgba(199,54,89,0.28)',
                    opacity: status === 'sending' ? 0.7 : 1,
                    cursor: status === 'sending' ? 'not-allowed' : 'pointer',
                    transition: 'opacity 0.2s',
                    alignSelf: 'flex-start',
                  }}>
                  {status === 'sending' ? (
                    <>
                      <motion.div style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff' }}
                        animate={{ rotate: 360 }} transition={{ duration: 0.7, repeat: Infinity, ease: 'linear' }} />
                      Sending…
                    </>
                  ) : (
                    <><FiSend /> Send Message</>
                  )}
                </motion.button>
              </motion.form>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
};

export default Contact;
