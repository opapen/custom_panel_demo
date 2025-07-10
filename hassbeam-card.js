console.info("HassBeam Card v2.0.0 geladen");

class HassBeamCard extends HTMLElement {
  setConfig(config) {
    if (!config) {
      throw new Error('Invalid configuration');
    }
    
    this.config = config;
    this.irCodes = [];
    this.createCard();
    this.attachEventListeners();
  }

  createCard() {
    const showTable = this.config.show_table !== false;
    const maxRows = this.config.max_rows || 10;
    
    this.innerHTML = `
      <ha-card header="${this.config.title || 'HassBeam Card'}">
        <div class="card-content">
          <div class="status-section">
            <p>Letztes IR-Event: <span id="ir-event">Wird geladen...</span></p>
            <p>Status: <span id="status">Unbekannt</span></p>
            <p>Anzahl Codes: <span id="code-count">0</span></p>
          </div>
          
          ${showTable ? `
          <div class="table-controls">
            <div class="filter-section">
              <label>Gerät filtern:</label>
              <select id="device-filter">
                <option value="">Alle Geräte</option>
              </select>
              <button id="refresh-btn">Aktualisieren</button>
            </div>
          </div>
          
          <div class="table-container">
            <table id="ir-codes-table">
              <thead>
                <tr>
                  <th>Zeitstempel</th>
                  <th>Gerät</th>
                  <th>Aktion</th>
                  <th>Event Data</th>
                </tr>
              </thead>
              <tbody id="table-body">
                <tr>
                  <td colspan="4" style="text-align: center; padding: 20px;">
                    Daten werden geladen...
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          ` : ''}
        </div>
      </ha-card>
      
      <style>
        .card-content {
          padding: 16px;
        }
        
        .status-section {
          margin-bottom: 16px;
          padding-bottom: 16px;
          border-bottom: 1px solid var(--divider-color);
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
        
        .filter-section select {
          padding: 4px 8px;
          border: 1px solid var(--divider-color);
          border-radius: 4px;
          background: var(--card-background-color);
          color: var(--primary-text-color);
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
          overflow-x: auto;
          border: 1px solid var(--divider-color);
          border-radius: 4px;
        }
        
        #ir-codes-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 14px;
        }
        
        #ir-codes-table th,
        #ir-codes-table td {
          padding: 8px 12px;
          text-align: left;
          border-bottom: 1px solid var(--divider-color);
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
          white-space: nowrap;
          font-family: monospace;
          font-size: 12px;
        }
        
        .device {
          font-weight: 500;
        }
        
        .action {
          color: var(--primary-color);
        }
        
        .event-data {
          max-width: 200px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          font-family: monospace;
          font-size: 12px;
        }
        
        .event-data:hover {
          overflow: visible;
          white-space: normal;
          background: var(--card-background-color);
          position: relative;
          z-index: 1;
        }
      </style>
    `;
  }

