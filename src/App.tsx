import { FormEvent, useState } from "react";

const SUBMIT_ENDPOINT = "/api/submit";

const salesPhone = "010-5828-9130";
const officePhone = "043-236-6828";
const hqMobile = "010-8844-7829";
const email = "shsmart@hanmail.net";

const dogImage = "/images/karrot-dog.webp";
const swabImage = "/images/swab-banner.webp";
const dnaImage = "/images/dna-banner.webp";
const labImage = "/images/lab.webp";

const quickBenefits = ["당근 광고 전용 10만원", "집에서 1분 채취", "본사 담당자 상담"];

const knowItems = [
  ["질병", "녹내장·관절염 등 건강 경향"],
  ["성격", "분리불안·식탐 등 타고난 기질"],
  ["방식", "아프지 않은 구강 면봉 검사"],
];

const processSteps = [
  ["1", "상담 신청", "이름과 연락처만 남기면 됩니다."],
  ["2", "키트 수령", "택배로 받은 면봉을 볼 안쪽에 문지릅니다."],
  ["3", "결과 확인", "리포트와 생활관리 포인트를 안내받습니다."],
];

const trustItems = ["2007년 설립", "유전자 검사기관 신고", "특허 3건 보유", "기업부설연구소 인증"];

const faqs = [
  ["정말 집에서 할 수 있나요?", "네. 전용 면봉으로 볼 안쪽을 약 30초 문지른 뒤 반송하면 됩니다."],
  ["10만원 혜택은 어떤 검사인가요?", "반려견 성격 및 질병 예측 유전자 검사 광고 전용 상담 혜택입니다. 최종 항목은 담당자가 확인합니다."],
  ["검사 결과가 진단인가요?", "아니요. 유전적 경향을 보는 참고 정보이며, 진단과 치료는 동물병원 상담이 필요합니다."],
];

type SubmitStatus = "idle" | "submitting" | "success" | "error";

