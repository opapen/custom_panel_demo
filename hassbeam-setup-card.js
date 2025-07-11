console.info("HassBeam Setup Card v1.0.0 loaded");

/**
 * HassBeam Setup Card - Custom Lovelace Card for Home Assistant
 * Used for setting up new IR codes by listening to IR events.
 */
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
          width: ${cardWidth};
          height: ${cardHeight};
          display: flex;
          flex-direction: column;
        }
        
        .card-content {
          display: flex;
          flex-direction: column;
          flex-grow: 1;
          padding: 16px;
        }
        
        .top-controls {
          display: flex;
          gap: 10px;
          margin-bottom: 16px;
        }
        
        .listening-btn {
          background-color: var(--primary-color);
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
        }
        
        .listening-btn:hover {
          background-color: var(--primary-color-dark);
        }
        
        .clear-btn {
          background-color: var(--error-color);
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
        }
        
        .clear-btn:hover {
          background-color: var(--error-color-dark);
        }
        
        .setup-table-container {
          flex-grow: 1;
          overflow-y: auto;
          margin-bottom: 16px;
          border: 1px solid var(--divider-color);
          border-radius: 4px;
        }
        
        #setup-table {
          width: 100%;
          border-collapse: collapse;
        }
        
        #setup-table th,
        #setup-table td {
          border: 1px solid var(--divider-color);
          padding: 8px;
          text-align: left;
        }
        
        #setup-table th {
          background-color: var(--primary-color);
          color: white;
          font-weight: bold;
        }
        
        #setup-table tr:nth-child(even) {
          background-color: var(--table-row-alternative-background-color);
        }
        
        .setup-controls {
          display: flex;
          gap: 16px;
          margin-bottom: 16px;
        }
        
        .input-group {
          flex: 1;
        }
        
        .input-group label {
          display: block;
          margin-bottom: 4px;
          color: var(--primary-text-color);
          font-weight: 500;
        }
        
        .input-group input {
          width: 100%;
          padding: 8px;
          border: 1px solid var(--divider-color);
          border-radius: 4px;
          font-size: 14px;
        }
        
        .save-section {
          display: flex;
          justify-content: center;
        }
        
        .save-btn {
          background-color: var(--success-color);
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 16px;
          font-weight: bold;
        }
        
        .save-btn:hover:not(:disabled) {
          background-color: var(--success-color-dark);
        }
        
        .save-btn:disabled {
          background-color: var(--disabled-color);
          cursor: not-allowed;
        }
        
        .delete-btn {
          background-color: var(--error-color);
          color: white;
          border: none;
          padding: 4px 8px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
        }
        
        .delete-btn:hover {
          background-color: var(--error-color-dark);
        }
        
        .listening-btn.listening {
          background-color: var(--error-color);
        }
        
        .listening-btn.listening:hover {
          background-color: var(--error-color-dark);
        }
        
        .use-btn {
          padding: 4px 8px;
          border: none;
          border-radius: 2px;
          background: var(--primary-color);
          color: white;
          cursor: pointer;
          font-size: 12px;
        }
        
        .use-btn:hover {
          background: var(--primary-color-dark);
        }
        
        .use-btn.selected {
          background: var(--success-color);
        }
        
        .use-btn.selected:hover {
          background: var(--success-color-dark);
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
    const startListeningBtn = this.querySelector('#start-listening-btn');
    
    if (!this.isListening) {
      if (!this._hass || !this._hass.connection) {
        alert('No connection to Home Assistant available.');
        return;
      }
      
      this.isListening = true;
      startListeningBtn.textContent = 'Stop Listening';
      startListeningBtn.classList.add('listening');
      
      this.updateTableWithStatus('Listening for IR codes... Press a button on your remote control.');
      
      console.log('HassBeam Setup: Start Listening');
      
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
      this.stopListening();
    }
  }

  stopListening() {
    const startListeningBtn = this.querySelector('#start-listening-btn');
    
    this.isListening = false;
    startListeningBtn.textContent = 'Start Listening';
    startListeningBtn.classList.remove('listening');
    
    if (this._eventSubscription && typeof this._eventSubscription === 'function') {
      try {
        this._eventSubscription();
        console.log('HassBeam Setup: Event subscription ended');
      } catch (error) {
        console.error('HassBeam Setup: Error ending event subscription:', error);
      }
      this._eventSubscription = null;
    }
    
    this.updateSaveButtonState();
    console.log('HassBeam Setup: Stop Listening');
  }

  handleIrEvent(event) {
    console.log('HassBeam Setup: IR event processed', event);
    
    const eventData = {
      timestamp: new Date(),
      protocol: event.data?.protocol || 'Unknown',
      hassbeamDevice: event.data?.hassbeam_device || 'Unknown',
      code: event.data?.code || event.data?.data || 'N/A',
      rawData: event.data,
      selected: false
    };
    
    this.capturedEvents.push(eventData);
    this.updateTable();
    this.updateSaveButtonState();
  }

  updateSaveButtonState() {
    const saveCodeBtn = this.querySelector('#save-code-btn');
    const selectedEvent = this.capturedEvents.find(event => event.selected);
    const deviceInput = this.querySelector('#device-input');
    const actionInput = this.querySelector('#action-input');
    
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
    
    const uniqueEvents = this.capturedEvents.filter((event, index, array) => {
      const eventDataStr = JSON.stringify(event.rawData);
      return array.findIndex(e => JSON.stringify(e.rawData) === eventDataStr) === index;
    });
    
    tableBody.innerHTML = uniqueEvents.map((event, index) => {
      const timeString = event.timestamp.toLocaleTimeString('en-US');
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
          </td>
        </tr>
      `;
    }).join('');
    
    const useButtons = tableBody.querySelectorAll('.use-btn');
    useButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        const index = parseInt(e.target.getAttribute('data-event-index'));
        const selectedUniqueEvent = uniqueEvents[index];
        const originalIndex = this.capturedEvents.findIndex(event => 
          JSON.stringify(event.rawData) === JSON.stringify(selectedUniqueEvent.rawData)
        );
        this.selectEvent(originalIndex);
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
    this.capturedEvents.forEach(event => event.selected = false);
    
    if (this.capturedEvents[index]) {
      this.capturedEvents[index].selected = true;
    }
    
    this.updateTable();
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

    if (!device || !action) {
      alert('Please enter both device and action.');
      return;
    }

    if (!this._hass) {
      alert('No connection to Home Assistant available.');
      return;
    }

    try {
      console.log('HassBeam Setup: Calling save_ir_code service...');
      const saveResponse = await this._hass.callService('hassbeam_connect', 'save_ir_code', {
        device: device,
        action: action,
        event_data: JSON.stringify(selectedEvent.rawData)
      });
      
      console.log('HassBeam Setup: save_ir_code service completed. Response:', saveResponse);
      
      alert(`IR code saved successfully!\nDevice: ${device}\nAction: ${action}`);
      actionInput.value = '';
      this.capturedEvents = [];
      this.updateTableWithStatus('IR code saved. Enter a new action for the next code.');
      this.updateSaveButtonState();

    } catch (error) {
      console.error('HassBeam Setup: Error saving IR code:', error);
      
      if (error && error.message && error.message.includes('already exists')) {
        alert(`Error: An IR code for "${device}.${action}" already exists!\n\nPlease first delete the existing entry in the HassBeam Card or use a different device/action name.`);
      } else {
        alert('Error saving IR code: ' + (error.message || error));
      }
    }
  }

  clearTable() {
    console.log('HassBeam Setup Card: clearTable called');
    
    this.capturedEvents = [];
    
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
    
    this.updateSaveButtonState();
  }

  disconnectedCallback() {
    console.log('HassBeam Setup Card: disconnectedCallback');
    this.stopListening();
  }

  static get properties() {
    return {
      hass: {},
      config: {}
    };
  }
}

customElements.define('hassbeam-setup-card', HassBeamSetupCard);

window.customCards = window.customCards || [];
window.customCards.push({
  type: 'hassbeam-setup-card',
  name: 'HassBeam Setup',
  description: 'Shows setup options for HassBeam devices'
});
