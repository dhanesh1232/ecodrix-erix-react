import type { ErixError, ErrorDisplayConfig } from './types';
import { ErrorDisplayMode } from './types';

/**
 * ErrorDisplay handles user-facing error messages
 * Supports toast, inline, and modal display modes
 */
export class ErrorDisplay {
  private config: ErrorDisplayConfig;
  private activeErrors: Map<string, ErixError> = new Map();

  constructor(config: Partial<ErrorDisplayConfig> = {}) {
    this.config = {
      toastDuration: 5000,
      showTechnicalDetails: false,
      ...config,
    };
  }

  /**
   * Display an error to the user
   */
  display(error: ErixError): void {
    // Generate unique error ID
    const errorId = this.generateErrorId(error);

    // Store active error
    this.activeErrors.set(errorId, error);

    // Get user-friendly message
    const message = this.getUserFriendlyMessage(error);

    // Display based on mode
    switch (error.displayMode) {
      case ErrorDisplayMode.TOAST:
        this.displayToast(errorId, message, error);
        break;
      case ErrorDisplayMode.INLINE:
        this.displayInline(errorId, message, error);
        break;
      case ErrorDisplayMode.MODAL:
        this.displayModal(errorId, message, error);
        break;
      case ErrorDisplayMode.SILENT:
        // Don't display, just log
        break;
    }

    // Call custom display callback if provided
    if (this.config.onDisplayError) {
      try {
        this.config.onDisplayError(error);
      } catch (err) {
        console.error('Error in custom display callback:', err);
      }
    }
  }

  /**
   * Display error as toast notification
   */
  private displayToast(errorId: string, message: string, error: ErixError): void {
    // Create toast element
    const toast = document.createElement('div');
    toast.id = `erix-error-toast-${errorId}`;
    toast.className = 'erix-error-toast';
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'assertive');

    // Set content
    toast.innerHTML = `
      <div class="erix-error-toast-content">
        <div class="erix-error-toast-icon">${this.getErrorIcon(error)}</div>
        <div class="erix-error-toast-message">
          <strong>${this.getErrorTitle(error)}</strong>
          <p>${message}</p>
          ${this.config.showTechnicalDetails && error.code ? `<small>Error Code: ${error.code}</small>` : ''}
        </div>
        <button class="erix-error-toast-close" aria-label="Close">×</button>
      </div>
    `;

    // Add close handler
    const closeButton = toast.querySelector('.erix-error-toast-close');
    closeButton?.addEventListener('click', () => {
      this.dismissError(errorId);
    });

    // Add to DOM
    this.getToastContainer().appendChild(toast);

