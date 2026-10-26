## Browser extension: installation and usage

The browser companion is in [`extension/`](<>). It runs separately from the Electron desktop app: you do not need to build or launch the desktop app to load it. Use it only on pages where you have permission to edit and paste. It does not make synthetic input into trusted physical keyboard input, and no compatibility or detection guarantee is made.

### Choose the right manifest

| Browser             | Manifest to use                                                                        | Installation          |
| ------------------- | -------------------------------------------------------------------------------------- | --------------------- |
| Chrome, Brave, Edge | `extension/manifest.json` (same background setup as `manifest.chrome.json`)            | Load unpacked folder  |
| Firefox             | A separate copy of the folder with `manifest.firefox.json` copied over `manifest.json` | Load Temporary Add-on |

Chrome-family MV3 extensions use `background.service_worker`; Firefox uses `background.scripts`. Loading the Chrome manifest in Firefox causes `background.service_worker is currently disabled. Add background.scripts.` Do not switch the manifest in the folder already loaded by Brave. Make a separate Firefox copy instead.

#### Chrome / Brave / Edge

1. Clone or download the repository and keep the extracted folder on disk.
2. Open `chrome://extensions`, `brave://extensions`, or `edge://extensions`.
3. Enable **Developer mode**.
4. Choose **Load unpacked** and select the repository's `extension` folder, not the repository root or a ZIP.
5. Refresh existing target tabs so the content scripts load. Click inside the intended input/editor before using a paste command.
6. Optionally pin the extension to open its popup easily.

#### Firefox: separate folder

From the repository root, create a Firefox-only copy:

**PowerShell**

```powershell
Copy-Item -Recurse extension extension-firefox
Copy-Item -Force extension-firefox/manifest.firefox.json extension-firefox/manifest.json
```

**macOS / Linux shell**

```sh
cp -R extension extension-firefox
cp extension-firefox/manifest.firefox.json extension-firefox/manifest.json
```

If `extension-firefox` already exists, replace that copy deliberately instead of nesting one copy inside another. Keep any local edits you need first.

1. Open `about:debugging` in Firefox.
2. Select **This Firefox**, then **Load Temporary Add-on**.
3. Select `extension-firefox/manifest.json`.
4. Grant site access if prompted and refresh the target tab.

Temporary add-ons are removed when Firefox restarts. Load them again through `about:debugging`. This is a development install, not a signed permanent Firefox add-on. The corrected Firefox manifest is included, but Firefox paste behavior has not been runtime-verified in the recorded regression run.

### First use

Start on an editable test document you control. Copy a short harmless line, click inside the editor, and try normal paste. Check the actual resulting text before using a longer block. Pasting into a website may trigger that site's autosave or other actions; the extension does not prevent saves, submissions, or server-side changes.

For code, start with **Typo Rate = 0%** so the extension does not deliberately insert and correct extra characters. Keep the target focused during typing paste. Do not type or move the caret while a stream is active. Press Escape before changing tabs or editors.

### Popup controls

| Control                | Current behavior                                                                                                                                                              |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Paste Unblocker**    | Enables the page/editor compatibility patches and normal paste handling. Defaults on.                                                                                         |
| **Typing Simulation**  | Routes normal paste and the Paste action through character-by-character insertion. Defaults off.                                                                              |
| **Auto-Backspace Fix** | Enables cognitive delay, backspace erasure, and self-correction when typos occur. Defaults on.                                                                                 |
| **Speed**              | Base delay per character, 20-130 ms in the popup; lower is faster. Timing includes human variance and punctuation pauses. Default 65 ms.                                     |
| **Typo Rate**          | 0-15% setting for physical QWERTY neighbor mistakes followed by backspace correction. Default 4%; use 0% for literal code/text transfer.                                      |
| **Remote Relay**       | Connects two browser instances over local WebSocket rooms. User 2 sends text remotely into User 1's active tab with synchronized typing parameters.                            |
| **Paste**              | Inserts clipboard text into the focused editor/input. When Typing Simulation is enabled, it starts the typing stream instead.                                                 |
| **Type**               | Starts character-by-character insertion regardless of the Typing Simulation toggle.                                                                                          |
| **Stop**               | Cancels the active stream. Already inserted text remains; cancellation does not roll back changes.                                                                            |
| **Unlock**             | Runs the existing page/editor compatibility scan again. It is not a permission grant to modify another service's protected content.                                           |
| **Copy / Export Log**  | Copies or downloads complete diagnostic reports including active tabs, relay connection state, speed/typo settings, and chronological event logs.                             |

Settings are saved in extension local storage. When using Remote Relay, your configured speed, typo rate, and auto-backspace settings are automatically transmitted to the receiver tab.

### Remote Peer Relay: Dual-User Workflow

Use the Remote Peer Relay when User 1 is in a restricted testing browser/exam tab and User 2 is assisting from another browser instance, laptop, tablet, or phone on the same network:

1. **Launch Relay Server**: Start the TITS desktop app (or run `node src/utils/remoteServer.js`). The server listens on `ws://<LAN_IP>:59432`.
2. **Connect Receiver (User 1)**:
   - In User 1's browser, open the extension popup.
   - Enter the Server URL and a shared Room Code (e.g. `STEALTH-165`).
   - Click **Connect**. Status shows `🟡 Solo in Room`.
   - Open and focus the target test/editor tab (e.g. `OnlineNotepad.org`, Monaco, Ace).
3. **Connect Sender (User 2)**:
   - In User 2's browser, open the extension popup.
   - Enter the same Server URL and Room Code.
   - Click **Connect**. Both instances will show `🟢 2 Peers Live`.
