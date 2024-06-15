import { Router, Request, Response } from "express";
import axios from "axios";
import bcrypt from "bcrypt";
import { createMongoDBConnection } from "../shared/mongodbConfig";
import { UserInterface } from "../interfaces/interfaces";
// import passport from "passport";
// import { initializePassport } from "../shared/passportConfig";
import { getUserByEmail } from "../shared/userServices";
import handlebars = require("handlebars");

import { promisify } from "util";
const fs = require("fs");
const readFile = promisify(fs.readFile);

// initializePassport(passport);

const router = Router();
const MAILGUN_PASSWORD: string = process.env.MAILGUN_PASSWORD as string;
const FRONTEND_URL: string = process.env.FRONTEND_URL as string;

router.get("/wakeUpServer", (req: Request, res: Response) => {
  //   axios
  //     .get("https://jsonplaceholder.typicode.com/posts/1")
  //     .then((response) => {
  //       // console.log(response.data);
  //       res.json(response.data);
  //     })
  //     .catch((error) => console.log(error));
  res.json("ok");
});

router.post("/login", async (req: Request, res: Response) => {
  try {
    const fetchedUser = await getUserByEmail(req.body.email);

    if (fetchedUser === null) {
      res.status(401).json({ message: "No user with provided email" });
    } else {
      if (await bcrypt.compare(req.body.password, fetchedUser.password)) {
        if (fetchedUser.status === "Unverified") {
          res.json({ message: "User unverified" });
          return;
        }
        res.json({ message: "Success" });
      } else {
        res.status(401).json({ message: "Wrong password" });
      }
    }
  } catch (error) {
    console.log(error);
  }
});

router.post("/register", async (req: Request, res: Response) => {
  try {
    const fetchedUser = await getUserByEmail(req.body.email);
    if (fetchedUser !== null) {
      res.status(401).json({ message: "Email already registered" });
    } else {
      const db = await createMongoDBConnection();
      const users = db.collection("users");
      const hashedId = await bcrypt.hash(req.body._id, 10);
      const emailVerificationLink = FRONTEND_URL + "/verification/" + hashedId;
      const hashedPassword = await bcrypt.hash(req.body.password, 10);
      const currentDate = new Date();

      const newUser: UserInterface = {
        email: req.body.email,
        username: "",
        password: hashedPassword,
        company: "",
        status: "Unverified",
        registrationDate: currentDate,
        createdFormulas: 0,
        lastAccess: currentDate,
        TEMP: emailVerificationLink
      };

      const insertNewUserResponse = await users.insertOne(newUser);


      // sendVerificationEmail(emailVerificationLink);
      res.json(insertNewUserResponse);
    }
  } catch (error) {
    console.log(error);
  }
});

async function sendVerificationEmail(receivedEmailVerificationLink: string) {
  const nodemailer = require("nodemailer");

  // const transporter = nodemailer.createTransport({
  //   host: "smtp.mailgun.org",
  //   port: 587,
  //   secure: false, // Use `true` for port 465, `false` for all other ports
  //   auth: {
  //     user: "postmaster@sandboxd15c86dfa0e8480ea7c4711442934f64.mailgun.org",
  //     pass: MAILGUN_PASSWORD,
  //   },
  // });
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true, // Use `true` for port 465, `false` for all other ports
    auth: {
      user: "lexp2008@gmail.com",
      pass: MAILGUN_PASSWORD,
    },
  });

  const source = fs
    .readFileSync("server/src/Email templates/emailVerification.html ", "utf-8")
    .toString();
  const template = handlebars.compile(source);

  const replacements = {
    emailVerificationLink: receivedEmailVerificationLink,
  };
  const htmlToSend = template(replacements);

  const info = await transporter.sendMail({
    from: '"This is a test 👻" <postmaster@sandboxd15c86dfa0e8480ea7c4711442934f64.mailgun.org>', // sender address
    to: "LeoLeto@proton.me", // list of receivers
    subject: "Hello ✔", // Subject line
    // text: "Hello world?", // plain text body
    html: htmlToSend, // html body
  });

  console.log("Message sent: %s", info.messageId);
}

export default router;
