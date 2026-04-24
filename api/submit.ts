import type { VercelRequest, VercelResponse } from "@vercel/node";
import { google } from "googleapis";

const spreadsheetId = "1aZud4gJTC0l1IX-FaZuV_Q-WfX7fzCMH_WwqpliW7lU";
const header = [
  "신청일시",
  "문의유형",
  "이름",
  "연락처",
  "이메일",
  "반려견이름",
  "품종",
  "희망검사",
  "주소",
  "문의내용",
];

type LeadPayload = {
  submittedAt?: string;
  inquiryType?: string;
  name?: string;
  phone?: string;
  email?: string;
  dogName?: string;
  breed?: string;
  preferredTest?: string;
  address?: string;
  message?: string;
};

function clean(value: unknown) {
  return String(value ?? "").trim();
}

function readServiceAccount() {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;

  if (!raw) {
    throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON is not configured.");
  }

  const credentials = JSON.parse(raw);

  if (typeof credentials.private_key === "string") {
    credentials.private_key = credentials.private_key.replace(/\\n/g, "\n");
  }

  return credentials;
}

function isPayload(body: unknown): body is LeadPayload {
  if (!body || typeof body !== "object") {
    return false;
  }

  const payload = body as LeadPayload;
  return Boolean(clean(payload.inquiryType) && clean(payload.name) && clean(payload.phone));
}

async function getSheetsClient() {
  const credentials = readServiceAccount();
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  return google.sheets({ version: "v4", auth });
}

async function getFirstSheetTitle(sheets: ReturnType<typeof google.sheets>) {
  const spreadsheet = await sheets.spreadsheets.get({
    spreadsheetId,
    fields: "sheets.properties.title",
  });

  const title = spreadsheet.data.sheets?.[0]?.properties?.title;

  if (!title) {
    throw new Error("No worksheet found.");
  }

  return title;
}

async function ensureHeader(sheets: ReturnType<typeof google.sheets>, sheetTitle: string) {
  const range = `${sheetTitle}!A1:J1`;
  const existing = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range,
  });

  if (existing.data.values?.[0]?.length) {
    return;
  }

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range,
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [header],
    },
  });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "Method not allowed." });
  }

  if (!isPayload(req.body)) {
    return res.status(400).json({ ok: false, error: "Required fields are missing." });
  }

  try {
    const payload = req.body;
    const sheets = await getSheetsClient();
    const sheetTitle = await getFirstSheetTitle(sheets);

    await ensureHeader(sheets, sheetTitle);

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `${sheetTitle}!A:J`,
      valueInputOption: "USER_ENTERED",
      insertDataOption: "INSERT_ROWS",
      requestBody: {
        values: [
          [
            clean(payload.submittedAt) || new Date().toISOString(),
            clean(payload.inquiryType),
            clean(payload.name),
            clean(payload.phone),
            clean(payload.email),
            clean(payload.dogName),
            clean(payload.breed),
            clean(payload.preferredTest),
            clean(payload.address),
            clean(payload.message),
          ],
        ],
      },
    });

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ ok: false, error: "Failed to save lead." });
  }
}
