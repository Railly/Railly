import { motion } from "motion/react";
import { useEffect, useState } from "react";
import {
	cityCoordinates,
	projectCity,
	southAmericaBounds,
} from "../../utils/geoUtils";

interface City {
	name: string;
	country: string;
	x: number;
	y: number;
	color: string;
	isHome?: boolean;
}

interface FlightMapProps {
	flights: Array<{
		to: string;
		color: string;
		purpose: string;
		date: string;
		highlights: string[];
	}>;
}

interface GeoJSONFeature {
	type: string;
	geometry: {
		type: string;
		coordinates: number[][][] | number[][][][];
	};
	properties: {
		name: string;
	};
}

interface GeoJSON {
	type: string;
	features: GeoJSONFeature[];
}

// Projection config
const PROJECTION_CONFIG = {
	width: 500,
	height: 700,
	padding: 50,
};

// Project cities to SVG space using real coordinates
const projectCities = (): Record<string, City> => {
	const cityColorMap: Record<string, { color: string; isHome?: boolean }> = {
		"Lima, Peru": { color: "yellow", isHome: true },
		"Buenos Aires, Argentina": { color: "blue" },
		"Bariloche, Argentina": { color: "purple" },
		"Iguazú, Argentina": { color: "green" },
		"Santiago, Chile": { color: "magenta" },
		"Cusco, Peru": { color: "orange" },
		"Bogotá, Colombia": { color: "cyan" },
	};

	const cities: Record<string, City> = {};

	Object.entries(cityCoordinates).forEach(([key, coords]) => {
		const projected = projectCity(
			coords.lon,
			coords.lat,
			southAmericaBounds,
			PROJECTION_CONFIG,
		);
		const [cityName, country] = key.split(", ");
		const cityData = cityColorMap[key] || { color: "blue" };

		cities[key] = {
			name: cityName,
			country,
			x: projected.x,
			y: projected.y,
			color: cityData.color,
			isHome: cityData.isHome,
		};
	});

	return cities;
};

const cities = projectCities();

