import { app, BrowserWindow } from 'electron'
import path from 'path'
import http from 'http'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PORT = 3001
let mainWindow = null

function waitForServer() {
  return new Promise((resolve) => {
    const check = () => {
      http.get(`http://localhost:${PORT}/api/students`, resolve)
        .on('error', () => setTimeout(check, 300))
    }
    check()
  })
}

async function startServer() {
  const serverDir = app.isPackaged
    ? path.join(process.resourcesPath, 'server')
    : path.join(__dirname, '../server')

  const clientDist = app.isPackaged
    ? path.join(process.resourcesPath, 'client/dist')
    : path.join(__dirname, '../client/dist')

  process.chdir(serverDir)
  process.env.CLIENT_DIST = clientDist

  await import(path.join(serverDir, 'index.js'))
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1100,
    minHeight: 700,
    titleBarStyle: 'hiddenInset',
    backgroundColor: '#f1f5f9',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  })

  mainWindow.loadURL(`http://localhost:${PORT}`)
  mainWindow.on('closed', () => { mainWindow = null })
}

app.whenReady().then(async () => {
  await startServer()
  await waitForServer()
  createWindow()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', () => {
  if (!mainWindow) createWindow()
})
