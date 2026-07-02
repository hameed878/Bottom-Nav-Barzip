import express, { type Express } from "express";
import cors from "cors";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";

const PgStore = connectPgSimple(session);

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

const isProd = process.env["NODE_ENV"] === "production";
// Replit always proxies traffic through HTTPS, including in dev mode.
// Detect this so we can configure cookies correctly for the iframe preview.
const isReplit = !!process.env["REPL_ID"];
const behindProxy = isProd || isReplit;

// Trust the first proxy hop so req.secure reflects X-Forwarded-Proto.
// Required for secure cookies + SameSite=None to work behind Replit/prod proxy.
app.set("trust proxy", 1);

app.use(
  cors({
    origin: isProd
      ? (process.env["FRONTEND_ORIGIN"] ?? false)
      : true,
    credentials: true,
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const sessionSecret = process.env["SESSION_SECRET"];
if (!sessionSecret) {
  throw new Error("SESSION_SECRET environment variable is required");
}

const databaseUrl = process.env["DATABASE_URL"];
if (!databaseUrl) {
  throw new Error("DATABASE_URL environment variable is required");
}

app.use(
  session({
    store: new PgStore({
      conString: databaseUrl,
      tableName: "session",
      createTableIfMissing: true,
    }),
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    rolling: true,
    cookie: {
      httpOnly: true,
      // SameSite=None is required so cookies are sent in Replit's iframe/proxy
      // environment where every request appears cross-site to the browser.
      // SameSite=None requires Secure=true (browsers reject it otherwise).
      secure: behindProxy,
      sameSite: behindProxy ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    },
  }),
);

app.use("/api", router);

export default app;
