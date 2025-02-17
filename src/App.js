// src/App.js
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import ExcelForm from './components/ExcelForm';
import TotalPointsPage from './components/TotalPointsPage';
import './App.css';

function App() {
  return (
    <Routes>
      <Route path="/" element={<ExcelForm />} />
      <Route path="/total-points" element={<TotalPointsPage />} />
    </Routes>
  );
}

export default App;