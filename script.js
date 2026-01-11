mapboxgl.accessToken = 'pk.eyJ1Ijoia2lyb25qaWdnIiwiYSI6ImNtaDc5enB6NzBxZXQya3NpbHh3cTdxaTUifQ.PvzCNIg-j8EbgpJqHZK7sQ';

// COORDINATES
const PLOT_CENTER = [37.181111, -1.304444];
const KANGUNDO_TO_KIMANI_JUNCTION = [37.18666103710807, -1.286272974171356];
const TERTIARY_ROAD_JUNCTION = [37.186968206848235, -1.304346093461787];

// Key Landmarks with custom markers
const keyLandmarks = [
    { name: 'Deliverance Church', coords: [37.18667730218208, -1.2887718324629596], type: 'church', icon: '⛪' },
    { name: 'Kantafu Mosque', coords: [37.18633727899783, -1.2933557145471222], type: 'mosque', icon: '🕌' },
    { name: 'Mountain View SDA', coords: [37.18690502912583, -1.298175190660646], type: 'church', icon: '⛪' },
    { name: 'AIC Kwanzonzo', coords: [37.186969679291245, -1.305407415556391], type: 'church', icon: '⛪' },
    { name: 'Tooting Thorns Cottage', coords: [37.185648900307775, -1.2979812880678139], type: 'estate', icon: '🏘️' },
    { name: 'Ozone Estate Kantafu', coords: [37.18348882448484, -1.3042749679787262], type: 'estate', icon: '🏘️' },
    { name: 'Northgate School', coords: [37.20051204143163, -1.2994970199796887], type: 'school', icon: '🏫' },
    { name: 'Montessori Academy', coords: [37.168339700214815, -1.3037973562253524], type: 'school', icon: '🏫' },
    { name: 'Bus Stage', coords: [37.175358676110996, -1.2843790389637122], type: 'transport', icon: '🚌' },
    { name: 'Ardent School for Autism', coords: [37.16514595353225, -1.2774159190241292], type: 'school', icon: '🏫' }
];

// State
let regionalMap = null;
let localMap = null;
let isTouring = false;
let currentView = 'regional';

document.addEventListener('DOMContentLoaded', () => {
    initRegionalMap();
    initLocalMap();
    setupEventListeners();
});

function getIconColor(type) {
    const colors = {
        church: '#8b4513',
        mosque: '#4a90a4',
        school: '#3b82f6',
        hospital: '#dc2626',
        mall: '#9333ea',
        estate: '#f97316',
        transport: '#ef4444'
    };
    return colors[type] || '#6b8e23';
}

function createLandmarkMarker(landmark) {
    const container = document.createElement('div');
    container.style.cssText = `
        display: flex;
        align-items: center;
        gap: 8px;
        cursor: pointer;
    `;
    
    const icon = document.createElement('div');
    icon.style.cssText = `
        width: 40px;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: white;
        border-radius: 50%;
        border: 3px solid ${getIconColor(landmark.type)};
        box-shadow: 0 4px 12px rgba(0,0,0,0.6);
        font-size: 22px;
        flex-shrink: 0;
        transition: all 0.2s ease;
    `;
    icon.textContent = landmark.icon;
    
    const label = document.createElement('div');
    label.style.cssText = `
        background: rgba(0, 0, 0, 0.85);
        color: white;
        padding: 6px 12px;
        border-radius: 6px;
        font-size: 13px;
        font-weight: 600;
        white-space: nowrap;
        box-shadow: 0 2px 8px rgba(0,0,0,0.4);
        border: 1px solid ${getIconColor(landmark.type)};
    `;
    label.textContent = landmark.name;
    
    container.appendChild(icon);
    container.appendChild(label);
    
    container.addEventListener('mouseenter', () => {
        icon.style.boxShadow = '0 6px 20px rgba(0,0,0,0.8)';
        icon.style.borderWidth = '4px';
        label.style.background = 'rgba(0, 0, 0, 0.95)';
    });
    container.addEventListener('mouseleave', () => {
        icon.style.boxShadow = '0 4px 12px rgba(0,0,0,0.6)';
        icon.style.borderWidth = '3px';
        label.style.background = 'rgba(0, 0, 0, 0.85)';
    });
    
    return container;
}

