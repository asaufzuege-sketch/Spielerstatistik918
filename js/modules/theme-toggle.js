// theme-toggle.js

// Function to set the theme
function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
}

// Function to toggle between light and dark mode
function toggleTheme() {
    const currentTheme = localStorage.getItem('theme') || 'light';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
}

// Load the theme based on user preference
const userPreference = localStorage.getItem('theme');
if (userPreference) {
    setTheme(userPreference);
} else {
    // Detect system preference and set theme accordingly
    const systemPreference = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    setTheme(systemPreference);
}

// Add a button to toggle the theme
const themeToggleButton = document.createElement('button');
themeToggleButton.innerText = 'Toggle Theme';
themeToggleButton.onclick = toggleTheme;
document.body.appendChild(themeToggleButton);