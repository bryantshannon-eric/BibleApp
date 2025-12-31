import React from 'react';
import { HashRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import BibleViewer from './components/BibleViewer';
import Translator from './components/Translator';
import { Book, Languages } from 'lucide-react';

function Navigation() {
  const location = useLocation();
  
  return (
    <nav className="bg-white shadow-md mb-6">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex space-x-8">
            <Link
              to="/"
              className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                location.pathname === '/'
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Book className="mr-2" size={18} />
              Bible Viewer
            </Link>
            <Link
              to="/translator"
              className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                location.pathname === '/translator'
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Languages className="mr-2" size={18} />
              Translator
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}

function App() {
  return (
    <Router>
      <div className="min-h-screen">
        <Navigation />
        <Routes>
          <Route path="/" element={<BibleViewer />} />
          <Route path="/translator" element={<Translator />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
