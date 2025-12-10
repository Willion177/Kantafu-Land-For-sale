// Mapbox Access Token
mapboxgl.accessToken = 'pk.eyJ1Ijoia2lyb25qaWdnIiwiYSI6ImNtaDc5enB6NzBxZXQya3NpbHh3cTdxaTUifQ.PvzCNIg-j8EbgpJqHZK7sQ';

// REAL COORDINATES from Google Maps
const PLOT_CENTER = [37.181111, -1.304444]; // [lng, lat] - Original plot location

// Route Points (in order from Kangundo Road to Plot)
const KANGUNDO_TO_KIMANI_JUNCTION = [37.18666103710807, -1.286272974171356]; // Point A - Junction
const KIMANI_ROAD_POINT_1 = [37.18678487853843, -1.2930182042828755]; // Along Kimani Road
const KIMANI_ROAD_POINT_2 = [37.18633727899783, -1.2933557145471222]; // Mosque B location
const KIMANI_ROAD_POINT_3 = [37.18690502912583, -1.298175190660646]; // Tooting Thiorns Cottage
const TERTIARY_ROAD_JUNCTION = [37.186968206848235, -1.304346093461787]; // Turn to tertiary road

// Real Township Coordinates
const townships = [
    { name: 'Komarock', coords: [36.909028720789166, -1.2666563334377692] },
    { name: 'Kayole', coords: [36.915680599286, -1.2772538113227063] },
    { name: 'Njiru', coords: [36.92658109649503, -1.2506527723322554] },
    { name: 'Ruai', coords: [36.98597593304888, -1.2534845089561475] },
    { name: 'Kamulu', coords: [37.05927534119557, -1.2799997096786346] },
    { name: 'Joska', coords: [37.09549589142576, -1.2825739866322652] },
    { name: 'Malaa', coords: [37.13763936909476, -1.2762988919918679] },
    { name: 'Kantafu', coords: [37.18454075100735, -1.2859578501165574] }
];

// Real Landmark Coordinates
const landmarks = [
    { name: 'Deliverance Church Kantafu', coords: [37.18667730218208, -1.2887718324629596], color: '#8b4513' },
    { name: 'Kantafu Mosque B', coords: [37.18633727899783, -1.2933557145471222], color: '#4a90a4' },
    { name: 'Tooting Thiorns Cottage', coords: [37.18690502912583, -1.298175190660646], color: '#6b8e23' }
];

// State
let regionalMap = null;
let localMap = null;
let isTouring = false;
let currentView = 'regional';

// Initialize maps when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    initRegionalMap();
    initLocalMap();
    setupEventListeners();
});

