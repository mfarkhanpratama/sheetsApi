require("dotenv").config(); // Memuat variabel dari file .env

const express = require("express");
const fs = require("fs");
const { google } = require("googleapis");

const app = express();
const PORT = 3000;

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI;
const SPREADSHEET_ID = process.env.SPREADSHEET_ID;

const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);

const SCOPES = [
  "https://www.googleapis.com/auth/spreadsheets",
  "https://www.googleapis.com/auth/drive",
];

let authed = false;

app.get("/", (req, res) => {
  if (!authed) {
    const url = oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: SCOPES,
    });
    res.send(
      `<h1>Google Sheets API with OAuth2</h1><a href="${url}">Login with Google</a>`
    );
  } else {
    res.send(
      `<h1>Authenticated</h1><a href="/spreadsheet">Go to Spreadsheet</a>`
    );
  }
});

app.get("/oauth2callback", (req, res) => {
  const code = req.query.code;
  if (code) {
    oauth2Client.getToken(code, (err, tokens) => {
      if (err) {
        console.error("Error getting oAuth tokens:", err);
        res.send("Error during authentication");
        return;
      }
      oauth2Client.setCredentials(tokens);
      authed = true;
      res.redirect("/");
    });
  }
});

app.get("/spreadsheet", async (req, res) => {
  if (!authed) {
    res.redirect("/");
    return;
  }

  const sheets = google.sheets({ version: "v4", auth: oauth2Client });

  try {
    // Contoh: Membaca spreadsheet
    const SPREADSHEET_ID = "1QHRrKX1XnzdFnG1jrbSqgRdLdxpXKexQKstO5xKoysQ";
    const RANGE = "Sheet1!A1:D10";

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: RANGE,
    });

    const rows = response.data.values;
    if (rows.length === 0) {
      res.send("No data found.");
    } else {
      res.json(rows);
    }
  } catch (err) {
    console.error("Error reading spreadsheet:", err);
    res.send("Error reading spreadsheet");
  }
});

app.post("/update", express.json(), async (req, res) => {
  if (!authed) {
    res.redirect("/");
    return;
  }

  const sheets = google.sheets({ version: "v4", auth: oauth2Client });

  try {
    // Contoh: Mengupdate spreadsheet
    const SPREADSHEET_ID = "1QHRrKX1XnzdFnG1jrbSqgRdLdxpXKexQKstO5xKoysQ";
    const RANGE = "Sheet1!A1";
    const values = [["Updated value"]];
    const resource = {
      values,
    };

    const response = await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: RANGE,
      valueInputOption: "RAW",
      resource,
    });

    res.json(response.data);
  } catch (err) {
    console.error("Error updating spreadsheet:", err);
    res.send("Error updating spreadsheet");
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
