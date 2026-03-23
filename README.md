# Zone Gauge Card

A custom gauge card for [Home Assistant](https://www.home-assistant.io/) with five color zones and a full visual editor. The entire gauge changes color based on the current value — no segmented arcs, just one clean color at a time.

## Zones

| Zone | Default Color | Condition |
|------|---------------|-----------|
| Cold | 🔴 Red | Below cold threshold |
| Cool | 🟡 Yellow | Between cold and cool thresholds |
| Comfort | 🟢 Green | Between cool and warm thresholds |
| Warm | 🟡 Yellow | Between warm and hot thresholds |
| Hot | 🔴 Red | Above hot threshold |

All three colors (outer, caution, comfort) are customizable from the visual editor.

## Features

- **Visual editor** — configure everything from the UI, no YAML needed
- **Custom colors** — pick your own colors for each zone with color pickers
- **Five-zone color logic** — outer → caution → comfort → caution → outer
- **Entity picker** with autocomplete (filtered to sensors, custom entries allowed)
- **Needle gauge** with smooth arc fill
- **Tap action** opens the entity's more-info dialog (history, attributes, etc.)
- **Theme-aware** — adapts to light and dark mode via HA CSS variables
- **HACS compatible** for easy install and updates

## Installation

### HACS (recommended)

1. Open HACS in your Home Assistant instance
2. Click the three-dot menu → **Custom repositories**
3. Add this repository URL, category: **Lovelace**
4. Search for "Zone Gauge Card" and install
5. Restart Home Assistant

### Manual

1. Download `zone-gauge-card.js` from the [latest release](../../releases/latest)
2. Copy it to `/config/www/zone-gauge-card.js`
3. Go to **Settings → Dashboards → ⋮ → Resources**
4. Add resource: `/local/zone-gauge-card.js` (type: JavaScript Module)
5. Refresh your browser

## Usage

1. Edit any dashboard
2. Click **Add Card**
3. Search for **Zone Gauge**
4. Select your entity and configure the thresholds in the visual editor

That's it — no YAML required.

## Configuration

All options are available in the visual editor. If you prefer YAML:

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `entity` | string | *required* | Entity ID (e.g. `sensor.indoor_temperature`) |
| `name` | string | entity name | Display name below the gauge |
| `unit` | string | entity unit | Unit of measurement |
| `min` | number | `0` | Gauge minimum value |
| `max` | number | `120` | Gauge maximum value |
| `cold_threshold` | number | `55` | Below this → red |
| `cool_threshold` | number | `62` | Below this → yellow, above → green |
| `warm_threshold` | number | `78` | Above this → yellow |
| `hot_threshold` | number | `85` | Above this → outer color |
| `color_low` | string | `#E24B4A` | Outer zone color (cold/hot extremes) |
| `color_mid` | string | `#EF9F27` | Caution zone color (cool/warm) |
| `color_high` | string | `#5DCAA5` | Comfort zone color |

### Example YAML

```yaml
type: custom:zone-gauge-card
entity: sensor.indoor_temperature
name: Living Room
min: 0
max: 120
cold_threshold: 55
cool_threshold: 62
warm_threshold: 78
hot_threshold: 85
color_low: "#E24B4A"
color_mid: "#EF9F27"
color_high: "#5DCAA5"
```

## Use cases

This card works well for any sensor where you want a "comfortable range" with warnings on both sides:

- **Temperature** — indoor climate monitoring
- **Humidity** — too dry and too humid both flagged
- **CO₂ levels** — comfort vs. ventilation needed
- **Soil moisture** — under-watered and over-watered zones
- **Pool/spa temperature** — too cold, just right, too hot

Just adjust the thresholds and labels to fit your use case.

## License

MIT — see [LICENSE](LICENSE).
