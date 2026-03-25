const express = require("express");
const session = require("express-session");
const state = require("./state");

function startWeb() {
  const app = express();

  app.set("view engine", "ejs");
  app.use(express.urlencoded({ extended: true }));

  app.use(session({
    secret: process.env.SECRET_KEY || "dev",
    resave: false,
    saveUninitialized: true
  }));

  const PASSWORD = process.env.DASH_PASSWORD || "admin123";

  function isLoggedIn(req) {
    return req.session.logged_in;
  }

  app.get("/", (req, res) => {
    res.render("login");
  });

  app.post("/", (req, res) => {
    if (req.body.password === PASSWORD) {
      req.session.logged_in = true;
      return res.redirect("/dashboard");
    }
    res.redirect("/");
  });

  app.get("/dashboard", (req, res) => {
    if (!isLoggedIn(req)) return res.redirect("/");

    const client = state.client;

    const guilds = client.guilds.cache.size;
    const users = client.guilds.cache.reduce((acc, g) => acc + (g.memberCount || 0), 0);
    const uptime = Math.floor((Date.now() - state.startTime) / 1000);

    res.render("dashboard", { guilds, users, uptime });
  });

  app.post("/send", async (req, res) => {
    if (!isLoggedIn(req)) return res.redirect("/");

    await state.sendMessage(req.body.channel, req.body.message);
    res.redirect("/dashboard");
  });

  app.post("/spam", async (req, res) => {
    if (!isLoggedIn(req)) return res.redirect("/");

    await state.spamChannel(req.body.channel, req.body.message);
    res.redirect("/dashboard");
  });

  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => console.log(`Web running on ${PORT}`));
}

module.exports = { startWeb };
