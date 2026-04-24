import { FormEvent, useEffect, useRef, useState } from "react";

const SUBMIT_ENDPOINT = "/api/submit";

const salesPhone = "010-5828-9130";
const officePhone = "043-236-6828";
const hqMobile = "010-8844-7829";
const email = "shsmart@hanmail.net";

const swabImage = "/images/swab-banner.webp";
const dnaImage = "/images/dna-banner.webp";
const labImage = "/images/lab.webp";

const trustBadges = [
  "특허 보유",
  "2007년 설립",
  "정보보호 안내",
];

const testTypes = [
  {
    title: "16종 검사",
    body: "녹내장, 관절염, 비만, 아토피, 분리불안 등 폭넓은 항목의 유전적 경향을 확인하는 패키지입니다.",
  },
  {
    title: "6종 검사",
    body: "진행성 망막 위축증, 퇴행성 골수염, 고관절이형성증 등 핵심 항목을 선별한 패키지입니다.",
  },
];

const pricingOptions = [
  {
    name: "16종 검사",
    price: "100,000원",
    description: "폭넓은 유전 경향을 확인하고 싶은 보호자에게 적합합니다.",
  },
  {
    name: "6종 검사",
    price: "상담 후 안내",
    description: "핵심 항목 중심으로 확인하고 싶은 경우 상담 후 안내합니다.",
  },
];

const recommendations = [
  "반려견의 유전적 경향과 생활관리 방향을 미리 상담받고 싶은 보호자",
  "16종과 6종 중 어떤 검사가 맞는지 담당자와 확인하고 싶은 보호자",
  "키트 발송, 채취, 결과 리포트 확인까지 한 번에 안내받고 싶은 보호자",
];

const processSteps = [
  ["📋", "검사 신청", "아래 폼을 작성하시면 담당자가 직접 연락드립니다"],
  ["📞", "담당자 상담", "검사 항목, 절차, 비용을 안내해드립니다"],
  ["📦", "키트 수령", "택배로 구강 채취 전용 키트를 수령합니다"],
  ["📬", "채취 후 반송", "면봉으로 볼 안쪽을 30초 문지르고 밀봉 반송합니다"],
  ["✅", "결과 리포트 확인", "본인 확인 후 전자 또는 서면 결과 리포트를 제공합니다"],
];

const history = [
  ["2007", "한국DNA밸리 설립"],
  ["2008", "유전자 검사기관 신고필증 취득 (질병관리본부)"],
  ["2015", "충북대학교 산학협력 기술이전계약 체결"],
  ["2016", "기업부설연구소 설립 및 인증"],
  ["2020", "한국DNA밸리 공장 설립"],
  ["2025", "반려견 유전자 검사 사업화 추진"],
];

const certificates = [
  ["📜", "공로상", "국민생활체육회 제2009-2824호"],
  ["🤝", "공동사업협정서", "(사)한국운동재활협회"],
  ["🔬", "특허 3건 보유", "펄모니스 외 등록특허"],
];

const faqs = [
  [
    "검사는 어떻게 신청하나요?",
    "아래 신청 폼을 작성하시면 담당자가 직접 연락드려 안내해 드립니다. 키트는 택배로 수령하시고, 구강 면봉으로 간편하게 채취 후 반송하시면 됩니다.",
  ],
  [
    "16종과 6종의 차이는 무엇인가요?",
    "16종은 녹내장, 관절염, 비만, 아토피, 분리불안 등 전체 항목을 검사하며, 6종은 진행성 망막 위축증, 퇴행성 골수염, 고관절이형성증 등 핵심 항목만 선별한 패키지입니다.",
  ],
  [
    "결과는 어떻게 받나요?",
    "검사 완료 후 보호자 본인 확인을 거쳐 전자 또는 서면 결과 리포트로 제공됩니다. 요약, 항목별 설명, 생활관리 정보가 포함됩니다.",
  ],
  [
    "결과로 상태를 확정할 수 있나요?",
    "본 검사는 유전적 소인을 파악하는 참고 정보이며, 수의학적 판단이나 처방을 대신하지 않습니다. 이상 소견이 있을 경우 동물병원 상담을 권장합니다.",
  ],
  [
    "반려견 유전정보는 안전하게 보관되나요?",
    "관련 법령에 따라 동의받은 목적과 범위 내에서만 이용하며, 암호화 등 안전조치를 적용합니다. 동의 철회 시 관련 법령 기준에 따라 파기합니다.",
  ],
  [
    "검체 채취가 어렵지 않나요?",
    "전용 키트의 면봉으로 볼 안쪽을 30초 문지르면 됩니다. 채취 전 2시간은 음식과 양치를 피해주세요.",
  ],
];

