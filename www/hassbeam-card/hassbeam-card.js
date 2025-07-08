class HassBeamCard extends HTMLElement {
  setConfig(config) {
    this.innerHTML = `<div style="padding:1em; border:1px solid #ccc;">
        <h3>${config.title || "HassBeam Card"}</h3>
        <p>Status: OK</p>
      </div>`;
  }
}
customElements.define('hassbeam-card', HassBeamCard);
