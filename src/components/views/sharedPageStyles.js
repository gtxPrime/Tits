import { css } from '../../assets/lit-core-2.7.4.min.js';

export const unifiedPageStyles = css`
    * {
        box-sizing: border-box;
        font-family: var(--font);
        cursor: default;
        user-select: none;
    }

    :host {
        display: block;
        height: 100%;
        overflow: hidden;
    }

    .unified-page {
        height: 100%;
        overflow-y: auto;
        padding: 28px 36px;
        background: var(--bg-app);
        scrollbar-gutter: stable;
    }

    .unified-page::-webkit-scrollbar {
        width: 6px;
    }
    .unified-page::-webkit-scrollbar-track {
        background: transparent;
    }
    .unified-page::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 0.12);
        border-radius: 999px;
    }
    .unified-page::-webkit-scrollbar-thumb:hover {
        background: rgba(255, 255, 255, 0.28);
    }

    .unified-wrap {
        width: 100%;
        max-width: 1040px;
        margin: 0 auto;
        display: flex;
        flex-direction: column;
        gap: 20px;
        padding-bottom: 60px;
    }

    .page-header {
        display: flex;
        flex-direction: column;
        gap: 6px;
        margin-bottom: 8px;
    }

    .page-title {
        font-size: 24px;
        font-weight: 800;
        color: var(--text-primary);
        letter-spacing: -0.02em;
        display: flex;
        align-items: center;
        gap: 10px;
    }

    .page-title .accent-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: var(--accent);
        box-shadow: 0 0 10px var(--accent);
    }

    .page-subtitle {
        color: var(--text-secondary);
        font-size: var(--font-size-sm);
        line-height: 1.5;
    }

    /* Modern Glass Card */
    .surface {
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 16px;
        background: rgba(18, 21, 30, 0.7);
        backdrop-filter: blur(14px);
        padding: 22px 26px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.35);
        transition:
            border-color var(--transition),
            box-shadow var(--transition);
        display: flex;
        flex-direction: column;
        gap: 16px;
    }

    .surface:hover {
        border-color: rgba(250, 204, 21, 0.22);
    }

    .surface-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding-bottom: 12px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    }

    .surface-title {
        color: var(--text-primary);
        font-size: 15px;
        font-weight: 700;
        letter-spacing: -0.01em;
        display: flex;
        align-items: center;
        gap: 8px;
    }

    .surface-subtitle {
        color: var(--text-muted);
        font-size: var(--font-size-xs);
        line-height: 1.4;
    }

    .form-grid {
        display: flex;
        flex-direction: column;
        gap: 14px;
    }

    .form-row {
        display: flex;
        flex-direction: column;
        gap: 6px;
    }

    .form-group {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
    }

    .form-group.vertical {
        flex-direction: column;
        align-items: stretch;
        gap: 8px;
    }

    .form-label {
        color: var(--text-primary);
        font-size: var(--font-size-sm);
        font-weight: 500;
        white-space: nowrap;
        flex-shrink: 0;
    }

    .form-help {
        color: var(--text-muted);
        font-size: var(--font-size-xs);
        line-height: 1.4;
    }

    .control {
        background: #12151e;
        color: var(--text-primary);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 10px;
        padding: 9px 14px;
        font-size: var(--font-size-sm);
        transition:
            border-color var(--transition),
            box-shadow var(--transition),
            background var(--transition);
    }

    .control:hover:not(:focus) {
        border-color: rgba(250, 204, 21, 0.4);
        background: #161a26;
    }

    .control:focus {
        outline: none;
        border-color: var(--accent);
        box-shadow: 0 0 0 3px rgba(250, 204, 21, 0.2);
        background: #171b28;
    }

    select.control {
        appearance: none;
        background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23facc15' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
        background-position: right 10px center;
        background-repeat: no-repeat;
        background-size: 14px;
        padding-right: 32px;
        cursor: pointer;
    }

    textarea.control {
        width: 100%;
        min-height: 100px;
        resize: vertical;
        line-height: 1.5;
    }

    /* Buttons */
    .btn-primary {
        background: linear-gradient(135deg, #facc15 0%, #eab308 100%);
        color: #000000;
        font-weight: 700;
        font-size: var(--font-size-sm);
        border: none;
        border-radius: 10px;
        padding: 9px 18px;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        gap: 8px;
        box-shadow: 0 2px 10px rgba(250, 204, 21, 0.25);
        transition: all var(--transition);
    }

    .btn-primary:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 16px rgba(250, 204, 21, 0.45);
        filter: brightness(1.05);
    }

    .btn-primary:active {
        transform: translateY(0);
    }

    .btn-secondary {
        background: rgba(255, 255, 255, 0.05);
        color: var(--text-primary);
        font-weight: 600;
        font-size: var(--font-size-sm);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 10px;
        padding: 9px 16px;
        cursor: pointer;
        transition: all var(--transition);
    }

    .btn-secondary:hover {
        background: rgba(255, 255, 255, 0.1);
        border-color: rgba(250, 204, 21, 0.3);
    }

    .chip {
        display: inline-flex;
        align-items: center;
        border-radius: 6px;
        background: rgba(250, 204, 21, 0.12);
        color: #facc15;
        border: 1px solid rgba(250, 204, 21, 0.25);
        padding: 2px 8px;
        font-size: var(--font-size-xs);
        font-weight: 600;
        font-family: var(--font-mono);
    }

    .pill {
        border: 1px solid var(--border);
        border-radius: 999px;
        padding: 3px 10px;
        font-size: var(--font-size-xs);
        color: var(--text-muted);
    }

    .muted {
        color: var(--text-muted);
    }

    .danger {
        color: var(--danger);
    }

    @media (max-width: 640px) {
        .unified-page {
            padding: 16px;
        }
    }
`;
