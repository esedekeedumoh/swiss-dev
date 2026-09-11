const { app, BrowserWindow } = require("electron");
const { spawn } = require("child_process");
const path = require("path");

const port = 3210;
let nextServer;

function startNextServer() {
  const serverPath = path.join(
    process.resourcesPath,
    "app",
    ".next",
    "standalone",
    "server.js",
  );
  nextServer = spawn(process.execPath, [serverPath], {
    env: {
      ...process.env,
      ELECTRON_RUN_AS_NODE: "1",
      PORT: String(port),
      HOSTNAME: "127.0.0.1",
    },
    windowsHide: true,
  });
}

function createWindow() {
  const window = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 1100,
    minHeight: 700,
    backgroundColor: "#0b0d12",
    webPreferences: {
      contextIsolation: true,
      sandbox: true,
    },
  });

  window.loadURL(`http://127.0.0.1:${port}`);
}

app.whenReady().then(() => {
  if (app.isPackaged) {
    startNextServer();
    setTimeout(createWindow, 800);
  } else {
    createWindow();
  }
});

app.on("window-all-closed", () => {
  if (nextServer) nextServer.kill();
  if (process.platform !== "darwin") app.quit();
});

app.on("before-quit", () => {
  if (nextServer) nextServer.kill();
});