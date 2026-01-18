import { useEffect, useState } from "react";
import { projectCity, southAmericaBounds } from "../../utils/geoUtils";

interface MiniMapProps {
	totalCountries: number;
	visitedCountries: number;
	totalFlights: number;
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

// Smaller projection for mini map
const MINI_PROJECTION_CONFIG = {
	width: 500,
	height: 700,
	padding: 50,
};

export default function MiniMap({
	totalCountries,
	visitedCountries,
	totalFlights,
}: MiniMapProps) {
	const visitedPercentage = Math.round(
		(visitedCountries / totalCountries) * 100,
	);
	const [geoData, setGeoData] = useState<GeoJSON | null>(null);

	useEffect(() => {
		fetch("/south-ameriga.geojson")
			.then((res) => res.json())
			.then((data) => setGeoData(data))
			.catch((err) => console.error("Failed to load GeoJSON:", err));
	}, []);

	// Convert GeoJSON coordinates to SVG path (same logic as FlightMap)
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
										MINI_PROJECTION_CONFIG,
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

	// Lima coordinates for home pin
	const limaCoords = projectCity(
		-77.0428,
		-12.0464,
		southAmericaBounds,
		MINI_PROJECTION_CONFIG,
	);

	return (
		<div className="relative bg-flexoki-bg-2 rounded-lg border border-flexoki-ui p-4 overflow-hidden">
			<div
				className="flex items-center justify-between"
				style={{ gap: "1.5rem" }}
			>
				{/* Mini Map SVG */}
				<div className="flex-shrink-0">
					<svg
						width="80"
						height="120"
						viewBox="0 0 500 700"
						className="opacity-60"
					>
						{/* Accurate South America from GeoJSON */}
						{geoData ? (
							<>
								{geoData.features.map((feature, i) => (
									<path
										key={i}
										d={geoJsonToSvgPath(feature.geometry.coordinates)}
										fill="var(--color-flexoki-ui-2)"
										stroke="var(--color-flexoki-tx-3)"
										strokeWidth="4"
										opacity="0.7"
									/>
								))}
								{/* Home pin (Lima) */}
								<circle
									cx={limaCoords.x}
									cy={limaCoords.y}
									r="8"
									fill="var(--color-flexoki-yellow)"
									stroke="var(--color-flexoki-bg)"
									strokeWidth="2"
								/>
							</>
						) : null}
					</svg>
				</div>

				{/* Stats Grid */}
				<div className="flex-1 grid grid-cols-2" style={{ gap: "1rem" }}>
					<div>
						<div className="text-2xl font-bold text-flexoki-tx font-mono">
							{visitedCountries}
						</div>
						<div className="text-xs text-flexoki-tx-3 uppercase tracking-wide">
							Countries
						</div>
					</div>

					<div>
						<div className="text-2xl font-bold text-flexoki-tx font-mono">
							{totalFlights}
						</div>
						<div className="text-xs text-flexoki-tx-3 uppercase tracking-wide">
							Flights
						</div>
					</div>

					<div className="col-span-2">
						<div className="flex items-center justify-between mb-1">
							<span className="text-xs text-flexoki-tx-3">
								South America Coverage
							</span>
							<span className="text-xs font-mono text-flexoki-tx-2">
								{visitedPercentage}%
							</span>
						</div>
						<div className="h-1.5 bg-flexoki-ui rounded-full overflow-hidden">
							<div
								className="h-full bg-flexoki-cyan rounded-full transition-all duration-1000"
								style={{ width: `${visitedPercentage}%` }}
							/>
						</div>
					</div>
				</div>
			</div>

			{/* Decorative dots */}
			<div className="absolute top-2 right-2 flex" style={{ gap: "0.25rem" }}>
				<div className="w-1 h-1 rounded-full bg-flexoki-tx-3 opacity-30" />
				<div className="w-1 h-1 rounded-full bg-flexoki-tx-3 opacity-30" />
				<div className="w-1 h-1 rounded-full bg-flexoki-tx-3 opacity-30" />
			</div>
		</div>
	);
}
