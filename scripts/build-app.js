#!/usr/bin/env node
// Builds Aymond.app bundle and installs it to /Applications
import { execSync } from 'child_process'
import { cpSync, mkdirSync, rmSync, existsSync, copyFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const APP_SRC = resolve(ROOT, 'Aymond.app')
const APP_DEST = '/Applications/Aymond.app'
const SWIFT_SRC = resolve(ROOT, 'electron/main.swift')
const BINARY_CACHE = resolve(ROOT, 'electron/Aymond-binary')

console.log('Building Aymond.app...')

// 1. Always recompile Swift binary (source may have changed)
console.log('Compiling native launcher...')
execSync(
  `swiftc "${SWIFT_SRC}" -o "${BINARY_CACHE}" -framework Cocoa -framework WebKit`,
  { stdio: 'inherit' }
)

// 2. Set up app bundle in project root
const macosDir = resolve(APP_SRC, 'Contents/MacOS')
const resourcesDir = resolve(APP_SRC, 'Contents/Resources')
mkdirSync(macosDir, { recursive: true })
mkdirSync(resourcesDir, { recursive: true })

// 3. Copy binary
copyFileSync(BINARY_CACHE, resolve(macosDir, 'Aymond'))
execSync(`chmod +x "${resolve(macosDir, 'Aymond')}"`)

// 4. Sync server files (excluding test/dev deps)
const serverDest = resolve(resourcesDir, 'server')
if (existsSync(serverDest)) rmSync(serverDest, { recursive: true })
cpSync(resolve(ROOT, 'server'), serverDest, { recursive: true })

// 5. Sync built React files
const clientDest = resolve(resourcesDir, 'client')
if (existsSync(clientDest)) rmSync(clientDest, { recursive: true })
cpSync(resolve(ROOT, 'client/dist'), clientDest, { recursive: true })

// 6. Install to /Applications
if (existsSync(APP_DEST)) rmSync(APP_DEST, { recursive: true })
cpSync(APP_SRC, APP_DEST, { recursive: true })

// 7. Sign and remove quarantine
execSync(`codesign --force --deep --sign - "${APP_DEST}"`, { stdio: 'inherit' })
execSync(`xattr -r -d com.apple.quarantine "${APP_DEST}" 2>/dev/null || true`, { shell: true })

console.log('Done! Aymond.app installed to /Applications.')
console.log('You can now launch it from Spotlight or Finder.')
