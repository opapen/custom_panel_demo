console.info("HassBeam Card v2.0.0 loaded");

/**
 * HassBeam Card - Custom Lovelace Card for Home Assistant
 * Displays IR code events from HassBeam devices in a configurable table format.
 */
class HassBeamCard extends HTMLElement {
  constructor() {
    super();
    this.config = {};
    this.irCodes = [];
    this.currentDevice = '';
    this.currentAction = '';
    this.currentProtocol = 'Pronto';
    this.currentLimit = 10;
    this._hass = null;
    this._activeSubscription = null;
    this._subscriptionTimeout = null;
  }

  setConfig(config) {
    console.log('HassBeam Card: setConfig called', config);
    
    if (!config) {
      throw new Error('Invalid configuration');
    }

    this.config = config;
    this.irCodes = [];
    this.currentDevice = config.device || '';
    this.currentAction = config.action || '';
    this.currentProtocol = config.protocol || 'Pronto';
    this.currentLimit = config.limit || 10;

    console.log('HassBeam Card: Configuration set', {
      device: this.currentDevice,
      action: this.currentAction,
      protocol: this.currentProtocol,
      limit: this.currentLimit,
      show_table: config.show_table
    });

    this.createCard();
    this.attachEventListeners();
  }

  createCard() {
    const showTable = this.config.show_table !== false;
    const cardHeight = this.config.height || 'auto';
    const cardWidth = this.config.width || 'auto';

    this.innerHTML = this.generateCardHTML(showTable, cardHeight, cardWidth);
  }

  generateCardHTML(showTable, cardHeight, cardWidth) {
    return `
      <ha-card header="${this.config.title || 'HassBeam Card'}" style="height: ${cardHeight}; width: ${cardWidth};">
        <div class="card-content">
          ${showTable ? this.generateTableHTML() : ''}
        </div>
      </ha-card>
      ${this.generateCSS(cardWidth, cardHeight)}
    `;
  }

  /**
   * Generate the HTML for the table and its controls
   * @returns {string} HTML string
   */
  generateTableHTML() {
    return `
      <div class="table-controls">
        <div class="filter-section">
          <label>Filter by Device:</label>
          <input type="text" id="device-filter" placeholder="Enter device name..." value="${this.currentDevice}" />
          <label>Filter by Action:</label>
          <input type="text" id="action-filter" placeholder="Enter action name..." value="${this.currentAction}" />
          <label>Filter by Protocol:</label>
          <input type="text" id="protocol-filter" placeholder="Enter protocol..." value="${this.currentProtocol}" />
          <label>Limit:</label>
          <input type="number" id="limit-input" min="1" max="100" value="${this.currentLimit}" />
          <button id="refresh-btn">Refresh</button>
        </div>
      </div>
      
      <div class="table-container">
        <table id="ir-codes-table">
          <colgroup>
            <col style="width: 15%; min-width: 150px;">
            <col style="width: 12%; min-width: 100px;">
            <col style="width: 12%; min-width: 100px;">
            <col style="width: 12%; min-width: 100px;">
            <col style="width: 10%; min-width: 100px;">
            <col style="width: 31%; min-width: 300px;">
            <col style="width: 8%; min-width: 80px;">
          </colgroup>
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>HassBeam Device</th>
              <th>Device</th>
              <th>Action</th>
              <th>Protocol</th>
              <th>Event Data</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody id="table-body">
            <tr>
              <td colspan="7" style="text-align: center; padding: 20px; color: var(--secondary-text-color);">
                Click "Refresh" to load IR codes
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    `;
  }
  /**
   * Generate CSS styles for the card
   * @param {string} cardWidth - Width of the card
   * @param {string} cardHeight - Height of the card
   * @returns {string} CSS string
   */
  generateCSS(cardWidth, cardHeight) {
    return `
      <style>
        ha-card {
          width: ${cardWidth};
          height: ${cardHeight};
          display: block;
        }
        
        .card-content {
          padding: 16px;
          height: 100%;
          display: flex;
          flex-direction: column;
        }
        
        .table-controls {
          margin-bottom: 16px;
        }
        
        .filter-section {
          display: flex;
          gap: 8px;
          align-items: center;
          flex-wrap: wrap;
        }
        
        .filter-section label {
          font-weight: 500;
        }
        
        .filter-section input {
          padding: 6px 8px;
          border: 1px solid var(--divider-color);
          border-radius: 4px;
          background: var(--card-background-color);
          color: var(--primary-text-color);
        }
        
        .filter-section input[type="text"] {
          min-width: 150px;
        }
        
        .filter-section input[type="number"] {
          width: 60px;
        }
        
        .filter-section button {
          padding: 6px 12px;
          border: none;
          border-radius: 4px;
          background: var(--primary-color);
          color: var(--text-primary-color);
          cursor: pointer;
          font-size: 14px;
        }
        
        .filter-section button:hover {
          background: var(--primary-color-dark);
        }
        
        .table-container {
          overflow: auto;
          border: 1px solid var(--divider-color);
          border-radius: 4px;
          width: 100%;
          flex-grow: 1;
          min-height: 400px;
        }
        
        #ir-codes-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 14px;
          table-layout: fixed !important;
        }
        
        #ir-codes-table th,
        #ir-codes-table td {
          padding: 8px 12px;
          text-align: left;
          border-bottom: 1px solid var(--divider-color);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          user-select: text;
          -webkit-user-select: text;
          -moz-user-select: text;
          -ms-user-select: text;
        }
        
        #ir-codes-table th {
          background: var(--table-header-background-color, var(--secondary-background-color));
          font-weight: 500;
          position: sticky;
          top: 0;
        }
        
        #ir-codes-table tr:hover {
          background: var(--table-row-hover-color, var(--secondary-background-color));
        }
        
        .timestamp {
          font-family: monospace;
          font-size: 12px;
          user-select: text;
          cursor: text;
        }
        
        .device {
          font-weight: 500;
          user-select: text;
          cursor: text;
        }
        
        .action {
          color: var(--primary-color);
          user-select: text;
          cursor: text;
        }
        
        .protocol {
          font-weight: 500;
          color: var(--secondary-text-color);
          font-size: 12px;
          user-select: text;
          cursor: text;
        }
        
        .hassbeam-device {
          font-weight: 500;
          color: var(--secondary-text-color);
          font-size: 12px;
          user-select: text;
          cursor: text;
        }
        
        .event-data {
          font-family: monospace;
          font-size: 12px;
          user-select: text;
          cursor: text;
        }
        
        .event-data:hover {
          overflow: visible;
          white-space: normal;
          background: var(--card-background-color);
          position: relative;
          z-index: 1;
          word-break: break-all;
        }
        
        .actions {
          text-align: center;
          padding: 4px;
        }
        
        .send-btn {
          background: #4CAF50;
          color: white;
          border: none;
          border-radius: 50%;
          width: 24px;
          height: 24px;
          cursor: pointer;
          font-size: 12px;
          margin-right: 4px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          transition: background-color 0.2s;
        }
        
        .send-btn:hover {
          background: #45a049;
        }
        
        .send-btn:active {
          transform: scale(0.95);
        }
        
        .delete-btn {
          background: #ff4444;
          color: white;
          border: none;
          border-radius: 50%;
          width: 24px;
          height: 24px;
          cursor: pointer;
          font-size: 16px;
          font-weight: bold;
          line-height: 1;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          transition: background-color 0.2s;
        }
        
        .delete-btn:hover {
          background: #cc0000;
        }
        
        .delete-btn:active {
          transform: scale(0.95);
        }
        
        .temp-message {
          position: fixed;
          top: 20px;
          right: 20px;
          padding: 10px 20px;
          border-radius: 4px;
          font-weight: 500;
          z-index: 1000;
          display: none;
          max-width: 300px;
          word-wrap: break-word;
        }
        
        .temp-message.success {
          background: #4CAF50;
          color: white;
        }
        
        .temp-message.error {
          background: #f44336;
          color: white;
        }
        
        .temp-message.info {
          background: #2196F3;
          color: white;
        }
      </style>
    `;
  }

