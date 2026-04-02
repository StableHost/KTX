import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import path from "path";
import { fileURLToPath } from "url";
import authRouter from "./Routes/auth.js";
import dormitoryRouter from "./Routes/dormitorys.js";
import roomRouter from "./Routes/rooms.js";
import UserRouter from "./Routes/Users.js";
import AdminRouter from "./Routes/admin.js"
import RoleRouter from "./Routes/roles.js"
import RoomdetailsRouter from "./Routes/roomdetail.js"
import PickupDropoffRouter from "./Routes/pickupDropoff.js"
import ChatbotRouter from "./Routes/chatbot.js"
import GradingRouter from "./Routes/grading.js"
import cookieParser from "cookie-parser";
import cors from "cors";
import httpStatus from "http-status";
import localtunnel from 'localtunnel';

import { errors } from "celebrate";
import { errorHandler } from "./Middlewares/errors.js";
import ApiError from "./Utils/ApiError.js";

import { setServers } from "node:dns/promises";
setServers(["1.1.1.1", "8.8.8.8"]);

const app = express();

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

var whitelist = [process.env.FRONTEND_URL, 'http://localhost:3000', 'http://localhost:8800']; //white list consumers
var corsOptions = {
  origin: function (origin, callback) {
    if (whitelist.indexOf(origin) !== -1 || !origin) {
      callback(null, true);
    } else {
      callback(null, false);
    }
  },
  methods: ['GET', 'PUT', 'POST', 'DELETE', 'OPTIONS'],
  optionsSuccessStatus: 200, // some legacy browsers (IE11, various SmartTVs) choke on 204
  credentials: true, //Credentials are cookies, authorization headers or TLS client certificates.
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'device-remember-token',
    'Access-Control-Allow-Origin',
    'Origin',
    'Accept'
  ]
};

app.use(cors(corsOptions));

// parse json request body
app.use(express.json());

// parse urlencoded request body
app.use(express.urlencoded({ extended: true }));

const connect = async () => {
	try {
		await mongoose.connect(process.env.MONGO);
		console.log("Connect Mongo");
	} catch (error) {
		throw error;
	}
};

mongoose.connection.on("disconnected", () => {
	console.log("mongoDB disconnected!");
});

//middlewares
app.use(cookieParser());
app.use("/api/auth", authRouter);
app.use("/api/dormitorys", dormitoryRouter);
app.use("/api/rooms", roomRouter);
app.use("/api/user", UserRouter);
app.use("/api/role", RoleRouter);
app.use("/api/admin", AdminRouter);
app.use("/api/roomdetails", RoomdetailsRouter);
app.use("/api/pickup-dropoff", PickupDropoffRouter);
app.use("/api/chatbot", ChatbotRouter);
app.use("/api/grading", GradingRouter);

// Serve static files from React build folder with proper MIME types
const buildPath = path.join(__dirname, '../../Frontend/build');
app.use(express.static(buildPath, {
  maxAge: '1h',
  etag: false,
  setHeaders: (res, filePath, stat) => {
    const ext = path.extname(filePath).toLowerCase();
    
    // Set proper MIME types
    switch(ext) {
      case '.css':
        res.setHeader('Content-Type', 'text/css; charset=utf-8');
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        break;
      case '.js':
        res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        break;
      case '.json':
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.setHeader('Cache-Control', 'no-cache');
        break;
      case '.html':
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
        break;
      case '.png':
        res.setHeader('Content-Type', 'image/png');
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        break;
      case '.jpg':
      case '.jpeg':
        res.setHeader('Content-Type', 'image/jpeg');
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        break;
      case '.gif':
        res.setHeader('Content-Type', 'image/gif');
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        break;
      case '.svg':
        res.setHeader('Content-Type', 'image/svg+xml');
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        break;
      case '.woff':
        res.setHeader('Content-Type', 'font/woff');
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        break;
      case '.woff2':
        res.setHeader('Content-Type', 'font/woff2');
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        break;
      case '.ttf':
        res.setHeader('Content-Type', 'font/ttf');
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        break;
      case '.eot':
        res.setHeader('Content-Type', 'application/vnd.ms-fontobject');
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        break;
    }
    
    // Security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
  }
}));

// Catch-all handler for React Router (must be after API routes)
app.get('*', (req, res, next) => {
	// If the request is for an API route, pass to 404 handler
	if (req.path.startsWith('/api')) {
		return next(new ApiError(httpStatus.NOT_FOUND, "API Endpoint Not found"));
	}
	// Otherwise, serve the React app
	res.sendFile(path.join(__dirname, '../../Frontend/build', 'index.html'));
});

// send back a 404 error for any unknown api request
app.use((req, res, next) => {
	next(new ApiError(httpStatus.NOT_FOUND, "Endpoint Not found"));
});

// handle error
app.use(errorHandler);

// celebrate error handler
app.use(errors());

app.listen(8800, () => {
	connect();
	console.log("Connect BE");
});