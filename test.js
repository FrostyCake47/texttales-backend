const express = require('express');
const app = express();
const port = 3000;

// Define a route to serve a static HTML file
app.get('/', (req, res) => {
  res.send('hey but atleast it connects');
});

// Start the server
app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});