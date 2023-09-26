const express = require("express");
const bodyParser = require("body-parser");
require("dotenv").config();
const mongoose = require("mongoose");
const path = require("path");
const validUrl = require("valid-url");
const shortid = require("shortid");
const URL = require("./models/url");

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, "public")));

app.set("view engine", "ejs");
app.set("views", "views");

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("Connected to database!");
  })
  .catch(() => {
    console.log("Connection failed!");
    process.exit(1);
  });

app.get("/", (req, res, next) => {
  res.render("index", { shortUrl: "" });
});

app.post("/shorten", async (req, res, next) => {
  const url = req.body.url;
  if (!validUrl.isUri(url)) {
    console.log("Invalid URL");
    return res.status(401).redirect("/");
  }
  let shortUrl = await URL.findOne({ url: url });
  if (shortUrl) {
    console.log("URL already exists");
    return res.status(200).render("index", { shortUrl: shortUrl.shortUrl });
  }
  const urlCode = shortid.generate();
  shortUrl = new URL({
    url: url,
    urlCode: urlCode,
    shortUrl: `${req.protocol}://${req.get("host")}/${urlCode}`,
  });
  shortUrl
    .save()
    .then((result) => {
      console.log("URL created");
      res.status(200).render("index", { shortUrl: shortUrl.shortUrl });
    })
    .catch((err) => {
      console.log(err);
    });
});

app.get("/:urlCode", async (req, res, next) => {
  const urlCode = req.params.urlCode;
  let url = await URL.findOne({ urlCode: urlCode });
  if (!url) {
    console.log("URL not found");
    return res.status(404).redirect("/");
  }
  res.redirect(url.url);
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
