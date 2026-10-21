
import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import multer from 'multer';
import csv from 'csv-parser';
import { Parser } from 'json2csv';
import { Readable } from 'node:stream';
import User from './models/User.js';

const app = express();
const port = process.env.PORT || 5000;

app.use(express.json());

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.originalname.toLowerCase().endsWith('.csv')) {
      return cb(new Error('Please upload a CSV file.'));
    }
    cb(null, true);
  },
});

function parseCSV(buffer) {
  return new Promise((resolve, reject) => {
    const users = [];
    let headersFound = false;

    const parser = csv({
      strict: true,
      mapHeaders: ({ header }) =>
        header.replace(/^\uFEFF/, '').trim().toLowerCase(),
    });

    parser.on('headers', (headers) => {
      if (
        new Set(headers).size !== headers.length ||
        !headers.includes('name') ||
        !headers.includes('email')
      ) {
        parser.destroy(
          new Error('CSV must have unique name and email columns.')
        );
        return;
      }

      headersFound = true;
    });

    parser.on('data', (row) => {
      if (users.length >= 5000) {
        parser.destroy(new Error('Maximum 5000 users allowed.'));
        return;
      }

      const name = row.name?.trim();
      const email = row.email?.trim().toLowerCase();
      const ageValue = row.age?.trim();

      if (
        !name ||
        name.length > 100 ||
        !/^\S+@\S+\.\S+$/.test(email || '')
      ) {
        parser.destroy(new Error('Invalid name or email in CSV.'));
        return;
      }

      const user = { name, email };

      if (ageValue) {
        const age = Number(ageValue);

        if (!Number.isInteger(age) || age < 0 || age > 150) {
          parser.destroy(new Error('Invalid age in CSV.'));
          return;
        }

        user.age = age;
      }

      users.push(user);
    });

    parser.on('error', reject);

    parser.on('end', () => {
      if (!headersFound) {
        return reject(new Error('CSV file is empty or invalid.'));
      }

      if (users.length === 0) {
        return reject(new Error('No users found in CSV.'));
      }

      resolve(users);
    });

    Readable.from([buffer]).pipe(parser);
  });
}

app.get('/', (req, res) => {
  res.send(`
    <h1>User Import and Export</h1>

    <h2>Import Users</h2>
    <p>Choose a CSV file with name and email columns.
    Age is optional.</p>

    <form action="/api/users/import" method="POST"
          enctype="multipart/form-data">
      <input type="file" name="file" accept=".csv" required>
      <button type="submit">Import CSV</button>
    </form>

    <h2>Export Users</h2>
    <a href="/api/users/export">Download users.csv</a>
    <br><br>
    <a href="/api/users">View users as JSON</a>
  `);
});

app.get('/api/users', async (req, res) => {
  try {
    const users = await User.find().sort({ name: 1 }).lean();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get users.' });
  }
});

app.post(
  '/api/users/import',
  upload.single('file'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          error: 'Please select a CSV file.',
        });
      }

      const users = await parseCSV(req.file.buffer);
      const result = await User.insertMany(users);

      res.status(201).json({
        message: 'Users imported successfully.',
        imported: result.length,
      });
    } catch (error) {
      if (error.code === 11000) {
        return res.status(409).json({
          error: 'A user with this email already exists.',
        });
      }

      res.status(400).json({ error: error.message });
    }
  }
);

app.get('/api/users/export', async (req, res) => {
  try {
    const users = await User.find()
      .select('name email age -_id')
      .sort({ name: 1 })
      .lean();

    const parser = new Parser({
      fields: ['name', 'email', 'age'],
    });

    const csvFile = parser.parse(users);

    res.attachment('users.csv');
    res.type('text/csv').send(csvFile);
  } catch (error) {
    res.status(500).json({ error: 'Failed to export users.' });
  }
});

app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    return res.status(
      error.code === 'LIMIT_FILE_SIZE' ? 413 : 400
    ).json({ error: error.message });
  }

  if (error.message === 'Please upload a CSV file.') {
    return res.status(400).json({ error: error.message });
  }

  console.error(error);
  res.status(500).json({ error: 'Something went wrong.' });
});

async function startServer() {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error('Please add MONGO_URI to your .env file.');
    }

    await mongoose.connect(process.env.MONGO_URI);
    await User.init();

    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  } catch (error) {
    console.error('Server error:', error.message);
    process.exitCode = 1;
  }
}

startServer();
