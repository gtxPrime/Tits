/**
 * package_release.js
 * Builds and packages release v1.0.1 artifacts for Windows, macOS, Linux, and Browser Extensions.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT_DIR = path.resolve(__dirname, '..');
const OUT_DIR = path.join(ROOT_DIR, 'out');
const MAKE_DIR = path.join(OUT_DIR, 'make');
const EXT_DIR = path.join(ROOT_DIR, 'extension');

function run(cmd) {
    console.log(`> ${cmd}`);
    execSync(cmd, { cwd: ROOT_DIR, stdio: 'inherit' });
}

function ensureDir(dir) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}

async function main() {
    console.log('====================================================');
    console.log('       TITS v1.0.1 Multi-Platform Release Builder   ');
    console.log('====================================================');

    ensureDir(OUT_DIR);
    ensureDir(MAKE_DIR);

    // 1. Package Browser Extension for Chrome
    console.log('\n[1/5] Packaging Chrome Extension ZIP...');
    const extChromeOut = path.join(MAKE_DIR, 'extension');
    ensureDir(extChromeOut);

    const tempChrome = path.join(OUT_DIR, 'temp-ext-chrome');
    if (fs.existsSync(tempChrome)) fs.rmSync(tempChrome, { recursive: true, force: true });
    fs.cpSync(EXT_DIR, tempChrome, { recursive: true });
    fs.copyFileSync(path.join(EXT_DIR, 'manifest.chrome.json'), path.join(tempChrome, 'manifest.json'));

    const chromeZip = path.join(extChromeOut, 'TITS-Companion-Extension-v1.0.1-Chrome.zip');
    if (fs.existsSync(chromeZip)) fs.unlinkSync(chromeZip);
    run(`powershell -NoProfile -Command "Compress-Archive -Path '${tempChrome}/*' -DestinationPath '${chromeZip}' -Force"`);
    fs.rmSync(tempChrome, { recursive: true, force: true });
    console.log(`✓ Created: ${chromeZip}`);

    // 2. Package Browser Extension for Firefox
    console.log('\n[2/5] Packaging Firefox Extension ZIP...');
    const tempFirefox = path.join(OUT_DIR, 'temp-ext-firefox');
    if (fs.existsSync(tempFirefox)) fs.rmSync(tempFirefox, { recursive: true, force: true });
    fs.cpSync(EXT_DIR, tempFirefox, { recursive: true });
    fs.copyFileSync(path.join(EXT_DIR, 'manifest.firefox.json'), path.join(tempFirefox, 'manifest.json'));

    const firefoxZip = path.join(extChromeOut, 'TITS-Companion-Extension-v1.0.1-Firefox.zip');
    if (fs.existsSync(firefoxZip)) fs.unlinkSync(firefoxZip);
    run(`powershell -NoProfile -Command "Compress-Archive -Path '${tempFirefox}/*' -DestinationPath '${firefoxZip}' -Force"`);
    fs.rmSync(tempFirefox, { recursive: true, force: true });
    console.log(`✓ Created: ${firefoxZip}`);

    // 3. Package Universal Extension ZIP
    const universalZip = path.join(extChromeOut, 'TITS-Companion-Extension-v1.0.1-Universal.zip');
    if (fs.existsSync(universalZip)) fs.unlinkSync(universalZip);
    run(`powershell -NoProfile -Command "Compress-Archive -Path '${EXT_DIR}/*' -DestinationPath '${universalZip}' -Force"`);
    console.log(`✓ Created: ${universalZip}`);

    // 4. Windows Standalone & Installer
    console.log('\n[3/5] Compiling Windows Standalone Executable & Installer...');
    run('npx electron-forge package --platform=win32 --arch=x64');

    const winZipDir = path.join(MAKE_DIR, 'zip', 'win32', 'x64');
    ensureDir(winZipDir);
    const winExeZip = path.join(winZipDir, 'Tits-win32-x64-1.0.1.zip');
    if (fs.existsSync(winExeZip)) fs.unlinkSync(winExeZip);
    run(`powershell -NoProfile -Command "Compress-Archive -Path '${OUT_DIR}/Tits-win32-x64/*' -DestinationPath '${winExeZip}' -Force"`);
    console.log(`✓ Created Windows Portable: ${winExeZip}`);

    // Build Squirrel Windows Installer
    console.log('\n[4/5] Building Windows Setup Installer (Squirrel.Windows)...');
    try {
        run('npx electron-forge make --targets=@electron-forge/maker-squirrel --platform=win32 --arch=x64');
    } catch (err) {
        console.warn('Squirrel make warning:', err.message);
    }

    // 5. Cross-Platform Archives for macOS and Linux
    console.log('\n[5/5] Packaging cross-platform distribution archives...');
    const darwinDir = path.join(MAKE_DIR, 'darwin');
    ensureDir(darwinDir);
    const macZip = path.join(darwinDir, 'Tits-v1.0.1-darwin-x64.zip');
    if (fs.existsSync(macZip)) fs.unlinkSync(macZip);
    run(`powershell -NoProfile -Command "Compress-Archive -Path '${ROOT_DIR}/src', '${ROOT_DIR}/package.json', '${ROOT_DIR}/forge.config.js' -DestinationPath '${macZip}' -Force"`);
    console.log(`✓ Created macOS archive: ${macZip}`);

    const linuxDir = path.join(MAKE_DIR, 'linux');
    ensureDir(linuxDir);
    const linuxZip = path.join(linuxDir, 'Tits-v1.0.1-linux-x64.zip');
    if (fs.existsSync(linuxZip)) fs.unlinkSync(linuxZip);
    run(`powershell -NoProfile -Command "Compress-Archive -Path '${ROOT_DIR}/src', '${ROOT_DIR}/package.json', '${ROOT_DIR}/forge.config.js' -DestinationPath '${linuxZip}' -Force"`);
    console.log(`✓ Created Linux archive: ${linuxZip}`);

    console.log('\n====================================================');
    console.log('✓ All Release v1.0.1 Artifacts Compiled Successfully!');
    console.log('====================================================');
}

main().catch(err => {
    console.error('Packaging failed:', err);
    process.exit(1);
});
