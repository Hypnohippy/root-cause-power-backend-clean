const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

// Import our API routes
app.use('/api', require('./api/test.js'));

app.get('/', (req, res) => {
  res.json({ message: 'Root Cause Power Backend is running!' });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
