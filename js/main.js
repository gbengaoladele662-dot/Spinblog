/**
 * Blogr Landing Page — JavaScript
 * Features:
 * - Mobile menu toggle
 * - Desktop dropdown navigation
 * - Mobile dropdown accordions
 * - Scroll-based reveal animations
 * - Scroll to top button
 * - Page loading state
 * - Click outside to close dropdowns
 * - Keyboard navigation support
 * - Focus trap for mobile menu
 */

"use strict";

/* ============================================================
   UTILITY FUNCTIONS
   ============================================================ */

/**
 * Shorthand for querySelector
 * @param {string} selector
 * @param {Element} [context=document]
 * @returns {Element|null}
 */
const $ = (selector, context = document) => context.querySelector(selector);

/**
 * Shorthand for querySelectorAll
 * @param {string} selector
 * @param {Element} [context=document]
 * @returns {NodeList}
 */
const $$ = (selector, context = document) =>
  context.querySelectorAll(selector);

/**
 * Add event listener with optional options
 * @param {Element} el
 * @param {string} event
 * @param {Function} handler
 * @param {Object} [options]
 */
const on = (el, event, handler, options) => {
  if (!el) return;
  el.addEventListener(event, handler, options);
};

/**
 * Throttle a function call
 * @param {Function} fn
 * @param {number} limit - ms
 * @returns {Function}
 */
const throttle = (fn, limit) => {
  let lastCall = 0;
  return function (...args) {
    const now = Date.now();
    if (now - lastCall >= limit) {
      lastCall = now;
      fn.apply(this, args);
    }
  };
};

/**
 * Debounce a function call
 * @param {Function} fn
 * @param {number} delay - ms
 * @returns {Function}
 */
const debounce = (fn, delay) => {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
};

/* ============================================================
   PAGE LOADER
   ============================================================ */

const PageLoader = (() => {
  const loaderHTML = `
    <div class="page-loader" id="pageLoader" role="status" aria-label="Loading page">
      <div class="loader-ring"></div>
    </div>
  `;

  function init() {
    // Inject loader
    document.body.insertAdjacentHTML("afterbegin", loaderHTML);

    const loader = $("#pageLoader");

    // Hide loader after page is ready
    const hideLoader = () => {
      if (!loader) return;
      // Small minimum display time for UX polish
      setTimeout(() => {
        loader.classList.add("is-hidden");
        // Remove from DOM after transition
        setTimeout(() => loader.remove(), 450);
      }, 300);
    };

    if (document.readyState === "complete") {
      hideLoader();
    } else {
      on(window, "load", hideLoader);
    }
  }

  return { init };
})();

/* ============================================================
   MOBILE MENU
   ============================================================ */

const MobileMenu = (() => {
  let isOpen = false;
  let focusableElements = [];
  let firstFocusable = null;
  let lastFocusable = null;

  const hamburger = $(".nav__hamburger");
  const mobileMenu = $("#mobile-menu");
  const mobileDropdownBtns = $$(".mobile-menu__dropdown-btn");

  /**
   * Open the mobile menu
   */
  function open() {
    if (!hamburger || !mobileMenu) return;
    isOpen = true;
    hamburger.setAttribute("aria-expanded", "true");
    mobileMenu.classList.add("is-open");
    mobileMenu.setAttribute("aria-hidden", "false");

    // Get focusable elements for trap
    focusableElements = Array.from(
      mobileMenu.querySelectorAll(
        'a, button, input, [tabindex]:not([tabindex="-1"])'
      )
    ).filter((el) => !el.disabled);
    firstFocusable = focusableElements[0];
    lastFocusable = focusableElements[focusableElements.length - 1];

    // Focus first element
    firstFocusable?.focus();

    // Prevent body scroll
    document.body.style.overflow = "hidden";
  }

  /**
   * Close the mobile menu
   */
  function close() {
    if (!hamburger || !mobileMenu) return;
    isOpen = false;
    hamburger.setAttribute("aria-expanded", "false");
    mobileMenu.classList.remove("is-open");
    mobileMenu.setAttribute("aria-hidden", "true");

    // Close all sub-dropdowns
    closeAllMobileDropdowns();

    // Restore body scroll
    document.body.style.overflow = "";

    // Return focus to hamburger
    hamburger.focus();
  }

  /**
   * Toggle the mobile menu
   */
  function toggle() {
    isOpen ? close() : open();
  }

  /**
   * Close all mobile sub-dropdowns
   */
  function closeAllMobileDropdowns() {
    mobileDropdownBtns.forEach((btn) => {
      const targetId = btn.getAttribute("aria-controls");
      const dropdown = $(`#${targetId}`);
      btn.setAttribute("aria-expanded", "false");
      btn.closest(".mobile-menu__item")?.classList.remove("is-open");
      dropdown?.classList.remove("is-open");
      dropdown?.setAttribute("aria-hidden", "true");
    });
  }

  /**
   * Toggle a mobile sub-dropdown
   * @param {Element} btn
   */
  function toggleMobileDropdown(btn) {
    const targetId = btn.getAttribute("aria-controls");
    const dropdown = $(`#${targetId}`);
    const parentItem = btn.closest(".mobile-menu__item");
    const isExpanded = btn.getAttribute("aria-expanded") === "true";

    // Close others
    mobileDropdownBtns.forEach((otherBtn) => {
      if (otherBtn !== btn) {
        const otherId = otherBtn.getAttribute("aria-controls");
        const otherDropdown = $(`#${otherId}`);
        otherBtn.setAttribute("aria-expanded", "false");
        otherBtn.closest(".mobile-menu__item")?.classList.remove("is-open");
        otherDropdown?.classList.remove("is-open");
        otherDropdown?.setAttribute("aria-hidden", "true");
      }
    });

    // Toggle current
    if (isExpanded) {
      btn.setAttribute("aria-expanded", "false");
      parentItem?.classList.remove("is-open");
      dropdown?.classList.remove("is-open");
      dropdown?.setAttribute("aria-hidden", "true");
    } else {
      btn.setAttribute("aria-expanded", "true");
      parentItem?.classList.add("is-open");
      dropdown?.classList.add("is-open");
      dropdown?.setAttribute("aria-hidden", "false");
    }
  }

  /**
   * Handle focus trap inside mobile menu
   * @param {KeyboardEvent} e
   */
  function handleTrapFocus(e) {
    if (!isOpen) return;
    if (e.key !== "Tab") return;

    if (e.shiftKey) {
      if (document.activeElement === firstFocusable) {
        e.preventDefault();
        lastFocusable?.focus();
      }
    } else {
      if (document.activeElement === lastFocusable) {
        e.preventDefault();
        firstFocusable?.focus();
      }
    }
  }

  function init() {
    if (!hamburger || !mobileMenu) return;

    // Hamburger click
    on(hamburger, "click", toggle);

    // Mobile dropdown buttons
    mobileDropdownBtns.forEach((btn) => {
      on(btn, "click", () => toggleMobileDropdown(btn));
    });

    // Keyboard support
    on(document, "keydown", (e) => {
      if (e.key === "Escape" && isOpen) close();
      handleTrapFocus(e);
    });

    // Click outside to close
    on(document, "click", (e) => {
      if (
        isOpen &&
        !mobileMenu.contains(e.target) &&
        !hamburger.contains(e.target)
      ) {
        close();
      }
    });

    // Close on resize if viewport expands
    on(
      window,
      "resize",
      debounce(() => {
        if (window.innerWidth > 900 && isOpen) close();
      }, 150)
    );
  }

  return { init, close };
})();

/* ============================================================
   DESKTOP DROPDOWN NAVIGATION
   ============================================================ */

const DesktopNav = (() => {
  const dropdownItems = $$(".nav__item--dropdown");
  let openItem = null;

  /**
   * Open a dropdown item
   * @param {Element} item
   */
  function openDropdown(item) {
    if (openItem && openItem !== item) closeDropdown(openItem);

    const btn = $(".nav__dropdown-btn", item);
    const dropdown = $(".nav__dropdown", item);

    item.classList.add("is-open");
    btn?.setAttribute("aria-expanded", "true");
    openItem = item;
  }

  /**
   * Close a dropdown item
   * @param {Element} item
   */
  function closeDropdown(item) {
    const btn = $(".nav__dropdown-btn", item);
    item.classList.remove("is-open");
    btn?.setAttribute("aria-expanded", "false");
    if (openItem === item) openItem = null;
  }

  /**
   * Close all dropdowns
   */
  function closeAll() {
    dropdownItems.forEach(closeDropdown);
  }

  function init() {
    if (!dropdownItems.length) return;

    dropdownItems.forEach((item) => {
      const btn = $(".nav__dropdown-btn", item);
      const dropdown = $(".nav__dropdown", item);

      // Click to toggle (keyboard accessible)
      on(btn, "click", (e) => {
        e.stopPropagation();
        item.classList.contains("is-open")
          ? closeDropdown(item)
          : openDropdown(item);
      });

      // Keyboard navigation within dropdown
      on(dropdown, "keydown", (e) => {
        const links = Array.from($$("a", dropdown));
        const idx = links.indexOf(document.activeElement);

        if (e.key === "ArrowDown") {
          e.preventDefault();
          links[(idx + 1) % links.length]?.focus();
        }

        if (e.key === "ArrowUp") {
          e.preventDefault();
          links[(idx - 1 + links.length) % links.length]?.focus();
        }

        if (e.key === "Escape") {
          closeDropdown(item);
          btn?.focus();
        }

        if (e.key === "Tab" && !e.shiftKey && idx === links.length - 1) {
          closeDropdown(item);
        }
      });

      // Close if focus leaves item
      on(item, "focusout", (e) => {
        if (!item.contains(e.relatedTarget)) {
          closeDropdown(item);
        }
      });
    });

    // Click outside closes all
    on(document, "click", (e) => {
      const clickedInsideNav = Array.from(dropdownItems).some((item) =>
        item.contains(e.target)
      );
      if (!clickedInsideNav) closeAll();
    });

    // Escape closes all
    on(document, "keydown", (e) => {
      if (e.key === "Escape") closeAll();
    });
  }

  return { init };
})();

/* ============================================================
   SCROLL TO TOP BUTTON
   ============================================================ */

const ScrollTop = (() => {
  const btn = $("#scrollTop");
  const THRESHOLD = 400;

  function updateVisibility() {
    if (!btn) return;
    const scrolled = window.scrollY > THRESHOLD;
    btn.classList.toggle("is-visible", scrolled);
  }

  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function init() {
    if (!btn) return;

    on(window, "scroll", throttle(updateVisibility, 100), { passive: true });
    on(btn, "click", scrollToTop);

    // Keyboard
    on(btn, "keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        scrollToTop();
      }
    });
  }

  return { init };
})();

/* ============================================================
   INTERSECTION OBSERVER — SCROLL REVEAL ANIMATIONS
   ============================================================ */

const ScrollReveal = (() => {
  const observerOptions = {
    threshold: 0.12,
    rootMargin: "0px 0px -60px 0px",
  };

  /**
   * Create an IntersectionObserver
   * @param {string} selector - CSS selector for elements to observe
   * @param {string} visibleClass - Class to add when visible
   * @param {boolean} [once=true] - Unobserve after first intersection
   */
  function createObserver(selector, visibleClass = "is-visible", once = true) {
    const elements = $$(selector);
    if (!elements.length) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add(visibleClass);
          if (once) observer.unobserve(entry.target);
        } else if (!once) {
          entry.target.classList.remove(visibleClass);
        }
      });
    }, observerOptions);

    elements.forEach((el) => observer.observe(el));
  }

  function init() {
    // Check for IntersectionObserver support
    if (!("IntersectionObserver" in window)) {
      // Fallback: show all elements immediately
      $$(".reveal, .reveal--left, .reveal--right, .stagger").forEach((el) => {
        el.classList.add("is-visible");
      });
      return;
    }

    createObserver(".reveal");
    createObserver(".reveal--left");
    createObserver(".reveal--right");
    createObserver(".stagger");

    // Stagger children with delays
    $$(".stagger").forEach((container) => {
      const children = Array.from(container.children);
      children.forEach((child, idx) => {
        child.style.transitionDelay = `${idx * 100}ms`;
      });
    });
  }

  return { init };
})();

/* ============================================================
   APPLY REVEAL CLASSES TO DOM ELEMENTS
   ============================================================ */

const ApplyAnimations = (() => {
  function init() {
    // Section titles
    $$(".section__title").forEach((el) => el.classList.add("reveal"));

    // Feature cards — stagger within groups
    $$(".future__text, .features__text").forEach((group) => {
      group.classList.add("stagger");
    });

    // Illustrations
    $$(".future__illustration").forEach((el) => el.classList.add("reveal--right"));
    $$(".features__illustration").forEach((el) => el.classList.add("reveal--left"));

    // Infrastructure content
    $$(".infrastructure__content").forEach((el) => el.classList.add("reveal--right"));
    $$(".infrastructure__illustration").forEach((el) => el.classList.add("reveal--left"));

    // Footer columns
    const footerNavs = $$(".footer__nav");
    footerNavs.forEach((nav, i) => {
      nav.classList.add("reveal");
      nav.style.transitionDelay = `${i * 80}ms`;
    });
    $(".footer__brand")?.classList.add("reveal");
  }

  return { init };
})();

/* ============================================================
   HEADER SCROLL EFFECT
   ============================================================ */

const HeaderEffect = (() => {
  const header = $(".header");
  let ticking = false;

  function update() {
    if (!header) return;
    // Subtle parallax-like brightness change
    const scrolled = Math.min(window.scrollY / 300, 1);
    header.style.setProperty("--scroll-progress", scrolled);
    ticking = false;
  }

  function init() {
    on(
      window,
      "scroll",
      () => {
        if (!ticking) {
          requestAnimationFrame(update);
          ticking = true;
        }
      },
      { passive: true }
    );
  }

  return { init };
})();

/* ============================================================
   ACTIVE NAV LINK HIGHLIGHTING
   ============================================================ */

const ActiveNav = (() => {
  function init() {
    const navLinks = $$(".nav__dropdown a, .footer__link");

    navLinks.forEach((link) => {
      on(link, "click", function () {
        // Visual feedback
        this.style.fontWeight = "700";
        setTimeout(() => (this.style.fontWeight = ""), 300);
      });
    });
  }

  return { init };
})();

/* ============================================================
   SMOOTH SCROLL FOR ANCHOR LINKS
   ============================================================ */

const SmoothScroll = (() => {
  function init() {
    $$('a[href^="#"]').forEach((anchor) => {
      on(anchor, "click", function (e) {
        const href = this.getAttribute("href");
        if (href === "#") {
          e.preventDefault();
          window.scrollTo({ top: 0, behavior: "smooth" });
          return;
        }

        const target = $(href);
        if (target) {
          e.preventDefault();
          const offset = 80;
          const top =
            target.getBoundingClientRect().top + window.scrollY - offset;
          window.scrollTo({ top, behavior: "smooth" });
        }
      });
    });
  }

  return { init };
})();

/* ============================================================
   INITIALIZE ALL MODULES
   ============================================================ */

function initApp() {
  PageLoader.init();
  ApplyAnimations.init(); // Must run before ScrollReveal
  ScrollReveal.init();
  MobileMenu.init();
  DesktopNav.init();
  ScrollTop.init();
  HeaderEffect.init();
  ActiveNav.init();
  SmoothScroll.init();

  // Log initialization in development
  if (
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1"
  ) {
    console.log(
      "%cBlogr Landing Page Initialized",
      "color: #FF525D; font-weight: bold; font-size: 14px;"
    );
    console.log("Modules loaded: PageLoader, ScrollReveal, MobileMenu, DesktopNav, ScrollTop");
  }
}

// Initialize when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initApp);
} else {
  initApp();
}