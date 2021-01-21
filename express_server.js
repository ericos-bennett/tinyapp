const express = require("express");
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');

const app = express();
const PORT = 8080; // default port 8080 (works with vagrant rerouting)

app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());

app.set('view engine', 'ejs');

// Initialize the dummy database variables
const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const users = {
  "LmjMRm": {
    id: "LmjMRm",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
  "322Wyk": {
    id: "322Wyk",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
};

// Function to generate a new shortURL string
const generateRandomString = () => {
  const chars = '01234567890qwertyuiopasdfghjklzxcvbnmQWERTYUIOPASDFGHJKLZXCVBNM';
  let randomStr = '';
  for (let i = 0; i < 6; i++) {
    randomStr += chars[Math.floor(Math.random() * 63)];
  }
  return randomStr;
};

// Function to retrieve a user object given their email
const findUserByEmail = (email) => {
  for (let user in users) {
    if (users[user]['email'] === email) return users[user];
  }
};

// GET handler for the main URLs page (dynamically rendered with EJS)
app.get('/urls', (req, res) => {
  const user = req.cookies ? users[req.cookies['user_id']] : null;
  const templateVars = { urlDatabase, user };
  res.render('urls_index', templateVars);
});

// POST handler for new URL form submission
app.post('/urls', (req, res) => {
  const randomStr = generateRandomString();
  urlDatabase[randomStr] = req.body.longURL;
  res.redirect(`/urls/${randomStr}`);
});

// GET handler for the login page
app.get('/login', (req, res) => {
  const user = req.cookies ? users[req.cookies['user_id']] : null;
  const templateVars = { user };
  res.render('login', templateVars);
});

// POST handler for a login
app.post('/login', (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const user = findUserByEmail(email);
  // login error handling and authorization
  if (user && user.password === password) {
    res.cookie('user_id', user.id);
    res.redirect('/urls');
  } else {
    res.statusCode = '403';
    res.send('403 Forbidden');
  }
});

// POST handler for a logout
app.post('/logout', (req, res) => {
  res.clearCookie('user_id');
  res.redirect('/urls');
});


// GET handler for 'Create New URL' page
app.get("/urls/new", (req, res) => {
  const user = req.cookies ? users[req.cookies['user_id']] : null;
  const templateVars = { user };
  user ? res.render("urls_new", templateVars) : res.redirect('/login');
});

// POST handler for URL deletions
app.post('/urls/:shortURL/delete', (req, res) => {
  const shortURL = req.params.shortURL;
  delete urlDatabase[shortURL];
  res.redirect('/urls');
});

// GET handler for shortURLs (using express route parameters)
app.get("/urls/:shortURL", (req, res) => {
  const user = req.cookies ? users[req.cookies['user_id']] : null;
  const templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL], user };
  res.render("urls_show", templateVars);
});

// POST hanlder for URL edits
app.post('/urls/:shortURL', (req, res) => {
  const newURL = req.body.newURL;
  const shortURL = req.params.shortURL;
  urlDatabase[shortURL] = newURL;
  res.redirect(`/urls/${shortURL}`);
});

// GET handler for the registration page
app.get('/register', (req, res) => {
  const user = req.cookies ? users[req.cookies['user_id']] : null;
  const templateVars = { user };
  res.render('register', templateVars);
});

// POST handler for user registration
app.post('/register', (req, res) => {
  // Registration error handling
  if (req.body.email && req.body.password && !findUserByEmail(req.body.email)) {
    const newUserId = generateRandomString();
    users[newUserId] = {
      id: newUserId,
      email: req.body.email,
      password: req.body.password
    };
    res.cookie('user_id', newUserId);
    res.redirect('/urls');
  } else {
    res.statusCode = '400';
    res.send('400 Bad Request');
  }
});

// GET handler for shortURL redirects
app.get('/u/:shortURL', (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});

// Initialize listener
app.listen(PORT, () => {
  console.log(`TinyApp listening on port ${PORT}!`);
});
