
import appStrava from "strava-v3";
appStrava.config({
  access_token: "",
  client_id: process.env.CLIENT_ID!,
  client_secret: process.env.CLIENT_SECRET!,
  redirect_uri: process.env.REDIRECT_URI!,
});
export default appStrava;