const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

const desktop = path.join(os.homedir(), 'Desktop');
const targetExe = path.resolve(__dirname, '../out/Tits-win32-x64/Tits.exe');
const targetDir = path.resolve(__dirname, '../out/Tits-win32-x64');
const targetIcon = path.resolve(__dirname, '../src/assets/logo.ico');

console.log('Target Exe:', targetExe);
console.log('Target Icon:', targetIcon);

if (fs.existsSync(targetExe)) {
    const vbs = path.join(os.tmpdir(), 'create_shortcut.vbs');
    const lnkPath = path.join(desktop, 'Tits.lnk');
    const oldLnkPath = path.join(desktop, 'TITS.lnk');

    // Remove old TITS.lnk if it exists
    if (fs.existsSync(oldLnkPath)) {
        try { fs.unlinkSync(oldLnkPath); } catch (_) {}
    }

    const script = `
Set sh = CreateObject("WScript.Shell")
Set lnk = sh.CreateShortcut("${lnkPath.replace(/\\/g, '\\\\')}")
lnk.TargetPath = "${targetExe.replace(/\\/g, '\\\\')}"
lnk.WorkingDirectory = "${targetDir.replace(/\\/g, '\\\\')}"
lnk.IconLocation = "${targetIcon.replace(/\\/g, '\\\\')},0"
lnk.Description = "Tits - Test Intelligence & Tutoring System"
lnk.Save
    `.trim();

    fs.writeFileSync(vbs, script);
    try {
        execSync(`cscript //nologo "${vbs}"`);
        console.log('Successfully created/updated Desktop shortcut at:', lnkPath);
    } catch (e) {
        console.error('Error creating shortcut:', e.message);
    } finally {
        if (fs.existsSync(vbs)) fs.unlinkSync(vbs);
    }
} else {
    console.error('Tits.exe does not exist at', targetExe);
}
