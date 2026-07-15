# 📅 Venne-Dato

En simpel, letvægts webapplikation til at koordinere aftaler og finde fælles datoer i vennegrupper. Appen er bygget med Node.js (Express) i backenden og Tailwind CSS i frontenden. Den kører fuldstændig uden en tung databaseopsætning ved i stedet at gemme afstemninger direkte i en JSON-fil.

## ✨ Funktioner

* **Nem oprettelse:** Opret en afstemning med en titel, en valgfri beskrivelse og vælg datoer direkte på en interaktiv kalender.
* **Uformel afstemning:** Vennerne indtaster blot deres navn og vælger de datoer, de kan deltage på.
* **Live resultater:** Se status med det samme. Den mest populære dato markeres automatisk med et "Mest populær"-mærke.
* **Fuldt Admin Panel (`/admin.html`):**
  * Se alle oprettede afstemninger.
  * Tilføj eller slet datoer i en eksisterende afstemning.
  * Fjern en specifik deltagers stemmer (hvis de f.eks. har tastet forkert eller vil starte forfra).
  * Slet hele afstemningen permanent.

---

## 🛠️ Teknologistak

* **Backend:** Node.js, Express
* **Frontend:** HTML5, Vanilla JavaScript, Tailwind CSS (via CDN)
* **Datakilde:** JSON-baseret fil-database (`/data/polls.json`)
* **Udrulning:** Docker & Docker Compose

---

## 🚀 Installation & Lokal Opsætning

### Forudsætninger
* [Node.js](https://nodejs.org/) (hvis du vil køre den direkte uden Docker)
* [Docker](https://www.docker.com/) og [Docker Compose](https://docs.docker.com/compose/) (anbefales til produktion)

### Kør lokalt med Node.js
1. Installer afhængigheder:
   ```bash
   npm install
