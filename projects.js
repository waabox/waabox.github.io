(function () {
  "use strict";

  var API_URL = "https://api.github.com/users/waabox/repos?sort=updated&per_page=30";

  var IGNORED_REPOS = [
    "waabox.github.io",
  ];

  var LANG_COLORS = {
    Java: "#b07219",
    Rust: "#dea584",
    JavaScript: "#f1e05a",
    TypeScript: "#3178c6",
    Python: "#3572A5",
    Go: "#00ADD8",
    Kotlin: "#A97BFF",
    Shell: "#89e051",
    Dockerfile: "#384d54",
    HTML: "#e34c26",
    CSS: "#563d7c",
  };

  var grid = document.getElementById("projects-grid");
  var loading = document.getElementById("loading");
  var error = document.getElementById("error");
  var filterButtons = document.querySelectorAll(".filter-btn");
  var searchInput = document.getElementById("search-input");
  var resultsCount = document.getElementById("results-count");

  var allRepos = [];
  var currentFilter = "all";
  var currentSearch = "";

  // ===== Dark/Light Mode Toggle =====
  var themeToggle = document.getElementById("theme-toggle");
  var html = document.documentElement;

  function getStoredTheme() {
    try {
      return localStorage.getItem("waabox-theme");
    } catch (e) {
      return null;
    }
  }

  function setTheme(theme) {
    if (theme === "light") {
      html.classList.add("light-theme");
    } else {
      html.classList.remove("light-theme");
    }
    try {
      localStorage.setItem("waabox-theme", theme);
    } catch (e) {
      // localStorage unavailable
    }
  }

  var storedTheme = getStoredTheme();
  setTheme(storedTheme || "light");

  if (themeToggle) {
    themeToggle.addEventListener("click", function () {
      var isLight = html.classList.contains("light-theme");
      setTheme(isLight ? "dark" : "light");
    });
  }

  // ===== Scroll Animations =====
  function initScrollAnimations() {
    var elements = document.querySelectorAll(".scroll-hidden");

    if (!("IntersectionObserver" in window)) {
      elements.forEach(function (el) {
        el.classList.remove("scroll-hidden");
        el.classList.add("scroll-visible");
      });
      return;
    }

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("scroll-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
    );

    elements.forEach(function (el) {
      observer.observe(el);
    });
  }

  // ===== Classify Repo =====
  function classifyRepo(repo) {
    var name = (repo.name || "").toLowerCase();
    var desc = (repo.description || "").toLowerCase();
    var topics = repo.topics || [];

    if (
      name.indexOf("mcp") !== -1 ||
      desc.indexOf("mcp") !== -1 ||
      topics.indexOf("mcp-server") !== -1 ||
      topics.indexOf("mcp") !== -1
    ) {
      return "mcp";
    }
    return "tool";
  }

  function repoIcon() {
    return '<svg class="project-card-icon" viewBox="0 0 16 16" fill="currentColor"><path d="M2 2.5A2.5 2.5 0 014.5 0h8.75a.75.75 0 01.75.75v12.5a.75.75 0 01-.75.75h-2.5a.75.75 0 110-1.5h1.75v-2h-8a1 1 0 00-.714 1.7.75.75 0 01-1.072 1.05A2.495 2.495 0 012 11.5v-9zm10.5-1h-8a1 1 0 00-1 1v6.708A2.486 2.486 0 014.5 9h8V1.5z"/></svg>';
  }

  function starIcon() {
    return '<svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M8 .25a.75.75 0 01.673.418l1.882 3.815 4.21.612a.75.75 0 01.416 1.279l-3.046 2.97.719 4.192a.75.75 0 01-1.088.791L8 12.347l-3.766 1.98a.75.75 0 01-1.088-.79l.72-4.194L.818 6.374a.75.75 0 01.416-1.28l4.21-.611L7.327.668A.75.75 0 018 .25z"/></svg>';
  }

  function escapeHtml(text) {
    var div = document.createElement("div");
    div.appendChild(document.createTextNode(text));
    return div.innerHTML;
  }

  // ===== Render Card =====
  function renderCard(repo) {
    var category = classifyRepo(repo);
    var langColor = LANG_COLORS[repo.language] || "#666";
    var description = repo.description || "No description provided.";
    var isMcp = category === "mcp";

    var card = document.createElement("a");
    card.href = repo.html_url;
    card.target = "_blank";
    card.rel = "noopener noreferrer";
    card.className = "project-card";
    card.setAttribute("data-category", category);

    card.innerHTML =
      '<div class="project-card-header">' +
        repoIcon() +
        '<span class="project-card-name">' + escapeHtml(repo.name) + "</span>" +
        (isMcp ? '<span class="tag">MCP</span>' : "") +
      "</div>" +
      '<p class="project-card-description">' + escapeHtml(description) + "</p>" +
      (repo.topics && repo.topics.length > 0
        ? '<div class="project-card-tags">' +
            repo.topics
              .map(function (t) {
                return '<span class="tag small-tag">' + escapeHtml(t) + "</span>";
              })
              .join("") +
          "</div>"
        : "") +
      '<div class="project-card-meta">' +
        (repo.language
          ? '<span class="meta-item"><span class="lang-dot" style="background-color:' + langColor + '"></span>' +
              escapeHtml(repo.language) +
            "</span>"
          : "") +
        (repo.stargazers_count > 0
          ? '<span class="meta-item">' + starIcon() + " " + repo.stargazers_count + "</span>"
          : "") +
      "</div>";

    return card;
  }

  // ===== Filter + Search + Sort =====
  function getFilteredRepos() {
    var searchLower = currentSearch.toLowerCase().trim();

    var filtered = allRepos.filter(function (repo) {
      // Category filter
      if (currentFilter !== "all" && classifyRepo(repo) !== currentFilter) {
        return false;
      }
      // Search filter
      if (searchLower) {
        var name = (repo.name || "").toLowerCase();
        var desc = (repo.description || "").toLowerCase();
        var topics = (repo.topics || []).join(" ").toLowerCase();
        if (
          name.indexOf(searchLower) === -1 &&
          desc.indexOf(searchLower) === -1 &&
          topics.indexOf(searchLower) === -1
        ) {
          return false;
        }
      }
      return true;
    });

    filtered.sort(function (a, b) {
      return new Date(b.pushed_at || b.updated_at) - new Date(a.pushed_at || a.updated_at);
    });

    return filtered;
  }

  function renderRepos() {
    if (!grid) return;
    grid.innerHTML = "";
    var filtered = getFilteredRepos();

    if (resultsCount) {
      resultsCount.textContent = "Showing " + filtered.length + " of " + allRepos.length + " repositories";
    }

    if (filtered.length === 0) {
      grid.innerHTML = '<div class="empty-state"><p>No projects match your search.</p></div>';
      return;
    }

    filtered.forEach(function (repo) {
      grid.appendChild(renderCard(repo));
    });
  }

  // ===== Fetch Repos =====
  function fetchRepos() {
    if (loading) loading.style.display = "block";
    if (error) error.style.display = "none";

    fetch(API_URL, {
      headers: { Accept: "application/vnd.github.mercy-preview+json" },
    })
      .then(function (res) {
        if (!res.ok) throw new Error("GitHub API error");
        return res.json();
      })
      .then(function (repos) {
        allRepos = repos.filter(function (r) {
          return !r.fork && IGNORED_REPOS.indexOf(r.name) === -1;
        });

        if (loading) loading.style.display = "none";
        renderRepos();
      })
      .catch(function () {
        if (loading) loading.style.display = "none";
        if (error) error.style.display = "block";
      });
  }

  // ===== Event Listeners =====

  // Filter buttons
  filterButtons.forEach(function (btn) {
    btn.addEventListener("click", function () {
      filterButtons.forEach(function (b) {
        b.classList.remove("active");
      });
      btn.classList.add("active");
      currentFilter = btn.getAttribute("data-filter");
      renderRepos();
    });
  });

  // Search input (debounced)
  var searchTimeout;
  if (searchInput) searchInput.addEventListener("input", function () {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(function () {
      currentSearch = searchInput.value;
      renderRepos();
    }, 200);
  });

  // ===== Init =====
  fetchRepos();

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initScrollAnimations);
  } else {
    initScrollAnimations();
  }
})();
