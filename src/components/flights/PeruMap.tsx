import { useState, useEffect } from 'react';
import { motion } from 'motion/react';

interface City {
  name: string;
  department: string;
  lon: number;
  lat: number;
  color: string;
  isHome?: boolean;
}

interface PeruMapProps {
  visits: Array<{
    city: string;
    department: string;
    highlights: string[];
  }>;
}

interface GeoJSONFeature {
  type: string;
  properties: {
    NOMBDEP: string;
    [key: string]: any;
  };
  geometry: {
    type: string;
    coordinates: number[][][] | number[][][][];
  };
}

interface GeoJSON {
  type: string;
  features: GeoJSONFeature[];
}

// Cities with real coordinates
const peruCities: Record<string, City> = {
  'Lima': { name: 'Lima', department: 'LIMA', lon: -77.0428, lat: -12.0464, color: 'yellow', isHome: true },
  'Cusco': { name: 'Cusco', department: 'CUSCO', lon: -71.9675, lat: -13.5319, color: 'orange' },
  'Huaraz': { name: 'Huaraz', department: 'ANCASH', lon: -77.5286, lat: -9.5253, color: 'cyan' },
  'Huancayo': { name: 'Huancayo', department: 'JUNIN', lon: -75.2137, lat: -12.0653, color: 'magenta' },
  'Paracas': { name: 'Paracas', department: 'ICA', lon: -76.2508, lat: -13.8344, color: 'blue' },
};

// Peru bounds
const PERU_BOUNDS = {
  minLon: -81.5,
  maxLon: -68.5,
  minLat: -18.5,
  maxLat: -0.0,
};

const PROJECTION_CONFIG = {
  width: 400,
  height: 600,
  padding: 30,
};

// Project lat/lon to SVG coordinates
function projectCity(lon: number, lat: number): { x: number; y: number } {
  const { width, height, padding } = PROJECTION_CONFIG;
  const { minLon, maxLon, minLat, maxLat } = PERU_BOUNDS;

  const scale = Math.min(
    (width - 2 * padding) / (maxLon - minLon),
    (height - 2 * padding) / (maxLat - minLat)
  );

  const centerX = width / 2;
  const centerY = height / 2;
  const lonCenter = (minLon + maxLon) / 2;
  const latCenter = (minLat + maxLat) / 2;

  const x = centerX + (lon - lonCenter) * scale;
  const y = centerY - (lat - latCenter) * scale;

  return { x, y };
}

