// Get dependencies
const express = require('express');
const path = require('path');
const http = require('http');
const bodyParser = require('body-parser');

const app = express();

const dataFolder = './server/data';

const getAllDays = () => {
  const fs = require('fs');
  const regex = /smog_(\d+-\d+-\d+).txt/;
  var days = [];
  fs.readdirSync(dataFolder).forEach(file => {
    var matchDate = file.match(regex);
    if(matchDate){
      var day = matchDate[1];
      days.push(day);
    }
  })
  return days;
}

function pad(n) {
  return (n < 10) ? ("0" + n) : n;
}

function readMinutesFromFile(indexOfDay){
  const file = readDayFile(indexOfDay);
  const allRows = file.toString().split(/[\r\n]+/);
  var minutes = [];
  for(i = 0; i < allRows.length; ++i){
    if(allRows[i].length === 0) {
      break;
    }
    const rowRegex = /^([0-9]{2} [A-Za-z]{3} [0-9]+) ([0-9]{2}:[0-9]{2}:[0-9]{2}.[0-9]+)\: (.*)$/;
    var rowData = allRows[i].match(rowRegex);
    var date = rowData[1];
    var time = rowData[2];
    var measurments = rowData[3];

    const dustRegex = /^PM2\.5 (.*) mcg\/m3, PM10: (.*) mcg\/m3$/;
    var dust = measurments.match(dustRegex);
    var PM2_5 = dust[1];
    var PM10 = dust[2];

    var timestamp = Date.parse(date + ' ' + time);
    var datetime = new Date(timestamp);
    
    var minute = datetime.getMinutes();
    var hour = datetime.getHours();
    var second = datetime.getSeconds();

    var minuteIndex = pad(hour) +":" + pad(minute);

    if(minutes[minuteIndex]) {
      minutes[minuteIndex].seconds.push({second: second, pm2_5: parseFloat(PM2_5), pm10: parseFloat(PM10)});
      minutes[minuteIndex].sumPM2_5+=parseFloat(PM2_5);
      minutes[minuteIndex].sumPM10+=parseFloat(PM10);
    } else {
      minutes[minuteIndex] = {
         seconds:[{second: second, pm2_5: parseFloat(PM2_5), pm10: parseFloat(PM10)}],
         sumPM2_5:parseFloat(PM2_5),
         sumPM10:parseFloat(PM10),
      }
    }  
  }
  return minutes;
}

const readDayFile = (day) => {
  const filename = dataFolder + '/smog_' + day + '.txt';
  fs = require('fs');
  return fs.readFileSync(filename);
}

app.get('/api/', (req, res) => {
  res.sendFile(path.join(__dirname, 'server/assets/index.html'));
});

app.get('/api/listDays/', (req, res) => {
  const days = getAllDays();
  res.json(days);
  console.log("listDays: ", req.ip);
});

app.get("/api/:day/minutes/", (req, res) => {
  const days = getAllDays();
  const day = req.params.day;
  const index = days.indexOf(day);

  if(index === -1) {
    res.status(404).send('No such day in list!');
  } else {
    const indexOfDay = days[index];
    minutes = readMinutesFromFile(indexOfDay);

    var averages = [];
    for(var key in minutes){
      averages.push({
        minute: key,
        pm10: minutes[key].sumPM10 / minutes[key].seconds.length,
        pm2_5: minutes[key].sumPM2_5 / minutes[key].seconds.length,
      });
    }
    res.send(averages);
  }
})

/**
 * Get port from environment and store in Express.
 */
const port = process.env.PORT || '4343';
app.set('port', port);

/**
 * Create HTTP server.
 */
const server = http.createServer(app);

/**
 * Listen on provided port, on all network interfaces.
 */
server.listen(port, () => console.log(`API running on localhost:${port}`));
