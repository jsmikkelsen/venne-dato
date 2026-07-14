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

const requireAdmin = (req, res, next) => {
    const authHeader = req.headers['x-admin-password'];
    if (authHeader === ADMIN_PASSWORD) {
        next();
    } else {
        res.status(401).json({ error: 'Uautoriseret adgang' });
    }
};

app.post('/api/admin/login', (req, res) => {
    const { password } = req.body;
    if (password === ADMIN_PASSWORD) {
        res.json({ success: true });
    } else {
        res.status(401).json({ error: 'Forkert adgangskode' });
    }
});

app.get('/api/admin/polls', requireAdmin, (req, res) => {
    const polls = readData();
    const pollList = Object.values(polls).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json(pollList);
});

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

// API: Opret ny afstemning (Nu med description)
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
        description: description || '', // Gem beskrivelsen (eller en tom streng hvis tom)
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