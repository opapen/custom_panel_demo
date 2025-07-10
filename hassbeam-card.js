console.info("HassBeam Card v2.0.0 geladen");

/**
 * HassBeam Card - Custom Lovelace Card für Home Assistant
 * Zeigt IR-Code Events mit konfigurierbarer Tabelle an
 */
class HassBeamCard extends HTMLElement {
  constructor() {
    super();
    this.config = {};
    this.irCodes = [];
    this.currentDevice = '';
    this.currentLimit = 10;
    this._hass = null;
  }

  /**
   * Konfiguration der Karte setzen
   * @param {Object} config - Konfigurationsobjekt aus YAML
   */
  setConfig(config) {
    console.log('HassBeam Card: setConfig aufgerufen', config);
    
    if (!config) {
      throw new Error('Invalid configuration');
    }

    this.config = config;
    this.irCodes = [];

    // Aktuelle Werte für Filter und Limit initialisieren
    this.currentDevice = config.device || '';
    this.currentLimit = config.limit || 10;

    console.log('HassBeam Card: Konfiguration gesetzt', {
      device: this.currentDevice,
      limit: this.currentLimit,
      show_table: config.show_table
    });

    this.createCard();
    this.attachEventListeners();
  }

  /**
   * Erstellt das HTML der Karte
   */
  createCard() {
    const showTable = this.config.show_table !== false;
    const cardHeight = this.config.height || 'auto';
    const cardWidth = this.config.width || 'auto';
    const tableHeight = this.config.table_height || '400px';

    this.innerHTML = this.generateCardHTML(showTable, cardHeight, cardWidth, tableHeight);
  }

  /**
   * Generiert das HTML für die Karte
   * @param {boolean} showTable - Soll die Tabelle angezeigt werden
   * @param {string} cardHeight - Höhe der Karte
   * @param {string} cardWidth - Breite der Karte
   * @param {string} tableHeight - Höhe der Tabelle
   * @returns {string} HTML-String
   */
  generateCardHTML(showTable, cardHeight, cardWidth, tableHeight) {
    return `
      <ha-card header="${this.config.title || 'HassBeam Card'}" style="height: ${cardHeight}; width: ${cardWidth};">
        <div class="card-content">
          ${showTable ? this.generateTableHTML(tableHeight) : ''}
        </div>
      </ha-card>
      ${this.generateCSS(cardWidth, cardHeight)}
    `;
  }

  /**
   * Generiert das HTML für die Tabelle und Steuerelemente
   * @param {string} tableHeight - Höhe der Tabelle
   * @returns {string} HTML-String
   */
  generateTableHTML(tableHeight) {
    return `
      <div class="table-controls">
        <div class="filter-section">
          <label>Gerät filtern:</label>
          <input type="text" id="device-filter" placeholder="Gerätename eingeben..." value="${this.currentDevice}" />
          <label>Limit:</label>
          <input type="number" id="limit-input" min="1" max="100" value="${this.currentLimit}" />
          <button id="refresh-btn">Aktualisieren</button>
        </div>
      </div>
      
      <div class="table-container" style="max-height: ${tableHeight};">
        <table id="ir-codes-table">
          <thead>
            <tr>
              <th>Zeitstempel</th>
              <th>Gerät</th>
              <th>Aktion</th>
              <th>Protocol</th>
              <th>Event Data</th>
            </tr>
          </thead>
          <tbody id="table-body">
            <tr>
              <td colspan="5" style="text-align: center; padding: 20px;">
                Daten werden geladen...
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    `;
  }
  /**
   * Generiert das CSS für die Karte
   * @param {string} cardWidth - Breite der Karte
   * @param {string} cardHeight - Höhe der Karte
   * @returns {string} CSS-String
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
        }
        
        #ir-codes-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 14px;
          table-layout: fixed;
        }
        
        /* Spaltenbreiten */
        #ir-codes-table th:nth-child(1),
        #ir-codes-table td:nth-child(1) { width: 12.5%; }
        #ir-codes-table th:nth-child(2),
        #ir-codes-table td:nth-child(2) { width: 12.5%; }
        #ir-codes-table th:nth-child(3),
        #ir-codes-table td:nth-child(3) { width: 12.5%; }
        #ir-codes-table th:nth-child(4),
        #ir-codes-table td:nth-child(4) { width: 12.5%; }
        #ir-codes-table th:nth-child(5),
        #ir-codes-table td:nth-child(5) { width: 50%; }
        
