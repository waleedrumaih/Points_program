// src/components/HomePage.js
import React from 'react';
import { useNavigate } from 'react-router-dom';
import './HomePage.css';

const HomePage = () => {
  const navigate = useNavigate();

  return (
    <div className="home-container">
      <div className="home-content animate-bounce-in">
        <h1>نظام إدارة النقاط</h1>
        
        <div className="home-buttons">
          <button 
            className="home-button add-points-button animate-button"
            onClick={() => navigate('/add-points')}
          >
            <span className="home-button-icon">➕</span>
            <span>إضافة نقاط</span>
          </button>
          
          <button 
            className="home-button total-points-button animate-button"
            onClick={() => navigate('/total-points')}
          >
            <span className="home-button-icon">📊</span>
            <span>مجموع النقاط</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default HomePage;