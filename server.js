const express = require('express');
const elasticServiceQuery = require('./elkService');
const auth = require('http-auth');
const authorizeMethod = require('./../middleware/authorization');
 
var app = express();
const port = process.env.PORT || 3000

var authorization = auth.connect(authorizeMethod.basic);

app.get('/test', authorization, (req, res) => {
  res.send(elasticServiceQuery._request());
})

app.listen(port, () => {
  console.log(`Started up at port ${port}`);
});

module.exports = {app};

var resultG = elasticServiceQuery._request();
console.log(resultG);
