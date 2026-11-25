import { html, LitElement } from '../../assets/lit-core-2.7.4.min.js';
import { READER_TEMPLATE, mountReader } from '../../reader/reader.js';

/**
 * Document Reader, shown as a view inside the main window.
 * The reader's own markup and styles live in a shadow root so they never clash with the app's.
 */
export class ReaderView extends LitElement {
    constructor() {
        super();
        this._dispose = null;
    }

    _api() {
        const { ipcRenderer, webUtils } = window.require('electron');
        return {
            openDialog: () => ipcRenderer.invoke('reader:open-dialog'),
            openDroppedFile: file => {
                let filePath = '';
                try {
                    filePath = webUtils.getPathForFile(file);
                } catch (_) {}
                if (!filePath) return Promise.resolve({ success: false, error: 'Could not read the dropped file' });
                return ipcRenderer.invoke('reader:parse-path', filePath);
            },
        };
    }

    render() {
        return html`<link rel="stylesheet" href="reader/reader.css" />
            <div id="readerRoot" style="display:contents"></div>`;
    }

    firstUpdated() {
        const container = this.shadowRoot.getElementById('readerRoot');
        container.innerHTML = READER_TEMPLATE; // static markup only, no document text
        if (!window.require) return;
        this._dispose = mountReader(this.shadowRoot, this, this._api());
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        if (this._dispose) this._dispose();
        this._dispose = null;
    }
}

customElements.define('reader-view', ReaderView);
