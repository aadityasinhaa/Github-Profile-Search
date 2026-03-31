/*
 * GitHub Profile Search Application
 * Fetches user data and top repositories from the GitHub API.
 */

// DOM References
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const themeToggle = document.getElementById('themeToggle');
const loader = document.getElementById('loader');
const errorMessage = document.getElementById('errorMessage');
const resultsContainer = document.getElementById('resultsContainer');
const recentSearchesContainer = document.getElementById('recentSearches');

// Profile elements
const avatar = document.getElementById('avatar');
const nameEl = document.getElementById('name');
const profileLink = document.getElementById('profileLink');
const bioEl = document.getElementById('bio');
const companyEl = document.getElementById('company');
const locationEl = document.getElementById('location');
const followersEl = document.getElementById('followers');
const followingEl = document.getElementById('following');
const reposEl = document.getElementById('repos');
const reposGrid = document.getElementById('reposGrid');

// Constants
const GITHUB_API = 'https://api.github.com/users';
const MAX_RECENT = 5;
const DEBOUNCE_DELAY = 500;
const STORAGE_KEYS = {
  THEME: 'gh-search-theme',
  RECENT: 'gh-search-recent',
};

// Theme Management

/** Apply a theme to the document root. */
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
}

/** Load saved theme preference, falling back to system preference. */
function loadTheme() {
  const saved = localStorage.getItem(STORAGE_KEYS.THEME);
  if (saved) {
    applyTheme(saved);
    return;
  }
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  applyTheme(prefersDark ? 'dark' : 'light');
}

/** Toggle between light and dark themes. */
function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';
  applyTheme(next);
  localStorage.setItem(STORAGE_KEYS.THEME, next);
}

themeToggle.addEventListener('click', toggleTheme);

// Recent Searches

/** Retrieve recent searches from localStorage. */
function getRecentSearches() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.RECENT)) || [];
  } catch {
    return [];
  }
}

/** Save a username to recent searches (deduplicated, capped). */
function saveRecentSearch(username) {
  const recent = getRecentSearches().filter(
    (item) => item.toLowerCase() !== username.toLowerCase()
  );
  recent.unshift(username);
  if (recent.length > MAX_RECENT) recent.pop();
  localStorage.setItem(STORAGE_KEYS.RECENT, JSON.stringify(recent));
}

/** Render recent search chips below the search box. */
function renderRecentSearches() {
  const recent = getRecentSearches();
  if (recent.length === 0) {
    recentSearchesContainer.classList.add('hidden');
    return;
  }

  recentSearchesContainer.classList.remove('hidden');
  recentSearchesContainer.innerHTML = recent
    .map(
      (username) => `
        <span class="chip" data-username="${escapeHTML(username)}">
          <svg viewBox="0 0 24 24" width="12" height="12" fill="none"
               stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
          </svg>
          ${escapeHTML(username)}
        </span>`
    )
    .join('');

  recentSearchesContainer.querySelectorAll('.chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      const user = chip.dataset.username;
      searchInput.value = user;
      fetchProfile(user);
    });
  });
}

// Utility Functions

