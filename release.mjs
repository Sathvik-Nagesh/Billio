import fs from 'fs';
import { execSync } from 'child_process';
import path from 'path';

try {
  // 1. Ensure working directory is clean or add everything
  console.log("📦 Staging all changes...");
  execSync('git add .', { stdio: 'inherit' });

  // Get commit message from args
  const commitMsg = process.argv[2] || "Update application";
  console.log(`\n💾 Committing changes with message: "${commitMsg}"...`);
  try {
    execSync(`git commit -m "${commitMsg}"`, { stdio: 'inherit' });
  } catch (e) {
    console.log("No changes to commit or commit failed. Continuing...");
  }

  // 2. Increment version using npm version (this updates package.json and creates a git tag)
  console.log("\n📈 Incrementing version (patch)...");
  // using --force to allow versioning even if there are uncommitted changes somehow, though we just committed
  execSync('npm version patch -m "Bump version to %s"', { stdio: 'inherit' });

  // Get the new version
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const version = pkg.version;
  console.log(`\n✨ New version is v${version}`);

  // 3. Clean previous release artifacts
  console.log("\n🧹 Cleaning previous release folder...");
  try {
    fs.rmSync('release', { recursive: true, force: true });
  } catch (e) {
    console.log("Release folder not found or couldn't be deleted.");
  }

  // 4. Build electron app
  console.log("\n🔨 Building Electron app...");
  execSync('npx electron-builder --win -p never', { stdio: 'inherit' });

  // 5. Rename files to have hyphens (fixes the auto-updater 404 issue caused by spaces turning into dots on GitHub)
  console.log("\n🔧 Renaming artifacts to use hyphens...");
  const releaseDir = 'release';
  const oldExe = `Billio Setup ${version}.exe`;
  const newExe = `Billio-Setup-${version}.exe`;
  const oldBlockmap = `Billio Setup ${version}.exe.blockmap`;
  const newBlockmap = `Billio-Setup-${version}.exe.blockmap`;

  if (fs.existsSync(path.join(releaseDir, oldExe))) {
    fs.renameSync(path.join(releaseDir, oldExe), path.join(releaseDir, newExe));
    console.log(`Renamed: ${oldExe} -> ${newExe}`);
  }
  if (fs.existsSync(path.join(releaseDir, oldBlockmap))) {
    fs.renameSync(path.join(releaseDir, oldBlockmap), path.join(releaseDir, newBlockmap));
    console.log(`Renamed: ${oldBlockmap} -> ${newBlockmap}`);
  }

  // 6. Push changes and tags to GitHub
  console.log("\n🚀 Pushing to GitHub (including tags)...");
  execSync('git push origin main --tags', { stdio: 'inherit' });

  // 7. Create GitHub release and upload the 3 necessary artifacts
  console.log("\n🌐 Creating GitHub release...");
  const exePath = path.posix.join(releaseDir, newExe);
  const blockmapPath = path.posix.join(releaseDir, newBlockmap);
  const ymlPath = path.posix.join(releaseDir, 'latest.yml');

  const releaseNotes = `## What's New in v${version}\n\n- ${commitMsg}`;
  
  execSync(
    `gh release create v${version} "${exePath}" "${blockmapPath}" "${ymlPath}" -t "Billio v${version}" -n "${releaseNotes}"`, 
    { stdio: 'inherit' }
  );

  console.log(`\n✅ Successfully published Release v${version}!`);
  
} catch (error) {
  console.error("\n❌ Release failed:");
  console.error(error.message);
  process.exit(1);
}
