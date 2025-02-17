// src/components/TotalPointsPage.js
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import './TotalPointsPage.css';

const TotalPointsPage = () => {
  const navigate = useNavigate();
  const [sortedNames, setSortedNames] = useState([]);
  const [editingName, setEditingName] = useState(null);
  const [editPoints, setEditPoints] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  const checkForNeighborhood = useCallback((points) => {
    // Count how many types of points have values greater than 0
    const differentPointTypes = Object.keys(points).filter(type => points[type] > 0);

    if (differentPointTypes.length >= 4) {
      // Get the minimum count among all point types
      const minPointCount = Math.min(...differentPointTypes.map(type => points[type]));
      return minPointCount;
    }

    return 0;
  }, []);

  const fetchPoints = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch('http://localhost:8080/api/points');
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`Server responded with status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Data received:', data);

      if (!data.points) {
        console.log('No points in data:', data);
        setSortedNames([]);
        return;
      }

      const pointsByName = data.points.reduce((acc, point) => {
        if (!acc[point.name]) {
          acc[point.name] = {};
        }
        acc[point.name][point.point_type] = point.point_count;
        return acc;
      }, {});
      
      const sorted = Object.entries(pointsByName)
        .map(([name, points]) => {
          const total = Object.values(points).reduce((sum, count) => sum + count, 0);
          const neighborhoodCount = checkForNeighborhood(points);
          return { name, points, total, neighborhoodCount };
        })
        .sort((a, b) => b.total - a.total);

      setSortedNames(sorted);
    } catch (error) {
      console.error('Fetch error:', error);
      alert('حدث خطأ أثناء تحميل النقاط');
    } finally {
      setIsLoading(false);
    }
  }, [checkForNeighborhood]);

  useEffect(() => {
    fetchPoints();
  }, [fetchPoints]);

  const startEditing = (name, points) => {
    setEditingName(name);
    setEditPoints({...points});
  };

  const handlePointChange = (point, value) => {
    const numValue = parseInt(value, 10) || 0;
    setEditPoints(prev => ({
      ...prev,
      [point]: Math.max(0, numValue)
    }));
  };

  const savePointChanges = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/points', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: editingName,
          points: editPoints
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      await fetchPoints();
      setEditingName(null);
    } catch (error) {
      console.error('Error saving points:', error);
      alert('حدث خطأ أثناء حفظ النقاط');
    }
  };

  const clearAllPoints = async () => {
    const confirmClear = window.confirm('هل أنت متأكد من مسح جميع النقاط؟');
    if (confirmClear) {
      try {
        const response = await fetch('/api/points', {
          method: 'DELETE',
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        await fetchPoints();
      } catch (error) {
        console.error('Error clearing points:', error);
        alert('حدث خطأ أثناء مسح النقاط');
      }
    }
  };

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>جاري تحميل النقاط...</p>
      </div>
    );
  }

  return (
    <div className="page-container">
      <button className="back-button" onClick={() => navigate('/')}>
        <span className="back-button-icon">→</span>
        العودة
      </button>

      <div className="total-points-container">
        <div className="points-header">
          <h1>مجموع النقاط</h1>
          {sortedNames.length > 0 && (
            <button onClick={clearAllPoints} className="clear-points-btn">
              مسح جميع النقاط
            </button>
          )}
        </div>

        {sortedNames.length === 0 ? (
          <div className="no-points-message">
            <p>لا توجد نقاط مسجلة حتى الآن</p>
          </div>
        ) : (
          <div className="points-grid">
            {sortedNames.map(({ name, points, total, neighborhoodCount }) => (
              <div key={name} className="points-card">
                <div className="points-card-header">
                  <h2>{name}</h2>
                  <span className="total-points-badge">{total} نقطة</span>
                  {neighborhoodCount > 0 && (
                    <span className="neighborhood-badge">{neighborhoodCount} حي</span>
                  )}
                  <button 
                    onClick={() => startEditing(name, points)}
                    className="edit-points-btn"
                  >
                    تعديل
                  </button>
                </div>
                
                {editingName === name ? (
                  <div className="points-edit-mode">
                    {Object.entries(points).map(([point, count]) => (
                      <div key={point} className="point-edit-item">
                        <span className="point-name">{point}</span>
                        <input 
                          type="number" 
                          value={editPoints[point] || 0}
                          onChange={(e) => handlePointChange(point, e.target.value)}
                          className="point-edit-input"
                          min="0"
                        />
                      </div>
                    ))}
                    <div className="edit-actions">
                      <button 
                        onClick={savePointChanges} 
                        className="save-points-btn"
                      >
                        حفظ التعديلات
                      </button>
                      <button 
                        onClick={() => setEditingName(null)}
                        className="cancel-edit-btn"
                      >
                        إلغاء
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="points-breakdown">
                    {Object.entries(points).map(([point, count]) => (
                      <div key={point} className="point-item">
                        <span className="point-name">{point}</span>
                        <span className="point-count">{count}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="total-summary">
          <h3>ملخص عام</h3>
          <div className="summary-stats">
            <p>عدد الأسماء: {sortedNames.length}</p>
            <p>إجمالي النقاط: {sortedNames.reduce((sum, name) => sum + name.total, 0)}</p>
            <p>عدد الأحياء: {sortedNames.reduce((sum, name) => sum + name.neighborhoodCount, 0)}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TotalPointsPage;