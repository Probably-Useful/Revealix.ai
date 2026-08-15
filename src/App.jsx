import React, { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import PageLoader from './components/PageLoader';

const Home = lazy(() => import('./pages/Home'));
const LiveFeed = lazy(() => import('./pages/LiveFeed'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const TextAnalysis = lazy(() => import('./pages/TextAnalysis'));
const Contact = lazy(() => import('./pages/Contact'));

// Scroll to top on every route change
const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
};

const App = () => {
  return (
    <Router>
      <ScrollToTop />
      <Header />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/live-feed" element={<LiveFeed />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/text-analysis" element={<TextAnalysis />} />
          <Route path="/contact" element={<Contact />} />
        </Routes>
      </Suspense>
      <Footer />
    </Router>
  );
};

export default App;
