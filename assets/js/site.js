/* WAKA — progressive enhancement only. The site is fully usable without it. */
(() => {
  "use strict";

  const head = document.querySelector("[data-head]");
  const menuBtn = document.querySelector("[data-menu-btn]");
  const mobileNav = document.querySelector("[data-mobile-nav]");
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* --- Sticky header state ------------------------------------------- */
  if (head) {
    let ticking = false;
    const update = () => {
      head.classList.toggle("is-stuck", window.scrollY > 24);
      ticking = false;
    };
    update();
    window.addEventListener(
      "scroll",
      () => {
        if (!ticking) {
          ticking = true;
          requestAnimationFrame(update);
        }
      },
      { passive: true }
    );
  }

  /* --- Mobile menu --------------------------------------------------- */
  if (menuBtn && mobileNav) {
    const setOpen = (open) => {
      menuBtn.setAttribute("aria-expanded", String(open));
      mobileNav.hidden = !open;
      document.body.style.overflow = open ? "hidden" : "";
      if (head) head.classList.toggle("is-stuck", open || window.scrollY > 24);
    };

    menuBtn.addEventListener("click", () => {
      setOpen(menuBtn.getAttribute("aria-expanded") !== "true");
    });

    mobileNav.addEventListener("click", (e) => {
      if (e.target.closest("a")) setOpen(false);
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && menuBtn.getAttribute("aria-expanded") === "true") {
        setOpen(false);
        menuBtn.focus();
      }
    });

    window.matchMedia("(min-width: 1181px)").addEventListener("change", (e) => {
      if (e.matches) setOpen(false);
    });
  }

  /* --- Stagger children of a list (must run BEFORE the observer) ----- */
  document.querySelectorAll("[data-stagger]").forEach((parent) => {
    Array.from(parent.children).forEach((child, i) => {
      child.style.setProperty("--i", i);
      child.setAttribute("data-reveal", "");
    });
  });

  /* --- Scroll reveals ------------------------------------------------ */
  const revealables = Array.from(document.querySelectorAll("[data-reveal]"));

  if (revealables.length) {
    if (reduce || !("IntersectionObserver" in window)) {
      revealables.forEach((el) => el.classList.add("is-in"));
    } else {
      const io = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (!entry.isIntersecting) continue;
            entry.target.classList.add("is-in");
            io.unobserve(entry.target);
          }
        },
        // No negative root margin: a section that is even partly on screen
        // must reveal, otherwise tall mobile cards can never cross 6%.
        { rootMargin: "0px 0px 0px 0px", threshold: 0 }
      );
      revealables.forEach((el) => io.observe(el));

      // Anything already in view on first paint reveals immediately.
      requestAnimationFrame(() => {
        revealables.forEach((el) => {
          const r = el.getBoundingClientRect();
          if (r.top < window.innerHeight && r.bottom > 0) el.classList.add("is-in");
        });
      });
    }
  }

  /* --- Accordion: allow only one open per group (nice-to-have) ------- */
  document.querySelectorAll(".faq").forEach((group) => {
    group.addEventListener("toggle", (e) => {
      const item = e.target;
      if (!(item instanceof HTMLDetailsElement) || !item.open) return;
      group.querySelectorAll("details[open]").forEach((other) => {
        if (other !== item) other.open = false;
      });
    });
  });

  /* --- Contact form: compose a mailto so a static site can still work  */
  const form = document.querySelector("[data-contact-form]");
  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const data = new FormData(form);
      const name = (data.get("name") || "").toString().trim();
      const email = (data.get("email") || "").toString().trim();
      const topic = (data.get("topic") || "General").toString();
      const message = (data.get("message") || "").toString().trim();
      const body = [`Name: ${name}`, `Email: ${email}`, `Topic: ${topic}`, "", message].join("\n");
      const href = `mailto:info@wakaglobal.com?subject=${encodeURIComponent(
        `[Website] ${topic} — ${name || "Enquiry"}`
      )}&body=${encodeURIComponent(body)}`;
      window.location.href = href;
      const status = form.querySelector("[data-form-status]");
      if (status) {
        status.textContent = "Opening your email app… If nothing happens, write to info@wakaglobal.com.";
        status.hidden = false;
      }
    });
  }
})();
