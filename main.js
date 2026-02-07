(function () {
  "use strict";

  var API_URL = "https://api.github.com/users/waabox/repos?sort=updated&per_page=30";

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

  var allRepos = [];

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
        : ""
      ) +

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

  function escapeHtml(text) {
    var div = document.createElement("div");
    div.appendChild(document.createTextNode(text));
    return div.innerHTML;
  }

  function renderRepos(filter) {
    grid.innerHTML = "";
    var filtered = allRepos.filter(function (repo) {
      if (filter === "all") return true;
      return classifyRepo(repo) === filter;
    });

    if (filtered.length === 0) {
      grid.innerHTML = '<p style="color:var(--color-text-muted);grid-column:1/-1;text-align:center;padding:32px 0;">No projects found in this category.</p>';
      return;
    }

    filtered.forEach(function (repo) {
      grid.appendChild(renderCard(repo));
    });
  }

  function fetchRepos() {
    loading.style.display = "block";
    error.style.display = "none";

    fetch(API_URL, {
      headers: { Accept: "application/vnd.github.mercy-preview+json" },
    })
      .then(function (res) {
        if (!res.ok) throw new Error("GitHub API error");
        return res.json();
      })
      .then(function (repos) {
        allRepos = repos.filter(function (r) {
          return !r.fork;
        });

        // Sort: MCP servers first, then by updated date
        allRepos.sort(function (a, b) {
          var aMcp = classifyRepo(a) === "mcp" ? 0 : 1;
          var bMcp = classifyRepo(b) === "mcp" ? 0 : 1;
          if (aMcp !== bMcp) return aMcp - bMcp;
          return new Date(b.updated_at) - new Date(a.updated_at);
        });

        loading.style.display = "none";
        renderRepos("all");
      })
      .catch(function () {
        loading.style.display = "none";
        error.style.display = "block";
      });
  }

  // Filter buttons
  filterButtons.forEach(function (btn) {
    btn.addEventListener("click", function () {
      filterButtons.forEach(function (b) {
        b.classList.remove("active");
      });
      btn.classList.add("active");
      renderRepos(btn.getAttribute("data-filter"));
    });
  });

  // Init
  fetchRepos();
})();
