'use strict';
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  getConfig:           ()       => ipcRenderer.invoke('get-config'),
  saveConfig:          (cfg)    => ipcRenderer.invoke('save-config', cfg),
  checkPassword:       (pw)     => ipcRenderer.invoke('check-password', pw),
  setPassword:         (pw)     => ipcRenderer.invoke('set-password', pw),
  removePassword:      (pw)     => ipcRenderer.invoke('remove-password', pw),
  openSettings:        ()       => ipcRenderer.invoke('open-settings'),
  openScreenTime:      ()       => ipcRenderer.invoke('open-screentime'),
  getScreenTimeStatus: ()       => ipcRenderer.invoke('get-screentime-status'),
  addTime:             (mins)   => ipcRenderer.invoke('add-time', mins),
  closeNotification:   ()       => ipcRenderer.invoke('close-notification'),
  getBlockedCount:     ()       => ipcRenderer.invoke('get-blocked-count'),
  confirmExit:         ()       => ipcRenderer.send('confirmed-exit'),

  // Renderer → Main events (one-way)
  onNotification: (cb) => ipcRenderer.on('update-notification', (_e, d) => cb(d)),
  onTimeTick:     (cb) => ipcRenderer.on('time-tick',           (_e, d) => cb(d)),
  onConfigChanged:(cb) => ipcRenderer.on('config-changed',      (_e, d) => cb(d)),
});
