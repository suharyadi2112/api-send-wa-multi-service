const express = require('express');
const app = express();
const port = 2111;
const sampleRoutes = require('./routes/sampleRoute');

// Middleware to parse JSON bodies
app.use(express.json());

app.use('/api', sampleRoutes);

app.get('/', (req, res) => {
    res.send('Hello World!');
});

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`);
});
