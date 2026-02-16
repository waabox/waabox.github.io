(function () {
  "use strict";

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

  // Initialize theme
  var storedTheme = getStoredTheme();
  if (storedTheme) {
    setTheme(storedTheme);
  }

  if (themeToggle) {
    themeToggle.addEventListener("click", function () {
      var isLight = html.classList.contains("light-theme");
      setTheme(isLight ? "dark" : "light");
    });
  }

  // ===== Scroll Animations with IntersectionObserver =====
  function initScrollAnimations() {
    var elements = document.querySelectorAll(".scroll-hidden");

    if (!("IntersectionObserver" in window)) {
      // Fallback: show all elements immediately
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

  // Init on DOM ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initScrollAnimations);
  } else {
    initScrollAnimations();
  }
})();