  /**
   * Attach event listeners to UI elements
   */
  attachEventListeners() {
    console.log('HassBeam Card: attachEventListeners called');
    
    // Refresh button
    const refreshBtn = this.querySelector('#refresh-btn');
    if (refreshBtn) {
      console.log('HassBeam Card: Refresh button event listener added');
      refreshBtn.addEventListener('click', () => {
        console.log('HassBeam Card: Refresh button clicked');
        this.updateFiltersFromUI();
        this.loadIrCodes();
      });
    } else {
      console.warn('HassBeam Card: Refresh button not found');
    }
    
    // Action filter input
    const actionFilter = this.querySelector('#action-filter');
    if (actionFilter) {
      actionFilter.addEventListener('input', () => {
        this.updateFiltersFromUI();
      });
    }
    
    // Protocol filter input
    const protocolFilter = this.querySelector('#protocol-filter');
    if (protocolFilter) {
      protocolFilter.addEventListener('input', () => {
        this.updateFiltersFromUI();
      });
    }
    
    // Event delegation for action buttons
    this.addEventListener('click', (event) => {
      if (event.target.classList.contains('delete-btn')) {
        const codeId = event.target.getAttribute('data-code-id');
        if (codeId) {
          this.deleteCode(parseInt(codeId));
        }
      } else if (event.target.classList.contains('send-btn')) {
        const device = event.target.getAttribute('data-device');
        const action = event.target.getAttribute('data-action');
        if (device && action) {
          this.sendIrCode(device, action);
        }
      }
    });
  }

  /**
   * Read filter and limit values from UI elements
   */
  updateFiltersFromUI() {
    console.log('HassBeam Card: updateFiltersFromUI called');
    
    const deviceFilter = this.querySelector('#device-filter');
    const limitInput = this.querySelector('#limit-input');
    const actionFilter = this.querySelector('#action-filter');
    const protocolFilter = this.querySelector('#protocol-filter');

    const oldDevice = this.currentDevice;
    const oldLimit = this.currentLimit;
    const oldAction = this.currentAction;
    const oldProtocol = this.currentProtocol;
    this.currentDevice = deviceFilter?.value || '';
    this.currentAction = actionFilter?.value || '';
    this.currentProtocol = protocolFilter?.value || '';
    this.currentLimit = limitInput?.value || '10';

    console.log('HassBeam Card: Filters updated', {
      device: { old: oldDevice, new: this.currentDevice },
      action: { old: oldAction, new: this.currentAction },
      protocol: { old: oldProtocol, new: this.currentProtocol },
      limit: { old: oldLimit, new: this.currentLimit }
    });
  }

