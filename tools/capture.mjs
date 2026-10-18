import fs from "node:fs/promises";

const [
  output = "preview-full.png",
  widthArg = "1440",
  heightArg = "1000",
  captureYArg = "",
  captureHeightArg = "",
  uiArg = "",
] = process.argv.slice(2);
const width = Number(widthArg);
const height = Number(heightArg);
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

socket.addEventListener("message", (event) => {
  const message = JSON.parse(event.data);
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
  width,
  height,
  deviceScaleFactor: 1,
  mobile: width < 700,
});
await send("Page.navigate", { url: "file:///D:/codex-list/index.html" });
await new Promise((resolve) => setTimeout(resolve, 2600));

if (uiArg === "dialog") {
  await send("Runtime.evaluate", {
    expression: `document.querySelector("[data-open-reservation]").click()`,
  });
  await new Promise((resolve) => setTimeout(resolve, 500));
} else if (uiArg === "lightbox") {
  await send("Runtime.evaluate", {
    expression: `document.querySelector("[data-lightbox]").click()`,
  });
  await new Promise((resolve) => setTimeout(resolve, 500));
} else if (uiArg === "mobilemenu") {
  await send("Runtime.evaluate", {
    expression: `document.querySelector("[data-menu-toggle]").click()`,
  });
  await new Promise((resolve) => setTimeout(resolve, 800));
}

await send("Runtime.evaluate", {
  expression: `(async () => {
    document.querySelectorAll("img[loading='lazy']").forEach((image) => { image.loading = "eager"; });
    document.querySelectorAll(".reveal").forEach((element) => element.classList.add("is-visible"));
    const fullHeight = document.documentElement.scrollHeight;
    for (let y = 0; y < fullHeight; y += 650) {
      window.scrollTo(0, y);
      await new Promise((resolve) => setTimeout(resolve, 60));
    }
    window.scrollTo(0, 0);
    await Promise.all(Array.from(document.images).map((image) => image.decode().catch(() => {})));
  })()`,
  awaitPromise: true,
});
await new Promise((resolve) => setTimeout(resolve, 650));

const metrics = await send("Runtime.evaluate", {
  expression: `({ width: document.documentElement.scrollWidth, height: document.documentElement.scrollHeight })`,
  returnByValue: true,
});
const sections = await send("Runtime.evaluate", {
  expression: `Array.from(document.querySelectorAll("main > section")).map((section) => ({
    id: section.id || section.className.split(" ")[0],
    top: Math.round(section.offsetTop),
    height: Math.round(section.offsetHeight)
  }))`,
  returnByValue: true,
});
console.log(JSON.stringify(sections.result.value));
const pageHeight = Math.min(metrics.result.value.height, 16000);
const captureY = captureYArg ? Number(captureYArg) : 0;
const captureHeight = uiArg
  ? Math.min(height, pageHeight - captureY)
  : captureHeightArg
    ? Math.min(Number(captureHeightArg), pageHeight - captureY)
    : pageHeight;

const screenshot = await send("Page.captureScreenshot", {
  format: "png",
  fromSurface: true,
  captureBeyondViewport: true,
  clip: { x: 0, y: captureY, width, height: captureHeight, scale: 1 },
});

await fs.writeFile(output, Buffer.from(screenshot.data, "base64"));
socket.close();
console.log(`${output}: ${width}x${captureHeight} (page ${pageHeight}px)`);
