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

// import {
//   authenticateToken,
//   generateAccessToken,
//   generateRefreshToken,
//   refreshSecret,
// } from "../shared/jwtMiddleware";
// import jwt, { JwtPayload } from "jsonwebtoken";

const fs = require("fs");
const readFile = promisify(fs.readFile);

// initializePassport(passport);

const router = Router();
const MAILTRAP_PASSWORD: string = process.env.MAILTRAP_PASSWORD as string;
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

    if (!fetchedUser) {
      return res.status(401).json({ message: "No user with provided email" });
    }

    const passwordMatch = await bcrypt.compare(
      req.body.password,
      fetchedUser.password
    );

    if (!passwordMatch) {
      return res.status(401).json({ message: "Wrong password" });
    }

    if (fetchedUser.status === "Unverified") {
      return res.json({ message: "User unverified" });
    }

    if (fetchedUser.status === "Inactive") {
      return res.json({ message: "Account not yet activated" });
    }

    // const accessToken = generateAccessToken(String(fetchedUser._id));
    // const refreshToken = generateRefreshToken(String(fetchedUser._id));

    // res.cookie("accessToken", accessToken, { httpOnly: true, secure: true, maxAge: 900000 }); // 15 minutes
    // res.cookie("refreshToken", refreshToken, {
    //   httpOnly: true,
    //   secure: true,
    //   maxAge: 604800000,
    // }); // 7 days

    res.json({
      message: "Success",
      // accessToken,
      userCompany: fetchedUser.company,
      isAdmin: fetchedUser.isAdmin,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// router.post("/refreshToken", (req: Request, res: Response) => {
//   const refreshToken = req.cookies.refreshToken;

//   if (!refreshToken) {
//     return res.sendStatus(401);
//   }

//   jwt.verify(refreshToken, refreshSecret, (err: any, decoded: any) => {
//     if (err || !decoded) {
//       return res.sendStatus(403);
//     }

//     const userId = (decoded as JwtPayload).userId;
//     const accessToken = generateAccessToken(userId);
//     res.cookie("accessToken", accessToken, {
//       httpOnly: true,
//       secure: true,
//       maxAge: 900000,
//     }); // 15 minutes

//     res.json({ accessToken });
//   });
// });

router.post("/logout", (req: Request, res: Response) => {
  res.clearCookie("refreshToken", { httpOnly: true, secure: true });
  res.sendStatus(204); // No Content
});

router.post("/register", async (req: Request, res: Response) => {
  console.log(MAILTRAP_PASSWORD)
  res.json({MAILTRAP_PASSWORD});
  return
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
        username: req.body.username,
        password: hashedPassword,
        company: req.body.company,
        status: "Unverified",
        registrationDate: currentDate,
        createdFormulas: 0,
        lastAccess: currentDate,
        phone: req.body.phone,
        supplier: req.body.supplier,
      };

      const insertNewUserResponse = await users.insertOne(newUser);

      const encryptedId = returnEncryptedString(
        String(insertNewUserResponse.insertedId)
      );

      const emailVerificationLink =
        "https://" + FRONTEND_URL + "/verification/" + encryptedId;

      sendVerificationEmail(req.body.email, emailVerificationLink);
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
      { $set: { status: "Inactive" } }
    );
    res.json(activateUser);
  } catch (error) {
    console.log(error);
    res.status(500).json();
  }
});

router.get("/Supplier", async (req: Request, res: Response) => {
  const db = await createMongoDBConnection();
  const suppliers = db.collection("suppliers");
  const allSuppliers = await suppliers.find().toArray();
  res.json(allSuppliers);
});

async function sendVerificationEmail(
  receivedRecipientEmail: string,
  receivedEmailVerificationLink: string
) {
  const nodemailer = require("nodemailer");

  const transporter = nodemailer.createTransport({
    // host: "sandbox.smtp.mailtrap.io",
    host: "live.smtp.mailtrap.io",
    port: 587,
    secure: false, // Use `true` for port 465, `false` for all other ports
    auth: {
      user: "api",
      pass: MAILTRAP_PASSWORD,
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
    from: '"Matsui Color 🖌️" <info@matsui-color.com>', // sender address
    // from: '"This is a test 👻" <postmaster@sandboxd15c86dfa0e8480ea7c4711442934f64.mailgun.org>', // sender address
    to: receivedRecipientEmail, // list of receivers
    subject: "Verify your email 🚀", // Subject line
    // text: "Hello world?", // plain text body
    html: htmlToSend, // html body
  });

  console.log("Message sent: %s", info.messageId);
}

export default router;
