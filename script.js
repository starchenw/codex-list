document.documentElement.classList.add("js");

const header = document.querySelector("[data-header]");
const menuToggle = document.querySelector("[data-menu-toggle]");
const mobileMenu = document.querySelector("[data-mobile-menu]");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function setHeaderState() {
  if (!header) return;
  header.classList.toggle("is-scrolled", window.scrollY > 28);
}

setHeaderState();
window.addEventListener("scroll", setHeaderState, { passive: true });

function closeMobileMenu() {
  if (!menuToggle || !mobileMenu) return;
  menuToggle.setAttribute("aria-expanded", "false");
  menuToggle.querySelector(".sr-only").textContent = "打开菜单";
  mobileMenu.classList.remove("is-open");
  mobileMenu.setAttribute("aria-hidden", "true");
  header.classList.remove("is-menu-open");
  document.body.classList.remove("menu-open");
}

if (menuToggle && mobileMenu) {
  menuToggle.addEventListener("click", () => {
    const isOpen = menuToggle.getAttribute("aria-expanded") === "true";

    if (isOpen) {
      closeMobileMenu();
      return;
    }

    menuToggle.setAttribute("aria-expanded", "true");
    menuToggle.querySelector(".sr-only").textContent = "关闭菜单";
    mobileMenu.classList.add("is-open");
    mobileMenu.setAttribute("aria-hidden", "false");
    header.classList.add("is-menu-open");
    document.body.classList.add("menu-open");
  });

  mobileMenu.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", closeMobileMenu);
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 960) closeMobileMenu();
  });
}

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && mobileMenu?.classList.contains("is-open")) {
    closeMobileMenu();
    menuToggle?.focus();
  }
});

const revealElements = document.querySelectorAll(".reveal");

if ("IntersectionObserver" in window && !reduceMotion) {
  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    {
      threshold: 0.08,
      rootMargin: "0px 0px -40px",
    }
  );

  revealElements.forEach((element) => revealObserver.observe(element));
} else {
  revealElements.forEach((element) => element.classList.add("is-visible"));
}

const parallaxImage = document.querySelector("[data-parallax]");
let parallaxTicking = false;

function updateParallax() {
  if (!parallaxImage || reduceMotion) return;
  const offset = Math.min(window.scrollY * 0.11, 90);
  parallaxImage.style.transform = `translate3d(0, ${offset}px, 0) scale(1.04)`;
  parallaxTicking = false;
}

if (parallaxImage && !reduceMotion) {
  window.addEventListener(
    "scroll",
    () => {
      if (parallaxTicking) return;
      parallaxTicking = true;
      requestAnimationFrame(updateParallax);
    },
    { passive: true }
  );
}

/* Menu tabs */
const menuTabs = Array.from(document.querySelectorAll("[data-menu-tab]"));
const menuPanels = Array.from(document.querySelectorAll("[data-menu-panel]"));

function activateMenuTab(tab, moveFocus = false) {
  menuTabs.forEach((item) => {
    const isActive = item === tab;
    item.setAttribute("aria-selected", String(isActive));
    item.tabIndex = isActive ? 0 : -1;
  });

  menuPanels.forEach((panel) => {
    const isActive = panel.id === tab.getAttribute("aria-controls");
    panel.hidden = !isActive;
    panel.classList.toggle("is-active", isActive);
  });

  if (moveFocus) tab.focus();
}

menuTabs.forEach((tab, index) => {
  tab.addEventListener("click", () => activateMenuTab(tab));
  tab.addEventListener("keydown", (event) => {
    let targetIndex = index;

    if (event.key === "ArrowRight") targetIndex = (index + 1) % menuTabs.length;
    else if (event.key === "ArrowLeft") targetIndex = (index - 1 + menuTabs.length) % menuTabs.length;
    else if (event.key === "Home") targetIndex = 0;
    else if (event.key === "End") targetIndex = menuTabs.length - 1;
    else return;

    event.preventDefault();
    activateMenuTab(menuTabs[targetIndex], true);
  });
});

