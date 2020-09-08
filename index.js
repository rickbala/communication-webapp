const app = require('express')();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const redis = require("redis");

const MAX_NUMBER_OF_MSG_BY_TOPIC = 500;

//redis startup
const redisClient = redis.createClient(); 
redisClient.on("error", function(error) {
  console.error(error);
});

//online peeps
var p = 0;

listOfLatest = []
//main page
app.get('/', (req, res) => {
  listOfLatest = returnLatest();
  res.sendFile(__dirname + '/index.html');
});

//grab the latest 10 topics from the database
function returnLatest(){
  redisClient.lrange("latest", "0", "9", function (err, reply){
    listOfLatest = reply.reverse();
  });
  return listOfLatest;
}

//get contents of a box api
app.get('/getBox', (req, res) => {
  var boxName = req.query.boxName;
  redisClient.lrange(boxName, "0", MAX_NUMBER_OF_MSG_BY_TOPIC - 1, function(err, reply){
    res.send(reply);
  });
});

io.on('connection', (socket) => {
  //number of peeps plus
  io.emit('updateP', ++p);

  //populateInitialLatest
  io.emit('initialLatest', returnLatest());

  //number of peeps down
  socket.on('disconnect', () => {
    io.emit('updateP', --p);
  });

  //chat message
  socket.on('chat message', (msg, box) => {
    //append new msg to the current contents of the box
    redisClient.lpush(box, msg + "<br/>");

    //emits a signal that will update the rigth box with a new message
    io.emit('chat message', msg, box);
  });

  //added a box
  socket.on('added a box', (boxName) => {
    //save the new box name on redis database
    redisClient.lpush("latest", boxName);

    //emits a signal that will update the list of latest boxes
    io.emit('added a box', boxName);
  });

});

http.listen(3000, () => {
  console.log('listening on *:3000');
});