function initRegionalMap() {
    regionalMap = new mapboxgl.Map({
        container: 'regionalMap',
        style: 'mapbox://styles/mapbox/satellite-streets-v12',
        center: [37.05, -1.27], // Centered between Nairobi and Kantafu
        zoom: 10.5,
        pitch: 55,
        bearing: 0,
        antialias: true
    });

    regionalMap.on('load', () => {
        console.log('Regional map loaded');
        
        // Add 3D terrain
        regionalMap.addSource('mapbox-dem', {
            type: 'raster-dem',
            url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
            tileSize: 512,
            maxzoom: 14
        });
        regionalMap.setTerrain({ source: 'mapbox-dem', exaggeration: 1.5 });

        // Add sky
        regionalMap.addLayer({
            id: 'sky',
            type: 'sky',
            paint: {
                'sky-type': 'atmosphere',
                'sky-atmosphere-sun': [0.0, 90.0],
                'sky-atmosphere-sun-intensity': 15
            }
        });

        // Add Kangundo Road (approximate main highway line)
        const kangundoRoadCoords = [
            townships[0].coords, // Komarock
            townships[1].coords, // Kayole
            townships[2].coords, // Njiru
            townships[3].coords, // Ruai
            townships[4].coords, // Kamulu
            townships[5].coords, // Joska
            townships[6].coords, // Malaa
            townships[7].coords, // Kantafu
            KANGUNDO_TO_KIMANI_JUNCTION // Junction
        ];

        regionalMap.addSource('kangundo-road', {
            type: 'geojson',
            data: {
                type: 'Feature',
                geometry: {
                    type: 'LineString',
                    coordinates: kangundoRoadCoords
                }
            }
        });

        regionalMap.addLayer({
            id: 'kangundo-road-layer',
            type: 'line',
            source: 'kangundo-road',
            paint: {
                'line-color': '#ff6b6b',
                'line-width': 5,
                'line-opacity': 0.9
            }
        });

        // Add Kimani Road with real waypoints
        const kimaniRoadCoords = [
            KANGUNDO_TO_KIMANI_JUNCTION,
            landmarks[0].coords, // Deliverance Church
            KIMANI_ROAD_POINT_1,
            landmarks[1].coords, // Mosque B
            KIMANI_ROAD_POINT_3, // Tooting Thiorns
            TERTIARY_ROAD_JUNCTION,
            PLOT_CENTER
        ];

        regionalMap.addSource('kimani-road', {
            type: 'geojson',
            data: {
                type: 'Feature',
                geometry: {
                    type: 'LineString',
                    coordinates: kimaniRoadCoords
                }
            }
        });

        regionalMap.addLayer({
            id: 'kimani-road-layer',
            type: 'line',
            source: 'kimani-road',
            paint: {
                'line-color': '#4CAF50',
                'line-width': 4,
                'line-opacity': 0.95
            }
        });

        // Add township markers
        townships.forEach(town => {
            const el = document.createElement('div');
            el.className = 'township-marker';
            el.style.cssText = `
                background-color: #ff6b6b;
                width: 22px;
                height: 22px;
                border-radius: 50%;
                border: 3px solid white;
                box-shadow: 0 2px 6px rgba(0,0,0,0.4);
                cursor: pointer;
            `;

            new mapboxgl.Marker(el)
                .setLngLat(town.coords)
                .setPopup(new mapboxgl.Popup({ offset: 25 })
                    .setHTML(`<strong>${town.name}</strong><br/>Township along Kangundo Road`))
                .addTo(regionalMap);
        });

        // Add glowing plot marker
        const plotEl = document.createElement('div');
        plotEl.className = 'plot-marker';
        plotEl.style.cssText = `
            background: radial-gradient(circle, #00ff00 0%, #00cc00 50%, #009900 100%);
            width: 35px;
            height: 35px;
            border-radius: 50%;
            border: 4px solid white;
            box-shadow: 0 0 25px rgba(0,255,0,0.8), 0 0 50px rgba(0,255,0,0.4);
            cursor: pointer;
        `;

        new mapboxgl.Marker(plotEl)
            .setLngLat(PLOT_CENTER)
            .setPopup(new mapboxgl.Popup({ offset: 25 })
                .setHTML(`<strong>🎯 Plot on Sale</strong><br/>50x100 ft<br/>📍 Coordinates: ${PLOT_CENTER[1]}, ${PLOT_CENTER[0]}`))
            .addTo(regionalMap);

        hideLoading();
    });

    regionalMap.on('error', (e) => {
        console.error('Regional map error:', e);
    });
}

