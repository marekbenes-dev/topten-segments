import { setCookie } from "cookies-next";
import jwt from "jsonwebtoken";
import { NextApiRequest, NextApiResponse } from "next";
import appStrava from ".";

const authStravaHandler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== "POST") {
    res.status(404).end();
    return;
  }

  if (!req.body.code) {
    res.status(401).end();
    return;
  }

  const stravaToken = await appStrava.oauth.getToken(req.body.code);

  if (!stravaToken.athlete.id) {
    res.status(401).end();
    return;
  }

  const token = jwt.sign(
    {
      id: stravaToken.athlete.id,
    },
    process.env.JWT_KEY!,
    {
      expiresIn: Number(process.env.JWT_EXPIRES_IN),
    },
  );


  setCookie("accessToken", token, { req, res, maxAge: stravaToken.expires_in });
  res.status(200).json({ accessToken: token });
};

export default authStravaHandler;