  attachEventListeners() {
    // Aktualisieren-Button
    const refreshBtn = this.querySelector('#refresh-btn');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => this.loadIrCodes());
    }
    
    // Geräte-Filter
    const deviceFilter = this.querySelector('#device-filter');
    if (deviceFilter) {
      deviceFilter.addEventListener('change', (e) => {
        this.filterByDevice(e.target.value);
      });
    }
  }

  set hass(hass) {
    this._hass = hass;
    this.updateStatus();
    this.loadIrCodes();
  }

  updateStatus() {
    const entityId = this.config.entity || 'sensor.hassbeam_last_ir';
    const event = this._hass.states[entityId];
    const eventEl = this.querySelector('#ir-event');
    const statusEl = this.querySelector('#status');
    
    if (event && eventEl) {
      eventEl.innerText = event.state;
      if (statusEl) {
        statusEl.innerText = event.attributes.friendly_name || 'Aktiv';
      }
    } else if (eventEl) {
      eventEl.innerText = "Kein Event verfügbar";
      if (statusEl) {
        statusEl.innerText = "Offline";
      }
    }
  }

  async loadIrCodes() {
    if (!this._hass) return;
    
    try {
      const response = await this._hass.callService('hassbeam_connect', 'get_ir_codes', {
        limit: this.config.max_rows || 50,
        device: this.config.filter_device || null
      });
      
      if (response && response.response) {
        this.irCodes = response.response;
        this.updateTable();
        this.updateDeviceFilter();
      }
    } catch (error) {
      console.error('Fehler beim Laden der IR-Codes:', error);
      this.showError('Fehler beim Laden der Daten');
    }
  }

  updateTable() {
    const tableBody = this.querySelector('#table-body');
    const codeCountEl = this.querySelector('#code-count');
    
    if (!tableBody) return;
    
    if (codeCountEl) {
      codeCountEl.innerText = this.irCodes.length;
    }
    
    if (this.irCodes.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="4" style="text-align: center; padding: 20px;">
            Keine IR-Codes gefunden
          </td>
        </tr>
      `;
      return;
    }
    
    tableBody.innerHTML = this.irCodes.map(code => {
      const [id, device, action, eventData, createdAt] = code;
      const timestamp = new Date(createdAt).toLocaleString('de-DE');
      
      // Event Data formatieren
      let formattedEventData = eventData;
      try {
        const parsed = JSON.parse(eventData);
        formattedEventData = Object.keys(parsed).map(key => 
          `${key}: ${parsed[key]}`
        ).join(', ');
      } catch (e) {
        // Fallback zu originalem String
      }
      
      return `
        <tr>
          <td class="timestamp">${timestamp}</td>
          <td class="device">${device}</td>
          <td class="action">${action}</td>
          <td class="event-data" title="${formattedEventData}">${formattedEventData}</td>
        </tr>
      `;
    }).join('');
  }

  updateDeviceFilter() {
    const deviceFilter = this.querySelector('#device-filter');
    if (!deviceFilter) return;
    
    const devices = [...new Set(this.irCodes.map(code => code[1]))];
    const currentValue = deviceFilter.value;
    
    deviceFilter.innerHTML = '<option value="">Alle Geräte</option>' + 
      devices.map(device => 
        `<option value="${device}" ${device === currentValue ? 'selected' : ''}>${device}</option>`
      ).join('');
  }

  filterByDevice(device) {
    const tableBody = this.querySelector('#table-body');
    if (!tableBody) return;
    
    const filteredCodes = device ? 
      this.irCodes.filter(code => code[1] === device) : 
      this.irCodes;
    
    if (filteredCodes.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="4" style="text-align: center; padding: 20px;">
            Keine IR-Codes für "${device}" gefunden
          </td>
        </tr>
      `;
      return;
    }
    
    tableBody.innerHTML = filteredCodes.map(code => {
      const [id, device, action, eventData, createdAt] = code;
      const timestamp = new Date(createdAt).toLocaleString('de-DE');
      
      let formattedEventData = eventData;
      try {
        const parsed = JSON.parse(eventData);
        formattedEventData = Object.keys(parsed).map(key => 
          `${key}: ${parsed[key]}`
        ).join(', ');
      } catch (e) {
        // Fallback zu originalem String
      }
      
      return `
        <tr>
          <td class="timestamp">${timestamp}</td>
          <td class="device">${device}</td>
          <td class="action">${action}</td>
          <td class="event-data" title="${formattedEventData}">${formattedEventData}</td>
        </tr>
      `;
    }).join('');
  }

  showError(message) {
    const tableBody = this.querySelector('#table-body');
    if (tableBody) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="4" style="text-align: center; padding: 20px; color: var(--error-color);">
            ${message}
          </td>
        </tr>
      `;
    }
  }

  getCardSize() {
    return this.config.show_table !== false ? 6 : 1;
  }

  // Für bessere HACS-Kompatibilität
  static get properties() {
    return {
      hass: {},
      config: {}
    };
  }
}

customElements.define('hassbeam-card', HassBeamCard);

// Für Home Assistant Card Picker
window.customCards = window.customCards || [];
window.customCards.push({
  type: 'hassbeam-card',
  name: 'HassBeam Card',
  description: 'Eine Card zur Anzeige von IR-Events mit HassBeam inkl. Tabelle'
});