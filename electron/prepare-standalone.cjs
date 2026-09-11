const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const standalone = path.join(root, ".next", "standalone");

function copyDirectory(source, destination) {
  fs.cpSync(source, destination, { recursive: true, force: true });
}

copyDirectory(path.join(root, ".next", "static"), path.join(standalone, ".next", "static"));
copyDirectory(path.join(root, "public"), path.join(standalone, "public"));