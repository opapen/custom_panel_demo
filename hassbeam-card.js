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
    this._activeSubscription = null; // Verwalte aktive Subscription
    this._subscriptionTimeout = null; // Verwalte Timeout
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
          <colgroup>
            <col style="width: 10%; min-width: 150px;">
            <col style="width: 5%; min-width: 100px;">
            <col style="width: 5%; min-width: 100px;">
            <col style="width: 5%; min-width: 100px;">
            <col style="width: 75%;min-width: 630px;">
          </colgroup>
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
              <td colspan="5" style="text-align: center; padding: 20px; color: var(--secondary-text-color);">
                Klicke auf "Aktualisieren" um IR-Codes zu laden
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
          width: 100%;
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
   * Home Assistant Objekt setzen
   * @param {Object} hass - Home Assistant Objekt
   */
  set hass(hass) {
    console.log('HassBeam Card: hass Objekt gesetzt', hass ? 'verfügbar' : 'nicht verfügbar');
    
    this._hass = hass;
    
    // Kein automatisches Laden - nur manuell über Refresh-Button
    console.log('HassBeam Card: Automatisches Laden deaktiviert - verwende Refresh-Button');
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

    if (!this._hass.connection) {
      console.error('HassBeam Card: Keine Home Assistant Connection verfügbar');
      this.showError('Keine Verbindung zu Home Assistant');
      return;
    }

    // Vorherige Subscription beenden falls noch aktiv
    this.cleanupSubscription();

    try {
      const serviceData = this.prepareServiceData();
      console.log('HassBeam Card: Service-Daten vorbereitet', serviceData);
      
      let hasReceived = false;
      
      // Event-Subscription
      console.log('HassBeam Card: Event-Subscription wird eingerichtet für "hassbeam_connect_codes_retrieved"');
      try {
        this._activeSubscription = await this._hass.connection.subscribeEvents((event) => {
          console.log('HassBeam Card: Event "hassbeam_connect_codes_retrieved" empfangen', event);
          
          if (event.data?.codes && !hasReceived) {
            console.log('HassBeam Card: Gültige IR-Codes empfangen', {
              anzahl: event.data.codes.length,
              codes: event.data.codes
            });
            
            hasReceived = true;
            this.irCodes = event.data.codes;
            this.updateTable();
            this.cleanupSubscription();
          } else {
            console.log('HassBeam Card: Event ohne gültige Codes oder bereits empfangen', {
              hasCodes: !!event.data?.codes,
              hasReceived: hasReceived
            });
          }
        }, 'hassbeam_connect_codes_retrieved');

        if (this._activeSubscription && typeof this._activeSubscription === 'function') {
          console.log('HassBeam Card: Event-Subscription erfolgreich eingerichtet');
        } else {
          console.warn('HassBeam Card: Event-Subscription möglicherweise fehlgeschlagen:', typeof this._activeSubscription);
        }
      } catch (subscribeError) {
        console.error('HassBeam Card: Fehler beim Einrichten der Event-Subscription:', subscribeError);
        this._activeSubscription = null;
      }

      // Service aufrufen
      console.log('HassBeam Card: Service "hassbeam_connect.get_recent_codes" wird aufgerufen', serviceData);
      await this._hass.callService('hassbeam_connect', 'get_recent_codes', serviceData);
      console.log('HassBeam Card: Service-Aufruf erfolgreich abgeschlossen');

      // Timeout als Fallback
      console.log('HassBeam Card: Timeout (5s) wird eingerichtet');
      this._subscriptionTimeout = setTimeout(() => {
        if (!hasReceived) {
          console.error('HassBeam Card: Timeout erreicht - keine Daten empfangen');
          this.showError('Keine Daten empfangen (Timeout)');
          this.cleanupSubscription();
        } else {
          console.log('HassBeam Card: Timeout erreicht aber Daten bereits empfangen');
        }
      }, 5000);

    } catch (error) {
      console.error('HassBeam Card: Fehler beim Laden der IR-Codes:', error);
      this.showError('Fehler beim Laden der Daten: ' + error.message);
      this.cleanupSubscription();
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
   * Aktive Event-Subscription und Timeout bereinigen
   */
  cleanupSubscription() {
    console.log('HassBeam Card: cleanupSubscription aufgerufen', {
      hasActiveSubscription: !!this._activeSubscription,
      hasTimeout: !!this._subscriptionTimeout
    });

    // Timeout bereinigen
    if (this._subscriptionTimeout) {
      console.log('HassBeam Card: Timeout wird bereinigt');
      clearTimeout(this._subscriptionTimeout);
      this._subscriptionTimeout = null;
    }

    // Subscription bereinigen
    if (this._activeSubscription && typeof this._activeSubscription === 'function') {
      console.log('HassBeam Card: Event-Subscription wird beendet');
      try {
        this._activeSubscription();
        console.log('HassBeam Card: Event-Subscription erfolgreich beendet');
      } catch (error) {
        console.error('HassBeam Card: Fehler beim Beenden der Event-Subscription:', error);
      }
      this._activeSubscription = null;
    } else if (this._activeSubscription) {
      console.warn('HassBeam Card: ActiveSubscription ist keine Funktion:', typeof this._activeSubscription);
      this._activeSubscription = null;
    }
  }

  /**
   * Tabelle mit neuen Daten aktualisieren
   */
  updateTable() {
    console.log('HassBeam Card: updateTable aufgerufen', {
      anzahlCodes: this.irCodes.length,
      codes: this.irCodes
    });
    
    const tableBody = this.querySelector('#table-body');
    if (!tableBody) {
      console.error('HassBeam Card: table-body Element nicht gefunden');
      return;
    }

    // Code-Anzahl aktualisieren (falls Element vorhanden)
    const codeCountEl = this.querySelector('#code-count');
    if (codeCountEl) {
      codeCountEl.innerText = this.irCodes.length;
      console.log('HassBeam Card: Code-Anzahl aktualisiert', this.irCodes.length);
    }

    if (this.irCodes.length === 0) {
      console.log('HassBeam Card: Keine IR-Codes vorhanden, zeige leere Tabelle');
      tableBody.innerHTML = `
        <tr>
          <td colspan="5" style="text-align: center; padding: 20px;">
            Keine IR-Codes gefunden
          </td>
        </tr>
      `;
      return;
    }

    console.log('HassBeam Card: Tabelle wird mit Daten gefüllt');
    tableBody.innerHTML = this.irCodes.map(code => this.createTableRow(code)).join('');
    console.log('HassBeam Card: Tabelle erfolgreich aktualisiert');
  }

  /**
   * Einzelne Tabellenzeile erstellen
   * @param {Object} code - IR-Code-Objekt
   * @returns {string} HTML-String für die Tabellenzeile
   */
  createTableRow(code) {
    console.log('HassBeam Card: createTableRow aufgerufen', code);
    
    const timestamp = new Date(code.created_at).toLocaleString('de-DE');
    const { protocol, formattedEventData } = this.parseEventData(code.event_data);

    const row = `
      <tr>
        <td class="timestamp">${timestamp}</td>
        <td class="device">${code.device}</td>
        <td class="action">${code.action}</td>
        <td class="protocol">${protocol}</td>
        <td class="event-data" title="${formattedEventData}">${formattedEventData}</td>
      </tr>
    `;
    
    console.log('HassBeam Card: Tabellenzeile erstellt', {
      device: code.device,
      action: code.action,
      protocol: protocol
    });
    
    return row;
  }

  /**
   * Event-Daten parsen und formatieren
   * @param {string} eventData - JSON-String mit Event-Daten
   * @returns {Object} Geparste Daten mit Protocol und formatierten Event-Daten
   */
  parseEventData(eventData) {
    console.log('HassBeam Card: parseEventData aufgerufen', eventData);
    
    try {
      const parsed = JSON.parse(eventData);
      const protocol = parsed.protocol || 'N/A';
      
      console.log('HassBeam Card: Event-Daten erfolgreich geparst', {
        protocol: protocol,
        originalData: parsed
      });
      
      const formattedEventData = Object.entries(parsed)
        .map(([key, value]) => `${key}: ${value}`)
        .join(', ');
      
      console.log('HassBeam Card: Event-Daten formatiert', {
        protocol: protocol,
        formattedEventData: formattedEventData
      });
      
      return { protocol, formattedEventData };
    } catch (e) {
      console.error('HassBeam Card: Fehler beim Parsen der Event-Daten:', e, eventData);
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
    console.error('HassBeam Card: showError aufgerufen', message);
    
    const tableBody = this.querySelector('#table-body');
    if (tableBody) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="5" style="text-align: center; padding: 20px; color: var(--error-color);">
            ${message}
          </td>
        </tr>
      `;
      console.log('HassBeam Card: Fehlermeldung in Tabelle angezeigt');
    } else {
      console.error('HassBeam Card: table-body Element nicht gefunden für Fehlermeldung');
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

  /**
   * Wird aufgerufen wenn die Karte aus dem DOM entfernt wird
   */
  disconnectedCallback() {
    console.log('HassBeam Card: disconnectedCallback - Karte wird entfernt');
    this.cleanupSubscription();
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

// HASSBEAM STATS CARD (zweite Card im selben File)
console.info("HassBeam Stats Card v1.0.0 geladen");

class HassBeamStatsCard extends HTMLElement {
  constructor() {
    super();
    this.config = {};
  }

  setConfig(config) {
    this.config = config;
    this.render();
  }

  set hass(hass) {
    this._hass = hass;
    // Hier könnten später Daten geladen werden
  }

  render() {
    this.innerHTML = `
      <ha-card header="${this.config.title || 'HassBeam Statistiken'}">
        <div class="card-content">
          <p>Hier könnten Statistiken zu IR-Events angezeigt werden.</p>
        </div>
      </ha-card>
      <style>
        ha-card {
          width: ${this.config.width || 'auto'};
          height: ${this.config.height || 'auto'};
          display: block;
        }
        .card-content {
          padding: 16px;
        }
      </style>
    `;
  }

  static get properties() {
    return {};
  }
}

customElements.define('hassbeam-stats-card', HassBeamStatsCard);

window.customCards = window.customCards || [];
window.customCards.push({
  type: 'hassbeam-stats-card',
  name: 'HassBeam Statistiken',
  description: 'Zeigt Statistiken zu IR-Events an'
});