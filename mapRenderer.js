import { getCurrentLocation } from './locationSearch.js';
import { getStarRating, sleep } from './utils.js';
import { fetchCrimeData } from './dataService.js';

export const map = L.map('map').setView([12.9716, 77.5946], 6);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap contributors'
}).addTo(map);

export function addPopupMarker(lat, lon, address, rating = null) {
  const starInfo = rating !== null ? getStarRating(rating) : null;

  const popupHtml = rating !== null
    ? `<div class="max-w-xs">
         <b>${address}</b><br>
         <span class="text-yellow-500 text-lg">${starInfo.display}</span>
         <span class="text-sm">(${starInfo.exact})</span>
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
  const starInfo = getStarRating(avgRating);

  const popupHtml = `<b>${location}</b><br>Rating: <span style="color: #FFD700;">${starInfo.display}</span> <b>(${starInfo.exact})</b>`;

  const circle = L.circle([lat, lon], {
    radius: 5000,
    color: 'transparent',
    fillColor: 'transparent',
    fillOpacity: 0,
    interactive: true,
    zIndexOffset: 1000
  }).addTo(map);

  circle.bindPopup(popupHtml, { closeOnClick: false });

  circle.on('mouseover', function () {
    this.openPopup();
  });
  circle.on('mouseout', function () {
    this.closePopup();
  });
}
export function resetMapView() {
  map.setView([12.9716, 77.5946], 6); // Reset to original view
}
async function loadCrimeDataFromSupabase() {
  const data = await fetchCrimeData();
  const locationMap = new Map();

  // Group ratings by location
  data.forEach(({ latt, long, rating }) => {
    if (
      typeof latt !== "number" ||
      typeof long !== "number" ||
      typeof rating !== "number" ||
      rating < 0 || rating > 10
    ) return;

    const key = `${latt.toFixed(9)}_${long.toFixed(9)}`;

    if (!locationMap.has(key)) {
      locationMap.set(key, { latt, long, ratings: [rating] });
    } else {
      locationMap.get(key).ratings.push(rating);
    }
  });

  const unsafePoints = [];
  const moderatePoints = [];
  const safePoints = [];

  locationMap.forEach(({ latt, long, ratings }) => {
    const avgRating = ratings.reduce((sum, r) => sum + r, 0) / ratings.length;

    // Tooltip for all types
    addTooltipMarker(latt, long, avgRating);

    if (avgRating <= 4) {
      // Unsafe
      const intensity = avgRating / 10;
      unsafePoints.push([latt, long, intensity]);
    } else if (avgRating > 4 && avgRating < 7) {
      // Moderate
      const intensity = avgRating / 10;
      moderatePoints.push([latt, long, intensity]);
    } else {
      // Safe
      const intensity = avgRating / 10;
      safePoints.push([latt, long, intensity]);
    }
  });

  // 🔴 Red heat layer (unsafe)
  if (unsafePoints.length) {
    L.heatLayer(unsafePoints, {
      radius: 25,
      blur: 15,
      minOpacity: 0.5,
      gradient: {
        0.0: '#ffcccc',
        0.5: '#ff6666',
        1.0: '#ff0000'
      },
      zIndex: 500
    }).addTo(map);
  }

  // 🟡 Yellow heat layer (moderate)
  if (moderatePoints.length) {
    L.heatLayer(moderatePoints, {
      radius: 25,
      blur: 15,
      minOpacity: 0.4,
      gradient: {
        0.0: '#fffccf',
        0.5: '#ffeb88',
        1.0: '#ffd700'
      },
      zIndex: 499
    }).addTo(map);
  }

  // 🟢 Green heat layer (safe)
  if (safePoints.length) {
    L.heatLayer(safePoints, {
      radius: 25,
      blur: 15,
      minOpacity: 0.3,
      gradient: {
        0.0: '#ccffcc',
        0.5: '#66ff66',
        1.0: '#00cc00'
      },
      zIndex: 498
    }).addTo(map);
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
