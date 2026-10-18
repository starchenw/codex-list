const targets = await fetch("http://127.0.0.1:9222/json/list").then((response) => response.json());
const page = targets.find((target) => target.type === "page");

if (!page) throw new Error("No debuggable browser page found.");

const socket = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((resolve, reject) => {
  socket.addEventListener("open", resolve, { once: true });
  socket.addEventListener("error", reject, { once: true });
});

let requestId = 0;
const pending = new Map();
const runtimeErrors = [];

socket.addEventListener("message", (event) => {
  const message = JSON.parse(event.data);

  if (message.method === "Runtime.exceptionThrown") {
    runtimeErrors.push(message.params.exceptionDetails.text);
  }

  const request = pending.get(message.id);
  if (!request) return;
  pending.delete(message.id);
  if (message.error) request.reject(new Error(message.error.message));
  else request.resolve(message.result);
});

function send(method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = ++requestId;
    pending.set(id, { resolve, reject });
    socket.send(JSON.stringify({ id, method, params }));
  });
}

await send("Page.enable");
await send("Runtime.enable");
await send("Emulation.setDeviceMetricsOverride", {
  width: 1440,
  height: 1000,
  deviceScaleFactor: 1,
  mobile: false,
});
await send("Page.navigate", { url: "file:///D:/codex-list/index.html" });
await new Promise((resolve) => setTimeout(resolve, 1800));

const desktop = await send("Runtime.evaluate", {
  expression: `(async () => {
    const result = {};
    document.querySelectorAll("img[loading='lazy']").forEach((image) => { image.loading = "eager"; });
    await new Promise((resolve) => setTimeout(resolve, 800));

    const images = Array.from(document.images);
    result.imageFailures = images.filter((image) => !image.complete || image.naturalWidth === 0).map((image) => image.getAttribute("src"));

    const tabs = Array.from(document.querySelectorAll("[data-menu-tab]"));
    result.menuTabs = [];
    for (const tab of tabs) {
      tab.click();
      await new Promise((resolve) => setTimeout(resolve, 30));
      const panel = document.getElementById(tab.getAttribute("aria-controls"));
      result.menuTabs.push({ tab: tab.textContent.trim(), selected: tab.getAttribute("aria-selected") === "true", panelVisible: !panel.hidden });
    }

    document.querySelector("[data-open-reservation]").click();
    await new Promise((resolve) => setTimeout(resolve, 80));
    result.dialogOpened = document.querySelector("[data-reservation-dialog]").open;

    const form = document.querySelector("[data-dialog-form]");
    form.elements.name.value = "林小姐";
    form.elements.phone.value = "13800138000";
    form.elements.date.value = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
    form.elements.time.value = "19:00";
    form.elements.guests.value = "2 位";
    form.elements.consent.checked = true;
    form.requestSubmit();
    await new Promise((resolve) => setTimeout(resolve, 100));
    result.formSuccess = !document.querySelector("[data-dialog-success]").hidden && form.hidden;
    result.successCopy = document.querySelector("[data-dialog-success-copy]").textContent;

    document.querySelector("[data-close-dialog]").click();
    await new Promise((resolve) => setTimeout(resolve, 80));
    result.dialogClosed = !document.querySelector("[data-reservation-dialog]").open;

    document.querySelector("[data-lightbox]").click();
    await new Promise((resolve) => setTimeout(resolve, 80));
    result.lightboxOpened = document.querySelector("[data-lightbox-dialog]").open;
    document.querySelector("[data-close-lightbox]").click();

    return result;
  })()`,
  awaitPromise: true,
  returnByValue: true,
});

await send("Emulation.setDeviceMetricsOverride", {
  width: 390,
  height: 844,
  deviceScaleFactor: 1,
  mobile: true,
});
await send("Runtime.evaluate", { expression: "window.dispatchEvent(new Event('resize'))" });
await new Promise((resolve) => setTimeout(resolve, 250));

const mobile = await send("Runtime.evaluate", {
  expression: `(async () => {
    const toggle = document.querySelector("[data-menu-toggle]");
    toggle.click();
    await new Promise((resolve) => setTimeout(resolve, 80));
    const menu = document.querySelector("[data-mobile-menu]");
    const result = {
      menuOpen: menu.classList.contains("is-open") && toggle.getAttribute("aria-expanded") === "true",
      menuVisible: getComputedStyle(menu).visibility === "visible",
      overflowLocked: getComputedStyle(document.body).overflow === "hidden"
    };
    document.querySelector("[data-mobile-menu] a").click();
    result.menuClosesOnLink = !menu.classList.contains("is-open");
    return result;
  })()`,
  awaitPromise: true,
  returnByValue: true,
});

console.log(JSON.stringify({ desktop: desktop.result.value, mobile: mobile.result.value, runtimeErrors }, null, 2));
socket.close();
