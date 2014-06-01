var express = require('express');
var app = express();


app.get('/', function(req, res) {
  res.send('hello world');
});

var PORT = process.env.PORT || 80;
app.listen(PORT, function() {
  console.log('listening on', PORT);
});
