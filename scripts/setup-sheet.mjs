import { google } from "googleapis";

const DEFAULT_SPREADSHEET_ID = "1aZud4gJTC0l1IX-FaZuV_Q-WfX7fzCMH_WwqpliW7lU";
const DEFAULT_SHEET_NAME = "시트1";
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

function clean(value) {
  return String(value ?? "").trim();
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

function sheetRange(sheetTitle, range) {
  return `'${sheetTitle.replace(/'/g, "''")}'!${range}`;
}

const spreadsheetId = clean(process.env.GOOGLE_SPREADSHEET_ID) || DEFAULT_SPREADSHEET_ID;
const sheetName = clean(process.env.GOOGLE_SHEET_NAME) || DEFAULT_SHEET_NAME;
const auth = new google.auth.GoogleAuth({
  credentials: readServiceAccount(),
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});
const sheets = google.sheets({ version: "v4", auth });

const spreadsheet = await sheets.spreadsheets.get({
  spreadsheetId,
  fields: "sheets.properties.sheetId,sheets.properties.title",
});

const worksheet = spreadsheet.data.sheets?.find((sheet) => sheet.properties?.title === sheetName);
const sheetId = worksheet?.properties?.sheetId;

if (sheetId === undefined || sheetId === null) {
  throw new Error(`Worksheet not found: ${sheetName}`);
}

const existing = await sheets.spreadsheets.values.get({
  spreadsheetId,
  range: sheetRange(sheetName, "A1:J1"),
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
  range: sheetRange(sheetName, "A1:J1"),
  valueInputOption: "USER_ENTERED",
  requestBody: {
    values: [header],
  },
});

console.log(`Sheet header is ready: ${sheetName}`);
