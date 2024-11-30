import osUtils from "os-utils";
import fs from "fs";
import os from "os";
import { BrowserWindow } from "electron";

const POLLING_INTERVAL = 500; // ms

export function pollResources(mainWindow: BrowserWindow) {
  setInterval(async () => {
    const cpuUsage = await getCpuUsage();
    const ramUsage = getRamUsage();
    const storageUsage = getStorageUsage();
    mainWindow.webContents.send("statistics", {
      cpuUsage,
      ramUsage,
      storageUsage,
    });
  }, POLLING_INTERVAL);
}

export function getBasicInfo() {
  const totalStorage = getStorageUsage().total;
  const totalMemory = Math.ceil(osUtils.totalmem() / 1024);
  const cpuModel = os.cpus()[0].model.trim();
  return { totalStorage, totalMemory, cpuModel };
}

function getCpuUsage() {
  return new Promise((resolve) => {
    osUtils.cpuUsage(resolve);
  });
}

function getRamUsage() {
  return 1 - osUtils.freememPercentage();
}

function getStorageUsage() {
  const rootPath = process.platform === "win32" ? "C:\\" : "/";

  const stats = fs.statfsSync(rootPath);

  // Calculate total, free, and used storage in bytes
  const total = stats.bsize * stats.blocks;
  const free = stats.bsize * stats.bavail; // Use bavail for available space to non-root users
  const used = total - free;

  // Convert bytes to gigabytes
  const totalGB = (total / 1_000_000_000).toFixed(2);
  const usedGB = (used / 1_000_000_000).toFixed(2);
  const freeGB = (free / 1_000_000_000).toFixed(2);

  // Return results
  return {
    total: parseFloat(totalGB),
    used: parseFloat(usedGB),
    free: parseFloat(freeGB),
    usage: parseFloat((used / total).toFixed(4)), // Usage percentage as a decimal
  };
}