export default function PeruMap({ visits }: PeruMapProps) {
  const [geoData, setGeoData] = useState<GeoJSON | null>(null);
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [hoveredDept, setHoveredDept] = useState<string | null>(null);

  useEffect(() => {
    fetch('/peru.geojson')
      .then(res => res.json())
      .then(data => setGeoData(data))
      .catch(err => console.error('Failed to load Peru GeoJSON:', err));
  }, []);

  // Convert GeoJSON to SVG path
  const geoJsonToSvgPath = (coordinates: number[][][] | number[][][][]): string => {
    const isMultiPolygon = Array.isArray(coordinates[0][0][0]);
    const polygons = isMultiPolygon ? (coordinates as number[][][][]) : [coordinates as number[][][]];

    return polygons.map(polygon => {
      return polygon.map(ring => {
        return ring.map((coord, i) => {
          const [lon, lat] = coord;
          const projected = projectCity(lon, lat);
          return `${i === 0 ? 'M' : 'L'} ${projected.x.toFixed(2)} ${projected.y.toFixed(2)}`;
        }).join(' ') + ' Z';
      }).join(' ');
    }).join(' ');
  };

  // Check if department is visited
  const visitedDepartments = new Set(
    Object.values(peruCities).map(city => city.department)
  );

  // Project cities
  const projectedCities = Object.entries(peruCities).map(([key, city]) => ({
    ...city,
    ...projectCity(city.lon, city.lat),
  }));

  const selectedVisit = selectedCity
    ? visits.find(v => v.city === selectedCity)
    : null;

  return (
    <div className="relative w-full">
      {/* Map Container */}
      <div className="relative bg-flexoki-bg-2 rounded-lg border border-flexoki-ui overflow-hidden">
        <svg
          viewBox="0 0 400 600"
          className="w-full h-auto"
          style={{ maxHeight: '600px' }}
        >
          {/* Peru departments */}
          {geoData && geoData.features.map((feature, i) => {
            const deptName = feature.properties.NOMBDEP;
            const isVisited = visitedDepartments.has(deptName);
            const isHovered = hoveredDept === deptName;

            return (
              <motion.path
                key={i}
                d={geoJsonToSvgPath(feature.geometry.coordinates)}
                fill={isVisited ? 'var(--color-flexoki-cyan)' : 'var(--color-flexoki-ui-2)'}
                stroke="var(--color-flexoki-tx-3)"
                strokeWidth="1.5"
                opacity={isVisited ? 0.6 : 0.3}
                initial={{ opacity: 0 }}
                animate={{ opacity: isVisited ? 0.6 : 0.3 }}
                transition={{ duration: 0.5, delay: i * 0.02 }}
                onMouseEnter={() => setHoveredDept(deptName)}
                onMouseLeave={() => setHoveredDept(null)}
                className="transition-all duration-300"
                style={{
                  cursor: isVisited ? 'pointer' : 'default',
                  filter: isHovered && isVisited ? 'brightness(1.2)' : 'none',
                }}
              />
            );
          })}

          {/* City pins */}
          {projectedCities.map((city) => {
            const isActive = hoveredDept === city.department || selectedCity === city.name;

            return (
              <motion.g
                key={city.name}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.5, type: 'spring' }}
                onMouseEnter={() => setHoveredDept(city.department)}
                onMouseLeave={() => setHoveredDept(null)}
                onClick={() => setSelectedCity(selectedCity === city.name ? null : city.name)}
                style={{ cursor: 'pointer' }}
              >
                {/* Pin Glow */}
                {isActive && (
                  <motion.circle
                    cx={city.x}
                    cy={city.y}
                    r="15"
                    fill={`var(--color-flexoki-${city.color})`}
                    opacity="0.3"
                    animate={{ scale: [1, 1.3, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                )}

                {/* Pin - only circle for non-home, star for home */}
                {!city.isHome ? (
                  <circle
                    cx={city.x}
                    cy={city.y}
                    r={isActive ? '7' : '5'}
                    fill={`var(--color-flexoki-${city.color})`}
                    stroke="var(--color-flexoki-bg)"
                    strokeWidth="2"
                    className="transition-all duration-300"
                  />
                ) : (
                  <motion.path
                    d={`M ${city.x} ${city.y - 12} L ${city.x + 3} ${city.y - 5} L ${city.x + 10} ${city.y - 5} L ${city.x + 5} ${city.y} L ${city.x + 7} ${city.y + 6} L ${city.x} ${city.y + 2} L ${city.x - 7} ${city.y + 6} L ${city.x - 5} ${city.y} L ${city.x - 10} ${city.y - 5} L ${city.x - 3} ${city.y - 5} Z`}
                    fill={`var(--color-flexoki-${city.color})`}
                    stroke="var(--color-flexoki-bg)"
                    strokeWidth="2"
                  />
                )}

                {/* City Label */}
                <text
                  x={city.x}
                  y={city.y - (city.isHome ? 18 : 12)}
                  textAnchor="middle"
                  fill="var(--color-flexoki-tx)"
                  fontSize="10"
                  fontFamily="var(--font-sans)"
                  fontWeight={isActive ? '600' : '400'}
                  opacity={isActive ? 1 : 0.8}
                  className="transition-all duration-300"
                >
                  {city.name}
                </text>
              </motion.g>
            );
          })}
        </svg>

        {/* Selected City Details */}
        {selectedVisit && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-4 left-4 right-4 bg-flexoki-bg border border-flexoki-ui rounded-lg p-4"
            style={{ backdropFilter: 'blur(8px)' }}
          >
            <div className="flex items-start justify-between mb-2">
              <div>
                <h4 className="font-medium text-flexoki-tx">{selectedCity}</h4>
                <p className="text-xs text-flexoki-tx-3">{selectedVisit.department}</p>
              </div>
              <button
                onClick={() => setSelectedCity(null)}
                className="text-flexoki-tx-3 hover:text-flexoki-tx"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex flex-col" style={{ gap: '0.25rem' }}>
              {selectedVisit.highlights.map((highlight, i) => (
                <div key={i} className="flex items-center text-xs text-flexoki-tx-3" style={{ gap: '0.5rem' }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span>{highlight}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* Legend */}
      <div className="mt-4 flex items-center justify-center flex-wrap" style={{ gap: '1rem' }}>
        <div className="flex items-center text-xs text-flexoki-tx-3" style={{ gap: '0.5rem' }}>
          <div className="w-4 h-3 bg-flexoki-cyan opacity-60 border border-flexoki-tx-3" />
          <span>Visitado</span>
        </div>
        <div className="flex items-center text-xs text-flexoki-tx-3" style={{ gap: '0.5rem' }}>
          <div className="w-4 h-3 bg-flexoki-ui-2 opacity-30 border border-flexoki-tx-3" />
          <span>No visitado</span>
        </div>
        <div className="flex items-center text-xs text-flexoki-tx-3" style={{ gap: '0.5rem' }}>
          <div className="w-3 h-3 rounded-full bg-flexoki-yellow border-2 border-flexoki-bg" />
          <span>Casa</span>
        </div>
      </div>
    </div>
  );
}