/* Local date defaults */
function getLocalDate(offsetDays = 0) {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function prepareDateInputs() {
  document.querySelectorAll("[data-date-input]").forEach((input) => {
    input.min = getLocalDate(0);
    if (!input.value) input.value = getLocalDate(1);
  });
}

prepareDateInputs();

function formatReservationDate(value) {
  if (!value) return "";
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return new Intl.DateTimeFormat("zh-CN", {
    month: "long",
    day: "numeric",
    weekday: "short",
  }).format(date);
}

/* Reservation dialogs */
const reservationDialog = document.querySelector("[data-reservation-dialog]");
const openDialogButtons = document.querySelectorAll("[data-open-reservation]");
const closeDialogButton = document.querySelector("[data-close-dialog]");

function openReservationDialog() {
  closeMobileMenu();
  if (!reservationDialog) return;

  if (dialogForm && dialogSuccess) {
    dialogForm.reset();
    dialogForm.hidden = false;
    dialogSuccess.hidden = true;
  }

  prepareDateInputs();
  document.body.classList.add("dialog-open");
  reservationDialog.showModal();
  window.setTimeout(() => dialogForm?.elements.name.focus(), 50);
}

function closeReservationDialog() {
  if (reservationDialog?.open) reservationDialog.close();
}

openDialogButtons.forEach((button) => {
  button.addEventListener("click", openReservationDialog);
});

closeDialogButton?.addEventListener("click", closeReservationDialog);

reservationDialog?.addEventListener("click", (event) => {
  if (event.target === reservationDialog) closeReservationDialog();
});

reservationDialog?.addEventListener("close", () => {
  if (!document.querySelector("[data-lightbox-dialog]")?.open) {
    document.body.classList.remove("dialog-open");
  }
});

/* Forms */
function validateForm(form) {
  let firstInvalid = null;

  form.querySelectorAll("input, select").forEach((field) => {
    field.removeAttribute("aria-invalid");
    if (!field.checkValidity()) {
      field.setAttribute("aria-invalid", "true");
      if (!firstInvalid) firstInvalid = field;
    }
  });

  if (firstInvalid) {
    firstInvalid.focus();
    showToast("请填写完整的订座信息");
    return false;
  }

  return true;
}

function handleReservationSubmit(form, successPanel, successCopy, resetButton) {
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!validateForm(form)) return;

    const data = new FormData(form);
    const name = String(data.get("name") || "").trim();
    const date = formatReservationDate(String(data.get("date") || ""));
    const time = String(data.get("time") || "");
    const guests = String(data.get("guests") || "");

    successCopy.textContent = `${name}，已记录您 ${date} ${time}、${guests}的订座申请。我们会在 30 分钟内致电确认。`;
    form.hidden = true;
    successPanel.hidden = false;
    successPanel.scrollIntoView({ block: "nearest", behavior: reduceMotion ? "auto" : "smooth" });
    successPanel.querySelector("h3")?.focus?.();
    showToast("订座申请已收到");

    resetButton.dataset.name = name;
  });
}

const mainForm = document.querySelector("[data-reservation-form]");
const mainSuccess = document.querySelector("[data-reservation-success]");
const mainSuccessCopy = document.querySelector("[data-success-copy]");
const mainReset = document.querySelector("[data-reset-reservation]");

if (mainForm && mainSuccess && mainSuccessCopy && mainReset) {
  handleReservationSubmit(mainForm, mainSuccess, mainSuccessCopy, mainReset);

  mainReset.addEventListener("click", () => {
    mainForm.reset();
    prepareDateInputs();
    mainSuccess.hidden = true;
    mainForm.hidden = false;
    mainForm.querySelector("input")?.focus();
  });
}

const dialogForm = document.querySelector("[data-dialog-form]");
const dialogSuccess = document.querySelector("[data-dialog-success]");
const dialogSuccessCopy = document.querySelector("[data-dialog-success-copy]");
const dialogReset = document.querySelector("[data-reset-dialog]");

if (dialogForm && dialogSuccess && dialogSuccessCopy && dialogReset) {
  handleReservationSubmit(dialogForm, dialogSuccess, dialogSuccessCopy, dialogReset);

  dialogReset.addEventListener("click", () => {
    dialogForm.reset();
    prepareDateInputs();
    dialogSuccess.hidden = true;
    dialogForm.hidden = false;
    dialogForm.querySelector("input")?.focus();
  });
}

/* Gallery lightbox */
const lightboxDialog = document.querySelector("[data-lightbox-dialog]");
const lightboxImage = document.querySelector("[data-lightbox-image]");
const closeLightboxButton = document.querySelector("[data-close-lightbox]");

document.querySelectorAll("[data-lightbox]").forEach((button) => {
  button.addEventListener("click", () => {
    if (!lightboxDialog || !lightboxImage) return;
    const source = button.dataset.lightbox;
    const image = button.querySelector("img");
    lightboxImage.src = source;
    lightboxImage.alt = image?.alt || "餐厅空间大图";
    document.body.classList.add("dialog-open");
    lightboxDialog.showModal();
  });
});

function closeLightbox() {
  if (lightboxDialog?.open) lightboxDialog.close();
}

closeLightboxButton?.addEventListener("click", closeLightbox);

lightboxDialog?.addEventListener("click", (event) => {
  if (event.target === lightboxDialog) closeLightbox();
});

lightboxDialog?.addEventListener("close", () => {
  if (!reservationDialog?.open) document.body.classList.remove("dialog-open");
});

/* Toast */
const toast = document.querySelector("[data-toast]");
let toastTimer;

function showToast(message) {
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("is-visible");
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => {
    toast.classList.remove("is-visible");
  }, 3200);
}

/* Active navigation */
const navLinks = Array.from(document.querySelectorAll(".desktop-nav a"));
const navSections = navLinks
  .map((link) => document.querySelector(link.getAttribute("href")))
  .filter(Boolean);

if ("IntersectionObserver" in window && navSections.length) {
  const navObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        navLinks.forEach((link) => {
          link.classList.toggle("is-active", link.getAttribute("href") === `#${entry.target.id}`);
        });
      });
    },
    { rootMargin: "-38% 0px -52% 0px" }
  );

  navSections.forEach((section) => navObserver.observe(section));
}
