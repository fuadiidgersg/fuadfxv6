#!/usr/bin/env node
/**
 * FuadFX Auto-Push Watcher
 * Watches for file changes and automatically pushes to GitHub + triggers Render.
 * Debounced — waits 30s after the last change before pushing.
 */

import chokidar from 'chokidar'
import { execSync } from 'child_process'
import { readFileSync, readdirSync, statSync } from 'fs'
import { join, relative } from 'path'
import { createHash } from 'crypto'

const DEBOUNCE_MS = 30_000 // 30 seconds after last change
const OWNER  = 'fuadiidgersg'
const REPO   = 'fuadfxv6'
const BRANCH = 'main'
const TOKEN  = process.env.GITHUB_TOKEN
const RENDER_HOOK = process.env.RENDER_DEPLOY_HOOK_URL

if (!TOKEN) { console.error('❌  GITHUB_TOKEN not set'); process.exit(1) }

const IGNORE_DIRS  = new Set(['node_modules', '.git', '.local', 'dist', '.cache', 'attached_assets', 'scripts'])
const IGNORE_FILES = new Set(['.replit', 'replit.nix'])

const headers = {
  Authorization: `Bearer ${TOKEN}`,
  Accept: 'application/vnd.github+json',
  'X-GitHub-Api-Version': '2022-11-28',
  'Content-Type': 'application/json',
  'User-Agent': 'FuadFX-AutoPush',
}

async function api(path, options = {}) {
  const res  = await fetch(`https://api.github.com${path}`, { headers, ...options })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(`GitHub API ${res.status}: ${JSON.stringify(body)}`)
  return body
}

function gitBlobSha(buf) {
  const header = Buffer.from(`blob ${buf.length}\0`)
  const hash   = createHash('sha1')
  hash.update(header)
  hash.update(buf)
  return hash.digest('hex')
}

function collectFiles(dir, root = dir) {
  const files = []
  for (const entry of readdirSync(dir)) {
    if (IGNORE_DIRS.has(entry) || IGNORE_FILES.has(entry)) continue
    const full = join(dir, entry)
    const st   = statSync(full)
    if (st.isDirectory()) files.push(...collectFiles(full, root))
    else files.push(relative(root, full))
  }
  return files
}

async function pushToGitHub(message) {
  const cwd = process.cwd()
  const refData    = await api(`/repos/${OWNER}/${REPO}/git/ref/heads/${BRANCH}`)
  const headSha    = refData.object.sha
  const commitData = await api(`/repos/${OWNER}/${REPO}/git/commits/${headSha}`)
  const baseTreeSha = commitData.tree.sha

  const treeData = await api(`/repos/${OWNER}/${REPO}/git/trees/${baseTreeSha}?recursive=1`)
  const remoteShaByPath = {}
  for (const item of treeData.tree) {
    if (item.type === 'blob') remoteShaByPath[item.path] = item.sha
  }

  const localFiles = collectFiles(cwd)
  const treeItems  = []

  for (const filePath of localFiles) {
    let buf
    try { buf = readFileSync(join(cwd, filePath)) } catch { continue }
    if (gitBlobSha(buf) === remoteShaByPath[filePath]) continue
    const { sha } = await api(`/repos/${OWNER}/${REPO}/git/blobs`, {
      method: 'POST',
      body: JSON.stringify({ content: buf.toString('base64'), encoding: 'base64' }),
    })
    treeItems.push({ path: filePath, mode: '100644', type: 'blob', sha })
  }

  if (treeItems.length === 0) {
    console.log(`[${ts()}] ✅  No changes to push.`)
    return
  }

  const newTree   = await api(`/repos/${OWNER}/${REPO}/git/trees`, {
    method: 'POST',
    body: JSON.stringify({ base_tree: baseTreeSha, tree: treeItems }),
  })
  const newCommit = await api(`/repos/${OWNER}/${REPO}/git/commits`, {
    method: 'POST',
    body: JSON.stringify({ message, tree: newTree.sha, parents: [headSha] }),
  })
  await api(`/repos/${OWNER}/${REPO}/git/refs/heads/${BRANCH}`, {
    method: 'PATCH',
    body: JSON.stringify({ sha: newCommit.sha }),
  })

  console.log(`[${ts()}] ✅  Pushed ${treeItems.length} file(s) → ${newCommit.sha.slice(0, 7)}`)
  console.log(`[${ts()}]    https://github.com/${OWNER}/${REPO}/commit/${newCommit.sha}`)

  if (RENDER_HOOK) {
    await fetch(RENDER_HOOK, { method: 'POST' })
    console.log(`[${ts()}] 🔄  Render redeploy triggered.`)
  }
}

function ts() {
  return new Date().toLocaleTimeString()
}

// ── Watcher ───────────────────────────────────────────────────────────────────
let debounceTimer = null
let pendingChanges = new Set()

const watcher = chokidar.watch('.', {
  ignored: [
    /node_modules/, /\.git/, /\.local/, /dist\//, /\.cache/,
    /attached_assets/, /scripts\//,
  ],
  ignoreInitial: true,
  persistent: true,
})

function schedulePush(filePath) {
  pendingChanges.add(filePath)
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(async () => {
    const count   = pendingChanges.size
    const message = `chore: auto-push ${count} change(s) — ${new Date().toISOString().slice(0, 16).replace('T', ' ')}`
    pendingChanges.clear()
    debounceTimer = null
    console.log(`[${ts()}] 📦  ${count} change(s) detected — pushing to GitHub…`)
    try {
      await pushToGitHub(message)
    } catch (err) {
      console.error(`[${ts()}] ❌  Push failed:`, err.message)
    }
  }, DEBOUNCE_MS)
}

watcher
  .on('change', p => { console.log(`[${ts()}] ✏️   Changed: ${p}`); schedulePush(p) })
  .on('add',    p => { console.log(`[${ts()}] ➕  Added:   ${p}`); schedulePush(p) })
  .on('unlink', p => { console.log(`[${ts()}] 🗑️   Deleted: ${p}`); schedulePush(p) })
  .on('ready',  () => console.log(`[${ts()}] 👀  Auto-push watcher ready — changes push to GitHub after ${DEBOUNCE_MS / 1000}s of inactivity.`))
  .on('error',  err => console.error(`[${ts()}] ❌  Watcher error:`, err))

console.log(`[${ts()}] 🚀  FuadFX auto-push started (debounce: ${DEBOUNCE_MS / 1000}s)`)
