import type { VercelRequest, VercelResponse } from "@vercel/node";
import { google } from "googleapis";

const spreadsheetId = "1aZud4gJTC0l1IX-FaZuV_Q-WfX7fzCMH_WwqpliW7lU";
const header = [
  "신청 일시",
  "문의 유형",
  "보호자 이름",
  "연락처",
  "이메일",
  "반려견 이름",
  "반려견 품종",
  "희망 검사 항목",
  "주소",
  "상세 메모",
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

async function getFirstSheet(sheets: ReturnType<typeof google.sheets>) {
  const spreadsheet = await sheets.spreadsheets.get({
    spreadsheetId,
    fields: "sheets.properties.sheetId,sheets.properties.title",
  });

  const properties = spreadsheet.data.sheets?.[0]?.properties;
  const title = properties?.title;
  const sheetId = properties?.sheetId;

  if (!title || sheetId === undefined || sheetId === null) {
    throw new Error("No worksheet found.");
  }

  return { title, sheetId };
}

async function ensureHeader(
  sheets: ReturnType<typeof google.sheets>,
  sheetTitle: string,
  sheetId: number,
) {
  const existing = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${sheetTitle}!A1:J1`,
  });

  const currentHeader = existing.data.values?.[0] ?? [];
  const hasHeader = currentHeader.length > 0;
  const hasEmailColumn = currentHeader.includes("이메일");
  const dogNameIndex = currentHeader.indexOf("반려견 이름");

  if (hasHeader && !hasEmailColumn && dogNameIndex === 4) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [
          {
            insertDimension: {
              range: {
                sheetId,
                dimension: "COLUMNS",
                startIndex: 4,
                endIndex: 5,
              },
              inheritFromBefore: true,
            },
          },
        ],
      },
    });
  }

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `${sheetTitle}!A1:J1`,
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
    const { title: sheetTitle, sheetId } = await getFirstSheet(sheets);

    await ensureHeader(sheets, sheetTitle, sheetId);

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `${sheetTitle}!A:J`,
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
