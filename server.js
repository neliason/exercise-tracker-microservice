'use strict'; 

const express = require('express');
const mongo = require('mongodb');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const dateFormat = require('dateformat');
const User = require('./user');
const Exercise = require('./exercise');

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

// Not found middleware
// app.use((req, res, next) => {
//   return next({status: 404, message: 'not found'})
// })

// // Error Handling middleware
// app.use((err, req, res, next) => {
//   let errCode, errMessage

//   if (err.errors) {
//     // mongoose validation error
//     errCode = 400 // bad request
//     const keys = Object.keys(err.errors)
//     // report the first validation error
//     errMessage = err.errors[keys[0]].message
//   } else {
//     // generic or custom error
//     errCode = err.status || 500
//     errMessage = err.message || 'Internal Server Error'
//   }
//   res.status(errCode).type('txt')
//     .send(errMessage)
// });

app.post('/api/exercise/new-user', (req, res) => {
  const inputUsername = req.body.username;
  User.find({username: inputUsername}, (err, user) => {
    if(err) throw new Error(err);
    if(user.length !== 0) {
      res.end('Username already taken');
      return;
    }
    let newUser = new User({
      username: inputUsername,
    });
    newUser.save((err, data) => {
      if(err) throw new Error(err);
      res.json({
        username: data.username,
        _id: data._id
      });
    });
  });
});

app.post('/api/exercise/add', (req, res) => {
  const inputUserId = req.body.userId;
  const inputDescription = req.body.description;
  const inputDuration = req.body.duration;
  let inputDate = req.body.date ;
  if(!isNaN(inputDate)) {
    inputDate = parseInt(inputDate);
  }
  const date = !inputDate ? new Date() : new Date(inputDate);
  if(date.toUTCString() === 'Invalid Date') {
    res.end('Invalid date');
    return;
  }
  verifyUserId(inputUserId, res);
  User.findById(inputUserId, (err, user) => {
    if(err) throw new Error(err);
    if(!user) {
      res.end('invalid user ID');
      return;
    }
    let newExercise = new Exercise({
      userId: inputUserId,
      description: inputDescription,
      duration: inputDuration,
      date: date
    });
    newExercise.save((err, data) => {
      if(err) throw new Error(err);
      user.log.unshift(newExercise._id);
      user.save((err) => {
        if(err) throw new Error(err);
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

app.get('/api/exercise/log', (req, res) => {
  const userId = req.query.userId;
  const fromDate = req.query.from;
  const toDate = req.query.to;
  const limit = parseInt(req.query.limit);
  let query = User.findById(userId);
  const populateParameters = {
    path: 'log', 
    select: '-__v -_id -userId',
    options: {sort: {'date': -1}}
  }
  if(fromDate) {
    populateParameters.match = {
      ...populateParameters.match,
      date: {$gte: fromDate}
    };
  }
  if(toDate) {
    populateParameters.match = {
      ...populateParameters.match,
      date: {$lte: toDate}
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
    if(err) throw new Error(err);
    res.json({
      username: user.username,
      userId: user._id,
      count: user.log.length,
      log: user.log
    });
  });
});

app.get('/api/exercise/log2', (req, res) => {
  const userId = req.query.userId;
  const fromDate = req.query.from;
  const toDate = req.query.to;
  const limit = parseInt(req.query.limit);
  verifyUserId(userId, res);
  User.findById(userId, (err, user) => {
    if(err) throw new Error(err);
    if(!user) {
      res.end('invalid user ID');
    }
    let query = Exercise.find({userId});
    query.select('-userId -_id -__v');
    if(fromDate) query.where('date').gt(fromDate);
    if(toDate) query.where('date').lt(toDate);
    if(limit) query.limit(limit);
    query.exec((err, exercises) => {
      if(err) throw new Error(err);
      res.json({
        username: user.username,
        userId,
        count: exercises.length,
        log: exercises
      })
    });
  });
});

const verifyUserId = (userId, res) => {
  if(!mongoose.Types.ObjectId.isValid(userId)) {
    res.end('Invalid user ID')
  }
}

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('App is listening on port ' + listener.address().port)
})