type SubmitStatus = "idle" | "submitting" | "success" | "error";

type DaumPostcodeData = {
  zonecode: string;
  roadAddress: string;
  jibunAddress: string;
  buildingName?: string;
};

declare global {
  interface Window {
    daum?: {
      Postcode: new (options: { oncomplete: (data: DaumPostcodeData) => void }) => {
        open: () => void;
        embed: (element: HTMLElement) => void;
      };
    };
  }
}

function App() {
  const [status, setStatus] = useState<SubmitStatus>("idle");
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showPostcode, setShowPostcode] = useState(false);
  const [addressLookupError, setAddressLookupError] = useState("");
  const postcodeRef = useRef<HTMLInputElement>(null);
  const addressRef = useRef<HTMLInputElement>(null);
  const addressDetailRef = useRef<HTMLInputElement>(null);
  const postcodeLayerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showPostcode) {
      return;
    }

    const renderPostcodeSearch = () => {
      if (!window.daum?.Postcode) {
        setAddressLookupError("주소 검색을 불러오지 못했습니다. 주소를 직접 입력해주세요.");
        setShowPostcode(false);
        return;
      }

      if (!postcodeLayerRef.current) {
        return;
      }

      new window.daum.Postcode({
        oncomplete: (data) => {
          const baseAddress = data.roadAddress || data.jibunAddress;
          const extraAddress = data.buildingName ? ` (${data.buildingName})` : "";

          if (postcodeRef.current) {
            postcodeRef.current.value = data.zonecode;
          }

          if (addressRef.current) {
            addressRef.current.value = `${baseAddress}${extraAddress}`;
          }

          addressDetailRef.current?.focus();
          setShowPostcode(false);
        },
      }).embed(postcodeLayerRef.current);
    };

    if (window.daum?.Postcode) {
      renderPostcodeSearch();
      return;
    }

    const existingScript = document.querySelector<HTMLScriptElement>(
      'script[data-daum-postcode="true"]',
    );

    if (existingScript) {
      existingScript.addEventListener("load", renderPostcodeSearch, { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = "https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js";
    script.async = true;
    script.dataset.daumPostcode = "true";
    script.onload = renderPostcodeSearch;
    script.onerror = () => {
      setAddressLookupError("주소 검색을 불러오지 못했습니다. 주소를 직접 입력해주세요.");
      setShowPostcode(false);
    };
    document.head.appendChild(script);
  }, [showPostcode]);

  const openPostcodeSearch = () => {
    setAddressLookupError("");
    setShowPostcode(true);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);
    const phone = `010-${formData.get("phoneMiddle")}-${formData.get("phoneLast")}`;
    const address = [
      formData.get("postcode"),
      formData.get("address"),
      formData.get("addressDetail"),
    ]
      .filter(Boolean)
      .join(" ");

    const payload = {
      submittedAt: new Date().toISOString(),
      inquiryType: String(formData.get("inquiryType") || ""),
      name: String(formData.get("name") || ""),
      phone,
      email: String(formData.get("email") || ""),
      dogName: String(formData.get("dogName") || ""),
      breed: String(formData.get("breed") || ""),
      preferredTest: String(formData.get("preferredTest") || ""),
      address,
      message: String(formData.get("message") || ""),
    };

    setStatus("submitting");

    try {
      const response = await fetch(SUBMIT_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Failed to submit lead.");
      }

      setStatus("success");
      form.reset();
    } catch {
      setStatus("error");
    }
  };

  return (
    <main>
      <nav className="site-nav" aria-label="주요 메뉴">
        <a className="brand" href="#top">
          한국DNA밸리
        </a>
        <div>
          <a href="#tests">검사</a>
          <a href="#process">절차</a>
          <a href="#apply">신청</a>
          <a href="#faq">FAQ</a>
        </div>
      </nav>

      <section className="hero" id="top">
        <div className="hero-content">
          <p className="eyebrow">한국DNA밸리 PET 16종 / 6종</p>
          <h1>
            <span>반려견 DNA 검사,</span>
            <span>상담으로 쉽게 시작하세요</span>
          </h1>
          <p className="hero-copy">16종/6종 중 우리 아이에게 맞는 항목을 안내합니다.</p>
          <div className="hero-info" aria-label="핵심 안내">
            <span>상담 후 검사 선택</span>
            <span>키트 택배 발송</span>
            <span>결과 리포트 제공</span>
          </div>
          <div className="trust-badges" aria-label="신뢰 배지">
            {trustBadges.map((badge) => (
              <span key={badge}>{badge}</span>
            ))}
          </div>
          <div className="hero-actions">
            <a className="button button--primary" href="#apply">
              지금 신청하기
            </a>
            <a className="button button--outline" href="tel:01058289130">
              전화 상담 {salesPhone}
            </a>
          </div>
        </div>
        <div className="hero-illustration" aria-hidden="true">
          <div className="dna-strand">
            <span />
            <span />
            <span />
            <span />
          </div>
          <div className="dog-mark">
            <span />
            <span />
            <span />
            <span />
            <b />
          </div>
          <div className="report-card">
            <strong>PET DNA</strong>
            <small>16종 / 6종 검사 상담</small>
          </div>
        </div>
      </section>

      <section className="section" id="tests">
        <div className="section-header">
          <p className="eyebrow">검사종류</p>
          <h2>16종 / 6종 중 상담 후 선택</h2>
          <p>검사 항목 선택이 어렵다면 담당자 상담 후 결정하셔도 됩니다.</p>
        </div>
        <div className="test-grid">
          {testTypes.map((item) => (
            <article className="card" key={item.title}>
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </article>
          ))}
        </div>
        <div className="pricing-panel" aria-label="검사 옵션 가격">
          <div className="pricing-panel-header">
            <strong>검사 옵션</strong>
            <span>신청 전 담당자가 최종 확인합니다</span>
          </div>
          <div className="pricing-options">
            {pricingOptions.map((option) => (
              <article key={option.name}>
                <div>
                  <h3>{option.name}</h3>
                  <p>{option.description}</p>
                </div>
                <strong>{option.price}</strong>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section section-soft">
        <div className="section-header">
          <p className="eyebrow">추천대상</p>
          <h2>이런 보호자에게 적합합니다</h2>
        </div>
        <div className="recommend-list">
          {recommendations.map((item) => (
            <article key={item}>
              <span>✓</span>
              <p>{item}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section" id="process">
        <ImageBanner
          src={swabImage}
          alt="반려견 유전자 검사 구강 면봉 채취 키트"
          title="검사 신청 방법"
          tone="blue"
        />
        <div className="section-header">
          <p className="eyebrow">신청프로세스</p>
          <h2>신청부터 결과 리포트까지</h2>
        </div>
        <ol className="process-list">
          {processSteps.map(([icon, title, body]) => (
            <li key={title}>
              <span className="step-icon" aria-hidden="true">
                {icon}
              </span>
              <div>
                <h3>{title}</h3>
                <p>{body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="section">
        <ImageBanner
          src={dnaImage}
          alt="DNA 이중나선 분자 구조 유전자 분석"
          title="상담 및 결과 확인"
          tone="dark"
        />
      </section>

      <section className="section trust-section" id="trust">
        <img
          className="trust-bg"
          src={labImage}
          alt="한국DNA밸리 생명공학 연구소"
          loading="lazy"
        />
        <div className="section-header">
          <p className="eyebrow">회사 신뢰</p>
          <h2>한국DNA밸리를 믿을 수 있는 이유</h2>
        </div>
        <div className="history-list">
          {history.map(([year, text]) => (
            <article key={year}>
              <strong>{year}</strong>
              <p>{text}</p>
            </article>
          ))}
        </div>
        <div className="cert-grid">
          {certificates.map(([icon, title, body]) => (
            <article className="card" key={title}>
              <b>{icon}</b>
              <h3>{title}</h3>
              <p>{body}</p>
            </article>
          ))}
        </div>
        <blockquote>
          <p>
            "최첨단 생명공학분야의 첨병, 한국DNA밸리입니다. DNA 및 유전체
            분석기술의 노하우를 바탕으로 유전자 검사를 통한 맞춤 건강관리
            사업을 운영하고 있습니다."
          </p>
          <cite>대표 박상호</cite>
        </blockquote>
      </section>

      <section className="section" id="apply">
        <div className="section-header">
          <p className="eyebrow">검사 신청</p>
          <h2>담당자가 직접 연락드립니다</h2>
          <p>신청 정보는 담당자 확인용 Google Sheet에 적재됩니다.</p>
        </div>
        <form className="apply-form" onSubmit={handleSubmit}>
          <label>
            문의 유형 *
            <select name="inquiryType" required defaultValue="">
              <option value="" disabled>
                선택
              </option>
              <option value="구매 문의">구매 문의</option>
              <option value="구매 신청">구매 신청</option>
              <option value="기타">기타</option>
            </select>
          </label>
          <label>
            보호자 이름 *
            <input name="name" type="text" required placeholder="보호자 성함" />
          </label>
          <fieldset className="phone-fields">
            <legend>연락처 *</legend>
            <span>010</span>
            <input
              name="phoneMiddle"
              type="tel"
              required
              inputMode="numeric"
              minLength={3}
              maxLength={4}
              pattern="[0-9]{3,4}"
              placeholder="1234"
            />
            <input
              name="phoneLast"
              type="tel"
              required
              inputMode="numeric"
              minLength={4}
              maxLength={4}
              pattern="[0-9]{4}"
              placeholder="5678"
            />
          </fieldset>
          <label>
            이메일
            <input name="email" type="email" placeholder="example@email.com" />
          </label>
          <label>
            반려견 이름
            <input name="dogName" type="text" placeholder="예: 초코" />
          </label>
          <label>
            반려견 품종
            <input name="breed" type="text" placeholder="예: 말티즈, 푸들" />
          </label>
          <fieldset className="radio-group">
            <legend>희망 검사 항목 *</legend>
            <label>
              <input name="preferredTest" type="radio" value="16종 검사" required />
              <span>
                16종 검사
                <b>100,000원</b>
              </span>
            </label>
            <label>
              <input name="preferredTest" type="radio" value="6종 검사" />
              <span>
                6종 검사
                <b>상담 후 안내</b>
              </span>
            </label>
            <label>
              <input name="preferredTest" type="radio" value="상담 후 결정" />
              <span>
                상담 후 결정
                <b>담당자 확인</b>
              </span>
            </label>
          </fieldset>
          <div className="address-fields">
            <p>주소 <span>키트 발송용 선택 입력</span></p>
            <div className="postcode-row">
              <input
                ref={postcodeRef}
                name="postcode"
                type="text"
                inputMode="numeric"
                placeholder="우편번호"
                aria-label="우편번호"
              />
              <button type="button" onClick={openPostcodeSearch}>
                우편번호 찾기
              </button>
            </div>
            <input
              ref={addressRef}
              name="address"
              type="text"
              placeholder="주소"
              aria-label="주소"
            />
            <input
              ref={addressDetailRef}
              name="addressDetail"
              type="text"
              placeholder="상세주소"
              aria-label="상세주소"
            />
            {addressLookupError && <small className="field-note">{addressLookupError}</small>}
          </div>
          <label>
            문의 내용
            <textarea name="message" rows={4} placeholder="문의 내용을 적어주세요" />
          </label>
          <label className="consent">
            <input name="privacyConsent" type="checkbox" required />
            <span>
              [필수] 개인정보 수집·이용 동의
              <button type="button" onClick={() => setShowPrivacy(true)}>
                자세히보기
              </button>
            </span>
          </label>
          <label className="consent">
            <input name="geneticConsent" type="checkbox" required />
            <span>
              [필수] 유전정보 처리 사전 안내 확인: 본 검사는 수의학적 판단을
              대신하지 않는 참고 정보이며, 결과는 품종·환경·식이 등에 따라
              해석이 달라질 수 있습니다.
            </span>
          </label>
          <button className="button button--primary submit-button" type="submit">
            {status === "submitting" ? "신청 중..." : "검사 신청하기"}
          </button>
          {status === "success" && (
            <div className="submit-note" role="status">
              신청이 완료되었습니다. 담당자가 1~2 영업일 내 연락드립니다 🐾
            </div>
          )}
          {status === "error" && (
            <div className="submit-note submit-note--error" role="status">
              전송 중 문제가 발생했습니다. 전화 상담으로 문의해 주세요.
            </div>
          )}
        </form>
      </section>

      <section className="section faq-section" id="faq">
        <div className="section-header">
          <p className="eyebrow">FAQ</p>
          <h2>자주 묻는 질문</h2>
        </div>
        <div className="faq-list">
          {faqs.map(([question, answer]) => (
            <details key={question}>
              <summary>{question}</summary>
              <p>{answer}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="legal-note">
        본 서비스는 「생명윤리 및 안전에 관한 법률」 및 관련 법령을 준수하여
        운영됩니다. 검사 결과는 수의학적 판단·처방을 대체하지 않는 참고
        정보입니다. 유전정보 및 개인정보는 수집 동의 목적 내에서만 처리되며,
        제3자에게 무단 제공하지 않습니다.
      </section>

      <footer>
        <strong>한국DNA밸리</strong>
        <p>회사명: 한국DNA밸리 | 대표자: 박상호 | 사업자번호: 403-09-85050</p>
        <p>
          주소: 충청북도 청주시 오송읍 오송생명 1로 194-41 충북C&V센터
          기업연구관II 504·505호
        </p>
        <p>
          전화: <a href="tel:0432366828">{officePhone}</a> /{" "}
          <a href="tel:01088447829">{hqMobile}</a>
        </p>
        <p>이메일: {email}</p>
        <p>
          <a href="/privacy.html">개인정보처리방침</a>
        </p>
        <p>Copyright © 2026 한국DNA밸리. All Rights Reserved.</p>
      </footer>

      {showPostcode && (
        <div className="modal-backdrop" onClick={() => setShowPostcode(false)}>
          <section
            className="postcode-modal"
            role="dialog"
            aria-modal="true"
            aria-label="우편번호 찾기"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="postcode-modal-header">
              <strong>우편번호 찾기</strong>
              <button type="button" onClick={() => setShowPostcode(false)} aria-label="닫기">
                ×
              </button>
            </div>
            <div ref={postcodeLayerRef} className="postcode-layer" />
          </section>
        </div>
      )}

      {showPrivacy && (
        <div className="modal-backdrop" onClick={() => setShowPrivacy(false)}>
          <section
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-label="개인정보 수집 이용 동의"
            onClick={(event) => event.stopPropagation()}
          >
            <h2>개인정보 수집·이용 동의</h2>
            <p>
              수집항목: 이름, 연락처, 이메일, 주소, 반려견 정보
              <br />
              수집목적: 검사 신청 접수 및 안내, 결과 전달
              <br />
              보유기간: 검사 완료 후 3년
            </p>
            <button className="button button--primary" onClick={() => setShowPrivacy(false)}>
              확인
            </button>
          </section>
        </div>
      )}
    </main>
  );
}

function ImageBanner({
  src,
  alt,
  title,
  tone,
}: {
  src: string;
  alt: string;
  title: string;
  tone: "blue" | "dark";
}) {
  const [failed, setFailed] = useState(false);

  return (
    <div className={`image-banner image-banner--${tone} ${failed ? "is-fallback" : ""}`}>
      {!failed && <img src={src} alt={alt} loading="lazy" onError={() => setFailed(true)} />}
      <span>{title}</span>
    </div>
  );
}

export default App;
