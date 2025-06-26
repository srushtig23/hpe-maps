import { addPopupMarker, map } from './mapRenderer.js';
import { fetchCrimeData } from './dataService.js';
import { getStarRating, areCoordsClose, showToast } from './utils.js';

let cachedCrimeData = [];

export function getCurrentLocation() {
  if (!navigator.geolocation) {
    alert('Geolocation not supported.');
    return;
  }

  navigator.geolocation.getCurrentPosition(async (position) => {
    const { latitude, longitude } = position.coords;
    map.setView([latitude, longitude], 14);

    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
      const data = await response.json();
      const address = data.display_name || 'Your Location';

      let foundRatings = [];
      for (const entry of cachedCrimeData) {
        if (areCoordsClose(entry.latt, entry.long, latitude, longitude)) {
          foundRatings.push(entry.rating);
        }
      }

      const averageRating = foundRatings.length
        ? foundRatings.reduce((sum, r) => sum + r, 0) / foundRatings.length
        : null;

      addPopupMarker(latitude, longitude, address, averageRating);
    } catch (err) {
      console.error('Reverse geocoding failed:', err);
      addPopupMarker(latitude, longitude, 'Your Location', null);
    }
  });
}

async function initCrimeData() {
  cachedCrimeData = await fetchCrimeData();

  // You can optionally pre-process heatmap data here
}

function showLoading(isLoading) {
  const loader = document.getElementById('loadingIndicator');
  loader.style.display = isLoading ? 'block' : 'none';
}

function clearSuggestions() {
  const list = document.getElementById('suggestionsList');
  list.innerHTML = '';
  list.classList.add('hidden');
}

function showSuggestions(data) {
  const list = document.getElementById('suggestionsList');
  list.innerHTML = '';

  if (!data.length) return clearSuggestions();

  data.forEach(item => {
    const li = document.createElement('li');
    li.textContent = item.display_name;
    li.className = 'suggestion-item px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm';
    li.onclick = () => {
      document.getElementById('searchInput').value = item.display_name;
      clearSuggestions();
      searchLocation();
    };
    list.appendChild(li);
  });

  list.classList.remove('hidden');
}

export function getSuggestions(query) {
  if (!query.trim()) return clearSuggestions();

  showLoading(true);
  fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`)
    .then(res => res.json())
    .then(showSuggestions)
    .catch(err => console.error('Suggestion fetch error:', err))
    .finally(() => showLoading(false));
}

export async function searchLocation() {
  const query = document.getElementById('searchInput').value;
  if (!query) return;

  showLoading(true);
  try {
    const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`);
    const data = await response.json();

    if (!data.length) return showToast('Location not found.', 'error');

    const { lat, lon, display_name } = data[0];
    const latNum = parseFloat(lat);
    const lonNum = parseFloat(lon);
    map.setView([latNum, lonNum], 14);

    let foundRatings = [];
    for (const entry of cachedCrimeData) {
      if (areCoordsClose(entry.latt, entry.long, latNum, lonNum)) {
        foundRatings.push(entry.rating);
      }
    }

    const averageRating = foundRatings.length
      ? foundRatings.reduce((sum, r) => sum + r, 0) / foundRatings.length
      : null;

    addPopupMarker(latNum, lonNum, display_name, averageRating);
  } catch (err) {
    console.error('Search error:', err);
    showToast('Search failed. Please try again.');
  } finally {
    showLoading(false);
    clearSuggestions();
  }
}

// Auto-dismiss suggestion box on outside click
window.addEventListener('click', (e) => {
  const input = document.getElementById('searchInput');
  const suggestions = document.getElementById('suggestionsList');
  if (!input.contains(e.target) && !suggestions.contains(e.target)) {
    clearSuggestions();
  }
});

// Initial load of crime data
initCrimeData();
