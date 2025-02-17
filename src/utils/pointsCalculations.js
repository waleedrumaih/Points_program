// src/utils/pointsCalculations.js
export const calculateNeighborhoods = (points) => {
    const differentPointTypes = Object.keys(points).filter(type => points[type] > 0);

    if (differentPointTypes.length >= 4) {
        const minPointCount = Math.min(...differentPointTypes.map(type => points[type]));
        return minPointCount;
    }

    return 0;
};