export default function FlightMap({ flights }: FlightMapProps) {
	const [selectedCity, setSelectedCity] = useState<string | null>(null);
	const [hoveredCity, setHoveredCity] = useState<string | null>(null);
	const [geoData, setGeoData] = useState<GeoJSON | null>(null);

	const homeCity = cities["Lima, Peru"];

	useEffect(() => {
		fetch("/south-ameriga.geojson")
			.then((res) => res.json())
			.then((data) => setGeoData(data))
			.catch((err) => console.error("Failed to load GeoJSON:", err));
	}, []);

	// Convert GeoJSON coordinates to SVG path
	const geoJsonToSvgPath = (
		coordinates: number[][][] | number[][][][],
	): string => {
		const isMultiPolygon = Array.isArray(coordinates[0][0][0]);
		const polygons = isMultiPolygon
			? (coordinates as number[][][][])
			: [coordinates as number[][][]];

		return polygons
			.map((polygon) => {
				return polygon
					.map((ring) => {
						return (
							ring
								.map((coord, i) => {
									const [lon, lat] = coord;
									const projected = projectCity(
										lon,
										lat,
										southAmericaBounds,
										PROJECTION_CONFIG,
									);
									return `${i === 0 ? "M" : "L"} ${projected.x.toFixed(2)} ${projected.y.toFixed(2)}`;
								})
								.join(" ") + " Z"
						);
					})
					.join(" ");
			})
			.join(" ");
	};

	// Generate curved path between two points
	const generateArcPath = (from: City, to: City) => {
		const midX = (from.x + to.x) / 2;
		const midY = (from.y + to.y) / 2 - 50; // Arc upward

		return `M ${from.x} ${from.y} Q ${midX} ${midY} ${to.x} ${to.y}`;
	};

	const selectedFlight = selectedCity
		? flights.find((f) => f.to === selectedCity)
		: null;

	return (
		<div className="relative w-full">
			{/* Map Container */}
			<div className="relative bg-flexoki-bg-2 rounded-lg border border-flexoki-ui overflow-hidden">
				<svg
					viewBox="0 0 500 700"
					className="w-full h-auto"
					style={{ maxHeight: "700px" }}
				>
					{/* Accurate South America from GeoJSON */}
					{geoData && (
						<g opacity="0.5">
							{geoData.features.map((feature, i) => (
								<path
									key={i}
									d={geoJsonToSvgPath(feature.geometry.coordinates)}
									fill="var(--color-flexoki-ui-2)"
									stroke="var(--color-flexoki-tx-3)"
									strokeWidth="2"
									opacity="0.6"
								/>
							))}
						</g>
					)}

					{/* Flight Arcs */}
					{flights.map((flight, index) => {
						const toCity = cities[flight.to];
						if (!toCity) return null;

						const isActive =
							hoveredCity === flight.to || selectedCity === flight.to;

						return (
							<motion.g
								key={flight.to}
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								transition={{ delay: index * 0.1 + 0.5 }}
							>
								{/* Arc Path */}
								<motion.path
									d={generateArcPath(homeCity, toCity)}
									stroke={`var(--color-flexoki-${flight.color})`}
									strokeWidth={isActive ? "3" : "2"}
									fill="none"
									strokeDasharray="5,5"
									opacity={isActive ? 1 : 0.4}
									initial={{ pathLength: 0 }}
									animate={{ pathLength: 1 }}
									transition={{ duration: 1.5, delay: index * 0.1 + 0.5 }}
									className="transition-all duration-300"
								/>

								{/* Animated Dot along path */}
								{isActive && (
									<motion.circle
										r="4"
										fill={`var(--color-flexoki-${flight.color})`}
										initial={{ offsetDistance: "0%" }}
										animate={{ offsetDistance: "100%" }}
										transition={{
											duration: 2,
											repeat: Infinity,
											ease: "linear",
										}}
										style={{
											offsetPath: `path('${generateArcPath(homeCity, toCity)}')`,
										}}
									/>
								)}
							</motion.g>
						);
					})}

					{/* City Pins */}
					{Object.entries(cities).map(([cityKey, city]) => {
						const isVisited =
							flights.some((f) => f.to === cityKey) || city.isHome;
						if (!isVisited) return null;

						const isActive =
							hoveredCity === cityKey || selectedCity === cityKey;
						const flight = flights.find((f) => f.to === cityKey);

						return (
							<motion.g
								key={cityKey}
								initial={{ scale: 0 }}
								animate={{ scale: 1 }}
								transition={{ delay: 0.8, type: "spring" }}
								onMouseEnter={() => setHoveredCity(cityKey)}
								onMouseLeave={() => setHoveredCity(null)}
								onClick={() =>
									setSelectedCity(selectedCity === cityKey ? null : cityKey)
								}
								style={{ cursor: "pointer" }}
							>
								{/* Pin Glow */}
								{isActive && (
									<motion.circle
										cx={city.x}
										cy={city.y}
										r="20"
										fill={`var(--color-flexoki-${city.color})`}
										opacity="0.2"
										animate={{ scale: [1, 1.2, 1] }}
										transition={{ duration: 2, repeat: Infinity }}
									/>
								)}

								{/* Pin Circle - only show if NOT home */}
								{!city.isHome && (
									<circle
										cx={city.x}
										cy={city.y}
										r={isActive ? "8" : "6"}
										fill={`var(--color-flexoki-${city.color})`}
										stroke="var(--color-flexoki-bg)"
										strokeWidth="2"
										className="transition-all duration-300"
									/>
								)}

								{/* Home Star - bigger and more prominent */}
								{city.isHome && (
									<motion.path
										d={`M ${city.x} ${city.y - 15} L ${city.x + 4} ${city.y - 7} L ${city.x + 12} ${city.y - 7} L ${city.x + 6} ${city.y - 1} L ${city.x + 8} ${city.y + 7} L ${city.x} ${city.y + 2} L ${city.x - 8} ${city.y + 7} L ${city.x - 6} ${city.y - 1} L ${city.x - 12} ${city.y - 7} L ${city.x - 4} ${city.y - 7} Z`}
										fill={`var(--color-flexoki-${city.color})`}
										stroke="var(--color-flexoki-bg)"
										strokeWidth="2"
										animate={{ rotate: [0, 360] }}
										transition={{
											duration: 20,
											repeat: Infinity,
											ease: "linear",
										}}
										style={{ transformOrigin: `${city.x}px ${city.y - 4}px` }}
									/>
								)}

								{/* City Label */}
								<text
									x={city.x}
									y={city.y - 15}
									textAnchor="middle"
									fill="var(--color-flexoki-tx)"
									fontSize="11"
									fontFamily="var(--font-sans)"
									fontWeight={isActive ? "600" : "400"}
									opacity={isActive ? 1 : 0.7}
									className="transition-all duration-300"
								>
									{city.name}
								</text>
							</motion.g>
						);
					})}
				</svg>

				{/* Selected City Details */}
				{selectedFlight && (
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: 20 }}
						className="absolute bottom-4 left-4 right-4 bg-flexoki-bg border border-flexoki-ui rounded-lg p-4"
						style={{ backdropFilter: "blur(8px)" }}
					>
						<div className="flex items-start justify-between mb-2">
							<div>
								<h4 className="font-medium text-flexoki-tx">{selectedCity}</h4>
								<p className="text-xs text-flexoki-tx-3 font-mono">
									{selectedFlight.date}
								</p>
							</div>
							<button
								onClick={() => setSelectedCity(null)}
								className="text-flexoki-tx-3 hover:text-flexoki-tx"
							>
								<svg
									width="16"
									height="16"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									strokeWidth="2"
								>
									<path d="M18 6L6 18M6 6l12 12" />
								</svg>
							</button>
						</div>
						<p className="text-sm text-flexoki-tx-2 font-serif italic mb-2">
							{selectedFlight.purpose}
						</p>
						<div className="flex flex-col" style={{ gap: "0.25rem" }}>
							{selectedFlight.highlights.map((highlight, i) => (
								<div
									key={i}
									className="flex items-center text-xs text-flexoki-tx-3"
									style={{ gap: "0.5rem" }}
								>
									<svg
										width="12"
										height="12"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										strokeWidth="2.5"
									>
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
			<div
				className="mt-4 flex items-center justify-center"
				style={{ gap: "1rem" }}
			>
				<div
					className="flex items-center text-xs text-flexoki-tx-3"
					style={{ gap: "0.5rem" }}
				>
					<div className="w-3 h-3 rounded-full bg-flexoki-yellow border-2 border-flexoki-bg" />
					<span>Home Base</span>
				</div>
				<div
					className="flex items-center text-xs text-flexoki-tx-3"
					style={{ gap: "0.5rem" }}
				>
					<svg
						width="16"
						height="16"
						viewBox="0 0 24 24"
						stroke="var(--color-flexoki-tx-3)"
						strokeWidth="2"
						fill="none"
					>
						<path d="M5 12h14" strokeDasharray="3,3" />
					</svg>
					<span>Flight Path</span>
				</div>
			</div>
		</div>
	);
}
