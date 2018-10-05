const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));
const cookieParser = require('cookie-parser');
app.use(cookieParser());
const bcrypt = require('bcrypt');
app.set("view engine", "ejs");
const cookieSession = require('cookie-session');

app.use(cookieSession({
  name: 'session',
  keys: ['pink-platypus']
}));

let urlDatabase = {
  "b2xVn2": {
    shortURL: "b2xVn2blah",
    longURL: "http://www.lighthouselabs.ca",
    user_id: "111111"
  },
  "9sm5xK": {
    shortURL: "9sm5xK",
    longURL: "http://www.google.com",
    user_id: "222222"
  }
};

//hash the passwords of my seeded data

const user1password = bcrypt.hashSync("111", 10);
const user2password = bcrypt.hashSync("222", 10);

let users = {
  "111111": {
    id: "111111",
    email: "111@111.com",
    password: user1password
  },
  "222222": {
    id: "222222",
    email: "222@222.com",
    password: user2password
  }
};

//function to authenticate that user is logged in

function checkUserExistence(req, res) {
  for (let key in users) {
    if (req.session.user_id === users[key].id) {
      return true;
    }
  }
}

function filterDatabase(id) {
  let filteredDatabase = {};
  for (let key in urlDatabase) {
    if (urlDatabase[key]["user_id"] === id) {
      filteredDatabase[key] = urlDatabase[key];
    }
  }
  return filteredDatabase;
}

//homepage

app.get("/", (req, res) => {
  if (req.session.user_id) {
    res.redirect("/urls");
  } else {
    res.redirect("/login");
  }
});

//list of URLs

app.get("/urls", (req, res) => {
  if (req.session.user_id) {
    let filteredDatabase = filterDatabase(req.session.user_id);
    let templateVars = { urlDatabase: filteredDatabase, userObject: users[req.session.user_id] };
    res.render("urls_index", templateVars);
  } else {
    let templateVars = { userObject: users[req.session.user_id], message: "Please login to view URLs" };
    res.render("urls_error", templateVars);
  }
});

//route for new tiny URL form; renders urls_new.ejs

app.get("/urls/new", (req, res) => {
  const checkUser = checkUserExistence(req, res);
  if (checkUser) {
    let templateVars = { userObject: users[req.session.user_id] };
    res.render("urls_new", templateVars);
  } else {
    res.redirect("/login");
  }
});

//handles new tiny URL form submission

app.post("/urls", (req, res) => {
  let longURL = req.body.longURL;
  let shortURL = generateRandomString();
  let user_id = req.session.user_id;

  if (user_id) {
    urlDatabase[shortURL] = { shortURL, longURL, user_id }
    res.redirect(`/urls/${shortURL}`);
  } else {
    let templateVars = { userObject: users[req.session.user_id], message: "Please login!" };
    res.render("urls_error", templateVars);
  }
});

//displays (new) url entry; renders urls_show.ejs

app.get("/urls/:id", (req, res) => {

  const shortURL = req.params.id;
  const shortURLobject = urlDatabase[shortURL];
  const currentUserID = req.session.user_id;

  if (shortURLobject && shortURLobject.user_id === currentUserID) {
    let templateVars = { userObject: users[req.session.user_id], shortURL: req.params.id, urlDatabase: urlDatabase };
    res.render("urls_show", templateVars);
  } else if (shortURLobject) {
    let templateVars = { userObject: users[req.session.user_id], message: "Sorry, you cannot access this tiny URL :(" };
    res.render("urls_error", templateVars);
  } else {
    let templateVars = { userObject: users[req.session.user_id], message: "Sorry, this URL does not exist!" };
    res.render("urls_error", templateVars);
  }
});

//handles long URL edits

app.post("/urls/:id", (req, res) => {
  let newURL = req.body.longURL;
  let shortURL = req.params.id;
  urlDatabase[shortURL] = { shortURL, longURL: newURL, user_id: req.session.user_id};
  res.redirect("/urls");
});

//request to handle deleted short URLs

app.post("/urls/:id/delete", (req, res) => {
  let targetURL = req.params.id;
  delete urlDatabase[targetURL];
  res.redirect("/urls");
});

//handles shortURL requests by redirecting to longURL

app.get("/u/:shortURL", (req, res) => {
  const urlObject = urlDatabase[req.params.shortURL];
  if (urlObject) {
    const longURL = urlObject.longURL
    res.redirect(longURL);
  } else {
    let templateVars = { userObject: users[req.session.user_id], message: "Sorry, this tiny URL does not exist!" };
    res.render("urls_error", templateVars);
  }
});

//USER AUTHENTICATION CODE

//login form; renders urls_login.ejs

app.get("/login", (req, res) => {
  const currentUserID = req.session.user_id;
  if (currentUserID) {
    res.redirect("/urls");
  } else {
  let templateVars = { userObject: users[req.session.user_id] };
  res.render("urls_login", templateVars);
  }
});

//route for login submission

app.post("/login", (req, res) => {

  const userEmail = req.body.email;
  const userPassword = req.body.password;

  for (let key in users) {
    if (users[key].email === userEmail) {
      const hashedPassword = users[key].password;
      if (bcrypt.compareSync(userPassword, hashedPassword)) {
        const user_id = users[key].id;
        req.session.user_id = user_id;
        res.redirect("/urls");
        return;
      }
    }
  }
  res.status(403);
  let templateVars = { userObject: users[req.session.user_id], message: "Please enter valid email or password." };
  res.render("urls_error", templateVars);
});

//route to handle logout

app.post("/logout", (req, res) => {
  // res.clearCookie("user_id");
  req.session = null;
  res.redirect("/urls");
});

//route for /register endpoint that returns a register form

app.get("/register", (req, res) => {
  const currentUserID = req.session.user_id;
  if (currentUserID) {
    res.redirect("/urls");
  } else {
  let templateVars = { userObject: users[req.session.user_id] };
  res.render("urls_reg", templateVars);
  }
});

//handles a submitted reg form

app.post("/register", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const hashedPassword = bcrypt.hashSync(password, 10);

  if (email === "" || password === "") {
    res.status(400);
    let templateVars = { userObject: users[req.session.user_id], message: "Error 400: You must submit an email and password." };
    res.render("urls_error", templateVars);
  }

  //check to see if registered email already exists in database

  for (let key in users) {
    if (email === users[key].email) {
      res.status(400);
      let templateVars = { userObject: users[req.session.user_id], message: "Error 400: That email has already been used!" };
      res.render("urls_error", templateVars);
    }
  }

  let user_id = generateRandomString();
  users[user_id] = { id: user_id, email, password: hashedPassword };
  req.session.user_id = user_id;
  res.redirect("/urls");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

function generateRandomString() {
  let randomString = "";
  const possibleCharacters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < 5; i++) {
    randomString += possibleCharacters.charAt(Math.floor(Math.random() * possibleCharacters.length));
  }
  return randomString;
}
