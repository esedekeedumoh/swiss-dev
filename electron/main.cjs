const { app, BrowserWindow } = require("electron");
const { spawn } = require("child_process");
const path = require("path");
const http = require("http");
const fs = require("fs");

const port = 3210;
let nextServer;

function startNextServer() {
  const serverCandidates = [
    path.join(process.resourcesPath, "app.asar.unpacked", ".next", "standalone", "server.js"),
    path.join(process.resourcesPath, "app.asar", ".next", "standalone", "server.js"),
    path.join(app.getAppPath(), ".next", "standalone", "server.js"),
  ];
  const serverPath = serverCandidates.find((candidate) => fs.existsSync(candidate));
  if (!serverPath) throw new Error(`Bundled server not found. Checked: ${serverCandidates.join(", ")}`);
  nextServer = spawn(process.execPath, [serverPath], {
    cwd: path.dirname(serverPath),
    env: {
      ...process.env,
      ELECTRON_RUN_AS_NODE: "1",
      PORT: String(port),
      HOSTNAME: "127.0.0.1",
    },
    windowsHide: true,
  });
  nextServer.on("error", (error) => console.error("Swiss server failed:", error));
  nextServer.on("exit", (code, signal) => {
    if (code !== 0) console.error(`Swiss server exited with code ${code || "unknown"}${signal ? ` (${signal})` : ""}`);
  });
  nextServer.stdout?.on("data", (data) => console.log(String(data)));
  nextServer.stderr?.on("data", (data) => console.error(String(data)));
}

function waitForServer(url, attempts = 60) {
  return new Promise((resolve, reject) => {
    const check = () => {
      const request = http.get(url, (response) => {
        response.resume();
        if (response.statusCode && response.statusCode < 500) {
          resolve();
          return;
        }
        retry();
      });
      request.on("error", retry);
      request.setTimeout(1000, () => {
        request.destroy();
        retry();
      });
    };
    const retry = () => {
      if (--attempts <= 0) reject(new Error(`Swiss server did not start at ${url}`));
      else setTimeout(check, 250);
    };
    check();
  });
}

function createWindow(url) {
  const window = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 1100,
    minHeight: 700,
    backgroundColor: "#0b0d12",
    title: "Swiss Dev",
    webPreferences: {
      contextIsolation: true,
      sandbox: true,
    },
  });

  window.webContents.setWindowOpenHandler(({ url: guestUrl }) => {
    const guest = new BrowserWindow({
      width: 1280,
      height: 820,
      title: "Swiss Dev Preview",
      backgroundColor: "#0b0d12",
      webPreferences: {
        contextIsolation: true,
        sandbox: true,
        partition: "persist:swiss-guest",
      },
    });
    guest.loadURL(guestUrl).catch((error) => console.error("Swiss guest browser failed:", error));
    return { action: "deny" };
  });

  window.loadURL(url).catch((error) => {
    const message = encodeURIComponent(`Swiss Dev could not open its local server: ${error.message}`);
    window.loadURL(`data:text/html,<h1>Swiss Dev failed to open</h1><p>${message}</p>`);
  });
}

app.whenReady().then(() => {
  app.setAppUserModelId("com.swissdev.desktop");
  if (app.isPackaged) {
    try {
      startNextServer();
    } catch (error) {
      console.error(error);
      createWindow(`data:text/html,<h1>Swiss Dev failed to start</h1><p>${encodeURIComponent(error.message)}</p>`);
      return;
    }
    waitForServer(`http://127.0.0.1:${port}`)
      .then(() => createWindow(`http://127.0.0.1:${port}`))
      .catch((error) => {
        console.error(error);
        createWindow(`data:text/html,<h1>Swiss Dev failed to start</h1><p>${encodeURIComponent(error.message)}</p>`);
      });
  } else {
    createWindow("http://localhost:3000");
  }
});

app.on("window-all-closed", () => {
  if (nextServer) nextServer.kill();
  if (process.platform !== "darwin") app.quit();
});

app.on("before-quit", () => {
  if (nextServer) nextServer.kill();
});