function initLocalMap() {
    localMap = new mapboxgl.Map({
        container: 'localMap',
        style: 'mapbox://styles/mapbox/satellite-v9',
        center: PLOT_CENTER,
        zoom: 15.5,
        pitch: 60,
        bearing: -20,
        antialias: true
    });

    localMap.on('load', () => {
        console.log('Local map loaded');
        
        // Add 3D terrain
        localMap.addSource('mapbox-dem', {
            type: 'raster-dem',
            url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
            tileSize: 512,
            maxzoom: 14
        });
        localMap.setTerrain({ source: 'mapbox-dem', exaggeration: 1.5 });

        // Add sky
        localMap.addLayer({
            id: 'sky',
            type: 'sky',
            paint: {
                'sky-type': 'atmosphere',
                'sky-atmosphere-sun': [0.0, 90.0],
                'sky-atmosphere-sun-intensity': 15
            }
        });

        // Add Kimani Road in local detail
        const localKimaniCoords = [
            landmarks[0].coords, // Deliverance Church
            KIMANI_ROAD_POINT_1,
            landmarks[1].coords, // Mosque
            KIMANI_ROAD_POINT_3, // Tooting Thiorns
            TERTIARY_ROAD_JUNCTION
        ];

        localMap.addSource('kimani-road-detail', {
            type: 'geojson',
            data: {
                type: 'Feature',
                geometry: {
                    type: 'LineString',
                    coordinates: localKimaniCoords
                }
            }
        });

        localMap.addLayer({
            id: 'kimani-road-detail-layer',
            type: 'line',
            source: 'kimani-road-detail',
            paint: {
                'line-color': '#555555',
                'line-width': 10,
                'line-opacity': 0.8
            }
        });

        // Add tertiary road to plot
        localMap.addSource('tertiary-road', {
            type: 'geojson',
            data: {
                type: 'Feature',
                geometry: {
                    type: 'LineString',
                    coordinates: [
                        TERTIARY_ROAD_JUNCTION,
                        PLOT_CENTER
                    ]
                }
            }
        });

        localMap.addLayer({
            id: 'tertiary-road-layer',
            type: 'line',
            source: 'tertiary-road',
            paint: {
                'line-color': '#888888',
                'line-width': 6,
                'line-opacity': 0.8,
                'line-dasharray': [2, 1]
            }
        });

        // Add landmark markers with labels
        landmarks.forEach(landmark => {
            const el = document.createElement('div');
            el.style.cssText = `
                background-color: ${landmark.color};
                width: 28px;
                height: 28px;
                border-radius: 50%;
                border: 3px solid white;
                box-shadow: 0 3px 8px rgba(0,0,0,0.5);
                cursor: pointer;
            `;

            new mapboxgl.Marker(el)
                .setLngLat(landmark.coords)
                .setPopup(new mapboxgl.Popup({ offset: 25 })
                    .setHTML(`<strong>${landmark.name}</strong><br/>Landmark along Kimani Road`))
                .addTo(localMap);
        });

        // Special distinctive PLOT MARKER with custom icon
        const plotMarkerEl = document.createElement('div');
        plotMarkerEl.style.cssText = `
            width: 50px;
            height: 50px;
            position: relative;
            cursor: pointer;
        `;
        
        plotMarkerEl.innerHTML = `
            <svg width="50" height="50" viewBox="0 0 50 50" style="filter: drop-shadow(0 4px 8px rgba(0,0,0,0.6));">
                <!-- Pulsing outer circle -->
                <circle cx="25" cy="25" r="20" fill="#00ff00" opacity="0.3">
                    <animate attributeName="r" from="15" to="22" dur="2s" repeatCount="indefinite"/>
                    <animate attributeName="opacity" from="0.5" to="0" dur="2s" repeatCount="indefinite"/>
                </circle>
                <!-- Inner solid circle -->
                <circle cx="25" cy="25" r="12" fill="#00ff00" stroke="white" stroke-width="3"/>
                <!-- Center dot -->
                <circle cx="25" cy="25" r="5" fill="white"/>
                <!-- Star burst -->
                <path d="M 25 10 L 27 18 L 35 15 L 28 22 L 35 28 L 27 26 L 25 35 L 23 26 L 15 28 L 22 22 L 15 15 L 23 18 Z" 
                      fill="#ffff00" opacity="0.8" stroke="white" stroke-width="1">
                    <animateTransform attributeName="transform" type="rotate" from="0 25 25" to="360 25 25" dur="10s" repeatCount="indefinite"/>
                </path>
            </svg>
        `;

        new mapboxgl.Marker(plotMarkerEl, { anchor: 'center' })
            .setLngLat(PLOT_CENTER)
            .setPopup(new mapboxgl.Popup({ offset: 25 })
                .setHTML(`
                    <div style="text-align: center;">
                        <strong style="color: #00ff00; font-size: 16px;">🎯 PLOT ON SALE</strong><br/>
                        <strong>50 x 100 ft</strong><br/>
                        📍 ${PLOT_CENTER[1].toFixed(6)}, ${PLOT_CENTER[0].toFixed(6)}<br/>
                        🛣️ Access via Kimani Road<br/>
                        📏 ~600m from tertiary road junction
                    </div>
                `))
            .addTo(localMap);

        hideLoading();
    });

    localMap.on('error', (e) => {
        console.error('Local map error:', e);
    });
}

function setupEventListeners() {
    const regionalBtn = document.getElementById('regionalBtn');
    const localBtn = document.getElementById('localBtn');
    const tourBtn = document.getElementById('tourBtn');
    const resetBtn = document.getElementById('resetBtn');

    regionalBtn.addEventListener('click', () => switchView('regional'));
    localBtn.addEventListener('click', () => switchView('local'));
    tourBtn.addEventListener('click', startTour);
    resetBtn.addEventListener('click', resetView);
}

