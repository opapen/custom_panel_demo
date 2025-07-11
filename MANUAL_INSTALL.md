# Manuelle Installation der HassBeam Cards

Falls die automatische HACS-Installation nicht beide Cards erkennt, können Sie beide Dateien manuell registrieren:

## Schritt 1: Dateien kopieren
Nach der HACS-Installation sollten beide Dateien im `www/community/hassbeam-cards/` Ordner sein:
- `hassbeam-card.js`
- `hassbeam-setup-card.js`

## Schritt 2: Ressourcen manuell hinzufügen
Gehen Sie zu **Einstellungen** → **Dashboards** → **Ressourcen** und fügen Sie beide Dateien hinzu:

### Ressource 1: HassBeam Card
```
URL: /hacsfiles/hassbeam-cards/hassbeam-card.js
Typ: JavaScript-Modul
```

### Ressource 2: HassBeam Setup Card
```
URL: /hacsfiles/hassbeam-cards/hassbeam-setup-card.js  
Typ: JavaScript-Modul
```

## Schritt 3: Home Assistant neu starten
Nach dem Hinzufügen beider Ressourcen, starten Sie Home Assistant neu.

## Schritt 4: Cards verwenden
Beide Card-Typen sind nun verfügbar:

### HassBeam Card (Anzeige)
```yaml
type: custom:hassbeam-card
title: "Meine IR-Codes"
```

### HassBeam Setup Card (Einrichtung)  
```yaml
type: custom:hassbeam-setup-card
title: "IR-Codes einrichten"
```

## Problembehebung

### Card nicht verfügbar
- Überprüfen Sie die Browser-Konsole auf Fehler
- Stellen Sie sicher, dass beide Dateien korrekt geladen wurden
- Leeren Sie den Browser-Cache

### Ressourcen-Pfade
Je nach HACS-Version kann der Pfad variieren:
- `/hacsfiles/hassbeam-cards/` (neuere HACS-Versionen)
- `/local/community/hassbeam-cards/` (ältere Versionen)
