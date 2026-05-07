# CLAUDE.md — DNA Valley Landing Page Agent Guide

> Project-level instructions for Claude Code (and similar agents) working on this repo.
> Companion: `USER_GUIDE.md` (non-developer / ops handover doc).

---

## 1. Project at a Glance

- **Purpose**: Single-page Korean landing site for 한국DNA밸리 PET DNA test (16종) lead capture.
- **Stack**: Vite + React 19 + TypeScript. Tailwind is **not** used — vanilla CSS in `src/styles.css`.
- **Hosting**: Vercel, project `dna-valley` (id `prj_G21R4ptZy0YaN7Rqn6AgudNiMDsI`, team `team_EXr797OJ38qoMD1uvijwkxUd`).
- **Lead destination**: Google Sheets via `api/submit.ts` (Vercel serverless function). Spreadsheet id default `1aZud4gJTC0l1IX-FaZuV_Q-WfX7fzCMH_WwqpliW7lU`.
- **Production domain**: `https://dna-valley.vercel.app`.
- **Source repo**: `https://github.com/mkt-jaehoon/DNA-VALLEY`, branch `main`. Auto-deploys on push.
- **Node**: 24.x (matches Vercel project).

---

## 2. Repository Layout

```
DNA/
├── api/submit.ts          # Vercel serverless lead handler (validate + Sheets append)
├── src/
│   ├── App.tsx            # All landing-page UI + form (single-component layout)
│   ├── main.tsx           # React mount
│   └── styles.css         # All styles, mobile-first, single file
├── public/
│   ├── images/            # webp banners (hero, swab, dna, lab)
│   └── privacy.html       # Standalone privacy page (plain HTML)
├── scripts/
│   ├── optimize-images.mjs
│   └── setup-sheet.mjs
├── IMG/                   # Reference assets uploaded by client (not served)
├── index.html             # Vite entry (dev) — references /src/main.tsx
├── dist/                  # Build output (gitignored, Vercel rebuilds on deploy)
├── package.json
├── vite.config.ts
├── tsconfig*.json
├── USER_GUIDE.md          # Non-dev ops guide
└── CLAUDE.md              # This file
```

`src/App.tsx` intentionally holds the entire page (hero, sections, form, footer, modals) as one component. Resist the urge to split it into many files unless the user asks — past sessions have rolled back over-eager refactors.

---

## 3. Single-Source-of-Truth Constants (top of `src/App.tsx`)

```ts
const SUBMIT_ENDPOINT = "/api/submit";
const salesPhone = "010-5828-9130";        // Hero CTA + footer
const email = "korea91300@naver.com";       // Footer email
```

Change these to update all phone/email locations at once. **Do not duplicate** numbers/emails as string literals elsewhere.

Other top-of-file arrays drive each section:

| Constant | Drives |
| --- | --- |
| `trustBadges` | Hero white pills |
| `testTypes` | "검사종류" cards |
| `pricingOptions` | Pricing panel cards |
| `recommendations` | "추천대상" cards |
| `processSteps` | "신청프로세스" 5-step list |
| `history` | 회사 연혁 list |
| `certificates` | 인증/특허 cards |
| `faqs` | FAQ accordion |

When editing one of these, also re-check:
- The `<form>` radio group (희망 검사 항목) — its values must remain a subset of `ALLOWED_TEST_TYPES` in `api/submit.ts`.
- The `index.html` `<meta name="description">` — keep in sync with site copy.

---

## 4. The 16-종 / 6-종 History (important context)

The page used to offer two products (16종, 6종). **2026-05-07: consolidated to 16종 only** at the client's request.

If asked to "add another product variant," update **all** of:
1. `testTypes` array
2. `pricingOptions` array
3. `<form>` radio group inside `apply-form`
4. `faqs` (add/edit comparison Q&A)
5. `recommendations` (if it references variant choice)
6. `api/submit.ts` → `ALLOWED_TEST_TYPES`
7. `index.html` `<meta name="description">`

A miss in step 6 silently rejects form submissions with HTTP 400.

---

## 5. Form → Sheets Contract

`POST /api/submit` payload (JSON):

```ts
{
  submittedAt: ISO8601 string,
  inquiryType: "구매 문의" | "구매 신청" | "기타",
  name: string,
  phone: "010-XXX(X)-XXXX",       // exactly this regex
  email: string,
  dogName: string,
  breed: string,
  preferredTest: <member of ALLOWED_TEST_TYPES>,
  address: string,
  message: string,
}
```

Sheet row order (columns A..J): submittedAt(formatted KR date) | inquiryType | name | phone | email | dogName | breed | preferredTest | address | message.

If column order changes in the sheet, mirror the change in `api/submit.ts` `values` array — they must match positionally.

Required env on Vercel:
- `GOOGLE_SERVICE_ACCOUNT_JSON` — full service-account JSON as a string
- `GOOGLE_SPREADSHEET_ID` (optional override)
- `GOOGLE_SHEET_NAME` (optional override, default `시트1`)

---

## 6. Layout / Style Conventions

