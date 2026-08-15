import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import PageLoader from './components/PageLoader';

const Home = lazy(() => import('./pages/Home'));
const LiveFeed = lazy(() => import('./pages/LiveFeed'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const TextAnalysis = lazy(() => import('./pages/TextAnalysis'));
const Contact = lazy(() => import('./pages/Contact'));

const App = () => {
  return (
    <Router>
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