4. **Relay Text**:
   - Choose remote injection mode: `⚡ Instant Paste` or `⌨ Simulated Typing`.
   - Paste or type text into User 2's popup textarea.
   - Click **Send** or press `Alt+Enter` / `Ctrl+Enter`.
   - Text is injected directly into User 1's active webpage tab. User 2's activity terminal displays `Peer feedback: Injected into tab ✓`.

Turning Paste Unblocker off is not a full undo of page changes: some patches and editor-state changes may already have happened. To return to an unmodified page, disable the extension and reload the page. Switching Typing Paste off does not itself replace Stop; use Stop or Escape to cancel a running stream.

### Keyboard shortcuts

Click the target first. Browser/OS shortcut conflicts may require reassignment.

| Shortcut           | Action                                                                          |
| ------------------ | ------------------------------------------------------------------------------- |
| `Ctrl+V` / `Cmd+V` | Normal paste; typing insertion when Typing Paste is on                          |
| `Alt+V`            | Paste clipboard text; respects Typing Paste mode                                |
| `Alt+Shift+V`      | Start typing paste explicitly                                                   |
| `Escape`           | Cancel the active typing stream in the page                                     |
| `Alt+X`            | Stop typing                                                                     |
| `Alt+U`            | In-page compatibility scan; this is an in-page shortcut, not a manifest command |

Chrome-family command assignments can be checked on the browser's extension keyboard-shortcut page. Firefox exposes extension shortcuts through the Add-ons Manager's shortcut controls. The in-page fallback needs the target page focused. Some system shortcuts cannot be intercepted.

### Clipboard, permissions and privacy

- **Clipboard read:** clipboard insertion commands need clipboard text. A native paste event supplies `clipboardData`; explicit popup/shortcut actions may depend on clipboard permissions and focus. Empty or inaccessible clipboard content cannot be pasted.
- **Storage:** stores the toggle, speed and typo settings locally.
- **Context menus:** adds paste/typing/scan menu entries.
- **Active tab, scripting, and broad site access:** support the content scripts and page/editor integration. The manifests request `<all_urls>` and run in matching frames; this is broad access, so review the source and restrict site access in browser settings where appropriate.
- Browser-internal pages, extension stores and other protected pages may reject content scripts. Private/incognito access is separately controlled by the browser.
- Do not paste passwords, tokens or other sensitive content into an untrusted page. Whatever lands in an editor is available to that website, including through its own save behavior.

### Updating without losing the browser split

1. Keep any local changes before updating. Run `git pull` in your repository checkout when appropriate.
2. For Chrome/Brave/Edge, click **Reload** on the extension's management card, then refresh the target tab.
3. Rebuild your separate Firefox copy from the updated `extension` folder and copy the Firefox manifest over its `manifest.json` again. Reload it through `about:debugging`, then refresh target tabs.
4. Do not load both old and new copies on the same page. Duplicate copies can cause duplicate input or conflicting handlers.

### Troubleshooting

| Symptom                                            | Check                                                                                                                                                                                                     |
| -------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Firefox service-worker error                       | Use the separate Firefox copy with `background.scripts` in its `manifest.json`, as above.                                                                                                                 |
| Chrome rejects background scripts                  | Use the Chrome `manifest.json` / `manifest.chrome.json`, not the Firefox manifest.                                                                                                                        |
| Nothing happens                                    | Reload the extension and page, check site access, click the intended input, and verify the clipboard contains plain text.                                                                                 |
| Popup shows "Focus first"                          | Clipboard access or target state may be unavailable; the message does not identify a single cause. Try native paste in an editable local document first.                                                  |
| Wrong input receives text                          | Stop, focus the intended editor again and avoid opening another input during insertion. Multiple frames/editors can affect target selection.                                                              |
| Shortcut does nothing                              | Check browser/OS conflicts and reassignment; try a popup action or native paste.                                                                                                                          |
| Partial text remains after Stop                    | Expected: Stop cancels future characters, it does not undo inserted text. Review and undo manually if needed.                                                                                             |
| Text differs from clipboard                        | Set typo rate to 0%, check indentation/selection, and reproduce with a small sample on an editable document you control. Report the browser/version, mode, sample and actual result without private data. |
| Turning off a switch does not restore restrictions | Disable the extension and reload the page to remove page-lifetime patches.                                                                                                                                |

### Verified scope and local tests

The recorded repair regression used **Chromium 156.0.8078.4 with real Ace 1.45.2**: **14/14 checks passed**. It covers extension loading, actual Ctrl+V, literal multiline/Unicode preservation, selection replacement, typing insertion with typos disabled, cancellation/replacement, Alt shortcuts, textarea, contenteditable and open shadow DOM. See [`results.json`](regression/results.json), the [test screenshot](regression/local-ace-regression.png), and [test instructions](regression/README.md).

To run the tests:

```sh
cd extension/regression
npm install
npx playwright install chromium
npm test
```

Port 8989 must be free. The test starts a local editable fixture, loads the unpacked extension and writes results and a screenshot. It does not contact or test a signed-in course portal. The recorded results predate later popup/icon styling changes. They do not prove read-only editor compatibility, all sites, Firefox behavior, Monaco/CodeMirror integration or terminal behavior. Browser/editor differences still need direct testing. Broader claims elsewhere in the repository should not be read as verified extension guarantees.

For repair-specific details, see [`extension/REPAIR-NOTES.md`](REPAIR-NOTES.md). Mozilla documents the cross-browser background distinction in its [background manifest reference](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json/background).

---
