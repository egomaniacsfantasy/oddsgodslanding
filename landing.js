(function () {
  const menuBtn = document.getElementById("menu-btn");
  const navLinks = document.getElementById("nav-links");
  const nav = document.getElementById("site-nav");

  if (menuBtn && navLinks) {
    menuBtn.addEventListener("click", () => {
      const isOpen = navLinks.classList.toggle("is-open");
      menuBtn.setAttribute("aria-expanded", String(isOpen));
    });
  }

  if (nav) {
    const onScroll = () => {
      nav.classList.toggle("is-scrolled", window.scrollY > 8);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  const revealTargets = Array.from(document.querySelectorAll("[data-reveal]"));
  if ("IntersectionObserver" in window && revealTargets.length) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.14 }
    );

    revealTargets.forEach((target) => {
      target.classList.add("reveal-on-scroll");
      observer.observe(target);
    });
  } else {
    revealTargets.forEach((target) => target.classList.add("is-visible"));
  }

  const flipSlots = Array.from(document.querySelectorAll(".flip-slot"));
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const runFlip = (slot) => {
    if (!(slot instanceof HTMLElement)) return;
    if (prefersReducedMotion) return;
    slot.classList.remove("is-flipping");
    void slot.offsetWidth;
    slot.classList.add("is-flipping");
    window.setTimeout(() => slot.classList.remove("is-flipping"), 380);
  };

  flipSlots.forEach((slot) => {
    runFlip(slot);
    if (!("IntersectionObserver" in window)) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          runFlip(slot);
        });
      },
      { threshold: 0.5 }
    );
    observer.observe(slot);
  });

  const waitlistForm = document.querySelector("[data-waitlist-form]");
  const waitlistStatus = document.querySelector("[data-waitlist-status]");

  if (waitlistForm instanceof HTMLFormElement && waitlistStatus instanceof HTMLElement) {
    waitlistForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const emailInput = waitlistForm.querySelector('input[type="email"]');
      const email = emailInput instanceof HTMLInputElement ? emailInput.value.trim() : "";

      if (!email) {
        waitlistStatus.textContent = "Enter an email address to hold your place.";
        return;
      }

      const stored = JSON.parse(localStorage.getItem("oddsgods_waitlist_preview") || "[]");
      const next = Array.isArray(stored) ? stored : [];
      next.push({ email, savedAt: new Date().toISOString() });
      localStorage.setItem("oddsgods_waitlist_preview", JSON.stringify(next));

      waitlistStatus.textContent =
        "Saved in this browser for preview review. Connect the live capture endpoint before launch.";

      if (emailInput instanceof HTMLInputElement) {
        emailInput.value = "";
      }
    });
  }
})();