  /**
   * Set the Home Assistant object
   * @param {Object} hass - Home Assistant object
   */
  set hass(hass) {
    console.log('HassBeam Card: hass object set', hass ? 'available' : 'not available');
    
    this._hass = hass;
    
    // No automatic loading - only manual via refresh button
    console.log('HassBeam Card: Automatic loading disabled - use refresh button');
  }

  /**
   * Load IR codes from the HassBeam service
   */
  async loadIrCodes() {
    console.log('HassBeam Card: loadIrCodes called');
    
    if (!this._hass) {
      console.warn('HassBeam Card: No hass object available, loadIrCodes will exit');
      return;
    }

    if (!this._hass.connection) {
      console.error('HassBeam Card: No Home Assistant connection available');
      this.showError('No connection to Home Assistant');
      return;
    }

    // End previous subscription if still active
    this.cleanupSubscription();

    try {
      const serviceData = this.prepareServiceData();
      console.log('HassBeam Card: Service data prepared', serviceData);
      
      let hasReceived = false;
      
      // Event subscription
      console.log('HassBeam Card: Setting up event subscription for "hassbeam_connect_codes_retrieved"');
      try {
        this._activeSubscription = await this._hass.connection.subscribeEvents((event) => {
          console.log('HassBeam Card: Event "hassbeam_connect_codes_retrieved" received', event);
          
          if (event.data?.codes && !hasReceived) {
            console.log('HassBeam Card: Valid IR codes received', {
              count: event.data.codes.length,
              codes: event.data.codes
            });
            
            hasReceived = true;
            this.irCodes = event.data.codes;
            this.updateTable();
            this.cleanupSubscription();
          } else {
            console.log('HassBeam Card: Event without valid codes or already received', {
              hasCodes: !!event.data?.codes,
              hasReceived: hasReceived
            });
          }
        }, 'hassbeam_connect_codes_retrieved');

        if (this._activeSubscription && typeof this._activeSubscription === 'function') {
          console.log('HassBeam Card: Event subscription set up successfully');
        } else {
          console.warn('HassBeam Card: Event subscription might have failed:', typeof this._activeSubscription);
        }
      } catch (subscribeError) {
        console.error('HassBeam Card: Error setting up event subscription:', subscribeError);
        this._activeSubscription = null;
      }

      // Call service
      console.log('HassBeam Card: Calling service "hassbeam_connect.get_recent_codes"', serviceData);
      await this._hass.callService('hassbeam_connect', 'get_recent_codes', serviceData);
      console.log('HassBeam Card: Service call completed successfully');

      // Timeout as fallback
      console.log('HassBeam Card: Setting up timeout (5s)');
      this._subscriptionTimeout = setTimeout(() => {
        if (!hasReceived) {
          console.error('HassBeam Card: Timeout reached - no data received');
          this.showError('No data received (timeout)');
          this.cleanupSubscription();
        } else {
          console.log('HassBeam Card: Timeout reached but data already received');
        }
      }, 5000);

    } catch (error) {
      console.error('HassBeam Card: Error loading IR codes:', error);
      this.showError('Error loading data: ' + error.message);
      this.cleanupSubscription();
    }
  }

  /**
   * Prepare service data for the API call
   * @returns {Object} Service data
   */
  prepareServiceData() {
    console.log('HassBeam Card: prepareServiceData called', {
      currentDevice: this.currentDevice,
      currentProtocol: this.currentProtocol,
      currentLimit: this.currentLimit
    });
    
    const serviceData = { limit: parseInt(this.currentLimit) || 10 };
    if (this.currentDevice?.trim()) {
      serviceData.device = this.currentDevice.trim();
      console.log('HassBeam Card: Device name added to service data', serviceData.device);
    }
    if (this.currentAction?.trim()) {
      serviceData.action = this.currentAction.trim();
      console.log('HassBeam Card: Action name added to service data', serviceData.action);
    }
    if (this.currentProtocol?.trim()) {
      serviceData.protocol = this.currentProtocol.trim();
      console.log('HassBeam Card: Protocol added to service data', serviceData.protocol);
    }

    console.log('HassBeam Card: Service data prepared', serviceData);
    return serviceData;
  }

  /**
   * Clean up active event subscription and timeout
   */
  cleanupSubscription() {
    console.log('HassBeam Card: cleanupSubscription called', {
      hasActiveSubscription: !!this._activeSubscription,
      hasTimeout: !!this._subscriptionTimeout
    });

    // Clean up timeout
    if (this._subscriptionTimeout) {
      console.log('HassBeam Card: Clearing timeout');
      clearTimeout(this._subscriptionTimeout);
      this._subscriptionTimeout = null;
    }

    // Clean up subscription
    if (this._activeSubscription && typeof this._activeSubscription === 'function') {
      console.log('HassBeam Card: Ending event subscription');
      try {
        this._activeSubscription();
        console.log('HassBeam Card: Event subscription ended successfully');
      } catch (error) {
        console.error('HassBeam Card: Error ending event subscription:', error);
      }
      this._activeSubscription = null;
    } else if (this._activeSubscription) {
      console.warn('HassBeam Card: ActiveSubscription is not a function:', typeof this._activeSubscription);
      this._activeSubscription = null;
    }
  }

