console.info("HassBeam Stats Card v1.0.0 geladen");

/**
 * HassBeam Stats Card - Zeigt Statistiken zu IR-Events
 */
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

// Für Home Assistant Card Picker
window.customCards = window.customCards || [];
window.customCards.push({
  type: 'hassbeam-stats-card',
  name: 'HassBeam Statistiken',
  description: 'Zeigt Statistiken zu IR-Events an'
});
