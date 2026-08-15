import React from 'react';
import { motion } from 'framer-motion';

const PageLoader = () => {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      background: 'var(--bg)',
      gap: '1.5rem',
    }}>
      <motion.div
        style={{
          display: 'flex',
          gap: '8px',
        }}
      >
        {[0, 1, 2, 3].map((i) => (
          <motion.span
            key={i}
            style={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              background: i === 0 || i === 3 ? 'var(--crimson)' : 'rgba(199,54,89,0.4)',
              display: 'block',
            }}
            animate={{ y: [0, -14, 0] }}
            transition={{
              duration: 0.7,
              repeat: Infinity,
              delay: i * 0.12,
              ease: 'easeInOut',
            }}
          />
        ))}
      </motion.div>
      <motion.p
        style={{ color: 'var(--text-muted)', fontSize: '0.85rem', letterSpacing: '0.1em' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        LOADING
      </motion.p>
    </div>
  );
};

export default PageLoader;
