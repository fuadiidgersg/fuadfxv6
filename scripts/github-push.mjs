#!/usr/bin/env node
/**
 * FuadFX GitHub Push — uses the GitHub REST API, only uploads changed files.
 * Works inside Replit where git CLI write ops are restricted.
 *
 * Usage:
 *   node scripts/github-push.mjs "your commit message"
 *   node scripts/github-push.mjs          ← uses default message
 */

import { readFileSync, readdirSync, statSync } from 'fs'
import { join, relative } from 'path'
import { createHash } from 'crypto'

const OWNER  = 'fuadiidgersg'
const REPO   = 'fuadfxv6'
const BRANCH = 'main'
const TOKEN  = process.env.GITHUB_TOKEN

if (!TOKEN) {
  console.error('❌  GITHUB_TOKEN environment variable is not set.')
  process.exit(1)
}

const commitMessage =
  process.argv[2] ||
  `chore: update from Replit ${new Date().toISOString().slice(0, 16).replace('T', ' ')}`

const BASE    = 'https://api.github.com'
const headers = {
  Authorization: `Bearer ${TOKEN}`,
  Accept: 'application/vnd.github+json',
  'X-GitHub-Api-Version': '2022-11-28',
  'Content-Type': 'application/json',
  'User-Agent': 'FuadFX-Replit-Push',
}

// ── Paths to skip ─────────────────────────────────────────────────────────────
const IGNORE_DIRS  = new Set(['node_modules', '.git', '.local', 'dist', '.cache', 'attached_assets'])
const IGNORE_FILES = new Set(['.replit', 'replit.nix'])

// ── Helpers ───────────────────────────────────────────────────────────────────
async function api(path, options = {}) {
  const res  = await fetch(`${BASE}${path}`, { headers, ...options })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(`GitHub API ${res.status}: ${JSON.stringify(body)}`)
  return body
}

/** Compute the git blob SHA for raw file bytes (same algo git uses) */
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
    if (st.isDirectory()) {
      files.push(...collectFiles(full, root))
    } else {
      files.push(relative(root, full))
    }
  }
  return files
}

async function createBlob(buf) {
  const body = await api(`/repos/${OWNER}/${REPO}/git/blobs`, {
    method: 'POST',
    body: JSON.stringify({ content: buf.toString('base64'), encoding: 'base64' }),
  })
  return body.sha
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function run() {
  const cwd = process.cwd()

  // 1 — Get current HEAD + base tree
  console.log('🔍  Fetching current HEAD from GitHub…')
  const refData    = await api(`/repos/${OWNER}/${REPO}/git/ref/heads/${BRANCH}`)
  const headSha    = refData.object.sha
  const commitData = await api(`/repos/${OWNER}/${REPO}/git/commits/${headSha}`)
  const baseTreeSha = commitData.tree.sha

  // 2 — Fetch the full tree (recursive) to get existing SHAs
  console.log('🌳  Fetching existing tree from GitHub…')
  const treeData    = await api(`/repos/${OWNER}/${REPO}/git/trees/${baseTreeSha}?recursive=1`)
  const remoteShaByPath = {}
  for (const item of treeData.tree) {
    if (item.type === 'blob') remoteShaByPath[item.path] = item.sha
  }

  // 3 — Collect local files and diff against remote
  console.log('📦  Scanning local files…')
  const localFiles = collectFiles(cwd)
  console.log(`    Found ${localFiles.length} local files.`)

  const treeItems = []
  let changed = 0

  for (const filePath of localFiles) {
    const fullPath = join(cwd, filePath)
    let buf
    try { buf = readFileSync(fullPath) } catch { continue }

    const localSha  = gitBlobSha(buf)
    const remoteSha = remoteShaByPath[filePath]

    if (localSha === remoteSha) continue // unchanged — skip

    // Upload only changed/new blobs
    const blobSha = await createBlob(buf)
    treeItems.push({ path: filePath, mode: '100644', type: 'blob', sha: blobSha })
    changed++
    process.stdout.write(`\r    Uploaded ${changed} changed file(s)…`)
  }

  if (changed === 0) {
    console.log('\n✅  Nothing changed — GitHub is already up to date.')
    return
  }
  console.log(`\n    ${changed} file(s) changed.`)

  // 4 — Create new tree (only changed files on top of existing base tree)
  console.log('🌳  Creating new tree…')
  const newTree = await api(`/repos/${OWNER}/${REPO}/git/trees`, {
    method: 'POST',
    body: JSON.stringify({ base_tree: baseTreeSha, tree: treeItems }),
  })

  // 5 — Create commit
  console.log(`💬  Creating commit: "${commitMessage}"`)
  const newCommit = await api(`/repos/${OWNER}/${REPO}/git/commits`, {
    method: 'POST',
    body: JSON.stringify({ message: commitMessage, tree: newTree.sha, parents: [headSha] }),
  })

  // 6 — Update branch ref
  console.log(`🚀  Updating ${BRANCH}…`)
  await api(`/repos/${OWNER}/${REPO}/git/refs/heads/${BRANCH}`, {
    method: 'PATCH',
    body: JSON.stringify({ sha: newCommit.sha }),
  })

  console.log(`\n✅  Pushed to GitHub!`)
  console.log(`    Commit: ${newCommit.sha.slice(0, 7)} — ${commitMessage}`)
  console.log(`    https://github.com/${OWNER}/${REPO}/commit/${newCommit.sha}`)
}

run().catch((err) => {
  console.error('\n❌  Push failed:', err.message)
  process.exit(1)
})