        #ir-codes-table th,
        #ir-codes-table td {
          padding: 8px 12px;
          text-align: left;
          border-bottom: 1px solid var(--divider-color);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
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
        }
        
        .device {
          font-weight: 500;
        }
        
        .action {
          color: var(--primary-color);
        }
        
        .protocol {
          font-weight: 500;
          color: var(--secondary-text-color);
          font-size: 12px;
        }
        
        .event-data {
          font-family: monospace;
          font-size: 12px;
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

  /**
   * Event-Listener für UI-Elemente hinzufügen
   */
  attachEventListeners() {
    console.log('HassBeam Card: attachEventListeners aufgerufen');
    
    const refreshBtn = this.querySelector('#refresh-btn');
    if (refreshBtn) {
      console.log('HassBeam Card: Refresh-Button Event-Listener hinzugefügt');
      refreshBtn.addEventListener('click', () => {
        console.log('HassBeam Card: Refresh-Button geklickt');
        this.updateFiltersFromUI();
        this.loadIrCodes();
      });
    } else {
      console.warn('HassBeam Card: Refresh-Button nicht gefunden');
    }
  }

  /**
   * Filter- und Limit-Werte aus den UI-Elementen lesen
   */
  updateFiltersFromUI() {
    console.log('HassBeam Card: updateFiltersFromUI aufgerufen');
    
    const deviceFilter = this.querySelector('#device-filter');
    const limitInput = this.querySelector('#limit-input');

    const oldDevice = this.currentDevice;
    const oldLimit = this.currentLimit;

    this.currentDevice = deviceFilter?.value || '';
    this.currentLimit = limitInput?.value || '10';

    console.log('HassBeam Card: Filter aktualisiert', {
      device: { alt: oldDevice, neu: this.currentDevice },
      limit: { alt: oldLimit, neu: this.currentLimit }
    });
  }

  /**
   * Home Assistant Objekt setzen und Daten laden
   * @param {Object} hass - Home Assistant Objekt
   */
  set hass(hass) {
    console.log('HassBeam Card: hass Objekt gesetzt', hass ? 'verfügbar' : 'nicht verfügbar');
    
    this._hass = hass;
    if (hass) {
      console.log('HassBeam Card: loadIrCodes wird automatisch aufgerufen');
      this.loadIrCodes();
    }
  }

  /**
   * IR-Codes vom HassBeam Service laden
   */
  async loadIrCodes() {
    console.log('HassBeam Card: loadIrCodes aufgerufen');
    
    if (!this._hass) {
      console.warn('HassBeam Card: Kein hass Objekt verfügbar, loadIrCodes wird beendet');
      return;
    }

    try {
      const serviceData = this.prepareServiceData();
      console.log('HassBeam Card: Service-Daten vorbereitet', serviceData);
      
      // Event-Listener für die Service-Response
      let unsubscribe = null;
      let hasReceived = false;
      
      const cleanup = () => {
        console.log('HassBeam Card: Cleanup-Funktion aufgerufen', { hasReceived });
        hasReceived = true;
        if (unsubscribe) {
          console.log('HassBeam Card: Event-Subscription wird beendet');
          unsubscribe();
        }
      };

      // Event-Subscription
      console.log('HassBeam Card: Event-Subscription wird eingerichtet für "hassbeam_connect_codes_retrieved"');
      unsubscribe = this._hass.connection.subscribeEvents((event) => {
        console.log('HassBeam Card: Event "hassbeam_connect_codes_retrieved" empfangen', event);
        
        if (event.data?.codes && !hasReceived) {
          console.log('HassBeam Card: Gültige IR-Codes empfangen', {
            anzahl: event.data.codes.length,
            codes: event.data.codes
          });
          
          this.irCodes = event.data.codes;
          this.updateTable();
          cleanup();
        } else {
          console.log('HassBeam Card: Event ohne gültige Codes oder bereits empfangen', {
            hasCodes: !!event.data?.codes,
            hasReceived: hasReceived
          });
        }
      }, 'hassbeam_connect_codes_retrieved');

      console.log('HassBeam Card: Event-Subscription erfolgreich eingerichtet');

      // Service aufrufen
      console.log('HassBeam Card: Service "hassbeam_connect.get_recent_codes" wird aufgerufen', serviceData);
      await this._hass.callService('hassbeam_connect', 'get_recent_codes', serviceData);
      console.log('HassBeam Card: Service-Aufruf erfolgreich abgeschlossen');

      // Timeout als Fallback
      console.log('HassBeam Card: Timeout (5s) wird eingerichtet');
      setTimeout(() => {
        if (!hasReceived) {
          console.error('HassBeam Card: Timeout erreicht - keine Daten empfangen');
          this.showError('Keine Daten empfangen (Timeout)');
          cleanup();
        } else {
          console.log('HassBeam Card: Timeout erreicht aber Daten bereits empfangen');
        }
      }, 5000);

    } catch (error) {
      console.error('HassBeam Card: Fehler beim Laden der IR-Codes:', error);
      this.showError('Fehler beim Laden der Daten: ' + error.message);
    }
  }

  /**
   * Service-Daten für den API-Aufruf vorbereiten
   * @returns {Object} Service-Daten
   */
  prepareServiceData() {
    console.log('HassBeam Card: prepareServiceData aufgerufen', {
      currentDevice: this.currentDevice,
      currentLimit: this.currentLimit
    });
    
    const serviceData = { limit: parseInt(this.currentLimit) || 10 };
    
    if (this.currentDevice?.trim()) {
      serviceData.device = this.currentDevice.trim();
      console.log('HassBeam Card: Gerätename zu Service-Daten hinzugefügt', serviceData.device);
    }

    console.log('HassBeam Card: Service-Daten vorbereitet', serviceData);
    return serviceData;
  }

  /**
   * Tabelle mit neuen Daten aktualisieren
   */
  updateTable() {
    const tableBody = this.querySelector('#table-body');
    if (!tableBody) return;

    // Code-Anzahl aktualisieren (falls Element vorhanden)
    const codeCountEl = this.querySelector('#code-count');
    if (codeCountEl) {
      codeCountEl.innerText = this.irCodes.length;
    }

    if (this.irCodes.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="5" style="text-align: center; padding: 20px;">
            Keine IR-Codes gefunden
          </td>
        </tr>
      `;
      return;
    }

    tableBody.innerHTML = this.irCodes.map(code => this.createTableRow(code)).join('');
  }

  /**
   * Einzelne Tabellenzeile erstellen
   * @param {Object} code - IR-Code-Objekt
   * @returns {string} HTML-String für die Tabellenzeile
   */
  createTableRow(code) {
    const timestamp = new Date(code.created_at).toLocaleString('de-DE');
    const { protocol, formattedEventData } = this.parseEventData(code.event_data);

    return `
      <tr>
        <td class="timestamp">${timestamp}</td>
        <td class="device">${code.device}</td>
        <td class="action">${code.action}</td>
        <td class="protocol">${protocol}</td>
        <td class="event-data" title="${formattedEventData}">${formattedEventData}</td>
      </tr>
    `;
  }

  /**
   * Event-Daten parsen und formatieren
   * @param {string} eventData - JSON-String mit Event-Daten
   * @returns {Object} Geparste Daten mit Protocol und formatierten Event-Daten
   */
  parseEventData(eventData) {
    try {
      const parsed = JSON.parse(eventData);
      const protocol = parsed.protocol || 'N/A';
      
      // Protocol aus den Event-Daten entfernen
      const { protocol: _, ...filteredData } = parsed;
      
      const formattedEventData = Object.entries(filteredData)
        .map(([key, value]) => `${key}: ${value}`)
        .join(', ');
      
      return { protocol, formattedEventData };
    } catch (e) {
      return { protocol: 'N/A', formattedEventData: eventData };
    }
  }

  /**
   * Kartengröße für das Dashboard zurückgeben
   * @returns {number} Kartengröße
   */
  getCardSize() {
    // Konfigurierbare Kartengröße
    // Standardwerte: 6 für Karten mit Tabelle, 1 für Karten ohne Tabelle
    if (this.config.card_size !== undefined) {
      return this.config.card_size;
    }
    return this.config.show_table !== false ? 6 : 1;
  }

  /**
   * Fehlermeldung in der Tabelle anzeigen
   * @param {string} message - Fehlermeldung
   */
  showError(message) {
    const tableBody = this.querySelector('#table-body');
    if (tableBody) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="5" style="text-align: center; padding: 20px; color: var(--error-color);">
            ${message}
          </td>
        </tr>
      `;
    }
  }

  /**
   * Eigenschaften für bessere HACS-Kompatibilität
   * @returns {Object} Eigenschaften-Objekt
   */
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