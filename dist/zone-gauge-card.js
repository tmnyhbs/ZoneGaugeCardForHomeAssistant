/**
 * Zone Gauge Card for Home Assistant
 * A gauge card with five color zones and a full visual editor.
 * Colors, thresholds, and entity are all configurable from the UI.
 *
 * Installation:
 *   1. Copy this file to /config/www/zone-gauge-card.js
 *   2. In HA, go to Settings → Dashboards → ⋮ → Resources
 *   3. Add resource: /local/zone-gauge-card.js (type: JavaScript Module)
 *   4. Add the card via the UI — search "Zone Gauge" in the card picker
 */

const DEFAULTS = {
  entity: '',
  name: '',
  unit: '',
  min: 0,
  max: 120,
  cold_threshold: 55,
  cool_threshold: 62,
  warm_threshold: 78,
  hot_threshold: 85,
  color_low: '#E24B4A',
  color_mid: '#EF9F27',
  color_high: '#5DCAA5',
};

class ZoneGaugeCard extends HTMLElement {
  static getConfigElement() {
    return document.createElement('zone-gauge-card-editor');
  }

  static getStubConfig() {
    return { ...DEFAULTS };
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._config = {};
    this._hass = null;
  }

  set hass(hass) {
    this._hass = hass;
    this._render();
  }

  setConfig(config) {
    if (!config.entity) throw new Error('Please select an entity');
    this._config = { ...DEFAULTS, ...config };
    this._render();
  }

  getCardSize() {
    return 4;
  }

  _getColor(val) {
    const c = this._config;
    if (val < c.cold_threshold) return c.color_low;
    if (val < c.cool_threshold) return c.color_mid;
    if (val <= c.warm_threshold) return c.color_high;
    if (val <= c.hot_threshold) return c.color_mid;
    return c.color_low;
  }

  _render() {
    if (!this._hass || !this._config.entity) return;

    const stateObj = this._hass.states[this._config.entity];
    if (!stateObj) {
      this.shadowRoot.innerHTML = `
        <ha-card>
          <div style="padding:16px;text-align:center;color:var(--secondary-text-color);">
            Entity not found: ${this._config.entity}
          </div>
        </ha-card>`;
      return;
    }

    const val = parseFloat(stateObj.state);
    const mn = this._config.min;
    const mx = this._config.max;
    const rng = mx - mn || 1;
    const pct = Math.max(0, Math.min(1, (val - mn) / rng));
    const color = isNaN(val) ? 'var(--secondary-text-color)' : this._getColor(val);
    const unit = this._config.unit || stateObj.attributes.unit_of_measurement || '';
    const name = this._config.name || stateObj.attributes.friendly_name || this._config.entity;
    const display = isNaN(val) ? stateObj.state : Math.round(val * 10) / 10;

    const cx = 150, cy = 150, r = 120, sw = 24;
    const sA = Math.PI;

    function arc(a1, a2) {
      if (a2 - a1 < 0.002) return '';
      const x1 = cx + r * Math.cos(a1), y1 = cy + r * Math.sin(a1);
      const x2 = cx + r * Math.cos(a2), y2 = cy + r * Math.sin(a2);
      const lg = (a2 - a1) > Math.PI ? 1 : 0;
      return `M ${x1.toFixed(1)} ${y1.toFixed(1)} A ${r} ${r} 0 ${lg} 1 ${x2.toFixed(1)} ${y2.toFixed(1)}`;
    }

    const fA = sA + pct * Math.PI;
    const na = fA;
    const nx = cx + (r - 2) * Math.cos(na), ny = cy + (r - 2) * Math.sin(na);
    const bx = cx + 8 * Math.cos(na + Math.PI), by = cy + 8 * Math.sin(na + Math.PI);
    const lx = cx + 6 * Math.cos(na + Math.PI / 2), ly = cy + 6 * Math.sin(na + Math.PI / 2);
    const rx = cx + 6 * Math.cos(na - Math.PI / 2), ry = cy + 6 * Math.sin(na - Math.PI / 2);

    this.shadowRoot.innerHTML = `
      <style>
        :host { display: block; }
        ha-card {
          padding: 16px 16px 12px;
          text-align: center;
          cursor: pointer;
        }
        svg { max-width: 250px; display: block; margin: 0 auto; }
        .label {
          font-size: 14px;
          color: var(--secondary-text-color);
          margin-top: 4px;
        }
        .track { transition: stroke 0.4s ease; }
        .fill { transition: stroke 0.4s ease; }
        .val { transition: fill 0.4s ease; }
      </style>
      <ha-card>
        <svg viewBox="0 0 300 195">
          <path class="track" d="${arc(sA, 2 * Math.PI)}" fill="none"
            stroke="var(--primary-text-color)" stroke-opacity="0.1"
            stroke-width="${sw}" />
          ${pct > 0.002 ? `<path class="fill" d="${arc(sA, fA)}" fill="none"
            stroke="${color}" stroke-width="${sw}" />` : ''}
          <polygon points="${nx.toFixed(1)},${ny.toFixed(1)} ${lx.toFixed(1)},${ly.toFixed(1)} ${bx.toFixed(1)},${by.toFixed(1)} ${rx.toFixed(1)},${ry.toFixed(1)}"
            fill="var(--primary-text-color)" />
          <circle cx="${cx}" cy="${cy}" r="5" fill="var(--primary-text-color)" />
          <text class="val" x="${cx}" y="${cy + 36}" text-anchor="middle"
            font-size="36" font-weight="500" fill="${color}">${display}${unit}</text>
          <text x="${cx - r - 4}" y="${cy + 16}" text-anchor="end"
            font-size="12" fill="var(--secondary-text-color)">${mn}</text>
          <text x="${cx + r + 4}" y="${cy + 16}" text-anchor="start"
            font-size="12" fill="var(--secondary-text-color)">${mx}</text>
        </svg>
        <div class="label">${name}</div>
      </ha-card>`;

    this.shadowRoot.querySelector('ha-card').addEventListener('click', () => this._handleClick());
  }