function switchView(view) {
    currentView = view;
    
    const regionalMapEl = document.getElementById('regionalMap');
    const localMapEl = document.getElementById('localMap');
    const regionalBtn = document.getElementById('regionalBtn');
    const localBtn = document.getElementById('localBtn');
    const regionalInfo = document.getElementById('regionalInfo');
    const localInfo = document.getElementById('localInfo');

    if (view === 'regional') {
        regionalMapEl.classList.add('active');
        localMapEl.classList.remove('active');
        regionalBtn.classList.add('active');
        localBtn.classList.remove('active');
        regionalInfo.style.display = 'block';
        localInfo.style.display = 'none';
        
        // Trigger resize to fix rendering
        setTimeout(() => regionalMap.resize(), 100);
    } else {
        localMapEl.classList.add('active');
        regionalMapEl.classList.remove('active');
        localBtn.classList.add('active');
        regionalBtn.classList.remove('active');
        localInfo.style.display = 'block';
        regionalInfo.style.display = 'none';
        
        // Trigger resize to fix rendering
        setTimeout(() => localMap.resize(), 100);
    }
}

function startTour() {
    if (isTouring) return;
    
    const tourBtn = document.getElementById('tourBtn');
    const map = currentView === 'regional' ? regionalMap : localMap;
    
    isTouring = true;
    tourBtn.disabled = true;
    tourBtn.innerHTML = `
        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="6" y="4" width="4" height="16"></rect>
            <rect x="14" y="4" width="4" height="16"></rect>
        </svg>
        Touring...
    `;

    if (currentView === 'regional') {
        const tourStops = [
            { center: townships[0].coords, zoom: 12, pitch: 50, bearing: 90, duration: 2500 },
            { center: townships[3].coords, zoom: 12, pitch: 50, bearing: 90, duration: 2500 },
            { center: townships[6].coords, zoom: 13, pitch: 55, bearing: 80, duration: 2500 },
            { center: KANGUNDO_TO_KIMANI_JUNCTION, zoom: 14, pitch: 60, bearing: 45, duration: 3000 },
            { center: landmarks[0].coords, zoom: 15, pitch: 65, bearing: 20, duration: 2500 },
            { center: KIMANI_ROAD_POINT_3, zoom: 15, pitch: 65, bearing: 0, duration: 2500 },
            { center: TERTIARY_ROAD_JUNCTION, zoom: 16, pitch: 70, bearing: -10, duration: 2500 },
            { center: PLOT_CENTER, zoom: 17, pitch: 70, bearing: -20, duration: 3000 }
        ];

        let currentStop = 0;
        const flyToNext = () => {
            if (currentStop < tourStops.length) {
                map.flyTo({
                    ...tourStops[currentStop],
                    essential: true
                });
                currentStop++;
                setTimeout(flyToNext, tourStops[currentStop - 1].duration);
            } else {
                endTour();
            }
        };
        flyToNext();
    } else {
        const tourStops = [
            { center: TERTIARY_ROAD_JUNCTION, zoom: 16, pitch: 60, bearing: 0, duration: 2000 },
            { center: PLOT_CENTER, zoom: 17, pitch: 65, bearing: 90, duration: 2000 },
            { center: PLOT_CENTER, zoom: 17.5, pitch: 70, bearing: 180, duration: 2000 },
            { center: PLOT_CENTER, zoom: 17.5, pitch: 70, bearing: 270, duration: 2000 },
            { center: PLOT_CENTER, zoom: 17, pitch: 65, bearing: 360, duration: 2000 },
            { center: PLOT_CENTER, zoom: 16, pitch: 60, bearing: -20, duration: 2000 }
        ];

        let currentStop = 0;
        const flyToNext = () => {
            if (currentStop < tourStops.length) {
                map.flyTo({
                    ...tourStops[currentStop],
                    essential: true
                });
                currentStop++;
                setTimeout(flyToNext, tourStops[currentStop - 1].duration);
            } else {
                endTour();
            }
        };
        flyToNext();
    }
}

function endTour() {
    isTouring = false;
    const tourBtn = document.getElementById('tourBtn');
    tourBtn.disabled = false;
    tourBtn.innerHTML = `
        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polygon points="5 3 19 12 5 21 5 3"></polygon>
        </svg>
        Start Tour
    `;
}

function resetView() {
    const map = currentView === 'regional' ? regionalMap : localMap;
    
    if (currentView === 'regional') {
        map.flyTo({
            center: [37.05, -1.27],
            zoom: 10.5,
            pitch: 55,
            bearing: 0,
            duration: 2000
        });
    } else {
        map.flyTo({
            center: PLOT_CENTER,
            zoom: 15.5,
            pitch: 60,
            bearing: -20,
            duration: 2000
        });
    }
}

function hideLoading() {
    const loading = document.getElementById('loading');
    if (regionalMap && localMap) {
        setTimeout(() => {
            loading.classList.add('hidden');
        }, 500);
    }
}