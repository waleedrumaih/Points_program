import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import './ExcelForm.css';
import { calculateNeighborhoods } from '../utils/pointsCalculations';

const ExcelForm = () => {
  const navigate = useNavigate();
  const [names, setNames] = useState([]);
  const [groups, setGroups] = useState([]);
  const [selectedName, setSelectedName] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [selectedOptions, setSelectedOptions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [submitStatus, setSubmitStatus] = useState('');
  const [statusType, setStatusType] = useState('');

  const fetchExistingPoints = useCallback(async () => {
    try {
      const response = await fetch(`/api/points`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    } catch (error) {
      console.error('Error fetching existing points:', error);
      return { points: [] };
    }
  }, []);

  const savePoints = useCallback(async (name, points) => {
    try {
      const response = await fetch(`/api/points`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, points })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    } catch (error) {
      console.error('Error saving points:', error);
      throw error;
    }
  }, []);

  const processExcelData = useCallback((data) => {
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
    
    const sortedGroups = Array.from(uniqueGroups).sort();
    const sortedGroupedNames = {};
    
    sortedGroups.forEach(group => {
      sortedGroupedNames[group] = groupedNames[group].sort();
    });

    return { sortedGroupedNames, sortedGroups };
  }, []);

  const loadExcelData = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Log current environment details
      console.log('Current environment:', {
        origin: window.location.origin,
        pathname: window.location.pathname
      });
  
      // Multiple fetch attempts
      const fetchAttempts = [
        '/names.xlsx',
        'names.xlsx',
        `${window.location.origin}/names.xlsx`,
        `${window.location.origin}/public/names.xlsx`
      ];
  
      let arrayBuffer;
      for (const url of fetchAttempts) {
        try {
          console.log(`Attempting to fetch from: ${url}`);
          const response = await fetch(url);
          
          if (!response.ok) {
            console.warn(`Fetch failed for ${url}. Status: ${response.status}`);
            continue;
          }
  
          arrayBuffer = await response.arrayBuffer();
          break;
        } catch (fetchError) {
          console.error(`Error fetching from ${url}:`, fetchError);
        }
      }
  
      if (!arrayBuffer) {
        throw new Error('Could not fetch Excel file from any attempted URL');
      }
  
      // Read the workbook
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      
      // Get the first sheet
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      
      // Convert to JSON
      const data = XLSX.utils.sheet_to_json(worksheet, { 
        header: 'A',
        raw: false,
        defval: ''
      });
      
      console.log('Parsed Excel data:', data);
      
      const { sortedGroupedNames, sortedGroups } = processExcelData(data);
      
      if (sortedGroups.length === 0) {
        throw new Error('No valid data found in Excel file.');
      }
      
      setNames(sortedGroupedNames);
      setGroups(sortedGroups);
      setError('');
    } catch (error) {
      console.error('Excel Loading Comprehensive Error:', error);
      setError(`Failed to load contact data: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  }, [processExcelData]);

  useEffect(() => {
    loadExcelData();
  }, [loadExcelData]);

  const handleGroupChange = (e) => {
    setSelectedGroup(e.target.value);
    setSelectedName('');
    setSelectedOptions([]);
    setSubmitStatus('');
  };

  const handleNameChange = (e) => {
    setSelectedName(e.target.value);
    setSelectedOptions([]);
    setSubmitStatus('');
  };

  const handleOptionToggle = (option) => {
    setSubmitStatus('');
    setSelectedOptions(prev => {
      if (prev.includes(option)) {
        return prev.filter(item => item !== option);
      }
      return [...prev, option];
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedName || selectedOptions.length === 0) {
        return;
    }

    setIsSubmitting(true);
    setError('');
    setSubmitStatus('');

    try {
        const { points: existingPoints } = await fetchExistingPoints();
        
        let currentPoints = {};
        existingPoints?.forEach(point => {
            if (point.name === selectedName) {
                currentPoints[point.point_type] = point.point_count;
            }
        });

        selectedOptions.forEach(option => {
            currentPoints[option] = (currentPoints[option] || 0) + 1;
        });

        await savePoints(selectedName, currentPoints);

        const neighborhoodCount = calculateNeighborhoods(currentPoints);
        const neighborhoodMessage = neighborhoodCount > 0 
            ? ` وتم تشكيل ${neighborhoodCount} حي` 
            : '';

        setStatusType('success');
        setSubmitStatus(`تم تحديث النقاط بنجاح لـ ${selectedName}. الخيارات المحددة: ${selectedOptions.join(', ')}${neighborhoodMessage}`);
        
        setTimeout(() => {
            setSelectedName('');
            setSelectedGroup('');
            setSelectedOptions([]);
            setSubmitStatus('');
        }, 3000);

    } catch (error) {
        console.error('Error saving points:', error);
        setStatusType('error');
        setSubmitStatus('حدث خطأ أثناء حفظ النقاط. الرجاء المحاولة مرة أخرى.');
    } finally {
        setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>جاري تحميل البيانات...</p>
      </div>
    );
  }

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
              {['بيت', 'مسجد', 'ملعب', 'مطعم', 'مكتبة'].map((option) => (
                <button
                  key={option}
                  type="button"
                  className={`toggle-button ${selectedOptions.includes(option) ? 'active' : ''}`}
                  onClick={() => handleOptionToggle(option)}
                >
                  {option}
                </button>
              ))}
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

        {submitStatus && (
          <div className={`status-message ${statusType}`}>
            <span className="status-icon">
              {statusType === 'success' ? '✓' : '⚠️'}
            </span>
            <p>{submitStatus}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExcelForm;