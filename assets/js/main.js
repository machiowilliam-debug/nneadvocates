/* ==========================================================================
   NNE Advocates — site interactions
   ========================================================================== */
(function () {
  "use strict";

  /* ---------- Header on scroll ---------- */
  var header = document.getElementById("site-header");
  var headerScrolled = false;
  function onScroll() {
    if (!header) return;
    var y = window.scrollY;
    // Hysteresis: enter the compact state below 24px but only leave it
    // within 12px of the top, so small scroll jitter at the threshold
    // cannot retrigger the header transition.
    if (!headerScrolled && y > 24) {
      headerScrolled = true;
      header.classList.add("is-scrolled");
    } else if (headerScrolled && y <= 12) {
      headerScrolled = false;
      header.classList.remove("is-scrolled");
    }
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- Mobile navigation ---------- */
  var nav = document.getElementById("primary-nav");
  var navToggle = document.getElementById("nav-toggle");

  function setNav(open) {
    if (!nav || !navToggle) return;
    nav.classList.toggle("is-open", open);
    document.body.classList.toggle("nav-open", open);
    navToggle.setAttribute("aria-expanded", String(open));
    navToggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    if (open) {
      var first = nav.querySelector("a, button");
      if (first) first.focus({ preventScroll: true });
    }
  }

  if (navToggle && nav) {
    navToggle.addEventListener("click", function () {
      setNav(navToggle.getAttribute("aria-expanded") !== "true");
    });

    nav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () { setNav(false); });
    });

    window.addEventListener("resize", function () {
      if (window.innerWidth > 1100) setNav(false);
    });
  }

  /* ---------- Practice areas dropdown ---------- */
  var dropBtn = document.querySelector(".nav__toggle");
  var dropItem = dropBtn ? dropBtn.closest(".nav__item") : null;

  function closeDrop() {
    if (!dropItem || !dropBtn) return;
    dropItem.classList.remove("is-open");
    dropBtn.setAttribute("aria-expanded", "false");
  }

  if (dropBtn && dropItem) {
    dropBtn.addEventListener("click", function (event) {
      event.preventDefault();
      var open = dropItem.classList.toggle("is-open");
      dropBtn.setAttribute("aria-expanded", String(open));
    });

    dropItem.addEventListener("mouseleave", function () {
      if (window.innerWidth > 1100) closeDrop();
    });

    document.addEventListener("click", function (event) {
      if (!dropItem.contains(event.target)) closeDrop();
    });

    dropItem.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", closeDrop);
    });
  }

  /* ---------- Escape closes overlays ---------- */
  document.addEventListener("keydown", function (event) {
    if (event.key !== "Escape") return;
    if (nav && nav.classList.contains("is-open")) {
      setNav(false);
      if (navToggle) navToggle.focus();
    }
    closeDrop();
  });

  /* ---------- Scroll reveal ---------- */
  var revealItems = Array.prototype.slice.call(document.querySelectorAll(".reveal"));
  if (revealItems.length) {
    if ("IntersectionObserver" in window) {
      var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.1, rootMargin: "0px 0px -40px 0px" });
      revealItems.forEach(function (item) { observer.observe(item); });
    } else {
      revealItems.forEach(function (item) { item.classList.add("is-visible"); });
    }
  }

  /* ---------- Gallery lightbox ---------- */
  var galleryItems = Array.prototype.slice.call(document.querySelectorAll("[data-lightbox]"));
  var lightbox = null;
  var lightboxImg = null;
  var lightboxCaption = null;
  var lightboxCount = null;
  var lastFocused = null;
  var currentIndex = 0;

  function buildLightbox() {
    lightbox = document.createElement("div");
    lightbox.className = "lightbox";
    lightbox.setAttribute("role", "dialog");
    lightbox.setAttribute("aria-modal", "true");
    lightbox.setAttribute("aria-label", "Gallery image viewer");
    lightbox.innerHTML =
      '<button class="lightbox__btn lightbox__close" type="button" aria-label="Close gallery">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>' +
      "</button>" +
      '<button class="lightbox__btn lightbox__nav lightbox__prev" type="button" aria-label="Previous image">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>' +
      "</button>" +
      '<figure class="lightbox__figure">' +
        '<img class="lightbox__img" alt="">' +
        '<figcaption class="lightbox__caption"></figcaption>' +
      "</figure>" +
      '<button class="lightbox__btn lightbox__nav lightbox__next" type="button" aria-label="Next image">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg>' +
      "</button>" +
      '<p class="lightbox__count" aria-live="polite"></p>';

    document.body.appendChild(lightbox);
    lightboxImg = lightbox.querySelector(".lightbox__img");
    lightboxCaption = lightbox.querySelector(".lightbox__caption");
    lightboxCount = lightbox.querySelector(".lightbox__count");

    lightbox.querySelector(".lightbox__close").addEventListener("click", closeLightbox);
    lightbox.querySelector(".lightbox__prev").addEventListener("click", function (e) { e.stopPropagation(); step(-1); });
    lightbox.querySelector(".lightbox__next").addEventListener("click", function (e) { e.stopPropagation(); step(1); });
    lightbox.addEventListener("click", function (event) {
      if (event.target === lightbox) closeLightbox();
    });
  }

  function renderLightbox() {
    if (!galleryItems.length) return;
    var item = galleryItems[currentIndex];
    var full = item.getAttribute("data-full") || item.getAttribute("href") || "";
    var caption = item.getAttribute("data-caption") || "";
    lightboxImg.src = full;
    lightboxImg.alt = caption;
    lightboxCaption.textContent = caption;
    lightboxCount.textContent = (currentIndex + 1) + " / " + galleryItems.length;
  }

  function openLightbox(index, trigger) {
    if (!lightbox) buildLightbox();
    lastFocused = trigger || document.activeElement;
    currentIndex = index;
    renderLightbox();
    lightbox.classList.add("is-open");
    document.body.classList.add("nav-open");
    lightbox.querySelector(".lightbox__close").focus();
  }

  function closeLightbox() {
    if (!lightbox) return;
    lightbox.classList.remove("is-open");
    document.body.classList.remove("nav-open");
    lightboxImg.removeAttribute("src");
    if (lastFocused && typeof lastFocused.focus === "function") lastFocused.focus();
  }

  function step(direction) {
    if (!galleryItems.length) return;
    currentIndex = (currentIndex + direction + galleryItems.length) % galleryItems.length;
    renderLightbox();
  }

  if (galleryItems.length) {
    galleryItems.forEach(function (item, index) {
      item.addEventListener("click", function (event) {
        event.preventDefault();
        openLightbox(index, item);
      });
    });

    document.addEventListener("keydown", function (event) {
      if (!lightbox || !lightbox.classList.contains("is-open")) return;
      if (event.key === "Escape") closeLightbox();
      if (event.key === "ArrowLeft") step(-1);
      if (event.key === "ArrowRight") step(1);
    });
  }

  /* ---------- Footer year ---------- */
  document.querySelectorAll("[data-year]").forEach(function (el) {
    el.textContent = String(new Date().getFullYear());
  });

  /* ---------- Back to top ---------- */
  document.querySelectorAll("[data-to-top]").forEach(function (button) {
    button.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  });
})();
