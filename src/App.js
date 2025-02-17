// src/App.js
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import HomePage from './components/HomePage';
import ExcelForm from './components/ExcelForm';
import TotalPointsPage from './components/TotalPointsPage';
import './App.css';

function App() {
  return (
    <div className="app">
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/add-points" element={<ExcelForm />} />
        <Route path="/total-points" element={<TotalPointsPage />} />
      </Routes>
    </div>
  );
}

export default App;