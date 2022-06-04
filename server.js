const dotenv = require('dotenv');
const express = require('express');
const path = require('path');
const funct = require('./functions')

const createUser = funct.createUser;

dotenv.config();

const app = express();

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

//app.use(logger('dev'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

app.use('/', require('./routes/index'));

// Catch 404 and forward to error handler
app.use(function (req, res, next) {
  const err = new Error('Not Found');
  err.status = 404;
  next(err);
});


// Error handlers
app.use(function (err, req, res, next) {
  res.status(err.status || 500);
  let msg;
  if (err.status === 404){
    msg = 'URL not found'
  } else {
    msg = 'Internal Server Error'
  }
  res.json({"Error": msg});
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}...`);
});
