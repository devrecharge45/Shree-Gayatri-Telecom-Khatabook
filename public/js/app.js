/**
 * Khatabook Pro - Client-Side Interactivity (Zero CDN)
 */
(() => {
  'use strict';

  // Helper function to open modal by ID
  function openModal(modalId) {
    if (!modalId) return;
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add('active');
      const autofocusEl = modal.querySelector('input:not([type="hidden"]), select, textarea');
      if (autofocusEl) {
        setTimeout(() => autofocusEl.focus(), 60);
      }
    }
  }

  // Helper function to close modal element
  function closeModal(modal) {
    if (modal) {
      modal.classList.remove('active');
    }
  }

  // Global event delegation for modal & UI triggers
  document.addEventListener('click', (e) => {
    // 1. Open Modal Trigger
    const openTrigger = e.target.closest('[data-open-modal]');
    if (openTrigger) {
      e.preventDefault();
      const modalId = openTrigger.getAttribute('data-open-modal');

      // Special handling for Edit Transaction Modal to pre-fill data
      if (modalId === 'editTxModal') {
        const partyId = openTrigger.getAttribute('data-party-id');
        const txId = openTrigger.getAttribute('data-tx-id');
        const txType = openTrigger.getAttribute('data-tx-type');
        const txAmount = openTrigger.getAttribute('data-tx-amount');
        const txDate = openTrigger.getAttribute('data-tx-date');
        const txNotes = openTrigger.getAttribute('data-tx-notes');
        const txRef = openTrigger.getAttribute('data-tx-ref');

        const editForm = document.getElementById('editTxForm');
        if (editForm) {
          editForm.action = `/parties/${partyId}/transactions/${txId}/edit`;
        }

        const typeSelect = document.getElementById('edit_tx_type');
        if (typeSelect && txType) typeSelect.value = txType;

        const amountInput = document.getElementById('edit_tx_amount');
        if (amountInput && txAmount) amountInput.value = txAmount;

        const dateInput = document.getElementById('edit_tx_date');
        if (dateInput && txDate) dateInput.value = txDate;

        const notesInput = document.getElementById('edit_tx_notes');
        if (notesInput) notesInput.value = txNotes || '';

        const refInput = document.getElementById('edit_tx_ref');
        if (refInput) refInput.value = txRef || '';
      }

      openModal(modalId);
      return;
    }

    // 2. Close Modal Trigger
    const closeBtn = e.target.closest('[data-close-modal]');
    if (closeBtn) {
      e.preventDefault();
      const modal = closeBtn.closest('.modal-overlay');
      closeModal(modal);
      return;
    }

    // 3. Click on Modal Overlay Backdrop (outside modal-content)
    if (e.target.classList.contains('modal-overlay')) {
      closeModal(e.target);
      return;
    }

    // 4. Dropdown Menu Toggle (e.g., Download Report)
    const dropdownToggle = e.target.closest('[data-toggle="dropdown"]');
    if (dropdownToggle) {
      e.preventDefault();
      e.stopPropagation();
      const parent = dropdownToggle.closest('.dropdown');
      if (parent) {
        const menu = parent.querySelector('.dropdown-menu');
        if (menu) menu.classList.toggle('show');
      }
      return;
    }

    // Close any open dropdowns when clicking anywhere outside
    document.querySelectorAll('.dropdown-menu.show').forEach((menu) => {
      menu.classList.remove('show');
    });

    // 5. Flash Alert Dismissal
    const alertClose = e.target.closest('.alert-close');
    if (alertClose) {
      const alert = alertClose.closest('.alert');
      if (alert) alert.remove();
    }

    // 6. Ledger Filter Drawer Toggle
    const filterToggleBtn = e.target.closest('#toggleFilterDrawerBtn');
    if (filterToggleBtn) {
      e.preventDefault();
      const drawer = document.getElementById('ledgerFilterDrawer');
      if (drawer) {
        drawer.classList.toggle('open');
      }
      return;
    }

    // 7. Ledger Party Details Accordion Toggle (Mobile)
    const partyAccordionBtn = e.target.closest('#togglePartyAccordionBtn');
    if (partyAccordionBtn) {
      e.preventDefault();
      const accordion = document.getElementById('partyDetailsAccordion');
      if (accordion) {
        const isOpen = accordion.classList.toggle('open');
        partyAccordionBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        partyAccordionBtn.classList.toggle('active', isOpen);
      }
      return;
    }
  });

  // Close modals & dropdowns with Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal-overlay.active').forEach((modal) => {
        closeModal(modal);
      });
      document.querySelectorAll('.dropdown-menu.show').forEach((menu) => {
        menu.classList.remove('show');
      });
    }
  });

  // Universal Form Submit Interceptor:
  // 1. Checks confirmation (data-confirm)
  // 2. Disables submit button & displays animated loading spinner to prevent multiple submissions
  document.addEventListener('submit', (e) => {
    const form = e.target;

    // Check data-confirm attribute
    const confirmMessage = form.getAttribute('data-confirm');
    if (confirmMessage) {
      if (!window.confirm(confirmMessage)) {
        e.preventDefault();
        return;
      }
    }

    // Prevent multiple submissions by adding loading state
    const submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn) {
      if (submitBtn.classList.contains('btn-loading') || submitBtn.disabled) {
        e.preventDefault();
        return;
      }

      submitBtn.classList.add('btn-loading');
      submitBtn.disabled = true;

      // Prepend animated spinner
      const spinner = document.createElement('span');
      spinner.className = 'btn-spinner';
      submitBtn.prepend(spinner);

      // Re-enable after timeout as a safety fallback in case browser cancels navigation
      setTimeout(() => {
        submitBtn.disabled = false;
        submitBtn.classList.remove('btn-loading');
        if (spinner && spinner.parentNode) {
          spinner.parentNode.removeChild(spinner);
        }
      }, 8000);
    }
  });

  // Register Service Worker for PWA (if supported)
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => console.log('ServiceWorker registered:', reg.scope))
        .catch((err) => console.log('ServiceWorker registration notice:', err));
    });
  }
})();
