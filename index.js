const express = require("express");
const session = require("express-session");
const bodyParser = require("body-parser");
const { dbconnection } = require("./db");
const { main } = require("./index2");
const Prediction = require("./models/Prediction");
const Users = require("./models/users");

const app = express();

dbconnection();

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
      latestData = data.dashboard;
      // console.log(`Dashboard updated: ${new Date().toLocaleTimeString()}`);
      await Prediction.findOneAndUpdate(
        {
          date: new Date().toISOString().slice(0, 10),
        },
        {
          date: new Date().toISOString().slice(0, 10),

          today: data.todayPrediction,

          tomorrow: data.tomorrowPrediction,

          updatedAt: new Date(),
        },
        {
          upsert: true,
          returnDocument: "after",
        },
      );
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

app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  const userInDB = await Users.findOne({ username });

  if (!userInDB || userInDB.password !== password) {
    return res.render("login", {
      error: "Invalid username or password",
    });
  }

  req.session.loggedIn = true;
  req.session.username = username;

  // Save current session ID
  userInDB.activeSessionId = req.sessionID;
  await userInDB.save();

  res.redirect("/");
});

app.get("/logout", async (req, res) => {
  if (req.session.username) {
    await Users.updateOne(
      { username: req.session.username },
      { $unset: { activeSessionId: "" } },
    );
  }

  req.session.destroy(() => {
    res.clearCookie("connect.sid");
    res.redirect("/login");
  });
});

// Dashboard page
app.get("/", checkAuth, async (req, res) => {
  const userInDB = await Users.findOne({
    username: req.session.username,
  }).lean();
  res.render("dashboard", {
    username: req.session.username,
    canCreateUser: userInDB.canCreateUser,
  });
});
// API for frontend refresh
// app.get("/api/dashboard", checkAuth, (req, res) => {
//   res.json(latestData);
// });

app.get("/api/dashboard", checkAuth, async (req, res) => {
  const today = new Date().toISOString().slice(0, 10);

  const prediction = await Prediction.findOne({ date: today });
  const userInDB = await Users.findOne({
    username: req.session.username,
  }).lean();

  res.json({
    dashboard: latestData,
    prediction,
    isShowPrediction: userInDB.isShowPrediction,
  });
});

app.get("/add-user", checkAuth, async (req, res) => {
  const user = await Users.findOne({
    username: req.session.username,
  }).lean();

  if (!user || !user.canCreateUser) {
    return res.status(403).send("Access Denied");
  }

  res.render("register");
});

// const bcrypt = require("bcrypt");

app.post("/add-user", checkAuth, async (req, res) => {
  const currentUser = await Users.findOne({
    username: req.session.username,
  }).lean();
  if (!currentUser || !currentUser.canCreateUser) {
    return res.status(403).send("Access Denied");
  }

  const { username, password, canCreateUser, isShowPrediction } = req.body;

  if (!username || !password) {
    return res.render("register", {
      error: "All fields are required.",
    });
  }

  const exists = await Users.findOne({ username });

  if (exists) {
    return res.render("register", {
      error: "Username already exists",
    });
  }

  // const hash = await bcrypt.hash(password, 10);

  await Users.create({
    username,
    password,
    canCreateUser: canCreateUser === "on",
    isShowPrediction: isShowPrediction === "on",
  });

  res.redirect("/");
});

// Start server
app.listen(7000, () => {
  console.log("Dashboard running at http://localhost:7000");
});

async function checkAuth(req, res, next) {
  if (!req.session.loggedIn) {
    return res.redirect("/login");
  }

  const user = await Users.findOne({
    username: req.session.username,
  });

  if (!user) {
    return res.redirect("/login");
  }

  // Another login happened
  if (user.activeSessionId !== req.sessionID) {
    req.session.destroy(() => {
      res.clearCookie("connect.sid");

      if (req.originalUrl.startsWith("/api/")) {
        return res.status(401).json({
          message: "Logged in from another device",
        });
      }

      return res.redirect("/login");
    });

    return;
  }

  next();
}
