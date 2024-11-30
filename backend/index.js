import express, { json, urlencoded } from "express";
const app = express();
import { DBConn } from "./databases/db.js";
import User from "./models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { config } from "dotenv";
import cookieParser from "cookie-parser";
import { authenticateToken } from "./middleware/authentication.js";

app.use(json());
app.use(urlencoded({ extended: true }));
app.use(cookieParser());

config();
DBConn();

function addTokens(res, user) {
  const accessToken = jwt.sign(
    { id: user._id, name: user.name, email: user.email },
    process.env.SECRET_KEY,
    {
      expiresIn: "1h",
    }
  );
  const refreshToken = jwt.sign(
    { id: user._id, name: user.name, email: user.email },
    process.env.REFRESH_SECRET_KEY,
    {
      expiresIn: "7d",
    }
  );
  res.cookie("token", accessToken, { httpOnly: true });
  res.cookie("refreshToken", refreshToken, { httpOnly: true });
}

app.get("/", authenticateToken, (req, res) => {
  res.send(`Hello ${req.user.name}.`);
});

app.post("/register", async (req, res) => {
  const { name, email, password } = req.body;
  if (!(name && email && password)) {
    res.status(400).send("Please enter all the required fields to register");
    return;
  }
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    res.status(400).send("User already exists!");
    return;
  }
  const passwordHash = bcrypt.hashSync(password, 10);
  const createdAt = Date.now();
  const user = await User.create({
    name,
    email,
    passwordHash,
    createdAt,
  });

  addTokens(res, user);
  user.passwordHash = undefined;
  res.cookie("token", token, { httpOnly: true });
  res.status(201).json({
    message: "You have succesfully registered!",
    user,
  });
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!(email && password)) {
    res.status(400).send("Please enter all the required fields to login");
    return;
  }
  const user = await User.findOne({ email });
  if (!user) {
    res.status(400).send("User does not exist!");
    return;
  }
  const passMatch = bcrypt.compareSync(password, user.passwordHash);
  if (!passMatch) {
    res.status(400).send("Incorrect Password");
    return;
  }
  addTokens(res, user);
  res.status(200).json({
    message: "Logged in succesfully",
    id: user._id,
    name: user.name,
    email: user.email,
  });
});

app.post("/refresh-token", (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken) {
    return res.status(401).send("Access Denied: No Refresh Token provided!");
  }
  try {
    const verified = jwt.verify(refreshToken, process.env.REFRESH_SECRET_KEY);
    const accessToken = jwt.sign(
      { id: verified.id, name: verified.name, email: verified.email },
      process.env.SECRET_KEY,
      {
        expiresIn: "1h",
      }
    );
    res.cookie("token", accessToken, { httpOnly: true });
    res.status(200).json({
      message: "Token refreshed successfully",
    });
  } catch (err) {
    res.status(400).send("Invalid Refresh Token");
  }
});

app.post("/logout", (req, res) => {
  res.clearCookie("token");
  res.status(200).json({
    message: "Logged out successfully",
  });
});

app.listen(8000, () => {
  console.log("Server is listening on port 8000");
});
