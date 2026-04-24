import type { VercelRequest, VercelResponse } from "@vercel/node";
import { google } from "googleapis";

const DEFAULT_SPREADSHEET_ID = "1aZud4gJTC0l1IX-FaZuV_Q-WfX7fzCMH_WwqpliW7lU";
const DEFAULT_SHEET_NAME = "시트1";
const ALLOWED_INQUIRY_TYPES = new Set(["구매 문의", "구매 신청", "기타"]);
const ALLOWED_TEST_TYPES = new Set(["16종 검사", "6종 검사", "상담 후 결정"]);
const MAX_FIELD_LENGTH = 500;

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

type CleanLeadPayload = Required<Pick<LeadPayload, "inquiryType" | "name" | "phone" | "preferredTest">> &
  Pick<LeadPayload, "submittedAt" | "email" | "dogName" | "breed" | "address" | "message">;

function clean(value: unknown) {
  return String(value ?? "").trim();
}

function cleanField(value: unknown, maxLength = MAX_FIELD_LENGTH) {
  return clean(value).slice(0, maxLength);
}

function formatSubmittedDate(value: unknown) {
  const raw = clean(value);
  const date = raw ? new Date(raw) : new Date();

  if (Number.isNaN(date.getTime())) {
    return formatSubmittedDate(undefined);
  }

  const parts = new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
  }).formatToParts(date);

  const year = parts.find((part) => part.type === "year")?.value ?? "";
  const month = parts.find((part) => part.type === "month")?.value ?? "";
  const day = parts.find((part) => part.type === "day")?.value ?? "";
  const weekday = parts.find((part) => part.type === "weekday")?.value ?? "";

  return `${year}-${month}-${day}(${weekday})`;
}

function readServiceAccount() {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;

  if (!raw) {
    throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON is not configured.");
  }

  const credentials = JSON.parse(raw.replace(/^\uFEFF+/, "").trim());

  if (typeof credentials.private_key === "string") {
    credentials.private_key = credentials.private_key.replace(/\\n/g, "\n");
  }

  return credentials;
}

function getSpreadsheetId() {
  return clean(process.env.GOOGLE_SPREADSHEET_ID) || DEFAULT_SPREADSHEET_ID;
}

function getSheetName() {
  return clean(process.env.GOOGLE_SHEET_NAME) || DEFAULT_SHEET_NAME;
}

function sheetRange(sheetTitle: string, range: string) {
  return `'${sheetTitle.replace(/'/g, "''")}'!${range}`;
}

function parsePayload(body: unknown): CleanLeadPayload | null {
  if (!body || typeof body !== "object") {
    return null;
  }

  const payload = body as LeadPayload;
  const inquiryType = cleanField(payload.inquiryType, 30);
  const name = cleanField(payload.name, 80);
  const phone = cleanField(payload.phone, 20);
  const preferredTest = cleanField(payload.preferredTest, 30);

  if (
    !ALLOWED_INQUIRY_TYPES.has(inquiryType) ||
    !name ||
    !/^010-\d{3,4}-\d{4}$/.test(phone) ||
    !ALLOWED_TEST_TYPES.has(preferredTest)
  ) {
    return null;
  }

  return {
    submittedAt: cleanField(payload.submittedAt, 40),
    inquiryType,
    name,
    phone,
    email: cleanField(payload.email, 120),
    dogName: cleanField(payload.dogName, 80),
    breed: cleanField(payload.breed, 80),
    preferredTest,
    address: cleanField(payload.address, 300),
    message: cleanField(payload.message, 1000),
  };
}

async function getSheetsClient() {
  const credentials = readServiceAccount();
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  return google.sheets({ version: "v4", auth });
}

async function assertSheetExists(sheets: ReturnType<typeof google.sheets>, spreadsheetId: string, sheetName: string) {
  const spreadsheet = await sheets.spreadsheets.get({
    spreadsheetId,
    fields: "sheets.properties.title",
  });

  const exists = spreadsheet.data.sheets?.some((sheet) => sheet.properties?.title === sheetName);

  if (!exists) {
    throw new Error(`Worksheet not found: ${sheetName}`);
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "Method not allowed." });
  }

  const payload = parsePayload(req.body);

  if (!payload) {
    return res.status(400).json({ ok: false, error: "Required fields are missing." });
  }

  try {
    const spreadsheetId = getSpreadsheetId();
    const sheetName = getSheetName();
    const sheets = await getSheetsClient();

    await assertSheetExists(sheets, spreadsheetId, sheetName);

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: sheetRange(sheetName, "A:J"),
      valueInputOption: "USER_ENTERED",
      insertDataOption: "INSERT_ROWS",
      requestBody: {
        values: [
          [
            formatSubmittedDate(payload.submittedAt),
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
