const express = require('express');
const exphbs = require('express-handlebars');
const session = require('express-session');
const bcrypt = require('bcrypt');
const sqlite3 = require('sqlite3');
const axios = require('axios');


const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(__dirname));
app.use(express.urlencoded({ extended: true }));

// Set up SQLite database
const db = new sqlite3.Database('user.db');

// Set up sessions
app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: true
}));

// Set up Handlebars as the template engine
app.engine('handlebars', exphbs({
  defaultLayout: 'index',
  layoutsDir: __dirname + '/views',
  extname: '.handlebars'
}));
app.set('view engine', 'handlebars');

// New route for guest signup
app.get('/signup', (req, res) => {
  res.render('signup');
});

// // New route for guest signup
// app.post('/signup', async (req, res) => {
//   const { username, password } = req.body;
//   console.log(' Signup route accessed');

//   // Hash the password before storing it (use bcrypt)
//   const hashedPassword = await bcrypt.hash(password, 10);

//   // Store the user in the database (replace with your logic)
//   db.run('INSERT INTO users (username, password) VALUES (?, ?)', [username, hashedPassword], (err) => {
//     if (err) {
//       console.error(err);
//       return res.status(500).send('Internal Server Error');
//     }

//     console.log('User signed up successfully:', username);

//     // Redirect to the main page after successful signup
//     res.redirect('/');
//   });
// });

// New route for processing guest signup
app.post('/signup/guest', async (req, res) => {
  console.log('Guest Signup route accessed');
  const { username, password } = req.body;

  // Hash the password before storing it (use bcrypt)
  const hashedPassword = await bcrypt.hash(password, 10);

  // Store the user in the database (replace with your logic)
  db.run('INSERT INTO users (username, password) VALUES (?, ?)', [username, hashedPassword], (err) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Internal Server Error');
    }

    console.log('User signed up successfully:', username);

    // Redirect to the main page after successful signup
    res.redirect('/');
  });
});

app.get('/', (req, res) => {
  res.render('index', { user: req.session.user });
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  console.log('Received login request:', { username, password });

  // Check if the user exists in the database
  db.get('SELECT * FROM users WHERE username = ?', [username], async (err, user) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Internal Server Error');
    }

    if (user) {
      console.log('User found in the database:', user);
      const passwordMatch = await bcrypt.compare(password, user.password);
      console.log('Password match result:', passwordMatch||password == user.password);

      if (passwordMatch || password == user.password) {
        // Successful login
        console.log('Login successful');
        req.session.user = user;
        res.redirect('/');
      } else {
        // Invalid password
        console.log('Invalid password');
        res.render('index', { error: 'Invalid password' });
      }
    } else {
      // User not found
      console.log('User not found');
      res.render('index', { error: 'User not found' });
    }
  });
});

app.get('/filter-activities', async (request, response) => {
  const type = request.query.type;
  const participants = request.query.participants;

  // Check if the user is logged in
  if (!request.session.user) {
    return response.status(401).json({ error: 'Unauthorized' });
  }

  try {
      const apiUrl = `https://bored-api.appbrewery.com/filter?type=${type}&participants=${participants}`;
      const apiResponse = await axios.get(apiUrl);

      console.log('API Response:', apiResponse.data);
      
      response.json(apiResponse.data);
  } catch (error) {
      console.error('Error fetching filtered activities:', error.stack);
      response.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/check-auth', (req, res) => {
  if (req.session.user) {
    res.json({
      authenticated: true,
      username: req.session.user.username,
      role: req.session.user.role || 'user',
    });
  } else {
    res.json({ authenticated: false });
  }
});

// Start server
app.listen(PORT, (err) => {
  if (err) {
    console.error(err);
  } else {
    console.log(`Server listening on port: ${PORT}`);
    console.log('To Test:');
    console.log('http://localhost:3000');
  }
});

app.get('/admin/users', (req, res) => {
  // Check if the user is logged in and is an admin
  if (req.session.user && req.session.user.role === 'admin') {
    // Define the SQL query to select all users
    const query = 'SELECT * FROM users';

    // Wrap the db.all operation in a Promise
    const getUsers = new Promise((resolve, reject) => {
      db.all(query, (err, users) => {
        if (err) {
          console.error(err.message);
          reject(err);
        } else {
          console.log('List of Users:', users);
          resolve(users);
        }
      });
    });

    // Execute the Promise and handle results
    getUsers
      .then((users) => {
        // Render the 'userList' view with the users data
        res.json(users);     
      })
      .catch((error) => {
        console.error('Error fetching users:', error);
        // Handle the error appropriately
        res.status(500).send('Internal Server Error');
      })
      .finally(() => {
        // Close the database connection after rendering the view
        db.close();
      });
  } else {
    // If not an admin, redirect to the main page or display an error message
    res.redirect('/');
  }
});