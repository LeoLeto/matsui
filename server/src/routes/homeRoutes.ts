import bcrypt from "bcrypt";
import { Request, Response, Router } from "express";
import { UserInterface } from "../interfaces/interfaces";
import { createMongoDBConnection } from "../shared/mongodbConfig";
// import passport from "passport";
// import { initializePassport } from "../shared/passportConfig";
import { getUserByEmail } from "../shared/userServices";
import handlebars = require("handlebars");

import { ObjectId } from "mongodb";
import { promisify } from "util";
import {
  returnDecryptedString,
  returnEncryptedString,
} from "../shared/stringEncryption";
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
      };

      const insertNewUserResponse = await users.insertOne(newUser);

      const encryptedId = returnEncryptedString(
        String(insertNewUserResponse.insertedId)
      );

      const emailVerificationLink =
        "https://" + FRONTEND_URL + "/verification/" + encryptedId;

      sendVerificationEmail(emailVerificationLink);
      // console.log(String(insertNewUserResponse.insertedId));
      res.json(insertNewUserResponse);
    }
  } catch (error) {
    console.log(error);
  }
});

router.post("/emailVerification", async (req: Request, res: Response) => {
  const db = await createMongoDBConnection();
  const users = db.collection("users");

  try {
    const decryptedId = new ObjectId(
      returnDecryptedString(req.body.encryptedId)
    );
    const activateUser = await users.updateOne(
      { _id: decryptedId },
      { $set: { status: "Active" } }
    );
    res.json(activateUser);
  } catch (error) {
    console.log(error);
    res.status(500).json();

  }
});

async function sendVerificationEmail(receivedEmailVerificationLink: string) {
  const nodemailer = require("nodemailer");

  const transporter = nodemailer.createTransport({
    host: "sandbox.smtp.mailtrap.io",
    port: 587,
    secure: false, // Use `true` for port 465, `false` for all other ports
    auth: {
      user: "97da40881803eb",
      pass: "fa675f5f1506c7",
    },
  });

  const source = fs
    .readFileSync("./src/emailTemplates/emailVerification.html", "utf-8")
    .toString();
  const template = handlebars.compile(source);

  const replacements = {
    emailVerificationLink: receivedEmailVerificationLink,
  };
  const htmlToSend = template(replacements);

  const info = await transporter.sendMail({
    from: '"Matsui Color 🖌️" <from@example.com', // sender address
    // from: '"This is a test 👻" <postmaster@sandboxd15c86dfa0e8480ea7c4711442934f64.mailgun.org>', // sender address
    to: "LeoLeto@proton.me", // list of receivers
    subject: "Verify your email 🚀", // Subject line
    // text: "Hello world?", // plain text body
    html: htmlToSend, // html body
  });

  console.log("Message sent: %s", info.messageId);
}

export default router;