  /**
   * Update table with new data
   */
  updateTable() {
    console.log('HassBeam Card: updateTable called', {
      codeCount: this.irCodes.length,
      codes: this.irCodes
    });
    
    const tableBody = this.querySelector('#table-body');
    if (!tableBody) {
      console.error('HassBeam Card: table-body element not found');
      return;
    }

    if (this.irCodes.length === 0) {
      console.log('HassBeam Card: No IR codes available, showing empty table');
      tableBody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align: center; padding: 20px;">
            No IR codes found
          </td>
        </tr>
      `;
      return;
    }

    console.log('HassBeam Card: Filling table with data');
    tableBody.innerHTML = this.irCodes.map(code => this.createTableRow(code)).join('');
    console.log('HassBeam Card: Table updated successfully');
  }

  /**
   * Create a single table row
   * @param {Object} code - IR code object
   * @returns {string} HTML string for the table row
   */
  createTableRow(code) {
    console.log('HassBeam Card: createTableRow called', code);
    
    const timestamp = new Date(code.created_at).toLocaleString('en-US');
    const { protocol, formattedEventData, hassbeamDevice } = this.parseEventData(code.event_data);

    const row = `
      <tr>
        <td class="timestamp">${timestamp}</td>
        <td class="hassbeam-device">${hassbeamDevice}</td>
        <td class="device">${code.device}</td>
        <td class="action">${code.action}</td>
        <td class="protocol">${protocol}</td>
        <td class="event-data" title="${formattedEventData}">${formattedEventData}</td>
        <td class="actions">
          <button class="send-btn" data-device="${code.device}" data-action="${code.action}" title="Send IR Code">
            📡
          </button>
          <button class="delete-btn" data-code-id="${code.id}" title="Delete">
            ×
          </button>
        </td>
      </tr>
    `;
    
    console.log('HassBeam Card: Table row created', {
      id: code.id,
      device: code.device,
      action: code.action,
      protocol: protocol,
      hassbeamDevice: hassbeamDevice
    });
    
    return row;
  }

  /**
   * Parse and format event data
   * @param {string} eventData - JSON string with event data
   * @returns {Object} Parsed data with protocol and formatted event data
   */
  parseEventData(eventData) {
    console.log('HassBeam Card: parseEventData called', eventData);
    
    try {
      const parsed = JSON.parse(eventData);
      const protocol = parsed.protocol || 'N/A';
      const hassbeamDevice = parsed.hassbeam_device || 'N/A';
      
      console.log('HassBeam Card: Event data parsed successfully', {
        protocol: protocol,
        hassbeamDevice: hassbeamDevice,
        originalData: parsed
      });
      
      // Hide device_name, device_id, hassbeam_device and protocol from display
      const filteredData = Object.entries(parsed)
        .filter(([key]) => !['device_name', 'device_id', 'hassbeam_device', 'protocol'].includes(key))
        .map(([key, value]) => `${key}: ${value}`)
        .join(', ');
      
      console.log('HassBeam Card: Event data formatted (without device_name, device_id, hassbeam_device, protocol)', {
        protocol: protocol,
        hassbeamDevice: hassbeamDevice,
        formattedEventData: filteredData
      });
      
      return { protocol, formattedEventData: filteredData, hassbeamDevice };
    } catch (e) {
      console.error('HassBeam Card: Error parsing event data:', e, eventData);
      return { protocol: 'N/A', formattedEventData: eventData, hassbeamDevice: 'N/A' };
    }
  }

  /**
   * Get card size for the dashboard
   * @returns {number} Card size
   */
  getCardSize() {
    // Configurable card size
    // Default values: 6 for cards with table, 1 for cards without table
    if (this.config.card_size !== undefined) {
      return this.config.card_size;
    }
    return this.config.show_table !== false ? 6 : 1;
  }

  /**
   * Show error message in the table
   * @param {string} message - Error message
   */
  showError(message) {
    console.error('HassBeam Card: showError called', message);
    
    const tableBody = this.querySelector('#table-body');
    if (tableBody) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align: center; padding: 20px; color: var(--error-color);">
            ${message}
          </td>
        </tr>
      `;
      console.log('HassBeam Card: Error message displayed in table');
    } else {
      console.error('HassBeam Card: table-body element not found for error message');
    }
  }

  /**
   * Properties for better HACS compatibility
   * @returns {Object} Properties object
   */
  static get properties() {
    return {
      hass: {},
      config: {}
    };
  }

  /**
   * Send IR code
   * @param {string} device - Device name
   * @param {string} action - Action name
   */
  async sendIrCode(device, action) {
    console.log('HassBeam Card: sendIrCode called', { device, action });
    
    if (!this._hass) {
      console.error('HassBeam Card: No Home Assistant instance available');
      return;
    }
    
    try {
      // Call the send_ir_code service
      const result = await this._hass.callService('hassbeam_connect', 'send_ir_code', {
        device: device,
        action: action
      });
      
      console.log('HassBeam Card: IR code sent successfully', result);
      
      // Show success message
      this.showTemporaryMessage(`IR code sent: ${device}.${action}`, 'success');
      
    } catch (error) {
      console.error('HassBeam Card: Error sending IR code:', error);
      this.showTemporaryMessage(`Error sending IR code: ${error.message}`, 'error');
    }
  }

