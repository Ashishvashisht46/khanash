const express = require('express');
const multer = require('multer');
const path = require('path');
const cloudinary = require('cloudinary').v2;

const prisma = require('../lib/prisma');
const { authenticate, tenantGuard } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate, tenantGuard);

// ─── Cloudinary Configuration ─────────────────────────────────────────────────
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ─── Multer — store in memory for Cloudinary upload ──────────────────────────
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/csv',
  'text/plain',
];

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} is not allowed.`));
    }
  },
});

// ─── Helper: Upload buffer to Cloudinary ─────────────────────────────────────
function uploadToCloudinary(buffer, filename, folder) {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: `dental-rcm/${folder}`,
        public_id: `${Date.now()}-${filename.replace(/[^a-zA-Z0-9._-]/g, '_')}`,
        resource_type: 'auto',
        use_filename: true,
        unique_filename: true,
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    uploadStream.end(buffer);
  });
}

// ─── Helper: Fallback URL (base64 data URI for small files) ──────────────────
function toDataUri(buffer, mimeType) {
  return `data:${mimeType};base64,${buffer.toString('base64')}`;
}

// ─── POST /api/files/upload ───────────────────────────────────────────────────
router.post('/upload', upload.single('file'), async (req, res, next) => {
  try {
    const { depositId } = req.body;
    const tenantId = req.user.tenantId;

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded.' });
    }

    if (!depositId) {
      return res.status(400).json({ error: 'depositId is required.' });
    }

    // Verify deposit belongs to this tenant
    const deposit = await prisma.deposit.findFirst({
      where: { id: depositId, tenantId },
    });
    if (!deposit) {
      return res.status(404).json({ error: 'Deposit not found.' });
    }

    let url;
    let publicId = null;
    let storageProvider = 'cloudinary';

    // Attempt Cloudinary upload with fallback
    const cloudinaryConfigured =
      process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET;

    if (cloudinaryConfigured) {
      try {
        const result = await uploadToCloudinary(
          req.file.buffer,
          req.file.originalname,
          `tenant-${tenantId}/deposit-${depositId}`
        );
        url = result.secure_url;
        publicId = result.public_id;
      } catch (cloudErr) {
        console.warn('[files] Cloudinary upload failed, using fallback:', cloudErr.message);
        storageProvider = 'local_base64';
        url = toDataUri(req.file.buffer, req.file.mimetype);
      }
    } else {
      // No Cloudinary configured — use data URI fallback (not for production)
      storageProvider = 'local_base64';
      url = toDataUri(req.file.buffer, req.file.mimetype);
      console.warn('[files] Cloudinary not configured. Using base64 data URI (not production-safe).');
    }

    const file = await prisma.file.create({
      data: {
        tenantId,
        depositId,
        name: req.file.originalname,
        size: req.file.size,
        mimeType: req.file.mimetype,
        url,
        storageProvider,
        publicId,
      },
    });

    await prisma.auditLog.create({
      data: {
        tenantId,
        userId: req.user.id,
        userName: req.user.name,
        action: 'FILE_UPLOADED',
        entityType: 'File',
        entityId: file.id,
        metadata: {
          depositId,
          fileName: req.file.originalname,
          size: req.file.size,
          storageProvider,
        },
      },
    });

    res.status(201).json({
      file: {
        id: file.id,
        name: file.name,
        size: file.size,
        mimeType: file.mimeType,
        url: file.url,
        storageProvider: file.storageProvider,
        createdAt: file.createdAt,
      },
    });
  } catch (err) {
    if (err.message?.includes('File type')) {
      return res.status(400).json({ error: err.message });
    }
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB.` });
    }
    next(err);
  }
});

// ─── GET /api/files/:id ───────────────────────────────────────────────────────
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const tenantId = req.user.tenantId;

    const file = await prisma.file.findFirst({
      where: { id, tenantId },
      include: {
        deposit: { select: { id: true, depositId: true } },
      },
    });

    if (!file) {
      return res.status(404).json({ error: 'File not found.' });
    }

    res.json({ file });
  } catch (err) {
    next(err);
  }
});

// ─── DELETE /api/files/:id ────────────────────────────────────────────────────
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const tenantId = req.user.tenantId;

    const file = await prisma.file.findFirst({ where: { id, tenantId } });
    if (!file) {
      return res.status(404).json({ error: 'File not found.' });
    }

    // Attempt Cloudinary deletion
    if (file.storageProvider === 'cloudinary' && file.publicId) {
      try {
        await cloudinary.uploader.destroy(file.publicId, { resource_type: 'auto' });
      } catch (cdnErr) {
        console.warn('[files] Cloudinary deletion failed:', cdnErr.message);
      }
    }

    await prisma.file.delete({ where: { id } });

    await prisma.auditLog.create({
      data: {
        tenantId,
        userId: req.user.id,
        userName: req.user.name,
        action: 'FILE_DELETED',
        entityType: 'File',
        entityId: id,
        metadata: { fileName: file.name, depositId: file.depositId },
      },
    });

    res.json({ message: 'File deleted successfully.' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