/** Escape HTML entities to prevent XSS. */
function escapeHTML(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/** Format large numbers (e.g., 1500 => "1.5k"). */
function formatNumber(num) {
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (num >= 1_000) return (num / 1_000).toFixed(1).replace(/\.0$/, '') + 'k';
  return num.toString();
}

/** Language color map for common languages. */
const LANGUAGE_COLORS = {
  JavaScript: '#f1e05a',
  TypeScript: '#3178c6',
  Python: '#3572A5',
  Java: '#b07219',
  Go: '#00ADD8',
  Rust: '#dea584',
  'C++': '#f34b7d',
  C: '#555555',
  'C#': '#178600',
  Ruby: '#701516',
  PHP: '#4F5D95',
  Swift: '#F05138',
  Kotlin: '#A97BFF',
  Dart: '#00B4AB',
  HTML: '#e34c26',
  CSS: '#563d7c',
  Shell: '#89e051',
  Vue: '#41b883',
  Scala: '#c22d40',
  R: '#198CE7',
  Lua: '#000080',
  Elixir: '#6e4a7e',
  Haskell: '#5e5086',
};

// Debounce

/** Create a debounced version of a function. */
function debounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

// UI State Helpers

function showLoader() {
  loader.classList.remove('hidden');
  errorMessage.classList.add('hidden');
  resultsContainer.classList.add('hidden');
}

function hideLoader() {
  loader.classList.add('hidden');
}

function showError(message) {
  errorMessage.innerHTML = `
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none"
         stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/>
      <line x1="9" y1="9" x2="15" y2="15"/>
    </svg>
    <span>${escapeHTML(message)}</span>`;
  errorMessage.classList.remove('hidden');
  resultsContainer.classList.add('hidden');
}

function hideError() {
  errorMessage.classList.add('hidden');
}

function showResults() {
  resultsContainer.classList.remove('hidden');
}

// API Calls

/**
 * Fetch a GitHub user profile and their top repositories.
 * @param {string} username - The GitHub username to look up.
 */
async function fetchProfile(username) {
  const trimmed = username.trim();
  if (!trimmed) {
    showError('Please enter a GitHub username.');
    return;
  }

  showLoader();
  hideError();

  try {
    // Fetch user data and repos in parallel
    const [userResponse, reposResponse] = await Promise.all([
      fetch(`${GITHUB_API}/${encodeURIComponent(trimmed)}`),
      fetch(
        `${GITHUB_API}/${encodeURIComponent(trimmed)}/repos?per_page=100&sort=updated`
      ),
    ]);

    // Handle user not found
    if (userResponse.status === 404) {
      hideLoader();
      showError(`User "${trimmed}" not found. Please check the username and try again.`);
      return;
    }

    // Handle rate limiting or other errors
    if (!userResponse.ok || !reposResponse.ok) {
      hideLoader();
      const status = !userResponse.ok ? userResponse.status : reposResponse.status;
      if (status === 403) {
        showError('API rate limit exceeded. Please try again later.');
      } else {
        showError(`Something went wrong (HTTP ${status}). Please try again later.`);
      }
      return;
    }

    const user = await userResponse.json();
    const repos = await reposResponse.json();

    hideLoader();
    renderProfile(user);
    renderRepos(repos);
    showResults();

    // Save to recent searches
    saveRecentSearch(trimmed);
    renderRecentSearches();
  } catch (err) {
    hideLoader();
    showError('Network error. Please check your connection and try again.');
    console.error('Fetch error:', err);
  }
}

// Rendering

/** Render the user profile card. */
function renderProfile(user) {
  avatar.src = user.avatar_url;
  avatar.alt = `${user.login}'s avatar`;

  nameEl.textContent = user.name || user.login;
  profileLink.textContent = `@${user.login}`;
  profileLink.href = user.html_url;

  // Bio
  if (user.bio) {
    bioEl.textContent = user.bio;
    bioEl.classList.remove('hidden');
  } else {
    bioEl.classList.add('hidden');
  }

  // Company
  if (user.company) {
    companyEl.querySelector('span').textContent = user.company;
    companyEl.classList.remove('hidden');
  } else {
    companyEl.classList.add('hidden');
  }

  // Location
  if (user.location) {
    locationEl.querySelector('span').textContent = user.location;
    locationEl.classList.remove('hidden');
  } else {
    locationEl.classList.add('hidden');
  }

  // Stats
  followersEl.textContent = formatNumber(user.followers);
  followingEl.textContent = formatNumber(user.following);
  reposEl.textContent = formatNumber(user.public_repos);
}

/** Render the top 4 repositories sorted by stars then forks. */
function renderRepos(repos) {
  if (!repos.length) {
    reposGrid.innerHTML = `
      <p style="grid-column: 1/-1; color: var(--text-secondary); font-size: 0.9rem; text-align: center; padding: 24px 0;">
        This user has no public repositories.
      </p>`;
    return;
  }

  // Sort by stars (primary) and forks (secondary)
  const sorted = [...repos].sort((a, b) => {
    const starDiff = b.stargazers_count - a.stargazers_count;
    if (starDiff !== 0) return starDiff;
    return b.forks_count - a.forks_count;
  });

  const top4 = sorted.slice(0, 4);

  reposGrid.innerHTML = top4
    .map((repo) => {
      const langColor = repo.language ? (LANGUAGE_COLORS[repo.language] || '#8b949e') : null;
      return `
        <article class="repo-card">
          <a class="repo-name" href="${escapeHTML(repo.html_url)}" target="_blank" rel="noopener noreferrer">
            <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor">
              <path fill-rule="evenodd" d="M2 2.5A2.5 2.5 0 014.5 0h8.75a.75.75 0 01.75.75v12.5a.75.75 0 01-.75.75h-2.5a.75.75 0 110-1.5h1.75v-2h-8a1 1 0 00-.714 1.7.75.75 0 01-1.072 1.05A2.495 2.495 0 012 11.5v-9zm10.5-1V9h-8c-.356 0-.694.074-1 .208V2.5a1 1 0 011-1h8zM5 12.25v3.25a.25.25 0 00.4.2l1.45-1.087a.25.25 0 01.3 0L8.6 15.7a.25.25 0 00.4-.2v-3.25a.25.25 0 00-.25-.25h-3.5a.25.25 0 00-.25.25z"/>
            </svg>
            ${escapeHTML(repo.name)}
          </a>
          ${repo.description ? `<p class="repo-description">${escapeHTML(repo.description)}</p>` : '<p class="repo-description" style="opacity:0.5">No description</p>'}
          <div class="repo-stats">
            <span class="repo-stat stars">
              <svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor">
                <path fill-rule="evenodd" d="M8 .25a.75.75 0 01.673.418l1.882 3.815 4.21.612a.75.75 0 01.416 1.279l-3.046 2.97.719 4.192a.75.75 0 01-1.088.791L8 12.347l-3.766 1.98a.75.75 0 01-1.088-.79l.72-4.194L.818 6.374a.75.75 0 01.416-1.28l4.21-.611L7.327.668A.75.75 0 018 .25z"/>
              </svg>
              ${formatNumber(repo.stargazers_count)}
            </span>
            <span class="repo-stat forks">
              <svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor">
                <path fill-rule="evenodd" d="M5 3.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm0 2.122a2.25 2.25 0 10-1.5 0v.878A2.25 2.25 0 005.75 8.5h1.5v2.128a2.251 2.251 0 101.5 0V8.5h1.5a2.25 2.25 0 002.25-2.25v-.878a2.25 2.25 0 10-1.5 0v.878a.75.75 0 01-.75.75h-4.5A.75.75 0 015 6.25v-.878zm3.75 7.378a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm3-8.75a.75.75 0 100-1.5.75.75 0 000 1.5z"/>
              </svg>
              ${formatNumber(repo.forks_count)}
            </span>
            ${langColor ? `
            <span class="repo-stat">
              <span class="repo-lang-dot" style="background:${langColor}"></span>
              ${escapeHTML(repo.language)}
            </span>` : ''}
          </div>
        </article>`;
    })
    .join('');
}

// Event Listeners

// Search button click
searchBtn.addEventListener('click', () => {
  fetchProfile(searchInput.value);
});

// Enter key with debounce (for direct Enter press, no debounce)
searchInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    fetchProfile(searchInput.value);
  }
});

// Initialize
loadTheme();
renderRecentSearches();
searchInput.focus();