  /**
   * Show temporary message
   * @param {string} message - Message to show
   * @param {string} type - Message type ('success' or 'error')
   */
  showTemporaryMessage(message, type = 'info') {
    // Create or update message element
    let messageEl = this.querySelector('.temp-message');
    if (!messageEl) {
      messageEl = document.createElement('div');
      messageEl.className = 'temp-message';
      this.querySelector('.card-content').appendChild(messageEl);
    }
    
    messageEl.textContent = message;
    messageEl.className = `temp-message ${type}`;
    messageEl.style.display = 'block';
    
    // Hide after 3 seconds
    setTimeout(() => {
      if (messageEl) {
        messageEl.style.display = 'none';
      }
    }, 3000);
  }

  /**
   * Delete IR code
   * @param {number} codeId - ID of the code to delete
   */
  async deleteCode(codeId) {
    console.log('HassBeam Card: deleteCode called', codeId);
    
    if (!this._hass) {
      console.error('HassBeam Card: No Home Assistant instance available');
      return;
    }
    
    // Show confirmation dialog
    if (!confirm('Do you really want to delete this IR code?')) {
      return;
    }
    
    try {
      // Call service
      const result = await this._hass.callService('hassbeam_connect', 'delete_ir_code', {
        id: codeId
      });
      
      console.log('HassBeam Card: IR code deleted', result);
      
      // Refresh table
      await this.loadIrCodes();
      
    } catch (error) {
      console.error('HassBeam Card: Error deleting IR code:', error);
      alert('Error deleting IR code: ' + error.message);
    }
  }

  /**
   * Called when the card is removed from the DOM
   */
  disconnectedCallback() {
    console.log('HassBeam Card: disconnectedCallback - card being removed');
    this.cleanupSubscription();
  }
}

customElements.define('hassbeam-card', HassBeamCard);

// For Home Assistant Card Picker
window.customCards = window.customCards || [];
window.customCards.push({
  type: 'hassbeam-card',
  name: 'HassBeam Card',
  description: 'A card for displaying IR events with HassBeam including table'
});


// HASSBEAM SETUP CARD (second card in the same file)
console.info("HassBeam Setup Card v1.0.0 loaded");

class HassBeamSetupCard extends HTMLElement {
  constructor() {
    super();
    this.config = {};
    this.isListening = false;
    this.capturedEvents = [];
    this._eventSubscription = null;
  }

  setConfig(config) {
    this.config = config;
    this.render();
    this.attachEventListeners();
  }

  set hass(hass) {
    this._hass = hass;
    // Data could be loaded here later
  }

  render() {
    const cardWidth = this.config.width || 'auto';
    const cardHeight = this.config.height || 'auto';
    
    this.innerHTML = `
      <ha-card header="${this.config.title || 'HassBeam Setup'}">
        <div class="card-content">
          <div class="top-controls">
            <button id="start-listening-btn" class="listening-btn">Start Listening</button>
            <button id="clear-table-btn" class="clear-btn">Clear Table</button>
          </div>
          
          <div class="setup-table-container">
            <table id="setup-table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>HassBeam Device</th>
                  <th>Protocol</th>
                  <th>Event Data</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody id="setup-table-body">
                <tr>
                  <td colspan="5" style="text-align: center; padding: 20px; color: var(--secondary-text-color);">
                    Click "Start Listening" to begin
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <div class="setup-controls">
            <div class="input-group">
              <label for="device-input">Device:</label>
              <input type="text" id="device-input" placeholder="Enter device name..." />
            </div>
            <div class="input-group">
              <label for="action-input">Action:</label>
              <input type="text" id="action-input" placeholder="Enter action name..." />
            </div>
          </div>
          
          <div class="save-section">
            <button id="save-code-btn" class="save-btn" disabled>Save IR Code</button>
          </div>
        </div>
      </ha-card>
      ${this.generateSetupCSS(cardWidth, cardHeight)}
    `;
  }

