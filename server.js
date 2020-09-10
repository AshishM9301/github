const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyparser = require('body-parser');

const app = express();
app.use(cors());

app.use(express.json());
app.use(bodyparser.urlencoded({ extended: true }));
app.use(bodyparser.json());

const config = require('./config/keys');
const { User } = require('./models/Users');

var allowCrossDomain = function (req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  res.header(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, Content-Length, X-Requested-With'
  );

  // intercept OPTIONS method
  if ('OPTIONS' == req.method) {
    res.send(200);
  } else {
    next();
  }
};

app.use(allowCrossDomain);
mongoose
  .connect(process.env.MONGODB_URI || config.mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log('Database is Connected'))
  .catch((err) => console.log(err));

app.post('/api/add/user', (req, res) => {
  var { userName } = req.body;
  console.log(req.body);

  User.find({ userName: userName }, (err, user) => {
    if (err)
      return res.status(400).json({
        success: false,
        message: 'Server Error',
      });
    if (user.length > 0)
      return res.status(400).json({
        success: false,
        message: 'Already in Database',
      });
    const newUser = new User(req.body);

    newUser.userName = userName;

    newUser.save((err, user) => {
      if (err)
        return res.status(400).json({
          success: false,
          errorMessage: 'Error: Server Error',
          err: err,
        });
      return res.json({
        success: true,
        message: `${user.userName} is Added`,
      });
    });
  });
});

app.get('/api/users', (req, res) => {
  User.find({}, (err, users) => {
    if (err)
      return res.status(400).json({ success: false, message: 'Server Error' });
    res.json({ success: true, users: users });
  })
    .sort({ _id: -1 })
    .select('-_id')
    .select('-__v');
});

// Serve Static Assets if in Production
if (process.env.NODE_ENV === 'production') {
  // Set Static Folder
  app.use(express.static('client/build'));

  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'client', 'build', 'index.html'));
  });
}

const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`Server Started ${port}`));
