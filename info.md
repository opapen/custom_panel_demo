# HassBeam Card

Eine einfache Custom Lovelace Card zur Anzeige oder Steuerung von IR-Events mit HassBeam.

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

## Features

- **Status-Anzeige**: Zeigt das letzte IR-Event und den Status an
- **IR-Code-Tabelle**: Vollständige Übersicht aller gespeicherten IR-Codes
- **Geräte-Filter**: Filterung nach spezifischen Geräten
- **Live-Aktualisierung**: Automatische Aktualisierung der Daten
- **Responsive Design**: Optimiert für verschiedene Bildschirmgrößen

## Tabellen-Spalten

Die Tabelle zeigt folgende Informationen:

- **Zeitstempel**: Wann der IR-Code empfangen wurde
- **Gerät**: Name des Geräts
- **Aktion**: Ausgeführte Aktion
- **Event Data**: JSON-Daten des Events (hover für Details)

## Voraussetzungen

- Home Assistant mit Lovelace UI
- HassBeam Connect Integration installiert
- Service `hassbeam_connect.get_recent_codes` verfügbar
- Entity `sensor.hassbeam_last_ir` verfügbar (optional)

## Service-Integration

Die Card nutzt den Service `hassbeam_connect.get_recent_codes` um die IR-Code-Daten zu laden.

### Service-Parameter

- `device` (optional): Filtert nach einem bestimmten Gerät
- `limit` (optional, Standard: 10): Anzahl der zurückzugebenden Codes

### Beispiel-Aufruf

```yaml
service: hassbeam_connect.get_recent_codes
data:
  device: "TV"
  limit: 25
```

### Erwartetes Response-Format

```json
{
  "response": [
    [1, "TV", "power_on", "{\"protocol\": \"NEC\", \"code\": \"0x123456\"}", "2025-07-10 14:30:25"],
    [2, "TV", "volume_up", "{\"protocol\": \"NEC\", \"code\": \"0x789ABC\"}", "2025-07-10 14:31:10"]
  ]
}
```

## Unterstützung

Bei Problemen oder Fragen erstelle bitte ein Issue im GitHub Repository.

## Lizenz

MIT License
