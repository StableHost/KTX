import  express  from "express";
import { createUser, deleteUser, getUser, getallUser, updateUser, searchUserByInfo } from "../Controllers/user.js";
import { VerifyAdmin } from "../Utils/Verifytoken.js";

const router = express.Router();

//Create
router.post("/", createUser);
//Update
router.put("/:id", updateUser);
//Delete
router.delete("/:id", VerifyAdmin, deleteUser);
//Get
router.get("/search", searchUserByInfo); // Search phải trước /:id
router.get("/:id", getUser);
//Getall
router.get("/", getallUser);

export default router