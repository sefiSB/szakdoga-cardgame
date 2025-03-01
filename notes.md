# Szakdolgozat notes

## 1. Felépítés
A program egy böngészőben futó (web)alkalmazás, amit minden olyan eszközön használatba vehetik ahol egy újabb verziójú böngésző megtalálható.
Az eszközök CRUD kérésekkel és socketekkel kommunikálnak egymással és a szerverrel.
Az oldalak közti váltás BrowserRouter technológiával lett megoldva az oldal frissítésének megelőzésének érdekében például.

## 2. Oldalak magyarázata
### 2.1 Register
A Regisztrációért felelős oldal, egy email cím, felhasználónév és jelszó kell hozzá. A felhasználónév egyedisége és a jelszó megfelelő erősségének ellenőrzése után az adatok mentésre kerülnek az adatbázisban (jelszó titkosítva).
Innentől kezdve ezzel a felhasználóval be lehet jelentkezni.

### 2.2 Login
A Bejelentkezésért felelős oldal, a regisztrált felhasználók be tudnak jelentkezni a fiókjukba. Az adatbázis adatai közt keresi a beírt adatokat, ha valami nem helyes, akkor hibát ír ki.
### 2.3 NewGame
Lobby létrehozásáért felel
Konfigurációs lehetőségek:
- Játék neve
- Startkártyák száma
- Játékosonként kell e legyen kártya előtte
    - láthatóból mennyi
    - nem láthatóból mennyi
- Melyik fajta kártyapaklival follyon a játék
    - Melyikeket kívánják ténylegesen használni belőle
- Játékosok száma
- Preset elmentése