function createSimplePlotPin() {
    const pinContainer = document.createElement('div');
    pinContainer.style.cssText = `
        width: 32px;
        height: 40px;
        position: relative;
        cursor: pointer;
    `;
    
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 32 40');
    svg.setAttribute('width', '32');
    svg.setAttribute('height', '40');
    svg.style.cssText = `
        filter: drop-shadow(0 2px 4px rgba(0,0,0,0.6));
    `;
    
    const head = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    head.setAttribute('cx', '16');
    head.setAttribute('cy', '12');
    head.setAttribute('r', '10');
    head.setAttribute('fill', '#ef4444');
    head.setAttribute('stroke', '#ffffff');
    head.setAttribute('stroke-width', '2');
    
    const body = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    body.setAttribute('points', '16,40 8,20 24,20');
    body.setAttribute('fill', '#ef4444');
    body.setAttribute('stroke', '#ffffff');
    body.setAttribute('stroke-width', '1');
    
    svg.appendChild(head);
    svg.appendChild(body);
    pinContainer.appendChild(svg);
    
    return pinContainer;
}

function initRegionalMap() {
    regionalMap = new mapboxgl.Map({
        container: 'regionalMap',
        style: 'mapbox://styles/mapbox/satellite-streets-v12',
        center: [37.05, -1.27],
        zoom: 10.5,
        pitch: 55,
        bearing: 0,
        antialias: true
    });

    regionalMap.on('load', async () => {
        console.log('Regional map loaded');
        
        regionalMap.addSource('mapbox-dem', {
            type: 'raster-dem',
            url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
            tileSize: 512,
            maxzoom: 14
        });
        regionalMap.setTerrain({ source: 'mapbox-dem', exaggeration: 1.5 });

        regionalMap.addLayer({
            id: 'sky',
            type: 'sky',
            paint: {
                'sky-type': 'atmosphere',
                'sky-atmosphere-sun': [0.0, 90.0],
                'sky-atmosphere-sun-intensity': 15
            }
        });

        try {
            const response = await fetch(
                `https://api.mapbox.com/directions/v5/mapbox/driving/36.909028720789166,-1.2666563334377692;${KANGUNDO_TO_KIMANI_JUNCTION[0]},${KANGUNDO_TO_KIMANI_JUNCTION[1]}?geometries=geojson&access_token=${mapboxgl.accessToken}`
            );
            const data = await response.json();
            
            if (data.routes && data.routes[0]) {
                regionalMap.addSource('kangundo-road', {
                    type: 'geojson',
                    data: { type: 'Feature', geometry: data.routes[0].geometry }
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
            }
        } catch (error) {
            console.error('Error fetching Kangundo Road:', error);
        }

        try {
            const response = await fetch(
                `https://api.mapbox.com/directions/v5/mapbox/driving/${KANGUNDO_TO_KIMANI_JUNCTION[0]},${KANGUNDO_TO_KIMANI_JUNCTION[1]};${TERTIARY_ROAD_JUNCTION[0]},${TERTIARY_ROAD_JUNCTION[1]}?geometries=geojson&access_token=${mapboxgl.accessToken}`
            );
            const data = await response.json();
            
            if (data.routes && data.routes[0]) {
                regionalMap.addSource('kimani-road', {
                    type: 'geojson',
                    data: { type: 'Feature', geometry: data.routes[0].geometry }
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
            }
        } catch (error) {
            console.error('Error fetching Kimani Road:', error);
        }

        regionalMap.addSource('tertiary-road', {
            type: 'geojson',
            data: {
                type: 'Feature',
                geometry: {
                    type: 'LineString',
                    coordinates: [TERTIARY_ROAD_JUNCTION, PLOT_CENTER]
                }
            }
        });

        regionalMap.addLayer({
            id: 'tertiary-road-layer',
            type: 'line',
            source: 'tertiary-road',
            paint: {
                'line-color': '#4CAF50',
                'line-width': 3,
                'line-opacity': 0.9,
                'line-dasharray': [2, 1]
            }
        });

        const plotPin = createSimplePlotPin();
        new mapboxgl.Marker({ element: plotPin, anchor: 'bottom' })
            .setLngLat(PLOT_CENTER)
            .addTo(regionalMap);

        hideLoading();
    });
}

function initLocalMap() {
    localMap = new mapboxgl.Map({
        container: 'localMap',
        style: 'mapbox://styles/mapbox/satellite-streets-v12',
        center: PLOT_CENTER,
        zoom: 13.5,
        pitch: 60,
        bearing: -20,
        antialias: true
    });

    localMap.on('load', async () => {
        console.log('Local map loaded');
        
        localMap.addSource('mapbox-dem', {
            type: 'raster-dem',
            url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
            tileSize: 512,
            maxzoom: 14
        });
        localMap.setTerrain({ source: 'mapbox-dem', exaggeration: 1.5 });

        localMap.addLayer({
            id: 'sky',
            type: 'sky',
            paint: {
                'sky-type': 'atmosphere',
                'sky-atmosphere-sun': [0.0, 90.0],
                'sky-atmosphere-sun-intensity': 15
            }
        });

        try {
            const response = await fetch(
                `https://api.mapbox.com/directions/v5/mapbox/driving/${KANGUNDO_TO_KIMANI_JUNCTION[0]},${KANGUNDO_TO_KIMANI_JUNCTION[1]};${TERTIARY_ROAD_JUNCTION[0]},${TERTIARY_ROAD_JUNCTION[1]}?geometries=geojson&access_token=${mapboxgl.accessToken}`
            );
            const data = await response.json();
            
            if (data.routes && data.routes[0]) {
                localMap.addSource('kimani-road-detail', {
                    type: 'geojson',
                    data: { type: 'Feature', geometry: data.routes[0].geometry }
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
            }
        } catch (error) {
            console.error('Error fetching Kimani Road detail:', error);
        }

        localMap.addSource('tertiary-road', {
            type: 'geojson',
            data: {
                type: 'Feature',
                geometry: {
                    type: 'LineString',
                    coordinates: [TERTIARY_ROAD_JUNCTION, PLOT_CENTER]
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

        keyLandmarks.forEach(landmark => {
            const el = createLandmarkMarker(landmark);
            new mapboxgl.Marker({ element: el, anchor: 'left' })
                .setLngLat(landmark.coords)
                .addTo(localMap);
        });

        const plotPin = createSimplePlotPin();
        new mapboxgl.Marker({ element: plotPin, anchor: 'bottom' })
            .setLngLat(PLOT_CENTER)
            .addTo(localMap);

        hideLoading();
    });
}

function setupEventListeners() {
    const regionalBtn = document.getElementById('regionalBtn');
    const localBtn = document.getElementById('localBtn');
    const tourBtn = document.getElementById('tourBtn');
    const resetBtn = document.getElementById('resetBtn');
    const regionalToggle = document.getElementById('regionalToggle');
    const localToggle = document.getElementById('localToggle');
    const controlsToggle = document.getElementById('controlsToggle');
    const controlsInfo = document.getElementById('controlsInfo');
    const regionalInfo = document.getElementById('regionalInfo');
    const localInfo = document.getElementById('localInfo');

    regionalBtn.addEventListener('click', () => switchView('regional'));
    localBtn.addEventListener('click', () => switchView('local'));
    tourBtn.addEventListener('click', startTour);
    resetBtn.addEventListener('click', resetView);
    
    if (regionalToggle) {
        regionalToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            regionalInfo.classList.toggle('collapsed');
            regionalToggle.textContent = regionalInfo.classList.contains('collapsed') ? 'ℹ️ View Info' : '✖️ Close Info';
        });
    }
    
    if (localToggle) {
        localToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            localInfo.classList.toggle('collapsed');
            localToggle.textContent = localInfo.classList.contains('collapsed') ? 'ℹ️ View Info' : '✖️ Close Info';
        });
    }
    
    if (controlsToggle) {
        controlsToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            controlsInfo.classList.toggle('collapsed');
            controlsToggle.textContent = controlsInfo.classList.contains('collapsed') ? '🎮 Map Controls' : '✖️ Close';
        });
    }
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
        setTimeout(() => regionalMap.resize(), 100);
    } else {
        localMapEl.classList.add('active');
        regionalMapEl.classList.remove('active');
        localBtn.classList.add('active');
        regionalBtn.classList.remove('active');
        localInfo.style.display = 'block';
        regionalInfo.style.display = 'none';
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
        // DRONE-STYLE FLIGHT: Follow the actual road path from Kangundo Road to Plot
        const tourStops = [
            // Start at Kangundo Road beginning (wide overview)
            { center: [36.92, -1.268], zoom: 11, pitch: 45, bearing: 0, duration: 3500 },
            // Fly along Kangundo Road toward junction
            { center: [37.05, -1.275], zoom: 12, pitch: 50, bearing: 80, duration: 3500 },
            // Approach Kimani Road junction
            { center: KANGUNDO_TO_KIMANI_JUNCTION, zoom: 13, pitch: 55, bearing: 100, duration: 3500 },
            // Turn onto Kimani Road (green line)
            { center: [37.187, -1.292], zoom: 14, pitch: 58, bearing: 120, duration: 3500 },
            // Follow Kimani Road to tertiary junction
            { center: TERTIARY_ROAD_JUNCTION, zoom: 15, pitch: 62, bearing: 150, duration: 3500 },
            // Follow tertiary road to plot
            { center: [37.184, -1.3025], zoom: 15.5, pitch: 65, bearing: 180, duration: 3000 },
            // Final approach to plot location
            { center: PLOT_CENTER, zoom: 16, pitch: 60, bearing: 0, duration: 3000 }
        ];

        let currentStop = 0;
        const flyToNext = () => {
            if (currentStop < tourStops.length) {
                const stop = tourStops[currentStop];
                map.flyTo({ 
                    ...stop, 
                    essential: true,
                    // Smooth easing to prevent blurring
                    easing: (t) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
                });
                currentStop++;
                
                // Wait longer to let tiles load (prevents blurring)
                const waitTime = stop.duration + 800;
                setTimeout(flyToNext, waitTime);
            } else {
                endTour();
            }
        };
        flyToNext();
    } else {
        // LOCAL VIEW: Fly from tertiary road junction to plot
        const tourStops = [
            { center: TERTIARY_ROAD_JUNCTION, zoom: 14.5, pitch: 55, bearing: 0, duration: 3000 },
            { center: [37.184, -1.3025], zoom: 15, pitch: 60, bearing: 90, duration: 3000 },
            { center: PLOT_CENTER, zoom: 15.5, pitch: 62, bearing: 180, duration: 3000 },
            { center: PLOT_CENTER, zoom: 16, pitch: 60, bearing: -20, duration: 3000 }
        ];

        let currentStop = 0;
        const flyToNext = () => {
            if (currentStop < tourStops.length) {
                const stop = tourStops[currentStop];
                map.flyTo({ 
                    ...stop, 
                    essential: true,
                    easing: (t) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
                });
                currentStop++;
                setTimeout(flyToNext, stop.duration + 600);
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
            zoom: 13.5,
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
        }, 1000);
    }
}
