// utils.js

export function getStarRating(rating) {
  if (typeof rating !== 'number' || rating < 0 || rating > 10) {
    return {
      stars: 0,
      display: 'Not rated'
    };
  }

  const stars = Math.round((11 - rating) / 2);
  const clamped = Math.max(0, Math.min(5, stars));
  return {
    stars: clamped,
    display: '★'.repeat(clamped) + '☆'.repeat(5 - clamped)
  };
}

export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function areCoordsClose(lat1, lon1, lat2, lon2, tolerance = 0.001) {
  return (
    Math.abs(lat1 - lat2) < tolerance &&
    Math.abs(lon1 - lon2) < tolerance
  );
}

export function formatLatLon(lat, lon) {
  return `(${lat.toFixed(3)}, ${lon.toFixed(3)})`;
}

export function showToast(message, type = 'info') {
  alert(message); // You can replace this with a custom toast UI
}