  _handleClick() {
    if (!this._hass || !this._config.entity) return;
    const event = new Event('hass-more-info', { bubbles: true, composed: true });
    event.detail = { entityId: this._config.entity };
    this.dispatchEvent(event);
  }
}


class ZoneGaugeCardEditor extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._config = {};
    this._hass = null;
  }

  set hass(hass) {
    this._hass = hass;
    const picker = this.shadowRoot && this.shadowRoot.querySelector('ha-entity-picker');
    if (picker) picker.hass = hass;
  }

  setConfig(config) {
    this._config = { ...DEFAULTS, ...config };
    this._render();
  }

  _render() {
    const c = this._config;

    this.shadowRoot.innerHTML = `
      <style>
        :host { display: block; }
        .row { margin-bottom: 16px; }
        .row label {
          display: block;
          font-weight: 500;
          font-size: 13px;
          margin-bottom: 4px;
          color: var(--primary-text-color);
        }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        input[type="text"], input[type="number"] {
          width: 100%;
          box-sizing: border-box;
          padding: 8px 12px;
          border: 1px solid var(--divider-color, #e0e0e0);
          border-radius: 8px;
          font-size: 14px;
          background: var(--card-background-color, #fff);
          color: var(--primary-text-color);
        }
        input:focus {
          outline: none;
          border-color: var(--primary-color);
        }
        .section-title {
          font-size: 14px;
          font-weight: 500;
          margin: 20px 0 12px;
          padding-bottom: 8px;
          border-bottom: 1px solid var(--divider-color, #e0e0e0);
          color: var(--primary-text-color);
        }
        .zone-row {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 12px;
        }
        .zone-label {
          flex: 1;
          font-size: 13px;
          color: var(--primary-text-color);
        }
        .zone-input {
          width: 80px;
        }
        .color-swatch {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          border: 1px solid var(--divider-color, #e0e0e0);
          padding: 0;
          cursor: pointer;
          overflow: hidden;
          flex-shrink: 0;
          position: relative;
        }
        .color-swatch input[type="color"] {
          position: absolute;
          top: -4px;
          left: -4px;
          width: calc(100% + 8px);
          height: calc(100% + 8px);
          border: none;
          padding: 0;
          cursor: pointer;
          background: none;
        }
        .color-swatch input[type="color"]::-webkit-color-swatch-wrapper { padding: 0; }
        .color-swatch input[type="color"]::-webkit-color-swatch { border: none; border-radius: 6px; }
        .color-swatch input[type="color"]::-moz-color-swatch { border: none; border-radius: 6px; }
        .spacer-swatch {
          width: 32px;
          height: 32px;
          flex-shrink: 0;
        }
        .hint {
          font-size: 12px;
          color: var(--secondary-text-color);
          white-space: nowrap;
        }
      </style>

      <div class="row">
        <label>Entity</label>
        <ha-entity-picker allow-custom-entity></ha-entity-picker>
      </div>

      <div class="grid">
        <div class="row">
          <label>Name (optional)</label>
          <input type="text" id="name" value="${this._esc(c.name)}" placeholder="Auto from entity" />
        </div>
        <div class="row">
          <label>Unit (optional)</label>
          <input type="text" id="unit" value="${this._esc(c.unit)}" placeholder="Auto from entity" />
        </div>
      </div>

      <div class="section-title">Gauge range</div>
      <div class="grid">
        <div class="row">
          <label>Minimum</label>
          <input type="number" id="min" value="${c.min}" />
        </div>
        <div class="row">
          <label>Maximum</label>
          <input type="number" id="max" value="${c.max}" />
        </div>
      </div>

      <div class="section-title">Color zones</div>

      <div class="zone-row">
        <div class="color-swatch">
          <input type="color" id="color_low" value="${c.color_low}" title="Outer zone color" />
        </div>
        <span class="zone-label">Outer zone</span>
        <span class="hint">below</span>
        <input type="number" id="cold_threshold" class="zone-input" value="${c.cold_threshold}" />
      </div>

      <div class="zone-row">
        <div class="color-swatch">
          <input type="color" id="color_mid" value="${c.color_mid}" title="Caution zone color" />
        </div>
        <span class="zone-label">Caution zone</span>
        <span class="hint">below</span>
        <input type="number" id="cool_threshold" class="zone-input" value="${c.cool_threshold}" />
      </div>

      <div class="zone-row">
        <div class="color-swatch">
          <input type="color" id="color_high" value="${c.color_high}" title="Comfort zone color" />
        </div>
        <span class="zone-label">Comfort zone</span>
        <span class="hint" style="text-align:right;flex-shrink:0;">between cool &amp; warm</span>
      </div>

      <div class="zone-row">
        <div class="spacer-swatch"></div>
        <span class="zone-label" style="color:var(--secondary-text-color);">Caution zone</span>
        <span class="hint">above</span>
        <input type="number" id="warm_threshold" class="zone-input" value="${c.warm_threshold}" />
      </div>

      <div class="zone-row">
        <div class="spacer-swatch"></div>
        <span class="zone-label" style="color:var(--secondary-text-color);">Outer zone</span>
        <span class="hint">above</span>
        <input type="number" id="hot_threshold" class="zone-input" value="${c.hot_threshold}" />
      </div>
    `;

    // Wire up entity picker
    const picker = this.shadowRoot.querySelector('ha-entity-picker');
    if (picker) {
      picker.hass = this._hass;
      picker.value = c.entity;
      picker.includeDomains = ['sensor'];
      picker.allowCustomEntity = true;
      picker.addEventListener('value-changed', (e) => {
        this._updateConfig('entity', e.detail.value);
      });
    }

    // Wire up text/number inputs
    ['name', 'unit', 'min', 'max', 'cold_threshold', 'cool_threshold', 'warm_threshold', 'hot_threshold'].forEach((key) => {
      const el = this.shadowRoot.getElementById(key);
      if (!el) return;
      el.addEventListener('change', () => {
        const val = el.type === 'number' ? parseFloat(el.value) : el.value;
        this._updateConfig(key, val);
      });
    });

    // Wire up color pickers — use 'input' for live preview
    ['color_low', 'color_mid', 'color_high'].forEach((key) => {
      const el = this.shadowRoot.getElementById(key);
      if (!el) return;
      el.addEventListener('input', () => {
        this._updateConfig(key, el.value);
      });
    });
  }

  _esc(str) {
    return (str || '').replace(/"/g, '&quot;');
  }

  _updateConfig(key, value) {
    this._config = { ...this._config, [key]: value };
    const event = new CustomEvent('config-changed', {
      detail: { config: this._config },
      bubbles: true,
      composed: true,
    });
    this.dispatchEvent(event);
  }
}

customElements.define('zone-gauge-card', ZoneGaugeCard);
customElements.define('zone-gauge-card-editor', ZoneGaugeCardEditor);

window.customCards = window.customCards || [];
window.customCards.push({
  type: 'zone-gauge-card',
  name: 'Zone Gauge',
  description: 'A gauge with five configurable color zones and a visual editor',
  preview: true,
  documentationURL: '',
});
