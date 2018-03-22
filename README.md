# Exercise Tracker REST API

### Create user

POST /api/exercise/new-user
parameter: username

### Add exercise for user

POST /api/exercise/add
parameters: userId, description, duration, date (defaults to current date)

### Get user exercise log

GET /api/exercise/log?{userId}[&from][&to][&limit]
{ } = required, [ ] = optional
from, to = dates (yyyy-mm-dd); limit = number