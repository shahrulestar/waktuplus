const fs = require("fs")
const path = require("path")

const publicDir = path.join(process.cwd(), "public")
const versionPath = path.join(publicDir, "version.json")

if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true })
}

const version = Date.now()
fs.writeFileSync(versionPath, JSON.stringify({ version }), "utf-8")
console.log(`Wrote version.json with version: ${version}`)
