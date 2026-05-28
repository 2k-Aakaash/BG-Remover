import {execSync} from "child_process"
import fs from "fs"
import path from "path"

const rootPath = process.cwd()
const tempDist = path.join(rootPath, "__temp_dist__")
const distPath = path.join(rootPath, "dist")

try {
  console.log("Building project...")
  execSync("vite build", {stdio: "inherit"})

  console.log("Preparing temp dist...")

  if (fs.existsSync(tempDist)) {
    fs.rmSync(tempDist, {recursive: true, force: true})
  }

  fs.cpSync(distPath, tempDist, {
    recursive: true,
    force: true,
  })

  console.log("Stashing changes...")
  execSync('git stash push --include-untracked -m "temp-deploy"', {
    stdio: "inherit",
  })

  console.log("Switching to main branch...")
  execSync("git checkout main", {
    stdio: "inherit",
  })

  console.log("Removing old files...")

  try {
    execSync("git rm -r .", {
      stdio: "inherit",
    })
  } catch {
    console.log("No tracked files to remove.")
  }

  execSync("git clean -fd", {
    stdio: "inherit",
  })

  console.log("Copying build files...")

  fs.cpSync(tempDist, rootPath, {
    recursive: true,
    force: true,
  })

  console.log("Removing temp folder...")
  fs.rmSync(tempDist, {
    recursive: true,
    force: true,
  })

  console.log("Adding files...")
  execSync("git add .", {
    stdio: "inherit",
  })

  console.log("Commiting...")
  execSync('git commit -m "Deploy build"', {
    stdio: "inherit",
  })

  console.log("Pushing...")
  execSync("git push origin main", {
    stdio: "inherit",
  })

  console.log("Returning to dev...")
  execSync("git checkout dev", {
    stdio: "inherit",
  })

  console.log("Restoring stash...")
  execSync("git stash pop", {
    stdio: "inherit",
  })

  console.log("Deployment completed!")
} catch (err) {
  console.error(err)
}
