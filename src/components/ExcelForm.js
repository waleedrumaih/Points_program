// src/components/ExcelForm.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import './ExcelForm.css';

const ExcelForm = () => {
  const navigate = useNavigate();
  const [names, setNames] = useState([]);
  const [groups, setGroups] = useState([]);
  const [selectedName, setSelectedName] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [selectedOptions, setSelectedOptions] = useState([]);

  useEffect(() => {
    const loadExcelData = async () => {
      try {
        const response = await fetch('/names.xlsx');
        const blob = await response.blob();
        const arrayBuffer = await new Response(blob).arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const data = XLSX.utils.sheet_to_json(worksheet, { 
          header: 'A',
          raw: false,
          defval: ''
        });
        
        const processedData = data.slice(1).map(row => ({
          name: row.A,
          group: row.C || 'Ungrouped'
        }));
        
        const groupedNames = {};
        const uniqueGroups = new Set();
        
        processedData.forEach(row => {
          if (row.name) {
            if (!groupedNames[row.group]) {
              groupedNames[row.group] = [];
            }
            groupedNames[row.group].push(row.name);
            uniqueGroups.add(row.group);
          }
        });
        
        if (Object.keys(groupedNames).length === 0) {
          setError('No valid data found in Excel file.');
          return;
        }
        
        // Sort groups and names within groups
        const sortedGroups = Array.from(uniqueGroups).sort();
        const sortedGroupedNames = {};
        sortedGroups.forEach(group => {
          sortedGroupedNames[group] = groupedNames[group].sort();
        });
        
        setNames(sortedGroupedNames);
        setGroups(sortedGroups);
        setError('');
        
      } catch (error) {
        console.error('Error details:', error);
        setError('Failed to load contact data. Please try again.');
      }
    };

    loadExcelData();
  }, []);

  const handleGroupChange = (e) => {
    setSelectedGroup(e.target.value);
    setSelectedName('');
  };

  const handleNameChange = (e) => {
    setSelectedName(e.target.value);
  };

  const handleOptionToggle = (option) => {
    setSelectedOptions(prev => {
      if (prev.includes(option)) {
        return prev.filter(item => item !== option);
      } else {
        return [...prev, option];
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Load existing points from localStorage
    const savedPoints = JSON.parse(localStorage.getItem('namePoints') || '{}');
    
    // Add or update points for the selected name
    if (!savedPoints[selectedName]) {
      savedPoints[selectedName] = {};
    }
    
    // Add points for each selected option
    selectedOptions.forEach(option => {
      savedPoints[selectedName][option] = 
        (savedPoints[selectedName][option] || 0) + 1;
    });
    
    // Save updated points to localStorage
    localStorage.setItem('namePoints', JSON.stringify(savedPoints));
    
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    alert(`تم التقديم بنجاح!\nالخيارات المختارة: ${selectedOptions.join(', ')}`);
    
    setSelectedName('');
    setSelectedGroup('');
    setSelectedOptions([]);
    setIsSubmitting(false);
  };

  return (
    <div className="page-container">
      <button 
        className="back-button" 
        onClick={() => navigate('/')}
      >
        <span className="back-button-icon">→</span>
        العودة
      </button>

      <div className="form-container">
        <div className="form-header">
          <h2>البحث عن جهات الاتصال</h2>
          <p>اختر مجموعة واسم للتواصل</p>
        </div>
  
        {error && (
          <div className="error-box">
            <span className="error-icon">⚠️</span>
            <span>{error}</span>
          </div>
        )}
  
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>المجموعة</label>
            <div className="select-wrapper">
              <select
                value={selectedGroup}
                onChange={handleGroupChange}
                required
                dir="rtl"
              >
                <option value="" disabled>اختر مجموعة</option>
                {groups.map(group => (
                  <option key={group} value={group}>{group}</option>
                ))}
              </select>
            </div>
          </div>

          {selectedGroup && (
            <div className="form-group">
              <label>الاسم</label>
              <div className="select-wrapper">
                <select
                  value={selectedName}
                  onChange={handleNameChange}
                  required
                  disabled={!selectedGroup}
                  dir="rtl"
                >
                  <option value="" disabled>اختر جهة اتصال</option>
                  {names[selectedGroup]?.map(name => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <div className="form-group">
            <label>اختر الخيارات</label>
            <div className="button-group">
              <button
                type="button"
                className={`toggle-button ${selectedOptions.includes('بيت') ? 'active' : ''}`}
                onClick={() => handleOptionToggle('بيت')}
              >
                بيت
              </button>
              <button
                type="button"
                className={`toggle-button ${selectedOptions.includes('مسجد') ? 'active' : ''}`}
                onClick={() => handleOptionToggle('مسجد')}
              >
                مسجد
              </button>
              <button
                type="button"
                className={`toggle-button ${selectedOptions.includes('ملعب') ? 'active' : ''}`}
                onClick={() => handleOptionToggle('ملعب')}
              >
                ملعب
              </button>
              <button
                type="button"
                className={`toggle-button ${selectedOptions.includes('مطعم') ? 'active' : ''}`}
                onClick={() => handleOptionToggle('مطعم')}
              >
                مطعم
              </button>
              <button
                type="button"
                className={`toggle-button ${selectedOptions.includes('مكتبة') ? 'active' : ''}`}
                onClick={() => handleOptionToggle('مكتبة')}
              >
                مكتبة
              </button>
            </div>
            {selectedOptions.length > 0 && (
              <div className="selected-options">
                المحدد: {selectedOptions.join(', ')}
              </div>
            )}
          </div>
  
          <button
            type="submit"
            className={`submit-button ${isSubmitting ? 'loading' : ''}`}
            disabled={!selectedName || selectedOptions.length === 0 || isSubmitting}
          >
            <span>{isSubmitting ? 'جاري المعالجة...' : 'إضافة النقاط'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};

export default ExcelForm;