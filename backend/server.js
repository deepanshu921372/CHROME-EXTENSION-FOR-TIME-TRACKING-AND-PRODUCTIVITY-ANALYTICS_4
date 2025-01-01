const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
app .use(cors())
.use(bodyParser.json());


mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const timeSchema = new mongoose.Schema({
    userId: String,
    domain: String,
    timeSpent: Number,
    date: { type: Date, default: Date.now }
});

const TimeEntry = mongoose.model('TimeEntry', timeSchema);


app.post('/api/time', async (req, res) => {
    const { userId, domain, timeSpent } = req.body;
    const entry = new TimeEntry({ userId, domain, timeSpent });
    await entry.save();
    res.status(201).send(entry);
});


app.get('/api/report/:userId', async (req, res) => {
    const { userId } = req.params;
    const report = await TimeEntry.find({ userId });
    res.send(report);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Backend server is running on http://localhost:${PORT}`);
});