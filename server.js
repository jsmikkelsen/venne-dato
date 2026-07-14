const express = require('express');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data', 'polls.json');

app.use(express.json());
app.use(express.static('public'));

// Sikring af at data-mappen og filen eksisterer
if (!fs.existsSync(path.join(__dirname, 'data'))) {
    fs.mkdirSync(path.join(__dirname, 'data'));
}
if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify({}));
}

// Hjælpefunktioner til at læse/skrive data
const readData = () => JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
const writeData = (data) => fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));

// API: Opret en ny afstemning (Admin)
app.post('/api/polls', (req, requireAdmin, res) => {
    const { title, dates } = req.body;
    if (!title || !dates || !Array.isArray(dates)) {
        return req.res.status(400).json({ error: 'Ugyldig data' });
    }

    const polls = readData();
    const pollId = uuidv4();
    
    polls[pollId] = {
        id: pollId,
        title,
        dates: dates.map(d => ({ date: d, votes: [] })), // Stemmer gemmes som liste af navne pr. dato
        createdAt: new Date().toISOString()
    };

    writeData(polls);
    req.res.json({ id: pollId });
});

// API: Hent en specifik afstemning
app.get('/api/polls/:id', (req, res) => {
    const polls = readData();
    const poll = polls[req.params.id];
    if (!poll) return res.status(404).json({ error: 'Afstemning ikke fundet' });
    res.json(poll);
});

// API: Afgiv stemme
app.post('/api/polls/:id/vote', (req, res) => {
    const { name, selectedDates } = req.body; // selectedDates er et array af dato-strenge
    if (!name || !Array.isArray(selectedDates)) {
        return res.status(400).json({ error: 'Navn og valg er påkrævet' });
    }

    const polls = readData();
    const poll = polls[req.params.id];
    if (!poll) return res.status(404).json({ error: 'Afstemning ikke fundet' });

    // Opdater stemmer for hver dato
    poll.dates.forEach(dateObj => {
        // Fjern tidligere stemmer fra samme person for at tillade opdatering af stemme
        dateObj.votes = dateObj.votes.filter(voter => voter !== name);
        
        // Hvis personen har valgt denne dato, tilføjes de igen
        if (selectedDates.includes(dateObj.date)) {
            dateObj.votes.push(name);
        }
    });

    polls[req.params.id] = poll;
    writeData(polls);
    res.json({ success: true, poll });
});

app.listen(PORT, () => {
    console.log(`Serveren kører på http://localhost:${PORT}`);
});