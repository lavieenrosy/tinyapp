const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');
app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.use(cookieParser());

let urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

let users = {
  "01": {
    id: "111111",
    email: "111@111.com",
    password: "111"
  },
  "02": {
    id: "222222",
    email: "222@222.com",
    password: "222"
  }
};

//list of URLs

app.get("/urls", (req, res) => {
  let templateVars = { urls: urlDatabase, userObject: users[req.cookies["user_id"]] };
  res.render("urls_index", templateVars);
});

//route for new tiny URL form; renders urls_new.ejs

app.get("/urls/new", (req, res) => {
  let templateVars = { userObject: users[req.cookies["user_id"]] };
  res.render("urls_new", templateVars);
});

//handles new tiny URL form submission

app.post("/urls", (req, res) => {
  let submittedLongURL = `http://${req.body.longURL}`;
  let newlyGeneratedShortURL = generateRandomString();
  urlDatabase[newlyGeneratedShortURL] = submittedLongURL;
  res.redirect(`/urls/${newlyGeneratedShortURL}`);
});

//displays (new) url entry; renders urls_show.ejs

app.get("/urls/:id", (req, res) => {
  let templateVars = { userObject: users[req.cookies["user_id"]], shortURL: req.params.id, longURL: urlDatabase };
  res.render("urls_show", templateVars);
});

//handles long URL edits

app.post("/urls/:id", (req, res) => {
  let newURL = req.body.longURL;
  let targetURL = req.params.id;
  urlDatabase[targetURL] = newURL;
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
  let longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});

//USER AUTHENTICATION CODE

//login form; renders urls_login.ejs

app.get("/login", (req, res) => {
  let templateVars = { userObject: users[req.cookies["user_id"]] };
  res.render("urls_login", templateVars);
});

//route for login submission

app.post("/login", (req, res) => {

  const userEmail = req.body.email;
  const userPassword = req.body.password;

  for (let key in users) {
    console.log(userEmail);
    console.log(users[key].email);
    console.log(users);
    if (users[key].email === userEmail) {
      if (users[key].password === userPassword) {
        const user_id = users[key].id;
        console.log("user_id:", user_id);
        res.cookie("user_id", user_id);
        res.redirect("/urls");
        return;
      }
    }
  }
  res.status(403).send("Error 403: Email not found or password incorrect!");
});

//route to handle logout

app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/urls");
});

//route for /register endpoint that returns a register form

app.get("/register", (req, res) => {
  let templateVars = { userObject: users[req.cookies["user_id"]], shortURL: req.params.id, longURL: urlDatabase };
  res.render("urls_reg", templateVars);
});

//handles a submitted reg form

app.post("/register", (req, res) => {
  let email = req.body.email;
  let password = req.body.password;

  if (email === "" || password === "") {
    res.status(400).send("Error 400: You must submit an email and password");
  }

  //check to see if registered email already exists in database
  for (let key in users) {
    if (email === users[key].email) {
      res.status(400).send("Error 400: That email has already been used!");
    }
  }

  let user_id = generateRandomString();
  users[user_id] = { id: user_id, email, password };

  console.log(users);
  res.cookie("email", email);
  res.cookie("password", password);
  res.cookie("user_id", user_id);
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

// app.get("/", (req, res) => {
//   res.send("Hello!");
// });

// app.get("/urls.json", (req, res) => {
//   res.json(urlDatabase);
// });

// app.get("/hello", (req, res) => {
//   res.send("<html><body>Hello <b>World</b></body></html>\n");
// });