import { contextBridge } from "electron";

contextBridge.exposeInMainWorld("vitaViewDesktop", {
  isDesktop: true,
  platform: process.platform,
  electronVersion: process.versions.electron,
});
