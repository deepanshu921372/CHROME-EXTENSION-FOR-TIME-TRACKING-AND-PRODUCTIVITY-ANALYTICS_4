const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();

// Configure CORS properly
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'DELETE'],
    allowedHeaders: ['Content-Type']
}));
app.use(bodyParser.json());

// Improve MongoDB connection with error handling
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('Connected to MongoDB successfully');
}).catch((err) => {
    console.error('MongoDB connection error:', err);
});

const timeSchema = new mongoose.Schema({
    userId: String,
    domain: String,
    timeSpent: Number,
    date: { type: Date, default: Date.now }
});

const TimeEntry = mongoose.model('TimeEntry', timeSchema);

// Add error handling to endpoints
app.post('/api/time', async (req, res) => {
    try {
        const { userId, domain, timeSpent } = req.body;
        const entry = new TimeEntry({ userId, domain, timeSpent });
        await entry.save();
        res.status(201).send(entry);
    } catch (error) {
        console.error('Error saving time entry:', error);
        res.status(500).send({ error: 'Failed to save time entry' });
    }
});

app.get('/api/report/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const report = await TimeEntry.find({ userId });
        res.send(report);
    } catch (error) {
        console.error('Error fetching report:', error);
        res.status(500).send({ error: 'Failed to fetch report' });
    }
});

app.delete('/api/reset/:userId', async (req, res) => {
    const { userId } = req.params;
    await TimeEntry.deleteMany({ userId });
    res.status(200).send({ message: 'Data reset successfully' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Backend server is running on http://localhost:${PORT}`);
});