function App() {
  const [status, setStatus] = useState<SubmitStatus>("idle");
  const [showPrivacy, setShowPrivacy] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);
    const phone = `010-${formData.get("phoneMiddle")}-${formData.get("phoneLast")}`;

    const payload = {
      submittedAt: new Date().toISOString(),
      inquiryType: String(formData.get("inquiryType") || "구매 문의"),
      name: String(formData.get("name") || ""),
      phone,
      email: "",
      dogName: String(formData.get("dogName") || ""),
      breed: String(formData.get("breed") || ""),
      preferredTest: String(formData.get("preferredTest") || "상담 후 결정"),
      address: "",
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
        <a className="brand" href="#top">한국DNA밸리</a>
        <a className="nav-cta" href="#apply">상담 신청</a>
      </nav>

      <section className="hero" id="top">
        <div className="hero-copy-wrap">
          <p className="eyebrow">당근 광고 보고 오셨나요?</p>
          <h1>반려견 성격&질병 예측 유전자 검사</h1>
          <p className="hero-copy">아프지 않은 1분 양치질 검사. 집에서 키트로 시작하세요.</p>
          <div className="price-card" aria-label="광고 전용 특가">
            <span>광고 전용 혜택</span>
            <strong>12만원 → 10만원</strong>
            <small>상담 후 검사 항목 확정</small>
          </div>
          <div className="hero-actions">
            <a className="button button--primary" href="#apply">30초 상담 신청</a>
            <a className="button button--outline" href="tel:01058289130">전화 문의</a>
          </div>
          <div className="benefit-row" aria-label="핵심 혜택">
            {quickBenefits.map((item) => <span key={item}>{item}</span>)}
          </div>
        </div>
        <img className="hero-image" src={dogImage} alt="아이와 반려견이 마주보는 반려견 유전자 검사 광고 이미지" />
      </section>

      <section className="section visual-section" id="benefits">
        <div className="section-header compact">
          <p className="eyebrow">한 장 요약</p>
          <h2>미리 알면 대비할 수 있습니다</h2>
        </div>
        <div className="image-stack">
          <img src={swabImage} alt="구강 면봉 검사 키트 이미지" loading="lazy" />
          <img src={dnaImage} alt="DNA 분석 이미지" loading="lazy" />
        </div>
        <div className="know-grid">
          {knowItems.map(([title, body]) => (
            <article key={title}>
              <strong>{title}</strong>
              <p>{body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section section-soft" id="process">
        <div className="section-header compact">
          <p className="eyebrow">진행 방식</p>
          <h2>신청은 짧게, 안내는 담당자가</h2>
        </div>
        <ol className="process-list">
          {processSteps.map(([number, title, body]) => (
            <li key={title}>
              <span>{number}</span>
              <div>
                <h3>{title}</h3>
                <p>{body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="section trust-section" id="trust">
        <img src={labImage} alt="한국DNA밸리 연구소 이미지" loading="lazy" />
        <div>
          <p className="eyebrow">검사 신뢰</p>
          <h2>한국DNA밸리 본사 연구소 상담</h2>
          <div className="trust-grid">
            {trustItems.map((item) => <span key={item}>{item}</span>)}
          </div>
        </div>
      </section>

      <section className="section apply-section" id="apply">
        <div className="section-header compact">
          <p className="eyebrow">광고 전용 신청</p>
          <h2>이름·연락처만 남기세요</h2>
          <p>검사 종류, 키트 배송, 결제는 담당자가 전화로 안내합니다.</p>
        </div>
        <form className="apply-form" onSubmit={handleSubmit}>
          <input type="hidden" name="inquiryType" value="구매 문의" />
          <label>
            보호자 이름 *
            <input name="name" type="text" required placeholder="예: 김보호" autoComplete="name" />
          </label>
          <fieldset className="phone-fields">
            <legend>연락처 *</legend>
            <span>010</span>
            <input name="phoneMiddle" type="tel" required inputMode="numeric" minLength={3} maxLength={4} pattern="[0-9]{3,4}" placeholder="1234" autoComplete="tel-national" />
            <input name="phoneLast" type="tel" required inputMode="numeric" minLength={4} maxLength={4} pattern="[0-9]{4}" placeholder="5678" />
          </fieldset>
          <fieldset className="radio-group">
            <legend>희망 검사 *</legend>
            <label>
              <input name="preferredTest" type="radio" value="16종 검사" defaultChecked />
              <span><b>16종 검사</b><small>광고 특가 10만원</small></span>
            </label>
            <label>
              <input name="preferredTest" type="radio" value="6종 검사" />
              <span><b>6종 검사</b><small>상담 후 안내</small></span>
            </label>
            <label>
              <input name="preferredTest" type="radio" value="상담 후 결정" />
              <span><b>상담 후 결정</b><small>잘 모르겠어요</small></span>
            </label>
          </fieldset>
          <details className="optional-fields">
            <summary>반려견 정보 선택 입력</summary>
            <label>
              반려견 이름
              <input name="dogName" type="text" placeholder="예: 초코" />
            </label>
            <label>
              품종
              <input name="breed" type="text" placeholder="예: 말티즈" />
            </label>
            <label>
              남길 말
              <textarea name="message" rows={3} placeholder="상담 가능한 시간 등을 남겨주세요" />
            </label>
          </details>
          <label className="consent">
            <input name="privacyConsent" type="checkbox" required />
            <span>
              [필수] 개인정보 수집·이용 동의
              <button type="button" onClick={() => setShowPrivacy(true)}>보기</button>
            </span>
          </label>
          <label className="consent">
            <input name="geneticConsent" type="checkbox" required />
            <span>[필수] 유전정보 처리 안내 확인</span>
          </label>
          <button className="button button--primary submit-button" type="submit">
            {status === "submitting" ? "신청 중..." : "광고 특가 상담 신청"}
          </button>
          {status === "success" && <div className="submit-note" role="status">신청 완료! 담당자가 1~2 영업일 내 연락드립니다.</div>}
          {status === "error" && <div className="submit-note submit-note--error" role="status">전송 문제가 발생했습니다. 전화 상담으로 문의해 주세요.</div>}
        </form>
      </section>

      <section className="section faq-section" id="faq">
        <div className="section-header compact">
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
        본 검사는 유전적 경향을 보는 참고 정보이며 수의학적 진단·처방을 대체하지 않습니다. 개인정보와 유전정보는 동의 목적 내에서만 처리합니다.
      </section>

      <footer>
        <strong>한국DNA밸리</strong>
        <p>대표자: 박상호 | 사업자번호: 403-09-85050</p>
        <p>충청북도 청주시 오송읍 오송생명 1로 194-41 충북C&V센터 기업연구관II 504·505호</p>
        <p>전화: <a href="tel:0432366828">{officePhone}</a> / <a href="tel:01088447829">{hqMobile}</a></p>
        <p>이메일: {email}</p>
        <p><a href="/privacy.html">개인정보처리방침</a></p>
      </footer>

      <div className="sticky-cta" aria-label="하단 고정 상담 버튼">
        <a href="tel:01058289130">전화</a>
        <a href="#apply">30초 신청</a>
      </div>

      {showPrivacy && (
        <div className="modal-backdrop" onClick={() => setShowPrivacy(false)}>
          <section className="modal" role="dialog" aria-modal="true" aria-label="개인정보 수집 이용 동의" onClick={(event) => event.stopPropagation()}>
            <h2>개인정보 수집·이용 동의</h2>
            <p>수집항목: 이름, 연락처, 반려견 정보</p>
            <p>수집목적: 검사 상담, 신청 안내, 키트 및 결과 안내</p>
            <p>보유기간: 상담 및 검사 업무 완료 후 3년</p>
            <button className="button button--primary" onClick={() => setShowPrivacy(false)}>확인</button>
          </section>
        </div>
      )}
    </main>
  );
}

export default App;
