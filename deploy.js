import {execSync} from "child_process"
import fs from "fs"
import path from "path"
import {fileURLToPath} from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

console.log("🚀 Starting deployment from dev branch...\n")

let tempDistPath = null

try {
  // Step 1: Ensure on dev branch
  console.log("📍 Checking current branch...")
  let currentBranch = execSync("git branch --show-current").toString().trim()

  if (currentBranch !== "dev") {
    console.log("🔄 Switching to dev...")
    execSync("git checkout dev", {stdio: "inherit"})
  }

  // Step 2: Stash any existing changes (before build)
  console.log("📦 Stashing existing changes...")
  execSync('git stash push -u -m "temp stash before deploy"', {
    stdio: "inherit",
  })

  // Step 3: Build
  console.log("📦 Building project...")
  execSync("npx vite build", {stdio: "inherit"})

  // Step 4: Copy dist to temp folder
  console.log("📦 Copying dist to temporary location...")
  const distPath = path.join(__dirname, "dist")
  tempDistPath = path.join(__dirname, "temp-dist")

  if (fs.existsSync(tempDistPath))
    fs.rmSync(tempDistPath, {recursive: true, force: true})
  fs.cpSync(distPath, tempDistPath, {recursive: true})

  // Step 5: Delete dist folder from dev (so git checkout doesn't complain)
  console.log("🗑️  Removing dist folder from dev branch...")
  fs.rmSync(distPath, {recursive: true, force: true})

  // Step 6: Switch to main
  console.log("🔄 Switching to main branch...")
  execSync("git checkout main", {stdio: "inherit"})

  // Step 7: Clean main branch
  console.log("🧹 Cleaning main branch...")
  const files = fs.readdirSync(".")
  for (const file of files) {
    if (
      file !== ".git" &&
      file !== "deploy.js" &&
      file !== "node_modules" &&
      file !== "temp-dist"
    ) {
      fs.rmSync(file, {recursive: true, force: true})
    }
  }

  // Step 8: Copy build files
  console.log("📋 Copying build files to main...")
  const tempFiles = fs.readdirSync(tempDistPath)
  for (const file of tempFiles) {
    fs.cpSync(path.join(tempDistPath, file), file, {recursive: true})
  }

  // Step 9: Add .nojekyll
  fs.writeFileSync(".nojekyll", "")

  // Step 10: Commit & Push
  console.log("📤 Committing & pushing...")
  execSync("git add .", {stdio: "inherit"})
  execSync(
    `git commit -m "chore: deploy new build - ${new Date().toISOString()}"`,
    {stdio: "inherit"},
  )
  execSync("git push origin main --force", {stdio: "inherit"})

  console.log("\n✅ Deployment completed successfully! 🎉")
} catch (error) {
  console.error("\n❌ Deployment failed:")
  console.error(error.message)
  process.exit(1)
} finally {
  // Cleanup
  if (tempDistPath && fs.existsSync(tempDistPath)) {
    fs.rmSync(tempDistPath, {recursive: true, force: true})
  }

  // Return to dev
  try {
    console.log("\n🔄 Returning to dev branch...")
    execSync("git checkout dev", {stdio: "inherit"})
    execSync("git stash pop", {stdio: "inherit"})
  } catch (e) {
    console.log("Note: No stash to restore.")
  }
}
