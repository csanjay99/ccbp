const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();
const dbPath = path.join(__dirname, "userData.db");

app.use(express.json());
let dbCon = null;
const initializeDbAndServer = async () => {
  dbCon = await open({
    filename: dbPath,
    driver: sqlite3.Database,
  });

  app.listen(5006, () => {
    console.log("Server running on http://localhost:5006");
  });
};

initializeDbAndServer();

app.post("/register/", async (req, res) => {
  const { username, name, password, gender, location } = req.body;
  const query1 = `select * from user where username = '${username}';`;
  const userPresent = await dbCon.get(query1);
  if (userPresent === undefined) {
    if (password.length >= 5) {
      const hashedPassword = await bcrypt.hash(password, 10);
      const query2 = `Insert into user 
              (username, name, password, gender, location) 
              values 
              ('${username}', '${name}', '${hashedPassword}', '${gender}', '${location}');
              `;
      const dbResponse = await dbCon.run(query2);
      res.send("User created successfully");
    } else {
      res.status(400);
      res.send("Password is too short");
    }
  } else {
    res.status(400);
    res.send("User already exists");
  }
});

app.post("/login/", async (req, res) => {
  const { username, password } = req.body;
  const queryPassword = `select password from user where username = '${username}';`;
  const userPresent = await dbCon.get(queryPassword);
  if (userPresent === undefined) {
    res.status(400);
    res.send("Invalid user");
  } else {
    const hashedPassword = await bcrypt.hash(password);
    const isPasswordCorrect = await bcrypt.compare(
      userPresent.password,
      hashedPassword
    );
    if (isPasswordCorrect) {
      res.send("Login success!");
    } else {
      res.status(400);
      res.send("Invalid password");
    }
  }
});

app.put("/change-password/", async (req, res) => {
  const { username, oldPassword, newPassword } = req.body;
  const getPasswordQuery = `select password from user where username = '${username}';`;
  const presentPass = await dbCon.get(getPasswordQuery);
  const hashedOldPassword = await bcrypt.hash(oldPassword);
  const isPasswordCorrect = await bcrypt.compare(
    presentPass,
    hashedOldPassword
  );
  if (!isPasswordCorrect) {
    res.status(400);
    res.send("Invalid current password");
  } else {
    if (newPassword.length < 5) {
      res.status(400);
      res.send("Password is too short");
    } else {
      const hashedNewPassword = await bcrypt.hash(newPassword);
      const updateQuery = `update user set password = '${hashedNewPassword}';`;
      await dbCon.run(updateQuery);
      res.send("Password updated");
    }
  }
});

module.exports = app;