    // Auto-dismiss after duration
    setTimeout(() => {
      this.dismissError(errorId);
    }, this.config.toastDuration);
  }

  /**
   * Display error inline (for form validation, etc.)
   */
  private displayInline(errorId: string, message: string, error: ErixError): void {
    // Inline errors are typically handled by the component
    // This method emits an event that components can listen to
    const event = new CustomEvent('erix-inline-error', {
      detail: { errorId, message, error },
    });
    window.dispatchEvent(event);
  }

  /**
   * Display error as modal dialog
   */
  private displayModal(errorId: string, message: string, error: ErixError): void {
    // Create modal overlay
    const overlay = document.createElement('div');
    overlay.id = `erix-error-modal-${errorId}`;
    overlay.className = 'erix-error-modal-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-labelledby', `erix-error-modal-title-${errorId}`);

    // Set content
    overlay.innerHTML = `
      <div class="erix-error-modal">
        <div class="erix-error-modal-header">
          <h2 id="erix-error-modal-title-${errorId}">${this.getErrorTitle(error)}</h2>
          <button class="erix-error-modal-close" aria-label="Close">×</button>
        </div>
        <div class="erix-error-modal-body">
          <div class="erix-error-modal-icon">${this.getErrorIcon(error)}</div>
          <p>${message}</p>
          ${this.config.showTechnicalDetails && error.details ? this.formatDetails(error.details) : ''}
          ${this.config.showTechnicalDetails && error.code ? `<p><small>Error Code: ${error.code}</small></p>` : ''}
        </div>
        <div class="erix-error-modal-footer">
          <button class="erix-error-modal-button">OK</button>
        </div>
      </div>
    `;

    // Add close handlers
    const closeButton = overlay.querySelector('.erix-error-modal-close');
    const okButton = overlay.querySelector('.erix-error-modal-button');

    const closeHandler = () => {
      this.dismissError(errorId);
    };

    closeButton?.addEventListener('click', closeHandler);
    okButton?.addEventListener('click', closeHandler);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        closeHandler();
      }
    });

    // Add to DOM
    document.body.appendChild(overlay);

    // Focus the OK button for accessibility
    (okButton as HTMLElement)?.focus();
  }

  /**
   * Dismiss an error by ID
   */
  dismissError(errorId: string): void {
    // Remove from active errors
    this.activeErrors.delete(errorId);

    // Remove toast if exists
    const toast = document.getElementById(`erix-error-toast-${errorId}`);
    if (toast) {
      toast.classList.add('erix-error-toast-exit');
      setTimeout(() => toast.remove(), 300);
    }

    // Remove modal if exists
    const modal = document.getElementById(`erix-error-modal-${errorId}`);
    if (modal) {
      modal.classList.add('erix-error-modal-exit');
      setTimeout(() => modal.remove(), 300);
    }
  }

  /**
   * Get or create toast container
   */
  private getToastContainer(): HTMLElement {
    let container = document.getElementById('erix-error-toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'erix-error-toast-container';
      container.className = 'erix-error-toast-container';
      container.setAttribute('aria-live', 'polite');
      container.setAttribute('aria-atomic', 'true');
      document.body.appendChild(container);
    }
    return container;
  }

  /**
   * Generate unique error ID
   */
  private generateErrorId(error: ErixError): string {
    return `${error.type}-${error.timestamp}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get user-friendly error message
   */
  private getUserFriendlyMessage(error: ErixError): string {
    // Check for custom message override
    if (this.config.customMessages?.[error.code || '']) {
      return this.config.customMessages[error.code || ''];
    }

    // Return the error message (should already be user-friendly)
    return error.message;
  }

  /**
   * Get error title based on type
   */
  private getErrorTitle(error: ErixError): string {
    const titles: Record<string, string> = {
      VALIDATION_ERROR: 'Validation Error',
      NETWORK_ERROR: 'Connection Error',
      API_ERROR: 'Service Error',
      PERMISSION_ERROR: 'Permission Denied',
      CONTENT_ERROR: 'Content Error',
      PLUGIN_ERROR: 'Plugin Error',
      UNKNOWN_ERROR: 'Error',
    };

    return titles[error.type] || 'Error';
  }

  /**
   * Get error icon based on type
   */
  private getErrorIcon(error: ErixError): string {
    const icons: Record<string, string> = {
      VALIDATION_ERROR: '⚠️',
      NETWORK_ERROR: '🌐',
      API_ERROR: '🔌',
      PERMISSION_ERROR: '🔒',
      CONTENT_ERROR: '📄',
      PLUGIN_ERROR: '🔌',
      UNKNOWN_ERROR: '❌',
    };

    return icons[error.type] || '❌';
  }

  /**
   * Format error details for display
   */
  private formatDetails(details: Record<string, any>): string {
    const entries = Object.entries(details);
    if (entries.length === 0) return '';

    const items = entries
      .map(([key, value]) => `<li><strong>${key}:</strong> ${String(value)}</li>`)
      .join('');

    return `<ul class="erix-error-details">${items}</ul>`;
  }

  /**
   * Clear all active errors
   */
  clearAll(): void {
    for (const errorId of this.activeErrors.keys()) {
      this.dismissError(errorId);
    }
  }

  /**
   * Update display configuration
   */
  updateConfig(config: Partial<ErrorDisplayConfig>): void {
    this.config = { ...this.config, ...config };
  }
}