- **Mobile-first**, max width 480px until `min-width: 768px` breakpoint widens to 800px.
- Color palette is hard-coded in `styles.css` (`#071b3a`, `#0d47a1`, `#1a6fff`, `#ffb800`). Don't introduce a CSS-vars system unless asked.
- Spacing scale is implicit (8/12/14/16/18/20/24/28). Match nearby blocks rather than introducing new values.
- The hero uses `image-set()` with `/images/hero-mobile.webp` + `/images/hero-desktop.webp`. Replacing hero art = drop new files at the same paths.
- Korean text: `word-break: keep-all` is set globally for headings/paragraphs — keep it.
- The site is intentionally Korean-only. No i18n framework.

---

## 7. Build & Deploy

**Source of truth = git push to `main`.** Vercel auto-builds and replaces all production aliases.

```bash
git add <files>
git commit -m "<imperative summary>"
git push origin main
# Vercel build typically completes in 30s–2min
```

Verify deploy via Vercel MCP tools (`mcp__claude_ai_Vercel__list_deployments`, `get_deployment`) — look for `state: "READY"` and the matching `githubCommitSha`.

`dist/` is gitignored. Don't bother committing it. Vercel rebuilds from source.

### Local build pitfall (Windows + Korean path)
This repo lives at `C:\Users\ekssk\Desktop\김재훈\DNA`. Korean characters in the path crash Rollup's native binary on Node 24 with `STATUS_STACK_BUFFER_OVERRUN (0xC0000409)` after "29 modules transformed". **Symptom**: build silently dies, `dist/` never updates.

Workaround when local build is needed:
```bash
rm -rf /tmp/dna-build && cp -r "C:/Users/ekssk/Desktop/김재훈/DNA" /tmp/dna-build
cd /tmp/dna-build && rm -rf node_modules dist && npm install --silent && npm run build
cp -r /tmp/dna-build/dist "C:/Users/ekssk/Desktop/김재훈/DNA/dist"
```

For routine work, **skip local build entirely** — push and let Vercel build. Local `npm run dev` is fine (no native rollup path).

---

## 8. Editing Etiquette

- **Surgical changes only.** Don't refactor unrelated code, rename "for clarity," or restructure CSS while making a copy edit. The client has rolled back at least two over-eager redesigns (`Restore the prior landing experience`, `Restore the exact prior deployed page`).
- **Match existing style** in `App.tsx` even if you'd write it differently.
- **No new dependencies** without asking. Stack is intentionally lean (React + googleapis + sharp dev-only).
- **No `console.log` in committed code.**
- **Comments**: only when the *why* isn't obvious. The code is short — names should carry it.
- **Tests**: there's no test suite. Don't add one unsolicited. If the user asks for E2E, use Playwright.

---

## 9. Common Tasks Cheat Sheet

| Request | What to touch |
| --- | --- |
| Change phone number | `salesPhone` constant only |
| Change email | `email` constant only |
| Update footer address / 사업자번호 / 대표자 | `<footer>` JSX in `App.tsx` |
| Edit hero headline / subcopy | `<section className="hero">` JSX |
| Add/remove a FAQ | `faqs` array |
| Adjust pricing | `pricingOptions[].price` + radio `<b>` label |
| Swap hero image | overwrite `public/images/hero-{mobile,desktop}.webp` |
| Update privacy policy | `public/privacy.html` (raw HTML) |
| Change form columns | both `App.tsx` form fields **and** `api/submit.ts` payload + sheet append |
| Update meta description | `index.html` |

---

## 10. Decision Rules

1. **Ask before reshaping the page** (hero redesign, section reorder, layout overhaul). Past redesigns were rolled back.
2. **Don't change the Sheets column contract** unless the user explicitly approves — the operator may be reading those columns by hand.
3. **Don't disable RLS / form validation** on `api/submit.ts`. The phone regex and `ALLOWED_*` sets are deliberate.
4. **Korean copy stays Korean.** Don't translate or "internationalize" by default.
5. **Don't commit `silent-text-*.json`, `.env`, or anything matching `*service-account*.json`** — `.gitignore` blocks them; if one slips in, stop and rotate the key in Google Cloud Console.

---

## 11. When the User Says "사이트 안 들어가져"

Likely causes, in order:
1. **Local changes not pushed** — check `git status`. If staged or unstaged, push them; Vercel will rebuild.
2. **Latest Vercel deployment in `ERROR` state** — check `mcp__claude_ai_Vercel__list_deployments`, fix the failing build.
3. **Browser cache** — instruct user to hard-reload (Ctrl+Shift+R).
4. **Aliases not bound** — check `get_deployment.alias[]` includes `dna-valley.vercel.app`.

---

## 12. Useful References

- Vercel project ID: `prj_G21R4ptZy0YaN7Rqn6AgudNiMDsI`
- Vercel team ID: `team_EXr797OJ38qoMD1uvijwkxUd`
- Vercel dashboard: https://vercel.com/kimjaehuns-projects-584252bd/dna-valley
- GitHub: https://github.com/mkt-jaehoon/DNA-VALLEY
- Google Sheets default ID: `1aZud4gJTC0l1IX-FaZuV_Q-WfX7fzCMH_WwqpliW7lU`
- Client primary contact: 오세흔 팀장 (`nelover01@gmail.com`)
- Operator contact line displayed on site: 010-5828-9130
- Display email on site: korea91300@naver.com