  generateSetupCSS(cardWidth, cardHeight) {
    return `
      <style>
        ha-card {
          width: ${this.config.width || 'auto'};
          height: ${this.config.height || 'auto'};
          display: block;
        }
        .card-content {
          padding: 16px;
        }
        .top-controls {
          margin-bottom: 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .setup-controls {
          margin-top: 20px;
          margin-bottom: 20px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .input-group {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .input-group label {
          font-weight: 500;
          min-width: 80px;
        }
        .input-group input {
          flex: 1;
          padding: 8px 12px;
          border: 1px solid var(--divider-color);
          border-radius: 4px;
          background: var(--card-background-color);
          color: var(--primary-text-color);
          font-size: 14px;
        }
        .listening-btn, .save-btn, .clear-btn {
          padding: 10px 20px;
          border: none;
          border-radius: 4px;
          background: var(--primary-color);
          color: var(--text-primary-color);
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
        }
        .clear-btn {
          background: var(--secondary-color, #757575);
        }
        .clear-btn:hover {
          background: var(--secondary-color-dark, #616161);
        }
        .listening-btn:hover, .save-btn:hover {
          filter: brightness(0.9);
        }
        .listening-btn.listening {
          background: var(--error-color);
        }
        .listening-btn.listening:hover {
          background: var(--error-color);
          filter: brightness(0.9);
        }
        .save-btn {
          background: var(--success-color);
        }
        .save-btn:hover {
          background: var(--success-color);
          filter: brightness(0.9);
        }
        .save-btn:disabled {
          background: var(--disabled-color, #cccccc);
          color: var(--disabled-text-color, #888888);
          cursor: not-allowed;
        }
        .save-btn:disabled:hover {
          background: var(--disabled-color, #cccccc);
        }
        .save-section {
          margin-top: 16px;
          text-align: center;
        }
        .setup-table-container {
          border: 1px solid var(--divider-color);
          border-radius: 4px;
          overflow: auto;
          max-height: 400px;
        }
        #setup-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 14px;
        }
        #setup-table th,
        #setup-table td {
          padding: 8px 12px;
          text-align: left;
          border-bottom: 1px solid var(--divider-color);
        }
        #setup-table th {
          background: var(--table-header-background-color, var(--secondary-background-color));
          font-weight: 500;
          position: sticky;
          top: 0;
        }
        #setup-table tr:hover {
          background: var(--table-row-hover-color, var(--secondary-background-color));
        }
        .use-btn {
          padding: 4px 8px;
          border: none;
          border-radius: 2px;
          background: var(--primary-color);
          color: var(--text-primary-color);
          cursor: pointer;
          font-size: 12px;
        }
        .use-btn:hover {
          background: var(--primary-color);
          filter: brightness(0.9);
        }
        .use-btn.selected {
          background: var(--success-color);
          color: var(--text-primary-color);
        }
        .use-btn.selected:hover {
          background: var(--success-color);
          filter: brightness(0.9);
        }
        .send-btn-setup {
          background: #4CAF50;
          color: white;
          border: none;
          border-radius: 2px;
          padding: 4px 8px;
          cursor: pointer;
          font-size: 12px;
          margin-left: 4px;
        }
        .send-btn-setup:hover {
          background: #45a049;
        }
        .send-btn-setup:active {
          transform: scale(0.95);
        }
        .event-data {
          font-family: monospace;
          font-size: 12px;
          max-width: 300px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .event-data:hover {
          overflow: visible;
          white-space: normal;
          background: var(--card-background-color);
          position: relative;
          z-index: 1;
          word-break: break-all;
        }
      </style>
    `;
  }

  attachEventListeners() {
    const startListeningBtn = this.querySelector('#start-listening-btn');
    const saveCodeBtn = this.querySelector('#save-code-btn');
    const clearTableBtn = this.querySelector('#clear-table-btn');
    const deviceInput = this.querySelector('#device-input');
    const actionInput = this.querySelector('#action-input');
    
    if (startListeningBtn) {
      startListeningBtn.addEventListener('click', () => {
        this.toggleListening();
      });
    }
    
    if (saveCodeBtn) {
      saveCodeBtn.addEventListener('click', () => {
        this.saveSelectedCode();
      });
    }
    
    if (clearTableBtn) {
      clearTableBtn.addEventListener('click', () => {
        this.clearTable();
      });
    }
    
    // Monitor input fields for save button state
    if (deviceInput) {
      deviceInput.addEventListener('input', () => {
        this.updateSaveButtonState();
      });
    }
    
    if (actionInput) {
      actionInput.addEventListener('input', () => {
        this.updateSaveButtonState();
      });
    }
  }

  async toggleListening() {
    const deviceInput = this.querySelector('#device-input');
    const actionInput = this.querySelector('#action-input');
    const startListeningBtn = this.querySelector('#start-listening-btn');
    const saveCodeBtn = this.querySelector('#save-code-btn');
    
    if (!this.isListening) {
      if (!this._hass || !this._hass.connection) {
        alert('No connection to Home Assistant available.');
        return;
      }
      
      // Start Listening
      this.isListening = true;
      startListeningBtn.textContent = 'Stop Listening';
      startListeningBtn.classList.add('listening');
      
      // Clear table and show status
      this.updateTableWithStatus('Listening for IR codes... Press a button on your remote control.');
      
      console.log('HassBeam Setup: Start Listening');
      
      // Start event subscription
      try {
        this._eventSubscription = await this._hass.connection.subscribeEvents((event) => {
          console.log('HassBeam Setup: IR event received', event);
          this.handleIrEvent(event);
        }, 'esphome.hassbeam.ir_received');
        
        console.log('HassBeam Setup: Event subscription set up successfully');
      } catch (error) {
        console.error('HassBeam Setup: Error setting up event subscription:', error);
        alert('Error starting listening: ' + error.message);
        this.stopListening();
      }
      
    } else {
      // Stop Listening
      this.stopListening();
    }
  }

  stopListening() {
    const startListeningBtn = this.querySelector('#start-listening-btn');
    const saveCodeBtn = this.querySelector('#save-code-btn');
    
    this.isListening = false;
    startListeningBtn.textContent = 'Start Listening';
    startListeningBtn.classList.remove('listening');
    
    // End event subscription
    if (this._eventSubscription && typeof this._eventSubscription === 'function') {
      try {
        this._eventSubscription();
        console.log('HassBeam Setup: Event subscription ended');
      } catch (error) {
        console.error('HassBeam Setup: Error ending event subscription:', error);
      }
      this._eventSubscription = null;
    }
    
    // Enable save button if events are available
    this.updateSaveButtonState();
    
    console.log('HassBeam Setup: Stop Listening');
  }

