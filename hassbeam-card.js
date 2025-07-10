console.info("HassBeam Card v2.0.0 geladen");

class HassBeamCard extends HTMLElement {
  setConfig(config) {
    if (!config) {
      throw new Error('Invalid configuration');
    }
    
    this.config = config;
    this.irCodes = [];
    
    // Aktuelle Werte für Filter und Limit
    this.currentDevice = config.device || '';
    this.currentLimit = config.limit || 10;
    
    this.createCard();
    this.attachEventListeners();
  }

  createCard() {
    const showTable = this.config.show_table !== false;
    const maxRows = this.currentLimit;
    
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
              <input type="text" id="device-filter" placeholder="Gerätename eingeben..." value="${this.currentDevice}" />
              <label>Limit:</label>
              <input type="number" id="limit-input" min="1" max="100" value="${maxRows}" />
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
        
        .filter-section input[type="text"] {
          padding: 6px 8px;
          border: 1px solid var(--divider-color);
          border-radius: 4px;
          background: var(--card-background-color);
          color: var(--primary-text-color);
          min-width: 150px;
        }
        
        .filter-section input[type="number"] {
          padding: 6px 8px;
          border: 1px solid var(--divider-color);
          border-radius: 4px;
          background: var(--card-background-color);
          color: var(--primary-text-color);
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
    
    // Geräte-Filter (Text-Input) - nur Wert speichern, nicht laden
    const deviceFilter = this.querySelector('#device-filter');
    if (deviceFilter) {
      deviceFilter.addEventListener('input', (e) => {
        this.currentDevice = e.target.value;
        // Kein automatisches loadIrCodes() mehr
      });
    }
    
    // Limit-Input - nur Wert speichern, nicht laden
    const limitInput = this.querySelector('#limit-input');
    if (limitInput) {
      limitInput.addEventListener('change', (e) => {
        this.currentLimit = parseInt(e.target.value) || 10;
        // Kein automatisches loadIrCodes() mehr
      });
    }
  }

  set hass(hass) {
    this._hass = hass;
    //this.loadIrCodes();
  }

  async loadIrCodes() {
    if (!this._hass) return;
    
    try {
      const deviceFilter = this.currentDevice || '';
      const limit = this.currentLimit || 10;
      
      const serviceData = {
        limit: limit
      };
      
      // Nur device hinzufügen, wenn es nicht leer ist
      if (deviceFilter.trim()) {
        serviceData.device = deviceFilter.trim();
      }
      
      // Variable für Unsubscribe-Funktion
      let unsubscribe = null;
      let hasReceived = false;
      
      // Event-Listener für die Service-Response
      try {
        unsubscribe = this._hass.connection.subscribeEvents((event) => {
          if (event.data && event.data.codes && !hasReceived) {
            hasReceived = true;
            this.irCodes = event.data.codes;
            this.updateTable();
            
            // Event-Listener entfernen nach erfolgreichem Empfang
            if (unsubscribe && typeof unsubscribe === 'function') {
              unsubscribe();
            }
          }
        }, 'hassbeam_connect_codes_retrieved');
      } catch (subscribeError) {
        console.error('Fehler beim Event-Subscribe:', subscribeError);
      }
      
      // Service aufrufen
      await this._hass.callService('hassbeam_connect', 'get_recent_codes', serviceData);
      
      // Timeout als Fallback
      setTimeout(() => {
        if (!hasReceived) {
          if (unsubscribe && typeof unsubscribe === 'function') {
            unsubscribe();
          }
          this.showError('Keine Daten empfangen (Timeout)');
        }
      }, 5000);
      
    } catch (error) {
      console.error('Fehler beim Laden der IR-Codes:', error);
      this.showError('Fehler beim Laden der Daten: ' + error.message);
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
      // Das neue Format: Objekt mit Eigenschaften
      const id = code.id;
      const device = code.device;
      const action = code.action;
      const eventData = code.event_data;
      const createdAt = code.created_at;
      
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

  getCardSize() {
    return this.config.show_table !== false ? 6 : 1;
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