<div align="center">

# GitHub Profile Search

A modern, responsive web app to search GitHub users and view their profiles and top repositories in real time.

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![GitHub API](https://img.shields.io/badge/GitHub_API-v3-181717?style=for-the-badge&logo=github&logoColor=white)

![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)
![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)
![No Dependencies](https://img.shields.io/badge/Dependencies-None-success.svg)

</div>

---

## Features

- **Real-time search** — Fetches live data from the GitHub REST API
- **Profile display** — Avatar, name, bio, company, location, followers, following, and public repo count
- **Top repositories** — Shows the top 4 repos sorted by stars and forks with language indicators
- **Dark / Light mode** — Toggle between themes with a smooth animated switch
- **Theme persistence** — Remembers your preference via `localStorage`
- **Recent searches** — Quick-access chips for your last 5 searches
- **Error handling** — Friendly messages for invalid usernames, rate limits, and network failures
- **Responsive design** — Works seamlessly on mobile, tablet, and desktop
- **Keyboard support** — Press `Enter` to search
- **Zero dependencies** — Pure HTML, CSS, and JavaScript. No frameworks, no build tools

## Demo

1. Open `index.html` in any modern browser
2. Type a GitHub username (e.g., `torvalds`, `sindresorhus`, `gaearon`)
3. Hit **Search** or press **Enter**

> Try searching for users with many repos to see the top-repos sorting in action.

## Getting Started

### Prerequisites

A modern web browser (Chrome, Firefox, Edge, Safari). No build tools or dependencies required.

### Installation

```bash
git clone https://github.com/your-username/github-profile-search.git
cd github-profile-search
```

### Running Locally

**Option 1 — Open directly:**

```bash
open index.html        # macOS
start index.html       # Windows
xdg-open index.html    # Linux
```

**Option 2 — Local server:**

```bash
npx serve .
```

Then visit `http://localhost:3000`.

## Project Structure

```
github-profile-search/
├── index.html    # Markup and semantic structure
├── style.css     # Styles, themes, and responsive layout
├── app.js        # API calls, DOM logic, and state management
├── README.md     # Project documentation
├── LICENSE        # MIT license
└── .gitignore     # Git ignore rules
```

## Tech Stack

| Layer       | Technology                     |
|-------------|--------------------------------|
| Markup      | HTML5 (semantic elements)      |
| Styling     | CSS3 (custom properties, grid) |
| Logic       | Vanilla JavaScript (ES2020+)   |
| API         | GitHub REST API v3             |
| Persistence | `localStorage`                 |
| Fonts       | Google Fonts (Inter)           |

## API Usage

The app makes two unauthenticated requests per search:

```
GET https://api.github.com/users/{username}
GET https://api.github.com/users/{username}/repos?per_page=100&sort=updated
```

> **Note:** Unauthenticated requests are limited to **60 requests/hour**. For higher limits, you can add a GitHub personal access token.

## How It Works

```
User types username
        │
        ▼
  ┌─────────────┐
  │  Debounced   │
  │  Input Event │
  └──────┬──────┘
         │
         ▼
  ┌─────────────┐     Parallel      ┌──────────────────┐
  │  Fetch User  │─────────────────▶│ GitHub REST API  │
  │  + Repos     │◀─────────────────│  /users/{name}   │
  └──────┬──────┘                   │  /users/{name}/  │
         │                          │    repos         │
         ▼                          └──────────────────┘
  ┌─────────────┐
  │  Sort by     │
  │  Stars/Forks │
  └──────┬──────┘
         │
         ▼
  ┌─────────────┐
  │  Render Top  │
  │  4 Repos +   │
  │  Profile     │
  └─────────────┘
```

## Browser Support

| Browser | Supported |
|---------|-----------|
| Chrome  | 80+       |
| Firefox | 78+       |
| Safari  | 14+       |
| Edge    | 80+       |

## Contributing

Contributions are welcome! Here's how you can help:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Ideas for contributions

- Add pagination for repositories
- Show contribution graph
- Add repository topics/tags
- Support GitHub organizations
- Add skeleton loading states
- Unit tests

## License

This project is open source and available under the [MIT License](LICENSE).

## Star History

If you find this project useful, please consider giving it a star!

<div align="center">

Made with vanilla HTML, CSS, and JavaScript

</div>
