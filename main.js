// main.js

import './utils.js';
import './dataService.js';
import './mapRenderer.js';
import { getSuggestions, searchLocation } from './locationSearch.js';

document.addEventListener('DOMContentLoaded', () => {
  const input = document.getElementById('searchInput');

  input.addEventListener('input', (e) => getSuggestions(e.target.value));
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') searchLocation();
  });

  const searchBtn = document.querySelector('button[title="Search"]');
  if (searchBtn) searchBtn.addEventListener('click', searchLocation);
});
