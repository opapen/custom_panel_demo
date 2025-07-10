# HassBeam Card

[![hacs_badge](https://img.shields.io/badge/HACS-Custom-orange.svg)](https://github.com/custom-components/hacs)

Eine einfache Custom Lovelace Card zur Anzeige von IR-Events mit HassBeam.

## Features

- **Status-Anzeige**: Zeigt das letzte IR-Event und den Status an
- **IR-Code-Tabelle**: Vollständige Übersicht aller gespeicherten IR-Codes aus der HassBeam-Datenbank
- **Geräte-Filter**: Filterung nach spezifischen Geräten
- **Live-Aktualisierung**: Automatische Aktualisierung der Daten
- **Responsive Design**: Optimiert für verschiedene Bildschirmgrößen
- **Hover-Details**: Vollständige Event-Daten beim Überfahren mit der Maus

## Installation

### Via HACS (empfohlen)

1. Öffne HACS in Home Assistant
2. Gehe zu "Frontend"
3. Klicke auf die drei Punkte oben rechts und wähle "Benutzerdefinierte Repositories"
4. Füge die Repository-URL hinzu: `https://github.com/IHR-USERNAME/hassbeam-card`
5. Kategorie: "Lovelace"
6. Klicke "Hinzufügen"
7. Suche nach "HassBeam Card" und installiere es
8. Starte Home Assistant neu

### Manuelle Installation

1. Kopiere `hassbeam-card.js` nach `config/www/hassbeam-card/`
2. Füge folgende Ressource in der Lovelace-Konfiguration hinzu:

```yaml
resources:
  - url: /local/hassbeam-card/hassbeam-card.js
    type: module
```

## Konfiguration

### Basis-Konfiguration

```yaml
type: custom:hassbeam-card
title: "Mein HassBeam"
```

### Erweiterte Konfiguration

```yaml
type: custom:hassbeam-card
title: "IR Remote Control"
entity: sensor.hassbeam_last_ir  # Optional: Angepasste Entity
show_table: true                 # Optional: Tabelle anzeigen (Standard: true)
max_rows: 50                     # Optional: Maximale Anzahl Zeilen (Standard: 50)
filter_device: "TV"              # Optional: Nur bestimmtes Gerät anzeigen
```

### Konfigurationsoptionen

| Option | Typ | Standard | Beschreibung |
|--------|-----|----------|-------------|
| `title` | string | "HassBeam Card" | Titel der Card |
| `entity` | string | "sensor.hassbeam_last_ir" | Entity für Status-Info |
| `show_table` | boolean | true | Tabelle mit IR-Codes anzeigen |
| `max_rows` | number | 50 | Maximale Anzahl Tabellenzeilen |
| `filter_device` | string | - | Nur bestimmtes Gerät anzeigen |

## Voraussetzungen

- Home Assistant mit Lovelace UI
- HassBeam Integration installiert
- Entity `sensor.hassbeam_last_ir` verfügbar

## Screenshot

![HassBeam Card](https://via.placeholder.com/400x200/1f1f1f/ffffff?text=HassBeam+Card)

## Unterstützung

Bei Problemen oder Fragen erstelle bitte ein Issue im GitHub Repository.

## Lizenz

MIT License
