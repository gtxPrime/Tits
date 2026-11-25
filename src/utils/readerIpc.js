/**
 * Document Reader IPC: opens and parses a PDF for the in-app reader view
 * (src/components/views/ReaderView.js). The reader renders inside the main window.
 */

const { BrowserWindow, dialog, ipcMain } = require('electron');
const { parsePdfFile } = require('./documentParser');

let handlersRegistered = false;

/** Only the app's own windows (loaded from local files) may use the reader IPC. */
function senderWindow(event) {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (!win || win.isDestroyed()) return null;
    const url = event.senderFrame ? event.senderFrame.url : event.sender.getURL();
    if (!/^file:\/\//i.test(url || '')) return null;
    return win;
}

async function parseSafely(filePath) {
    try {
        const doc = await parsePdfFile(filePath);
        return { success: true, doc };
    } catch (err) {
        console.error('[Reader] Failed to parse PDF:', err);
        return { success: false, error: (err && err.message) || 'Could not read this PDF' };
    }
}

function setupReaderIpcHandlers() {
    if (handlersRegistered) return;
    handlersRegistered = true;

    ipcMain.handle('reader:open-dialog', async event => {
        const win = senderWindow(event);
        if (!win) return { success: false, error: 'Not allowed' };
        const result = await dialog.showOpenDialog(win, {
            title: 'Open PDF',
            properties: ['openFile'],
            filters: [{ name: 'PDF documents', extensions: ['pdf'] }],
        });
        if (result.canceled || !result.filePaths.length) return { success: false, canceled: true };
        return parseSafely(result.filePaths[0]);
    });

    // Used for drag-and-drop: the renderer resolves the dropped File to a path.
    ipcMain.handle('reader:parse-path', async (event, filePath) => {
        if (!senderWindow(event)) return { success: false, error: 'Not allowed' };
        if (typeof filePath !== 'string' || filePath.length > 4096 || !/\.pdf$/i.test(filePath)) {
            return { success: false, error: 'Please drop a .pdf file' };
        }
        return parseSafely(filePath);
    });
}

module.exports = { setupReaderIpcHandlers };
