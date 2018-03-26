'use strict'; 

const express = require('express');
const mongo = require('mongodb');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const dateFormat = require('dateformat');
const User = require('./models/user');
const Exercise = require('./models/exercise');

require('dotenv').load();
const app = express()

mongoose.connect(process.env.DB_URI)

app.use(cors())
app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())
app.use(express.static('public'))

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.post('/api/exercise/new-user', (req, res, next) => {
  const inputUsername = req.body.username;
  User.find({ username: inputUsername }, (err, user) => {
    if(err) return next(err);
    if(user.length !== 0) {
      return next({ status: 460, message: 'Username already taken' })
    }
    let newUser = new User({
      username: inputUsername,
    });
    newUser.save((err, data) => {
      if(err) return next(err);
      res.json({
        username: data.username,
        _id: data._id
      });
    });
  });
});

app.post('/api/exercise/add', (req, res, next) => {
  const inputUserId = req.body.userId;
  const inputDescription = req.body.description;
  const inputDuration = req.body.duration;
  let inputDate = req.body.date;
  if(!isNaN(inputDate)) {
    inputDate = parseInt(inputDate);
  }
  const date = !inputDate ? new Date() : new Date(inputDate);
  if(date.toUTCString() === 'Invalid Date') {
    return next({ status: 461, message: 'Invalid date' })
  }
  if(!mongoose.Types.ObjectId.isValid(inputUserId)) {
    return next({ status: 462, message: 'Invalid user ID' })
  }
  if(isNaN(inputDuration)) {
    return next({status: 464, message: 'Duration must be a number'});
  }
  User.findById(inputUserId, (err, user) => {
    if(err) return next(err)
    if(!user) {
      return next({ status: 463, message: 'User not found' })
    }
    let newExercise = new Exercise({
      userId: inputUserId,
      description: inputDescription,
      duration: inputDuration,
      date: date
    });
    newExercise.save((err, data) => {
      if(err) {
        return next(err)
      }
      user.log.unshift(newExercise._id);
      user.save((err) => {
        if(err) return next(err);
      });
      res.json({
        username: user.username,
        userId: data.userId,
        description: data.description,
        duration: data.duration,
        date: data.date
      })
    })
  });
});

app.get('/api/exercise/log', (req, res, next) => {
  const userId = req.query.userId;
  const fromDate = req.query.from;
  const toDate = req.query.to;
  const limit = parseInt(req.query.limit);
  if(!mongoose.Types.ObjectId.isValid(userId)) {
    return next({ status: 462, message: 'Invalid user ID' });
  }
  let query = User.findById(userId);
  const populateParameters = {
    path: 'log',
    select: '-__v -_id -userId',
    options: { sort: { 'date': -1 } },
    match: {}
  }
  if(fromDate) {
    populateParameters.match.date = {
      ...populateParameters.match.date,
      $gte: fromDate
    };
  }
  if(toDate) {
    populateParameters.match.date = {
      ...populateParameters.match.date,
      $lte: toDate
    };
  }
  if(limit) {
    populateParameters.options = {
      ...populateParameters.options,
      limit: limit
    };
  }
  query.populate(populateParameters);
  query.exec((err, user) => {
    if(err) return next(err);
    if(!user) {
      return next({ status: 463, message: 'User not found' });
    }
    res.json({
      username: user.username,
      userId: user._id,
      count: user.log.length,
      log: user.log
    });
  });
});

// Not found middleware
app.use((req, res, next) => {
  return next({ status: 404, message: 'not found' })
})

// Error Handling middleware
app.use((err, req, res, next) => {
  let errCode, errMessage

  if (err.errors) {
    // mongoose validation error
    errCode = 400 // bad request
    const keys = Object.keys(err.errors)
    // report the first validation error
    errMessage = err.errors[keys[0]].message
  } else {
    // generic or custom error
    errCode = err.status || 500
    errMessage = err.message || 'Internal Server Error'
  }
  res.status(errCode).type('txt')
    .send(errMessage)
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('App is listening on port ' + listener.address().port)
})
