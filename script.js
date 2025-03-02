// DOM Elements
const cityInput = document.getElementById('city-input');
const searchBtn = document.getElementById('search-btn');
const weatherInfo = document.getElementById('weather-info');
const locationBtn = document.getElementById('location-btn');
const themeToggle = document.getElementById('theme-toggle');
const loadingElement = document.getElementById('loading');
const emptyState = document.getElementById('empty-state');
const recentSearches = document.getElementById('recent-searches');
const forecastSection = document.getElementById('forecast-section');
const forecastList = document.getElementById('forecast-list');
const toast = document.getElementById('toast');
const toastMessage = document.getElementById('toast-message');
const toastClose = document.getElementById('toast-close');

// API Key
const apiKey = '59d39126af30c73f2619699ee236c34d';

// Store recent searches
let searches = JSON.parse(localStorage.getItem('recentSearches')) || [];

// Initialize app
function init() {
    // Load dark mode preference
    if (localStorage.getItem('darkMode') === 'true') {
        document.body.setAttribute('data-theme', 'dark');
        themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
    }
    
    // Display recent searches
    updateRecentSearches();
    
    // Add event listeners
    searchBtn.addEventListener('click', searchWeather);
    cityInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') searchWeather();
    });
    locationBtn.addEventListener('click', getLocationWeather);
    themeToggle.addEventListener('click', toggleTheme);
    toastClose.addEventListener('click', hideToast);
    
    // Check if there's a stored last search and load it
    const lastSearch = localStorage.getItem('lastSearch');
    if (lastSearch) {
        cityInput.value = lastSearch;
        searchWeather();
    }
}

// Search weather
function searchWeather() {
    const city = cityInput.value.trim();
    if (!city) return;
    
    // Show loading
    showLoading();
    
    // Get current weather
    getCurrentWeather(city);
    
    // Add to recent searches
    addToRecentSearches(city);
    
    // Store as last search
    localStorage.setItem('lastSearch', city);
}

// Get current weather
function getCurrentWeather(city) {
    fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${apiKey}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('City not found');
            }
            return response.json();
        })
        .then(data => {
            // Display current weather
            displayCurrentWeather(data);
            
            // Get 5-day forecast
            getForecast(data.coord.lat, data.coord.lon);
        })
        .catch(error => {
            hideLoading();
            showToast(`Error: ${error.message}`);
            emptyState.style.display = 'block';
        });
}

// Get weather by location
function getLocationWeather() {
    if (navigator.geolocation) {
        showToast('Getting your location...');
        
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;
                
                showLoading();
                
                // Get city name from coordinates
                fetch(`https://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${apiKey}`)
                    .then(response => response.json())
                    .then(data => {
                        if (data.length > 0) {
                            const cityName = data[0].name;
                            cityInput.value = cityName;
                            
                            // Get weather data
                            getCurrentWeather(cityName);
                            
                            // Add to recent searches
                            addToRecentSearches(cityName);
                        }
                    })
                    .catch(error => {
                        hideLoading();
                        showToast('Error fetching location data');
                    });
            },
            (error) => {
                showToast('Unable to get your location');
            }
        );
    } else {
        showToast('Geolocation is not supported by your browser');
    }
}

// Get 5-day forecast
function getForecast(lat, lon) {
    fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`)
        .then(response => response.json())
        .then(data => {
            displayForecast(data);
        })
        .catch(error => {
            console.error('Error fetching forecast:', error);
            forecastSection.style.display = 'none';
        });
}

// Display current weather
function displayCurrentWeather(data) {
    hideLoading();
    emptyState.style.display = 'none';
    
    // Format date and time
    const date = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' };
    const dateFormatted = date.toLocaleDateString('en-US', options);
    
    // Icon URL
    const iconUrl = `https://openweathermap.org/img/wn/${data.weather[0].icon}@4x.png`;
    
    // Calculate temperature percentage for the visual indicator
    const tempRange = data.main.temp_max - data.main.temp_min;
    const tempPosition = tempRange > 0 ? 
        Math.round(((data.main.temp - data.main.temp_min) / tempRange) * 100) : 
        50; // Default to middle if no range
    
    // Update weather card
    weatherInfo.innerHTML = `
        <div class="weather-main fade-in">
            <div class="location">
                <h2 class="city-name">${data.name}</h2>
                <span class="country-code">${data.sys.country}</span>
            </div>
            <div class="date-time">${dateFormatted}</div>
            
            <div class="current-weather-card">
                <div class="weather-icon-large">
                    <img src="${iconUrl}" alt="${data.weather[0].description}">
                </div>
                <div class="temp-container">
                    <div class="current-temp">${Math.round(data.main.temp)}<span class="degree">°C</span></div>
                    <div class="feels-like">Feels like ${Math.round(data.main.feels_like)}°</div>
                </div>
            </div>
            
            <div class="weather-description">${data.weather[0].description}</div>
            
            <div class="temp-range-visual">
                <div class="temp-bar">
                    <div class="temp-indicator" style="left: ${tempPosition}%"></div>
                </div>
                <div class="temp-range-labels">
                    <div><i class="fas fa-arrow-down"></i> ${Math.round(data.main.temp_min)}°</div>
                    <div><i class="fas fa-arrow-up"></i> ${Math.round(data.main.temp_max)}°</div>
                </div>
            </div>
        </div>
        
        <div class="weather-details fade-in">
            <div class="detail-item">
                <div class="detail-label">
                    <i class="fas fa-wind"></i> Wind
                </div>
                <div class="detail-value">
                    ${data.wind.speed} <span class="detail-unit">km/h</span>
                </div>
            </div>
            
            <div class="detail-item">
                <div class="detail-label">
                    <i class="fas fa-tint"></i> Humidity
                </div>
                <div class="detail-value">
                    ${data.main.humidity}<span class="detail-unit">%</span>
                </div>
            </div>
            
            <div class="detail-item">
                <div class="detail-label">
                    <i class="fas fa-compress-arrows-alt"></i> Pressure
                </div>
                <div class="detail-value">
                    ${data.main.pressure}<span class="detail-unit">hPa</span>
                </div>
            </div>
            
            <div class="detail-item">
                <div class="detail-label">
                    <i class="fas fa-eye"></i> Visibility
                </div>
                <div class="detail-value">
                    ${(data.visibility / 1000).toFixed(1)}<span class="detail-unit">km</span>
                </div>
            </div>
        </div>
    `;
}

