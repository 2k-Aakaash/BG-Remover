import {execSync} from "child_process"
import fs from "fs"
import path from "path"
import {fileURLToPath} from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

console.log("🚀 Starting deployment from dev branch...\n")

try {
  // Step 1: Ensure we're on dev branch
  console.log("📍 Checking current branch...")
  let currentBranch = execSync("git branch --show-current").toString().trim()

  if (currentBranch !== "dev") {
    console.log(`🔄 Switching to dev branch... (current: ${currentBranch})`)
    execSync("git checkout dev", {stdio: "inherit"})
  }

  // Step 2: Build the project
  console.log("📦 Building project...")
  execSync("npm run build", {stdio: "inherit"})

  // Step 3: Switch to main branch
  console.log("🔄 Switching to main branch...")
  execSync("git checkout main", {stdio: "inherit"})

  // Step 4: Clean main branch (keep only .git and deploy.js)
  console.log("🧹 Cleaning main branch...")
  const files = fs.readdirSync(".")
  for (const file of files) {
    if (file !== ".git" && file !== "deploy.js" && file !== "node_modules") {
      fs.rmSync(file, {recursive: true, force: true})
    }
  }

  // Step 5: Copy dist contents to root
  console.log("📋 Copying build files...")
  const distPath = path.join(__dirname, "dist")

  if (!fs.existsSync(distPath)) {
    throw new Error("❌ dist folder not found after build!")
  }

  const distFiles = fs.readdirSync(distPath)
  for (const file of distFiles) {
    fs.cpSync(path.join(distPath, file), file, {recursive: true})
  }

  // Step 6: Create .nojekyll for GitHub Pages
  fs.writeFileSync(".nojekyll", "")

  // Step 7: Commit and push
  console.log("📤 Committing & pushing...")
  execSync("git add .", {stdio: "inherit"})
  execSync(
    `git commit -m "chore: deploy new build - ${new Date().toISOString()}"`,
    {stdio: "inherit"},
  )
  execSync("git push origin main --force", {stdio: "inherit"})

  console.log("\n✅ Deployment completed successfully! 🎉")
  console.log("Your main branch now contains only the built static files.")
} catch (error) {
  console.error("\n❌ Deployment failed:")
  console.error(error.message)
  process.exit(1)
}
