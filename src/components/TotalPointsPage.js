// src/components/TotalPointsPage.js
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import './TotalPointsPage.css';

const TotalPointsPage = () => {
  const navigate = useNavigate();

  const [namePoints, setNamePoints] = useState({});
  const [sortedNames, setSortedNames] = useState([]);
  const [editingName, setEditingName] = useState(null);
  const [editPoints, setEditPoints] = useState({});

  // Use useMemo to memoize the neighborhood points
  const neighborhoodPoints = useMemo(() => 
    ['بيت', 'مسجد', 'ملعب', 'مطعم', 'مكتبة'], 
    []
  );

  // Use useCallback to memoize the function
  const checkForNeighborhood = useCallback((points) => {
    let neighborhoodCount = 0;

    // Check how many حي from houses
    const houseCount = points['بيت'] || 0;
    const houseNeighborhoods = Math.floor(houseCount / 4);
    neighborhoodCount += houseNeighborhoods;

    // Check for حي from different points
    const uniquePoints = Object.keys(points).filter(point => 
      neighborhoodPoints.includes(point) && point !== 'بيت' && points[point] > 0
    );
    
    // Count حي from different point types
    if (uniquePoints.length >= 3) {
      // Find minimum count of these unique points
      const minUniquePointCount = Math.min(
        ...uniquePoints.map(point => points[point])
      );
      
      // Add حي based on the minimum count of unique points
      neighborhoodCount += Math.floor(minUniquePointCount / 2);
    }

    return neighborhoodCount;
  }, [neighborhoodPoints]);

  useEffect(() => {
    // Load points from localStorage
    const savedPoints = localStorage.getItem('namePoints');
    if (savedPoints) {
      const parsedPoints = JSON.parse(savedPoints);
      setNamePoints(parsedPoints);

      // Sort names by total points in descending order
      const sorted = Object.entries(parsedPoints)
        .map(([name, points]) => {
          const total = Object.values(points).reduce((sum, count) => sum + count, 0);
          
          // Calculate number of neighborhoods
          const neighborhoodCount = checkForNeighborhood(points);

          return {
            name,
            points,
            total,
            neighborhoodCount
          };
        })
        .sort((a, b) => b.total - a.total);

      setSortedNames(sorted);
    }
  }, [checkForNeighborhood]);

  const clearAllPoints = () => {
    const confirmClear = window.confirm('هل أنت متأكد من مسح جميع النقاط؟');
    if (confirmClear) {
      localStorage.removeItem('namePoints');
      setNamePoints({});
      setSortedNames([]);
    }
  };

  const startEditing = (name, points) => {
    setEditingName(name);
    setEditPoints({...points});
  };

  const handlePointChange = (point, value) => {
    const numValue = parseInt(value, 10) || 0;
    setEditPoints(prev => ({
      ...prev,
      [point]: numValue
    }));
  };

  const savePointChanges = () => {
    const updatedNamePoints = {...namePoints};
    updatedNamePoints[editingName] = editPoints;
    
    // Save to localStorage
    localStorage.setItem('namePoints', JSON.stringify(updatedNamePoints));
    
    // Update state
    setNamePoints(updatedNamePoints);
    
    // Refresh sorted names
    const sorted = Object.entries(updatedNamePoints)
      .map(([name, points]) => {
        const total = Object.values(points).reduce((sum, count) => sum + count, 0);
        const neighborhoodCount = checkForNeighborhood(points);

        return {
          name,
          points,
          total,
          neighborhoodCount
        };
      })
      .sort((a, b) => b.total - a.total);

    setSortedNames(sorted);
    
    // Exit editing mode
    setEditingName(null);
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

      <div className="total-points-container">
        <div className="points-header">
          <h1>مجموع النقاط</h1>
          {sortedNames.length > 0 && (
            <button 
              onClick={clearAllPoints} 
              className="clear-points-btn"
            >
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