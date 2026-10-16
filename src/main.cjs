const { app, BrowserWindow, Menu, ipcMain, shell, dialog } = require('electron');
const path = require('node:path');

let engine = null;

const isZh = () => (app.getLocale() || '').toLowerCase().startsWith('zh');

function createWindow() {
  const win = new BrowserWindow({
    width: 1120,
    height: 720,
    minWidth: 880,
    minHeight: 560,
    title: 'US Tariff Lookup',
    backgroundColor: '#f8fafc',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      spellcheck: false,
    },
  });
  win.once('ready-to-show', () => win.show());
  win.loadFile(path.join(__dirname, 'renderer', 'index.html'));
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:/i.test(url)) shell.openExternal(url);
    return { action: 'deny' };
  });
  return win;
}

function showAbout(win) {
  const zh = isZh();
  const ruleset = engine ? engine.rulesetSeed : null;
  const lines = engine
    ? [
        `App v${app.getVersion()} · Engine us-tariff-lookup (ruleset ${ruleset.version}, as of ${ruleset.asOf})`,
        zh
          ? `内置 ${ruleset.mfn.length} 条高频 HTS 编码 · 全球 301 ${ruleset.global301.tiers.length} 档 · 对华 301 ${ruleset.china301.length} 条 · 232 措施 ${ruleset.section232.length} 项`
          : `${ruleset.mfn.length} curated HTS codes · ${ruleset.global301.tiers.length} global-301 tiers · ${ruleset.china301.length} China-301 lines · ${ruleset.section232.length} Section-232 measures`,
        zh
          ? '全部数据内置本机，离线可用。税率行为估算值（sample/unverified），适用于报价测算，不用于正式报关。'
          : 'All data ships inside the app and works fully offline. Most rate lines carry sample/unverified flags — planning estimates, not certified for customs declarations.',
        'MIT License · © 2026 InvoiceTariff',
      ]
    : [zh ? '引擎加载中…' : 'Engine still loading…'];
  dialog.showMessageBox(win, {
    type: 'info',
    title: 'US Tariff Lookup',
    message: 'US Tariff Lookup v' + app.getVersion(),
    detail: lines.join('\n\n'),
    buttons: ['OK'],
  });
}

function menuTemplate(win) {
  const zh = isZh();
  const mac = process.platform === 'darwin';
  const aboutItem = {
    label: zh ? '关于 US Tariff Lookup' : 'About US Tariff Lookup',
    click: () => showAbout(win),
  };
  const template = [
    ...(mac
      ? [
          {
            label: app.name,
            submenu: [
              aboutItem,
              { type: 'separator' },
              { role: 'hide' },
              { role: 'hideOthers' },
              { role: 'unhide' },
              { type: 'separator' },
              { role: 'quit' },
            ],
          },
        ]
      : []),
    {
      label: zh ? '文件' : 'File',
      submenu: [mac ? { role: 'close' } : { role: 'quit' }],
    },
    { role: 'editMenu' },
    {
      label: zh ? '帮助' : 'Help',
      submenu: [
        ...(mac ? [] : [aboutItem, { type: 'separator' }]),
        {
          label: zh ? '网页版计算器' : 'Web calculator',
          click: () => shell.openExternal('https://invoicetariff.com/tariff-calculator'),
        },
        { label: 'GitHub', click: () => shell.openExternal('https://github.com/invoicetariff/us-tariff-lookup-desktop') },
        { label: 'npm · us-tariff-lookup', click: () => shell.openExternal('https://www.npmjs.com/package/us-tariff-lookup') },
      ],
    },
  ];
  return Menu.buildFromTemplate(template);
}

function normalizeCalcInput(raw) {
  const mode = ['sea', 'air', 'express', 'postal'].includes(raw.mode) ? raw.mode : 'sea';
  const value = Number(raw.value);
  const units = Math.floor(Number(raw.units));
  return {
    hts: String(raw.hts ?? '').replace(/\D/g, '').slice(0, 10),
    value: Number.isFinite(value) && value > 0 ? value : 0,
    originCountry: String(raw.originCountry ?? 'CN').toUpperCase().slice(0, 2),
    entryDate: /^\d{4}-\d{2}-\d{2}$/.test(String(raw.entryDate)) ? String(raw.entryDate) : new Date().toISOString().slice(0, 10),
    mode,
    units: Number.isFinite(units) && units >= 1 ? units : 1,
    locale: raw.locale === 'zh' ? 'zh' : 'en',
  };
}

function registerIpc() {
  ipcMain.handle('engine:search', (_e, q, limit) => {
    const query = String(q ?? '').slice(0, 80);
    const lim = Math.min(Math.max(parseInt(limit, 10) || 40, 1), 100);
    return engine.searchHts(engine.rulesetSeed, query, lim);
  });
  ipcMain.handle('engine:calc', (_e, raw) => {
    const input = normalizeCalcInput(raw || {});
    if (!input.hts || input.value <= 0) {
      const err = new Error('INVALID_INPUT');
      err.code = 'INVALID_INPUT';
      throw err;
    }
    return engine.calculateLandedCost(engine.rulesetSeed, input);
  });
  ipcMain.handle('engine:meta', () => {
    const s = engine.rulesetSeed;
    return {
      appVersion: app.getVersion(),
      rulesetVersion: s.version,
      asOf: s.asOf,
      mfnCount: s.mfn.length,
      global301Tiers: s.global301.tiers.length,
      china301Lines: s.china301.length,
      section232Measures: s.section232.length,
    };
  });
}

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    const [win] = BrowserWindow.getAllWindows();
    if (win) {
      if (win.isMinimized()) win.restore();
      win.focus();
    }
  });

  app.whenReady().then(async () => {
    engine = await import('us-tariff-lookup');
    registerIpc();
    const win = createWindow();
    Menu.setApplicationMenu(menuTemplate(win));
    win.webContents.on('did-finish-load', () => {
      win.setTitle(isZh() ? 'US Tariff Lookup — 美国关税查询' : 'US Tariff Lookup');
    });
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
  });
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
}
