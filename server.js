const express = require('express');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data', 'polls.json');

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

app.use(express.json());
app.use(express.static('public'));

if (!fs.existsSync(path.join(__dirname, 'data'))) {
    fs.mkdirSync(path.join(__dirname, 'data'));
}
if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify({}));
}

const readData = () => JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
const writeData = (data) => fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));

// Middleware til at sikre admin-adgang
const requireAdmin = (req, res, next) => {
    const authHeader = req.headers['x-admin-password'];
    if (authHeader === ADMIN_PASSWORD) {
        next();
    } else {
        res.status(401).json({ error: 'Uautoriseret adgang' });
    }
};

// Log ind
app.post('/api/admin/login', (req, res) => {
    const { password } = req.body;
    if (password === ADMIN_PASSWORD) {
        res.json({ success: true });
    } else {
        res.status(401).json({ error: 'Forkert adgangskode' });
    }
});

// Hent alle afstemninger (til admin dashboard)
app.get('/api/admin/polls', requireAdmin, (req, res) => {
    const polls = readData();
    const pollList = Object.values(polls).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json(pollList);
});

// Slet en hel afstemning
app.delete('/api/admin/polls/:id', requireAdmin, (req, res) => {
    const polls = readData();
    if (polls[req.params.id]) {
        delete polls[req.params.id];
        writeData(polls);
        res.json({ success: true });
    } else {
        res.status(404).json({ error: 'Afstemning ikke fundet' });
    }
});

// Slet en bestemt persons stemmer fra en afstemning
app.delete('/api/admin/polls/:id/votes/:name', requireAdmin, (req, res) => {
    const polls = readData();
    const poll = polls[req.params.id];
    if (!poll) return res.status(404).json({ error: 'Afstemning ikke fundet' });

    const targetName = req.params.name;
    poll.dates.forEach(dateObj => {
        dateObj.votes = dateObj.votes.filter(voter => voter !== targetName);
    });

    polls[req.params.id] = poll;
    writeData(polls);
    res.json({ success: true, poll });
});

// Tilføj en ny dato til en eksisterende afstemning
app.post('/api/admin/polls/:id/dates', requireAdmin, (req, res) => {
    const { date } = req.body;
    if (!date) return res.status(400).json({ error: 'Dato er påkrævet' });

    const polls = readData();
    const poll = polls[req.params.id];
    if (!poll) return res.status(404).json({ error: 'Afstemning ikke fundet' });

    // Undgå dubletter
    if (poll.dates.some(d => d.date === date)) {
        return res.status(400).json({ error: 'Datoen eksisterer allerede' });
    }

    poll.dates.push({ date, votes: [] });
    poll.dates.sort((a, b) => new Date(a.date) - new Date(b.date)); // Hold dem sorteret

    polls[req.params.id] = poll;
    writeData(polls);
    res.json({ success: true, poll });
});

// Slet en specifik dato fra en eksisterende afstemning
app.delete('/api/admin/polls/:id/dates/:date', requireAdmin, (req, res) => {
    const polls = readData();
    const poll = polls[req.params.id];
    if (!poll) return res.status(404).json({ error: 'Afstemning ikke fundet' });

    const targetDate = req.params.date;
    poll.dates = poll.dates.filter(d => d.date !== targetDate);

    polls[req.params.id] = poll;
    writeData(polls);
    res.json({ success: true, poll });
});

// API: Opret ny afstemning
app.post('/api/polls', (req, res) => {
    const { title, description, dates } = req.body;
    if (!title || !dates || !Array.isArray(dates)) {
        return res.status(400).json({ error: 'Ugyldig data' });
    }

    const polls = readData();
    const pollId = uuidv4();
    
    polls[pollId] = {
        id: pollId,
        title,
        description: description || '',
        dates: dates.map(d => ({ date: d, votes: [] })),
        createdAt: new Date().toISOString()
    };

    writeData(polls);
    res.json({ id: pollId });
});

app.get('/api/polls/:id', (req, res) => {
    const polls = readData();
    const poll = polls[req.params.id];
    if (!poll) return res.status(404).json({ error: 'Afstemning ikke fundet' });
    res.json(poll);
});

app.post('/api/polls/:id/vote', (req, res) => {
    const { name, selectedDates } = req.body;
    if (!name || !Array.isArray(selectedDates)) {
        return res.status(400).json({ error: 'Navn og valg er påkrævet' });
    }

    const polls = readData();
    const poll = polls[req.params.id];
    if (!poll) return res.status(404).json({ error: 'Afstemning ikke fundet' });

    poll.dates.forEach(dateObj => {
        dateObj.votes = dateObj.votes.filter(voter => voter !== name);
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