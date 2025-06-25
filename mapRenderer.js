// mapRenderer.js

import { getCurrentLocation } from './locationSearch.js';
import { getStarRating, sleep } from './utils.js';
import { fetchCrimeData } from './dataService.js';

export const map = L.map('map').setView([12.9716, 77.5946], 6);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap contributors'
}).addTo(map);

export function addPopupMarker(lat, lon, address, rating = null) {
  let starInfo = rating !== null ? getStarRating(rating) : null;
  const popupHtml = rating !== null
    ? `<div class="max-w-xs">
         <b>${address}</b><br>
         <span class="text-yellow-500 text-lg">${starInfo.display}</span>
         <span class="text-sm">(${starInfo.stars}/5)</span>
       </div>`
    : `<div class="max-w-xs">
         <b>${address}</b><br>
         <span class="text-gray-500 text-sm italic">This place is yet to be rated.</span>
       </div>`;

  L.marker([lat, lon]).addTo(map).bindPopup(popupHtml).openPopup();
}

async function addTooltipMarker(lat, lon, avgRating, delay = 0) {
  await sleep(delay);

  const location = `(${lat.toFixed(3)}, ${lon.toFixed(3)})`;
  const stars = Math.round((11 - avgRating) / 2);
  const goldStars = `<span style="color: #FFD700;">${'★'.repeat(stars)}${'☆'.repeat(5 - stars)}</span>`;
  const displayRating = ((11 - avgRating) / 2).toFixed(2);

  const circle = L.circle([lat, lon], {
    radius: 5000,
    color: 'transparent',
    fillColor: 'transparent',
    fillOpacity: 0,
    interactive: true,
    zIndexOffset: 1000
  }).addTo(map);

  const popupHtml = `<b>${location}</b><br>Rating: ${goldStars} <b>(${displayRating})</b>`;
  circle.bindPopup(popupHtml, { closeOnClick: false });

  circle.on('mouseover', function () {
    this.openPopup();
  });
  circle.on('mouseout', function () {
    this.closePopup();
  });
}

async function loadCrimeDataFromSupabase() {
  const data = await fetchCrimeData();
  const locationMap = new Map();

  data.forEach(({ latt, long, rating }) => {
    const key = `${latt.toFixed(9)}_${long.toFixed(9)}`;
    const adjustedRating = (11 - rating) / 2;

    if (!locationMap.has(key)) {
      locationMap.set(key, { latt, long, ratings: [adjustedRating] });
    } else {
      locationMap.get(key).ratings.push(adjustedRating);
    }
  });

  const unsafePoints = [];
  locationMap.forEach(({ latt, long, ratings }) => {
    const avgRating = ratings.reduce((sum, r) => sum + r, 0) / ratings.length;
    if (avgRating < 3) {
      unsafePoints.push([latt, long, (11 - avgRating * 2) / 10]);
      addTooltipMarker(latt, long, 11 - avgRating * 2);
    }
  });

  if (unsafePoints.length) {
    L.heatLayer(unsafePoints, {
      radius: 25,
      blur: 15,
      minOpacity: 0.6,
      gradient: {
        0.0: '#00ff00',
        0.5: '#ffff00',
        1.0: '#ff0000'
      },
      zIndex: 500
    }, { willReadFrequently: true }).addTo(map);
  } else {
    console.warn('No unsafe points found for heatmap');
  }
}

loadCrimeDataFromSupabase();

// Fixed icon for current location
const locationIcon = L.divIcon({
  className: 'custom-location-icon',
  html: `
    <div style="background: white; border: 1px solid #ccc; border-radius: 9999px; padding: 8px; box-shadow: 0 2px 6px rgba(0,0,0,0.2);">
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 -960 960 960" fill="currentColor" style="color: #333;">
        <path d="M440-42v-80q-125-14-214.5-103.5T122-440H42v-80h80q14-125 103.5-214.5T440-838v-80h80v80q125 14 214.5 103.5T838-520h80v80h-80q-14 125-103.5 214.5T520-122v80h-80Zm40-158q116 0 198-82t82-198q0-116-82-198t-198-82q-116 0-198 82t-82 198q0 116 82 198t198 82Z"/>
      </svg>
    </div>
  `,
  iconSize: [40, 40],
  iconAnchor: [20, 20]
});

L.marker([10.5, 82.5], { icon: locationIcon })
  .addTo(map)
  .bindPopup("Use Current Location")
  .on('click', getCurrentLocation);
