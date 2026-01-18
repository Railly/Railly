// Convert GeoJSON coordinates to SVG path
export function geoJsonToSvgPath(
	coordinates: number[][][],
	projectionConfig: {
		width: number;
		height: number;
		padding: number;
	},
): string {
	// Find bounds of all coordinates
	let minLon = Infinity,
		maxLon = -Infinity;
	let minLat = Infinity,
		maxLat = -Infinity;

	coordinates.forEach((ring) => {
		ring.forEach(([lon, lat]) => {
			minLon = Math.min(minLon, lon);
			maxLon = Math.max(maxLon, lon);
			minLat = Math.min(minLat, lat);
			maxLat = Math.max(maxLat, lat);
		});
	});

	// Project lon/lat to x/y with padding
	const { width, height, padding } = projectionConfig;
	const scale = Math.min(
		(width - 2 * padding) / (maxLon - minLon),
		(height - 2 * padding) / (maxLat - minLat),
	);

	const centerX = width / 2;
	const centerY = height / 2;
	const lonCenter = (minLon + maxLon) / 2;
	const latCenter = (minLat + maxLat) / 2;

	const project = ([lon, lat]: number[]): [number, number] => {
		const x = centerX + (lon - lonCenter) * scale;
		const y = centerY - (lat - latCenter) * scale; // Invert Y axis
		return [x, y];
	};

	// Convert rings to SVG path
	return coordinates
		.map((ring) => {
			const points = ring.map(project);
			const pathData =
				points
					.map(
						(point, i) =>
							`${i === 0 ? "M" : "L"} ${point[0].toFixed(2)} ${point[1].toFixed(2)}`,
					)
					.join(" ") + " Z";
			return pathData;
		})
		.join(" ");
}

// City coordinates in lon/lat
export const cityCoordinates: Record<string, { lon: number; lat: number }> = {
	"Lima, Peru": { lon: -77.0428, lat: -12.0464 },
	"Buenos Aires, Argentina": { lon: -58.3816, lat: -34.6037 },
	"Bariloche, Argentina": { lon: -71.3103, lat: -41.1335 },
	"Iguazú, Argentina": { lon: -54.5755, lat: -25.6953 },
	"Santiago, Chile": { lon: -70.6693, lat: -33.4489 },
	"Cusco, Peru": { lon: -71.9675, lat: -13.5319 },
	"Bogotá, Colombia": { lon: -74.0721, lat: 4.711 },
};

// Project a single city coordinate to SVG space
export function projectCity(
	lon: number,
	lat: number,
	bounds: { minLon: number; maxLon: number; minLat: number; maxLat: number },
	projectionConfig: { width: number; height: number; padding: number },
): { x: number; y: number } {
	const { width, height, padding } = projectionConfig;
	const { minLon, maxLon, minLat, maxLat } = bounds;

	const scale = Math.min(
		(width - 2 * padding) / (maxLon - minLon),
		(height - 2 * padding) / (maxLat - minLat),
	);

	const centerX = width / 2;
	const centerY = height / 2;
	const lonCenter = (minLon + maxLon) / 2;
	const latCenter = (minLat + maxLat) / 2;

	const x = centerX + (lon - lonCenter) * scale;
	const y = centerY - (lat - latCenter) * scale;

	return { x, y };
}

// South America bounds (from GeoJSON)
export const southAmericaBounds = {
	minLon: -81.41,
	maxLon: -34.73,
	minLat: -55.98,
	maxLat: 12.44,
};
