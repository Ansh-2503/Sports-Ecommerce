import type { Request } from "express";
import multer from "multer";
import { v4 as uuid } from "uuid";

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const ALLOWED_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp", "gif"]);

const storage = multer.diskStorage({
  destination(_req, _file, callback) {
    callback(null, "uploads");
  },
  filename(_req, file, callback) {
    const id = uuid();
    const ext = (file.originalname.split(".").pop() || "bin").toLowerCase();
    callback(null, `${id}.${ext}`);
  },
});

function fileFilter(
  _req: Request,
  file: Express.Multer.File,
  callback: multer.FileFilterCallback
) {
  const ext = (file.originalname.split(".").pop() || "").toLowerCase();
  if (!ALLOWED_MIME_TYPES.has(file.mimetype) || !ALLOWED_EXTENSIONS.has(ext)) {
    return callback(new Error("Only JPEG, PNG, WebP, and GIF images are allowed"));
  }
  callback(null, true);
}

export const singleUpload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
}).single("photo");