  handleIrEvent(event) {
    console.log('HassBeam Setup: IR event processed', event);
    
    // Add event to captured events
    const eventData = {
      timestamp: new Date(),
      protocol: event.data?.protocol || 'Unknown',
      hassbeamDevice: event.data?.hassbeam_device || 'Unknown',
      code: event.data?.code || event.data?.data || 'N/A',
      rawData: event.data,
      selected: false
    };
    
    this.capturedEvents.push(eventData);
    
    // Update table
    this.updateTable();
    
    // Update save button state
    this.updateSaveButtonState();
  }

  updateSaveButtonState() {
    const saveCodeBtn = this.querySelector('#save-code-btn');
    const selectedEvent = this.capturedEvents.find(event => event.selected);
    const deviceInput = this.querySelector('#device-input');
    const actionInput = this.querySelector('#action-input');
    
    // Enable button when event is selected and fields are filled
    const canSave = selectedEvent && 
                   deviceInput.value.trim() && 
                   actionInput.value.trim();
    
    if (saveCodeBtn) {
      saveCodeBtn.disabled = !canSave;
    }
  }

  updateTable() {
    const tableBody = this.querySelector('#setup-table-body');
    if (!tableBody) return;
    
    if (this.capturedEvents.length === 0) {
      this.updateTableWithStatus('No IR codes received yet');
      return;
    }
    
    // Remove duplicates based on event data
    const uniqueEvents = this.capturedEvents.filter((event, index, array) => {
      const eventDataStr = JSON.stringify(event.rawData);
      return array.findIndex(e => JSON.stringify(e.rawData) === eventDataStr) === index;
    });
    
    tableBody.innerHTML = uniqueEvents.map((event, index) => {
      const timeString = event.timestamp.toLocaleTimeString('en-US');
      // Remove device_name, device_id, hassbeam_device and protocol from event data for display
      const eventDataCopy = { ...event.rawData };
      delete eventDataCopy.device_name;
      delete eventDataCopy.device_id;
      delete eventDataCopy.hassbeam_device;
      delete eventDataCopy.protocol;
      const eventDataStr = JSON.stringify(eventDataCopy);
      
      return `
        <tr>
          <td>${timeString}</td>
          <td>${event.hassbeamDevice}</td>
          <td>${event.protocol}</td>
          <td class="event-data" title="${eventDataStr}">${eventDataStr}</td>
          <td>
            <button class="use-btn ${event.selected ? 'selected' : ''}" data-event-index="${index}">
              ${event.selected ? 'Selected' : 'Select'}
            </button>
            <button class="send-btn-setup" data-event-index="${index}" title="Send IR Code">
              📡
            </button>
          </td>
        </tr>
      `;
    }).join('');
    
    // Add event listeners for selection buttons
    const useButtons = tableBody.querySelectorAll('.use-btn');
    useButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        const index = parseInt(e.target.getAttribute('data-event-index'));
        // Find the original event based on the filtered index
        const selectedUniqueEvent = uniqueEvents[index];
        const originalIndex = this.capturedEvents.findIndex(event => 
          JSON.stringify(event.rawData) === JSON.stringify(selectedUniqueEvent.rawData)
        );
        this.selectEvent(originalIndex);
      });
    });
    
    // Add event listeners for send buttons
    const sendButtons = tableBody.querySelectorAll('.send-btn-setup');
    sendButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        const index = parseInt(e.target.getAttribute('data-event-index'));
        const selectedUniqueEvent = uniqueEvents[index];
        this.sendIrCodeFromEvent(selectedUniqueEvent.rawData);
      });
    });
  }

  updateTableWithStatus(message) {
    const tableBody = this.querySelector('#setup-table-body');
    if (!tableBody) return;
    
    tableBody.innerHTML = `
      <tr>
        <td colspan="5" style="text-align: center; padding: 20px; color: var(--secondary-text-color);">
          ${message}
        </td>
      </tr>
    `;
  }

  selectEvent(index) {
    // Deselect all events
    this.capturedEvents.forEach(event => event.selected = false);
    
    // Select chosen event
    if (this.capturedEvents[index]) {
      this.capturedEvents[index].selected = true;
    }
    
    // Update table
    this.updateTable();
    
    // Enable save button
    this.updateSaveButtonState();
  }

  async saveSelectedCode() {
    const selectedEvent = this.capturedEvents.find(event => event.selected);
    const deviceInput = this.querySelector('#device-input');
    const actionInput = this.querySelector('#action-input');

    if (!selectedEvent) {
      alert('Please select an IR code from the table.');
      return;
    }

    const device = deviceInput.value.trim();
    const action = actionInput.value.trim();

    // Validate inputs
    if (!device || !action) {
      alert('Please enter both device and action.');
      return;
    }

    if (!this._hass) {
      alert('No connection to Home Assistant available.');
      return;
    }

    try {
      // Service call to save
      console.log('HassBeam Setup: Calling save_ir_code service...');
      const saveResponse = await this._hass.callService('hassbeam_connect', 'save_ir_code', {
        device: device,
        action: action,
        event_data: JSON.stringify(selectedEvent.rawData)
      });
      
      console.log('HassBeam Setup: save_ir_code service completed. Response:', saveResponse);
      
      // Successful save
      alert(`IR code saved successfully!\nDevice: ${device}\nAction: ${action}`);
      actionInput.value = '';
      this.capturedEvents = [];
      this.updateTableWithStatus('IR code saved. Enter a new action for the next code.');
      this.updateSaveButtonState();

    } catch (error) {
      // Error during service call (e.g. duplicate or network error)
      console.error('HassBeam Setup: Error saving IR code:', error);
      
      // Check if it's an "already exists" error
      if (error && error.message && error.message.includes('already exists')) {
        alert(`Error: An IR code for "${device}.${action}" already exists!\n\nPlease first delete the existing entry in the HassBeam Card or use a different device/action name.`);
      } else {
        alert('Error saving IR code: ' + (error.message || error));
      }
    }
  }

  /**
   * Send IR code directly from event data
   * @param {Object} eventData - Raw event data from the captured IR event
   */
  async sendIrCodeFromEvent(eventData) {
    console.log('HassBeam Setup: sendIrCodeFromEvent called', eventData);
    
    if (!this._hass) {
      console.error('HassBeam Setup: No Home Assistant instance available');
      alert('No connection to Home Assistant available.');
      return;
    }
    
    try {
      // Extract protocol from event data
      const protocol = eventData.protocol;
      const hassbeamDevice = eventData.hassbeam_device;
      
      if (!protocol || !hassbeamDevice) {
        console.error('HassBeam Setup: Missing protocol or hassbeam_device in event data');
        alert('Cannot send IR code: Missing protocol or device information');
        return;
      }
      
      // Prepare service data similar to the main card
      const serviceData = this.prepareServiceDataFromEvent(eventData);
      const serviceName = `${hassbeamDevice}_send_ir_${protocol.toLowerCase()}`;
      
      console.log('HassBeam Setup: Calling ESPHome service', {
        service: serviceName,
        data: serviceData
      });
      
      // Call the ESPHome service directly
      await this._hass.callService('esphome', serviceName, serviceData);
      
      console.log('HassBeam Setup: IR code sent successfully');
      
      // Show success message
      this.showTemporaryMessage(`IR code sent via ${protocol} protocol`, 'success');
      
    } catch (error) {
      console.error('HassBeam Setup: Error sending IR code:', error);
      this.showTemporaryMessage(`Error sending IR code: ${error.message}`, 'error');
    }
  }

  /**
   * Prepare service data from event data for ESPHome service call
   * @param {Object} eventData - Raw event data
   * @returns {Object} Service data for ESPHome call
   */
  prepareServiceDataFromEvent(eventData) {
    const serviceData = {};
    
    // Copy relevant fields from event data, excluding internal fields
    const excludeFields = ['device_name', 'device_id', 'hassbeam_device', 'protocol'];
    
    Object.keys(eventData).forEach(key => {
      if (!excludeFields.includes(key)) {
        let value = eventData[key];
        
        // Convert hex strings to integers for certain fields
        if (typeof value === 'string' && value.startsWith('0x')) {
          value = parseInt(value, 16);
        }
        // Convert string arrays to actual arrays
        else if (typeof value === 'string' && value.startsWith('[') && value.endsWith(']')) {
          try {
            value = JSON.parse(value);
          } catch (e) {
            console.warn('HassBeam Setup: Could not parse array string:', value);
          }
        }
        
        serviceData[key] = value;
      }
    });
    
    console.log('HassBeam Setup: Service data prepared from event', serviceData);
    return serviceData;
  }

  /**
   * Show temporary message
   * @param {string} message - Message to show
   * @param {string} type - Message type ('success' or 'error')
   */
  showTemporaryMessage(message, type = 'info') {
    // Create or update message element
    let messageEl = this.querySelector('.temp-message');
    if (!messageEl) {
      messageEl = document.createElement('div');
      messageEl.className = 'temp-message';
      messageEl.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 10px 20px;
        border-radius: 4px;
        font-weight: 500;
        z-index: 1000;
        max-width: 300px;
        word-wrap: break-word;
      `;
      this.appendChild(messageEl);
    }
    
    messageEl.textContent = message;
    messageEl.className = `temp-message ${type}`;
    
    // Set colors based on type
    if (type === 'success') {
      messageEl.style.background = '#4CAF50';
      messageEl.style.color = 'white';
    } else if (type === 'error') {
      messageEl.style.background = '#f44336';
      messageEl.style.color = 'white';
    } else {
      messageEl.style.background = '#2196F3';
      messageEl.style.color = 'white';
    }
    
    messageEl.style.display = 'block';
    
    // Hide after 3 seconds
    setTimeout(() => {
      if (messageEl) {
        messageEl.style.display = 'none';
      }
    }, 3000);
  }

  /**
   * Clear table
   */
  clearTable() {
    console.log('HassBeam Setup Card: clearTable called');
    
    // Reset captured events
    this.capturedEvents = [];
    
    // Clear table
    const tableBody = this.querySelector('#setup-table-body');
    if (tableBody) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="5" style="text-align: center; padding: 20px; color: var(--secondary-text-color);">
            Click "Start Listening" to begin
          </td>
        </tr>
      `;
    }
    
    // Update save button state
    this.updateSaveButtonState();
    
    console.log('HassBeam Setup Card: Table cleared');
  }

  /**
   * Called when the card is removed from the DOM
   */
  disconnectedCallback() {
    console.log('HassBeam Setup Card: disconnectedCallback - card being removed');
    this.stopListening();
  }

  static get properties() {
    return {};
  }
}

customElements.define('hassbeam-setup-card', HassBeamSetupCard);

window.customCards = window.customCards || [];
window.customCards.push({
  type: 'hassbeam-setup-card',
  name: 'HassBeam Setup',
  description: 'Shows setup options for HassBeam devices'
});