const express = require("express");
const session = require("express-session");
const bodyParser = require("body-parser");
const { main } = require("./index2");

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));

app.use(
  session({
    secret: "pUTtz^ME4*#yf14mx%*PdWmK$ft2JB",
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 24 * 60 * 60 * 1000,
    },
  }),
);

let latestData = [];

loginDataAllow = [
  {
    username: "bhavesh",
    password: "bhavesh@narola",
  },
  {
    username: "ravivalva007@gmail.com",
    password: "valva@007",
  },
  {
    username: "veenschinese@gmail.com",
    password: "canis@system",
  },
  {
    username: "testingMax@gmail.com",
    password: "max@testing",
  },
];

// Pug setup
app.set("view engine", "pug");
app.set("views", "./views");

// Initial load
async function refreshData() {
  try {
    const data = await main();

    if (data) {
      latestData = data;
      // console.log(`Dashboard updated: ${new Date().toLocaleTimeString()}`);
    }
  } catch (err) {
    console.error("Refresh Error:", err);
  }
}

// Run immediately
refreshData();

// Refresh every 20 seconds
setInterval(refreshData, 1000 * 20);

app.get("/login", (req, res) => {
  res.render("login", {
    error: null,
  });
});

app.post("/login", (req, res) => {
  const { username, password } = req.body;

  const user = loginDataAllow.find(
    (u) => u.username === username && u.password === password,
  );

  if (!user) {
    return res.render("login", {
      error: "Invalid username or password",
    });
  }

  req.session.loggedIn = true;
  req.session.username = username;

  res.redirect("/");
});

app.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.redirect("/");
    }

    res.clearCookie("connect.sid");
    res.redirect("/login");
  });
});

// Dashboard page
app.get("/", checkAuth, (req, res) => {
  res.render("dashboard", {
    username: req.session.username,
  });
});
// API for frontend refresh
app.get("/api/dashboard", checkAuth, (req, res) => {
  res.json(latestData);
});

// Start server
app.listen(7000, () => {
  console.log("Dashboard running at http://localhost:7000");
});

function checkAuth(req, res, next) {
  if (req.session.loggedIn) {
    return next();
  }

  res.redirect("/login");
}