// Display forecast
function displayForecast(data) {
    forecastList.innerHTML = '';
    
    // Extract daily forecasts (noon each day)
    const dailyForecasts = data.list.filter(item => item.dt_txt.includes('12:00:00'));
    
    // Limit to 5 days
    const limitedForecasts = dailyForecasts.slice(0, 5);
    
    if (limitedForecasts.length > 0) {
        limitedForecasts.forEach(item => {
            // Format day name
            const date = new Date(item.dt * 1000);
            const day = date.toLocaleDateString('en-US', { weekday: 'short' });
            
            // Icon URL
            const iconUrl = `https://openweathermap.org/img/wn/${item.weather[0].icon}@2x.png`;
            
            // Create forecast item
            const forecastItem = document.createElement('div');
            forecastItem.className = 'forecast-item';
            forecastItem.innerHTML = `
                <div class="forecast-day">${day}</div>
                <div class="forecast-icon">
                    <img src="${iconUrl}" alt="${item.weather[0].description}">
                </div>
                <div class="forecast-temp">${Math.round(item.main.temp)}°</div>
            `;
            
            forecastList.appendChild(forecastItem);
        });
        
        forecastSection.style.display = 'block';
    } else {
        forecastSection.style.display = 'none';
    }
}

// Add to recent searches
function addToRecentSearches(city) {
    // Check if city is already in recent searches
    const index = searches.indexOf(city);
    if (index !== -1) {
        // Remove city from current position
        searches.splice(index, 1);
    }
    
    // Add to beginning of array
    searches.unshift(city);
    
    // Limit to 5 recent searches
    if (searches.length > 5) {
        searches.pop();
    }
    
    // Save to local storage
    localStorage.setItem('recentSearches', JSON.stringify(searches));
    
    // Update UI
    updateRecentSearches();
}

// Update recent searches UI
function updateRecentSearches() {
    recentSearches.innerHTML = '';
    
    searches.forEach(city => {
        const cityElement = document.createElement('div');
        cityElement.className = 'recent-city';
        cityElement.textContent = city;
        cityElement.addEventListener('click', () => {
            cityInput.value = city;
            searchWeather();
        });
        
        recentSearches.appendChild(cityElement);
    });
    
    // Show/hide based on searches
    recentSearches.style.display = searches.length > 0 ? 'flex' : 'none';
}

// Toggle theme
function toggleTheme() {
    const isDark = document.body.getAttribute('data-theme') === 'dark';
    
    if (isDark) {
        document.body.removeAttribute('data-theme');
        themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
        localStorage.setItem('darkMode', 'false');
    } else {
        document.body.setAttribute('data-theme', 'dark');
        themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
        localStorage.setItem('darkMode', 'true');
    }
}

// Show loading
function showLoading() {
    loadingElement.style.display = 'block';
    emptyState.style.display = 'none';
    weatherInfo.innerHTML = '';
    forecastSection.style.display = 'none';
}

// Hide loading
function hideLoading() {
    loadingElement.style.display = 'none';
}

// Show toast notification
function showToast(message) {
    toastMessage.textContent = message;
    toast.classList.add('show');
    
    // Auto hide after 3 seconds
    setTimeout(() => {
        hideToast();
    }, 3000);
}

// Hide toast notification
function hideToast() {
    toast.classList.remove('show');
}

// Initialize app
document.addEventListener('DOMContentLoaded', init);
