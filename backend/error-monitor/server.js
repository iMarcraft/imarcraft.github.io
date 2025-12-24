import express from 'express';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import cors from 'cors';
import { Resend } from 'resend';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

let last403Alert = {};
const COOLDOWN_MS = 60_000; // 1 minute

const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;
const resend = new Resend(process.env.RESEND_API_KEY);

// Function to send a Discord message
async function sendDiscordNotification(message) {
  try {
    await fetch(DISCORD_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: message }),
    });
  } catch (err) {
    console.error('Failed to send Discord notification', err);
  }
}

// Endpoint frontend calls when a 403 happens
app.post('/notify-403', async (req, res) => {
  const now = Date.now();
  const { url, userAgent } = req.body;  // destruct request body

  if (last403Alert[url] && now - last403Alert[url] < COOLDOWN_MS) {
    return res.status(429).json({ status: 'ignored', message: 'Cooldown active' });
  }

  last403Alert[url] = now;

  const time = new Date().toLocaleString();

  await sendDiscordNotification(
    `🚨 **403 Forbidden Detected**\n• URL: ${url}\n• Time: ${time}\n• User-Agent: ${userAgent}`
  );

  res.status(200).json({ status: 'ok' });
});

// Endpoint frontend calls when clicking the submit button in the connect section
app.post('/connect', async (req, res) => {
  const { name, email, msg } = req.body;    // destruct request body
  console.log('name:', name);     // DEBUG
  console.log('email:', email);   // DEBUG
  console.log('message:', msg);   // DEBUG

  try{
    resend.emails.send({
      from: 'Portfolio Connect <portfolio@resend.dev>',
      to: 'marcusponders@proton.me',
      subject: `New message from ${name}`,
      html: `<h3>Email:</h3><p>${email}</p><h3>Message:</h3><p>${msg}</p>`
    });
  } catch (err) {
    console.log("Resend error:", err);
  }

  res.status(200).json({ status: 'ok' });
})


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
