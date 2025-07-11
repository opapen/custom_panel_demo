# HassBeam Cards

Custom Lovelace Cards für HassBeam IR-Geräte in Home Assistant.

## Übersicht

Diese HACS-Integration enthält zwei Custom Cards:

### 1. HassBeam Card (`hassbeam-card`)
- **Zweck**: Anzeige und Verwaltung gespeicherter IR-Codes
- **Features**:
  - Tabellarische Darstellung aller IR-Codes
  - Filterung nach Gerät und Aktion
  - Senden von IR-Codes direkt aus der Tabelle
  - Löschen von IR-Codes
  - Vollständig responsive Design

### 2. HassBeam Setup Card (`hassbeam-setup-card`)
- **Zweck**: Einrichtung neuer IR-Codes durch Aufzeichnung
- **Features**:
  - Live-Listening für IR-Signale
  - Auswahl und Speicherung neuer IR-Codes
  - Benutzerfreundliche Einrichtung ohne Programmierung
  - Deduplizierung von IR-Events

## Installation über HACS

### Voraussetzungen
- Home Assistant mit HACS installiert
- HassBeam Connect Integration bereits installiert

### Installation
1. **HACS öffnen** → Frontend → Custom Repositories
2. **Repository hinzufügen**:
   - URL: `https://github.com/yourusername/hassbeam-cards`
   - Kategorie: `Lovelace`
3. **Installation** → "HassBeam Cards" suchen und installieren
4. **Home Assistant neustarten**

## Verwendung

### Card-Konfiguration im Dashboard

#### HassBeam Card (Anzeige)
```yaml
type: custom:hassbeam-card
title: "Meine IR-Codes"
device: "tv"           # Optional: Filter nach Gerät
action: "power"        # Optional: Filter nach Aktion
limit: 20              # Optional: Anzahl der Einträge (Standard: 10)
show_table: true       # Optional: Tabelle anzeigen (Standard: true)
height: "500px"        # Optional: Kartenhöhe
width: "100%"          # Optional: Kartenbreite
```

#### HassBeam Setup Card (Einrichtung)
```yaml
type: custom:hassbeam-setup-card
title: "IR-Codes einrichten"
height: "600px"        # Optional: Kartenhöhe
width: "100%"          # Optional: Kartenbreite
```

### Typische Verwendung

1. **Setup Card** verwenden um neue IR-Codes zu erstellen:
   - "Start Listening" klicken
   - Fernbedienung drücken
   - Gerät und Aktion eingeben
   - "Save IR Code" klicken

2. **HassBeam Card** verwenden um Codes zu verwalten:
   - Alle gespeicherten Codes anzeigen
   - Codes direkt senden (📡-Button)
   - Codes löschen (×-Button)
   - Nach Gerät/Aktion filtern

## Features

### HassBeam Card
- **Responsive Tabelle**: Passt sich automatisch an die Displaygröße an
- **Live-Senden**: IR-Codes direkt aus der Tabelle senden
- **Intelligente Filterung**: Schnelle Suche nach Geräten und Aktionen
- **Benutzerfreundliches UI**: Moderne Buttons mit Hover-Effekten
- **Fehlerbehandlung**: Klare Fehlermeldungen und Erfolgsbenachrichtigungen

### HassBeam Setup Card
- **Live-Listening**: Echtzeit-Erkennung von IR-Signalen
- **Event-Deduplizierung**: Automatische Entfernung doppelter Signale
- **Benutzerfreundliche Einrichtung**: Schritt-für-Schritt Anleitung
- **Validierung**: Überprüfung auf Duplikate vor dem Speichern

## Konfigurationsoptionen

### Gemeinsame Optionen
| Option | Typ | Standard | Beschreibung |
|--------|-----|----------|-------------|
| `title` | string | "HassBeam Card" / "HassBeam Setup" | Titel der Card |
| `height` | string | "auto" | Höhe der Card (z.B. "500px") |
| `width` | string | "auto" | Breite der Card (z.B. "100%") |

### HassBeam Card spezifisch
| Option | Typ | Standard | Beschreibung |
|--------|-----|----------|-------------|
| `device` | string | "" | Vorfilter für Gerät |
| `action` | string | "" | Vorfilter für Aktion |
| `limit` | number | 10 | Maximale Anzahl Einträge |
| `show_table` | boolean | true | Tabelle anzeigen |
| `card_size` | number | 6 | Größe im Dashboard |

## Technische Details

### Abhängigkeiten
- HassBeam Connect Custom Integration
- ESPHome mit HassBeam-Konfiguration
- Home Assistant 2023.x oder höher

### Event-System
- HassBeam Card: Lauscht auf `hassbeam_connect_codes_retrieved` Events
- Setup Card: Lauscht auf `esphome.hassbeam.ir_received` Events

### Services
- `hassbeam_connect.get_recent_codes`: Abrufen gespeicherter Codes
- `hassbeam_connect.send_ir_code`: Senden von IR-Codes
- `hassbeam_connect.save_ir_code`: Speichern neuer IR-Codes
- `hassbeam_connect.delete_ir_code`: Löschen von IR-Codes

## Unterstützung

Bei Problemen oder Fragen:
1. Überprüfen Sie die Browser-Konsole auf Fehlermeldungen
2. Stellen Sie sicher, dass die HassBeam Connect Integration korrekt funktioniert
3. Erstellen Sie ein Issue auf GitHub mit Details zum Problem

## Lizenz

MIT License - Siehe LICENSE-Datei für Details.
