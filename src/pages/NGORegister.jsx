import { useState } from "react";
import { C, gradAccent, gradBanner, Btn, Input, StepBar } from "../shared";
import { store } from "../store";

const STEPS = ["Organisation", "Certificate Upload", "Capacity", "Review"];

// ── What certificates are accepted ────────────────────────────
const CERT_TYPES = [
  {
    id: "12a",
    label: "12A Certificate",
    description: "Income Tax exemption certificate issued by Income Tax Department, India",
    required: true,
    example: "Shows: Registration number starting with 'DIT(E)/' or 'CIT(E)/', organisation name, date of registration",
  },
  {
    id: "80g",
    label: "80G Certificate",
    description: "Tax deduction certificate for donors — proves legitimacy of NGO",
    required: false,
    example: "Shows: Order number, validity period, organisation PAN, commissioner's signature",
  },
  {
    id: "niti",
    label: "NITI Aayog Registration (Darpan)",
    description: "Government of India NGO registration on NGO Darpan portal",
    required: false,
    example: "Shows: Unique ID (TS/2020/0XXXXXX), organisation name, registration date",
  },
  {
    id: "trust",
    label: "Trust Deed / Society Registration",
    description: "Registration certificate from Registrar of Societies or Trust Deed",
    required: false,
    example: "Shows: Registration number, date, registrar's seal, objectives clause mentioning food/welfare",
  },
  {
    id: "fssai",
    label: "FSSAI License",
    description: "Food Safety and Standards Authority of India license (for food handling)",
    required: false,
    example: "Shows: License number (14-digit), FBO name, validity, address",
  },
];

// ── ML Verification using Claude API ─────────────────────────
async function verifyWithML(file, certType, orgName) {
  // Convert file to base64
  const toBase64 = (f) => new Promise((res, rej) => {
    const reader = new FileReader();
    reader.onload  = () => res(reader.result.split(",")[1]);
    reader.onerror = rej;
    reader.readAsDataURL(f);
  });

  const isImage = file.type.startsWith("image/");
  const isPDF   = file.type === "application/pdf";

  if (!isImage && !isPDF) {
    return { verified: false, confidence: 0, reason: "File must be an image (JPG/PNG) or PDF", flags: [] };
  }

  try {
    const base64 = await toBase64(file);
    const mediaType = isImage ? file.type : "application/pdf";

    const certInfo = CERT_TYPES.find(c => c.id === certType);

    const prompt = `You are an NGO certificate verification system for a food sharing platform in India.

The NGO claims to be: "${orgName}"
Certificate type claimed: "${certInfo?.label || certType}"

Analyse this document image and verify:
1. Is this a genuine Indian NGO/trust/charity certificate? (12A, 80G, trust deed, society registration, FSSAI, or similar)
2. Does the organisation name match or closely match "${orgName}"?
3. Is the document legible and does it have official stamps/signatures?
4. Are there any obvious signs of forgery or tampering?
5. What is the registration/certificate number visible?

Respond ONLY in this exact JSON format (no markdown, no extra text):
{
  "verified": true or false,
  "confidence": 0-100,
  "orgNameMatch": true or false,
  "certType": "what type of certificate this appears to be",
  "registrationNumber": "the registration number if visible, else null",
  "issuingAuthority": "the issuing authority name if visible, else null",
  "reason": "brief explanation in 1-2 sentences",
  "flags": ["list", "of", "any", "concerns"],
  "suggestion": "what to do if rejected"
}`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 600,
        messages: [{
          role: "user",
          content: [
            {
              type: isImage ? "image" : "document",
              source: {
                type: "base64",
                media_type: mediaType,
                data: base64,
              },
            },
            { type: "text", text: prompt },
          ],
        }],
      }),
    });

    const data = await response.json();
    const text = data.content?.[0]?.text || "{}";

    // Parse JSON response
    const clean = text.replace(/```json|```/g, "").trim();
    const result = JSON.parse(clean);
    return result;

  } catch (err) {
    console.error("ML verification error:", err);
    return {
      verified: false,
      confidence: 0,
      reason: "Verification service unavailable. Manual review will be done by our team.",
      flags: ["auto-verification-failed"],
      suggestion: "Our team will manually review your certificate within 24 hours.",
    };
  }
}

const empty = {
  orgName: "", email: "", password: "", phone: "",
  city: "Sriperumbadur",
  // Certificate uploads
  uploadedCerts: {},    // { certId: { file, fileName, result } }
  selectedCertType: "12a",
  // Capacity
  peopleCount: "", foodQuantity: "", pickupAddress: "",
  foodType: "veg", daysActive: "",
  message: "", urgency: "medium", type: "ngo",
};

export default function NGORegister({ navigate }) {
  const [step, setStep]           = useState(0);
  const [form, setForm]           = useState(empty);
  const [submitted, setSubmitted] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState(null);

  const set = e => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const detectType = (name) => {
    const n = name.toLowerCase();
    if (n.includes("temple") || n.includes("kovil") || n.includes("church") || n.includes("mosque")) return "temple";
    if (n.includes("hospital") || n.includes("clinic")) return "hospital";
    return "ngo";
  };

  // ── Handle file upload + ML verification ─────────────────
  const handleCertUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const certType = form.selectedCertType;
    setVerifying(true);
    setVerifyResult(null);

    // Immediately show file name
    setForm(f => ({
      ...f,
      uploadedCerts: {
        ...f.uploadedCerts,
        [certType]: { file, fileName: file.name, result: null, status: "verifying" },
      },
    }));

    // Run ML verification
    const result = await verifyWithML(file, certType, form.orgName || "NGO");
    setVerifyResult(result);

    setForm(f => ({
      ...f,
      uploadedCerts: {
        ...f.uploadedCerts,
        [certType]: { file, fileName: file.name, result, status: result.verified ? "verified" : "failed" },
      },
    }));
    setVerifying(false);
  };

  const hasVerifiedCert = Object.values(form.uploadedCerts).some(c => c.result?.verified);
  const hasPendingCert  = Object.values(form.uploadedCerts).some(c => c.status === "verifying");

  const handleSubmit = () => {
    const type = detectType(form.orgName);
    store.addNeedPost({
      ngoName:     form.orgName,
      type,
      message:     form.message || `${form.orgName} is registered and looking for food donations. We serve ${form.peopleCount || "?"} people daily.`,
      location:    form.city || "Sriperumbadur",
      lat:         12.9740, lng: 79.9460,
      urgency:     form.urgency || "medium",
      peopleCount: parseInt(form.peopleCount) || 0,
      contact:     form.phone,
    });
    setSubmitted(true);
  };

  const BackNav = () => (
    <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 40px", background: "rgba(255,255,255,0.97)", boxShadow: `0 2px 24px ${C.purple}18`, backdropFilter: "blur(12px)" }}>
      <Btn onClick={() => navigate("home")} style={{ display: "flex", alignItems: "center", gap: 8, background: C.purplePale, color: C.purple, padding: "9px 18px", borderRadius: 50, border: `1.5px solid ${C.purpleLight}`, fontSize: 14 }}>← Back to Home</Btn>
      <div onClick={() => navigate("home")} style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
        <div style={{ width: 32, height: 32, borderRadius: "50%", background: gradAccent, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🍱</div>
        <span style={{ fontFamily: "'Playfair Display',serif", fontSize: 18, fontWeight: 700, color: C.dark }}>FoodShare</span>
      </div>
      <Btn onClick={() => navigate("donor")} style={{ background: gradAccent, color: C.white, padding: "9px 20px", borderRadius: 50, fontSize: 14, boxShadow: `0 4px 16px ${C.pink}44` }}>Donate Food</Btn>
    </nav>
  );

  // ── Success screen ────────────────────────────────────────
  if (submitted) return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@400;500;600&display=swap');*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}html,body{font-family:'DM Sans',sans-serif;background:${C.bg};color:${C.dark}}`}</style>
      <BackNav />
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", paddingTop: 80, background: C.bg }}>
        <div style={{ textAlign: "center", maxWidth: 560, padding: "0 24px" }}>
          <div style={{ fontSize: 72, marginBottom: 20 }}>🎉</div>
          <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 36, fontWeight: 700, color: C.dark, marginBottom: 16 }}>Registration Successful!</h2>
          <p style={{ color: C.muted, fontSize: 16, lineHeight: 1.7, marginBottom: 24 }}>
            <strong style={{ color: C.purple }}>{form.orgName}</strong> is now registered.
            {hasVerifiedCert ? " Your certificate was verified by our ML system ✅" : " Our team will manually verify your certificate within 24 hours."}
            {" "}Confirmation sent to <strong style={{ color: C.pink }}>{form.email}</strong>.
          </p>
          <div style={{ background: C.purplePale, border: `1px solid ${C.purpleLight}`, borderRadius: 16, padding: "18px 24px", marginBottom: 24, textAlign: "left" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.purple, marginBottom: 10 }}>What happens next?</div>
            {["Your need post appears on homepage live feed now", "Donors in your area can see your request", "You receive food donation alerts via SMS & email", "Accept donations from your dashboard"].map((s, i) => (
              <div key={i} style={{ display: "flex", gap: 10, marginBottom: 8, fontSize: 13, color: C.mid }}>
                <span style={{ color: C.pink, fontWeight: 700 }}>{i + 1}.</span>{s}
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
            <Btn onClick={() => navigate("home")} style={{ background: gradAccent, color: C.white, padding: "13px 28px", borderRadius: 50, fontSize: 15 }}>
              See it on homepage →
            </Btn>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@400;500;600&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        html,body{font-family:'DM Sans',sans-serif;background:${C.bg};color:${C.dark};overflow-x:hidden}
        input,textarea,select{width:100%;box-sizing:border-box}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}
        @keyframes slideIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        .slide-in{animation:slideIn .4s ease both}
      `}</style>
      <BackNav />

      <div style={{ minHeight: "100vh", paddingTop: 80, background: C.bg }}>
        <div style={{ background: gradBanner, padding: "48px 40px 80px", textAlign: "center" }}>
          <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: 3, color: "rgba(255,255,255,0.7)", textTransform: "uppercase" }}>Join as receiver</span>
          <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: "clamp(28px,4vw,44px)", fontWeight: 700, color: C.white, marginTop: 10 }}>NGO / Temple Registration</h1>
          <p style={{ color: "rgba(255,255,255,0.75)", marginTop: 10, fontSize: 16 }}>Your certificate is verified by ML — appear on the live feed instantly</p>
        </div>

        <div style={{ maxWidth: 680, margin: "-48px auto 60px", padding: "0 24px" }}>
          <div style={{ background: C.white, borderRadius: 24, padding: "40px 48px", boxShadow: `0 24px 64px ${C.purple}18` }}>
            <StepBar steps={STEPS} current={step} />

            {/* ── STEP 0: Organisation ── */}
            {step === 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: 22, fontWeight: 700, color: C.dark }}>Organisation details</h3>
                <Input label="Organisation / NGO name" name="orgName" value={form.orgName} onChange={set} placeholder="e.g. Hope Foundation" required />
                <Input label="Official email address" type="email" name="email" value={form.email} onChange={set} placeholder="contact@hope.org" required />
                <Input label="Password" type="password" name="password" value={form.password} onChange={set} placeholder="Create a strong password" required />
                <Input label="Phone number" type="tel" name="phone" value={form.phone} onChange={set} placeholder="+91 98765 43210" required />
                <Input label="City / Area" name="city" value={form.city} onChange={set} placeholder="Kanchipuram or Sriperumbadur" required />
                <Btn onClick={() => setStep(1)} disabled={!form.orgName || !form.email || !form.password || !form.phone}
                  style={{ background: gradAccent, color: C.white, padding: "14px", borderRadius: 12, fontSize: 15, marginTop: 8 }}>
                  Continue →
                </Btn>
              </div>
            )}

            {/* ── STEP 1: Certificate Upload + ML Verification ── */}
            {step === 1 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: 22, fontWeight: 700, color: C.dark }}>Certificate verification</h3>

                {/* What certificates are accepted */}
                <div style={{ background: C.purplePale, borderRadius: 14, padding: "16px 18px", border: `1px solid ${C.purpleLight}66` }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: C.purple, marginBottom: 12 }}>📋 Accepted certificates (upload at least one)</div>
                  {CERT_TYPES.map(cert => (
                    <div key={cert.id} style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 10, padding: "8px 10px", borderRadius: 10, background: form.uploadedCerts[cert.id]?.status === "verified" ? "#E8F5E9" : C.white, border: `1px solid ${form.uploadedCerts[cert.id]?.status === "verified" ? "#A5D6A7" : C.purpleLight + "33"}` }}>
                      <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>
                        {form.uploadedCerts[cert.id]?.status === "verified" ? "✅" : form.uploadedCerts[cert.id]?.status === "failed" ? "❌" : cert.required ? "🔴" : "⚪"}
                      </span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: C.dark }}>{cert.label} {cert.required && <span style={{ color: C.pink, fontWeight: 700 }}>*required</span>}</div>
                        <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{cert.description}</div>
                        <div style={{ fontSize: 10, color: C.muted, marginTop: 3, fontStyle: "italic" }}>Example: {cert.example}</div>
                        {form.uploadedCerts[cert.id]?.status === "verified" && (
                          <div style={{ fontSize: 11, color: "#2E7D32", fontWeight: 600, marginTop: 4 }}>
                            ✅ Verified · Confidence: {form.uploadedCerts[cert.id].result?.confidence}% · Reg: {form.uploadedCerts[cert.id].result?.registrationNumber || "—"}
                          </div>
                        )}
                        {form.uploadedCerts[cert.id]?.status === "failed" && (
                          <div style={{ fontSize: 11, color: "#C62828", fontWeight: 600, marginTop: 4 }}>
                            ❌ {form.uploadedCerts[cert.id].result?.reason}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Upload section */}
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <label style={{ fontSize: 13, fontWeight: 600, color: C.mid }}>Select certificate type to upload</label>
                  <select name="selectedCertType" value={form.selectedCertType} onChange={set}
                    style={{ padding: "12px 16px", borderRadius: 12, border: `1.5px solid ${C.purpleLight}88`, fontSize: 14, fontFamily: "'DM Sans',sans-serif", color: C.dark, background: C.white, outline: "none", cursor: "pointer" }}>
                    {CERT_TYPES.map(c => (
                      <option key={c.id} value={c.id}>{c.label}{c.required ? " *" : ""}</option>
                    ))}
                  </select>

                  {/* Upload zone */}
                  <div style={{ border: `2px dashed ${verifying ? C.purple : C.purpleLight}`, borderRadius: 14, padding: "24px 20px", textAlign: "center", background: verifying ? C.purplePale : C.offWhite, transition: "all 0.3s" }}>
                    {verifying ? (
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 36, height: 36, borderRadius: "50%", border: `3px solid ${C.purpleLight}`, borderTopColor: C.pink, animation: "spin 1s linear infinite" }} />
                        <div style={{ fontSize: 13, fontWeight: 600, color: C.purple }}>🤖 ML model analysing certificate…</div>
                        <div style={{ fontSize: 12, color: C.muted }}>Checking authenticity, organisation name, registration number</div>
                      </div>
                    ) : (
                      <>
                        <div style={{ fontSize: 32, marginBottom: 8 }}>📄</div>
                        <div style={{ fontSize: 13, color: C.muted, marginBottom: 12 }}>Upload {CERT_TYPES.find(c => c.id === form.selectedCertType)?.label}</div>
                        <div style={{ fontSize: 11, color: C.muted, marginBottom: 16 }}>JPG, PNG, PDF · Max 5MB · Our ML model will verify it instantly</div>
                      </>
                    )}
                    <input type="file" id="certUpload" accept=".pdf,.jpg,.jpeg,.png" onChange={handleCertUpload} style={{ display: "none" }} />
                    {!verifying && (
                      <label htmlFor="certUpload" style={{ display: "inline-block", background: gradAccent, color: C.white, padding: "10px 24px", borderRadius: 50, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                        Choose file to verify
                      </label>
                    )}
                  </div>
                </div>

                {/* ML verification result card */}
                {verifyResult && !verifying && (
                  <div className="slide-in" style={{ borderRadius: 14, padding: "18px", border: `1.5px solid ${verifyResult.verified ? "#A5D6A7" : "#EF9A9A"}`, background: verifyResult.verified ? "#E8F5E9" : "#FFEBEE" }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: verifyResult.verified ? "#2E7D32" : "#C62828", marginBottom: 10 }}>
                      {verifyResult.verified ? "✅ Certificate verified by ML model" : "❌ Certificate could not be verified"}
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, fontSize: 12 }}>
                      {[
                        ["Confidence", `${verifyResult.confidence}%`],
                        ["Certificate type", verifyResult.certType || "—"],
                        ["Reg. number", verifyResult.registrationNumber || "—"],
                        ["Issuing authority", verifyResult.issuingAuthority || "—"],
                        ["Org name match", verifyResult.orgNameMatch ? "✅ Yes" : "❌ No"],
                      ].map(([k, v]) => (
                        <div key={k}>
                          <span style={{ color: "#666" }}>{k}: </span>
                          <span style={{ fontWeight: 600, color: "#333" }}>{v}</span>
                        </div>
                      ))}
                    </div>
                    <div style={{ marginTop: 10, fontSize: 12, color: "#555", lineHeight: 1.6 }}>{verifyResult.reason}</div>
                    {verifyResult.flags?.length > 0 && (
                      <div style={{ marginTop: 8, fontSize: 11, color: "#E65100" }}>⚠️ Flags: {verifyResult.flags.join(", ")}</div>
                    )}
                    {!verifyResult.verified && verifyResult.suggestion && (
                      <div style={{ marginTop: 8, fontSize: 12, color: "#555", fontStyle: "italic" }}>💡 {verifyResult.suggestion}</div>
                    )}
                  </div>
                )}

                {/* Uploaded certificates summary */}
                {Object.keys(form.uploadedCerts).length > 0 && (
                  <div style={{ background: C.offWhite, borderRadius: 12, padding: "12px 14px" }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: C.purple, marginBottom: 8 }}>Uploaded certificates</div>
                    {Object.entries(form.uploadedCerts).map(([certId, data]) => {
                      const cert = CERT_TYPES.find(c => c.id === certId);
                      return (
                        <div key={certId} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: `1px solid ${C.purpleLight}22`, fontSize: 12 }}>
                          <span style={{ color: C.mid }}>{cert?.label}</span>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <span style={{ color: C.muted, fontSize: 11 }}>{data.fileName}</span>
                            <span style={{ fontSize: 11, fontWeight: 700, color: data.status === "verified" ? "#2E7D32" : data.status === "failed" ? "#C62828" : C.muted }}>
                              {data.status === "verified" ? "✅ Verified" : data.status === "failed" ? "❌ Failed" : "⏳"}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Manual review note */}
                {!hasVerifiedCert && Object.keys(form.uploadedCerts).length > 0 && (
                  <div style={{ background: "#FFF8E1", border: "1px solid #FFD54F", borderRadius: 12, padding: "12px 14px", fontSize: 12, color: "#E65100", lineHeight: 1.6 }}>
                    <strong>⚠️ No certificate verified yet.</strong> You can still proceed — our team will manually review within 24 hours before activating your account.
                  </div>
                )}

                <div style={{ display: "flex", gap: 12 }}>
                  <Btn onClick={() => setStep(0)} style={{ flex: 1, background: C.purplePale, color: C.purple, padding: "14px", borderRadius: 12 }}>← Back</Btn>
                  <Btn onClick={() => setStep(2)} disabled={hasPendingCert || Object.keys(form.uploadedCerts).length === 0}
                    style={{ flex: 2, background: gradAccent, color: C.white, padding: "14px", borderRadius: 12 }}>
                    {hasPendingCert ? "⏳ Verifying…" : Object.keys(form.uploadedCerts).length === 0 ? "Upload at least one certificate" : "Continue →"}
                  </Btn>
                </div>
              </div>
            )}

            {/* ── STEP 2: Capacity ── */}
            {step === 2 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: 22, fontWeight: 700, color: C.dark }}>Capacity & requirements</h3>
                <Input label="Number of people you serve daily" type="number" name="peopleCount" value={form.peopleCount} onChange={set} placeholder="e.g. 150" required hint="Helps us match the right food quantity" />
                <Input label="Food quantity you need (in kg)" type="number" name="foodQuantity" value={form.foodQuantity} onChange={set} placeholder="e.g. 30" required />

                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{ fontSize: 13, fontWeight: 600, color: C.mid }}>Food type preference <span style={{ color: C.pink }}>*</span></label>
                  <div style={{ display: "flex", gap: 12 }}>
                    {[{ v: "veg", l: "🌿 Veg only" }, { v: "both", l: "🍱 Veg & Non-veg" }].map(opt => (
                      <div key={opt.v} onClick={() => setForm(f => ({ ...f, foodType: opt.v }))} style={{ flex: 1, padding: "12px 16px", borderRadius: 12, textAlign: "center", cursor: "pointer", border: `2px solid ${form.foodType === opt.v ? C.purple : `${C.purpleLight}66`}`, background: form.foodType === opt.v ? C.purplePale : C.white, color: form.foodType === opt.v ? C.purple : C.muted, fontWeight: 600, fontSize: 14, transition: "all 0.2s" }}>{opt.l}</div>
                    ))}
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{ fontSize: 13, fontWeight: 600, color: C.mid }}>Urgency level</label>
                  <div style={{ display: "flex", gap: 10 }}>
                    {[{ v: "high", l: "🔴 Urgent", bg: "#FFEBEE", c: "#C62828" }, { v: "medium", l: "🟡 Needed", bg: "#FFF8E1", c: "#E65100" }, { v: "low", l: "🟢 Request", bg: "#E8F5E9", c: "#2E7D32" }].map(opt => (
                      <div key={opt.v} onClick={() => setForm(f => ({ ...f, urgency: opt.v }))} style={{ flex: 1, padding: "10px 8px", borderRadius: 12, textAlign: "center", cursor: "pointer", border: `2px solid ${form.urgency === opt.v ? opt.c : "#eee"}`, background: form.urgency === opt.v ? opt.bg : C.white, color: form.urgency === opt.v ? opt.c : C.muted, fontWeight: 600, fontSize: 13, transition: "all 0.2s" }}>{opt.l}</div>
                    ))}
                  </div>
                </div>

                <Input label="Days active per week" type="number" name="daysActive" value={form.daysActive} onChange={set} placeholder="e.g. 7" required hint="How many days/week do you serve food?" />
                <Input label="Pickup / collection address" type="textarea" name="pickupAddress" value={form.pickupAddress} onChange={set} placeholder="Full address where donor delivers food" required />
                <Input label="Message for donors (shown on homepage)" type="textarea" name="message" value={form.message} onChange={set} placeholder="e.g. We need food for 150 people today — lunch and dinner." hint="This appears on the homepage live feed so donors can see your need" />

                <div style={{ display: "flex", gap: 12 }}>
                  <Btn onClick={() => setStep(1)} style={{ flex: 1, background: C.purplePale, color: C.purple, padding: "14px", borderRadius: 12 }}>← Back</Btn>
                  <Btn onClick={() => setStep(3)} disabled={!form.peopleCount || !form.foodQuantity || !form.pickupAddress || !form.daysActive}
                    style={{ flex: 2, background: gradAccent, color: C.white, padding: "14px", borderRadius: 12 }}>Continue →</Btn>
                </div>
              </div>
            )}

            {/* ── STEP 3: Review ── */}
            {step === 3 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: 22, fontWeight: 700, color: C.dark }}>Review & submit</h3>

                {/* Cert status banner */}
                <div style={{ borderRadius: 12, padding: "14px 16px", background: hasVerifiedCert ? "#E8F5E9" : "#FFF8E1", border: `1px solid ${hasVerifiedCert ? "#A5D6A7" : "#FFD54F"}`, fontSize: 13 }}>
                  {hasVerifiedCert
                    ? <><strong style={{ color: "#2E7D32" }}>✅ Certificate verified by ML</strong> — your account will be activated immediately after admin approval.</>
                    : <><strong style={{ color: "#E65100" }}>⏳ Manual verification pending</strong> — our team will review your certificate within 24 hours.</>
                  }
                </div>

                <div style={{ background: C.purplePale, borderRadius: 16, padding: "24px", border: `1px solid ${C.purpleLight}66` }}>
                  {[
                    ["Organisation", form.orgName], ["Email", form.email],
                    ["Phone", form.phone], ["City", form.city],
                    ["Certificates uploaded", Object.keys(form.uploadedCerts).map(id => CERT_TYPES.find(c => c.id === id)?.label).join(", ") || "—"],
                    ["ML verification", hasVerifiedCert ? "✅ Verified" : "⏳ Manual review"],
                    ["People served daily", form.peopleCount], ["Food needed (kg)", form.foodQuantity],
                    ["Food type", form.foodType === "veg" ? "Veg only" : "Veg & Non-veg"],
                    ["Urgency", form.urgency], ["Days active", `${form.daysActive} days/week`],
                    ["Pickup address", form.pickupAddress],
                  ].map(([k, v]) => (
                    <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "9px 0", borderBottom: `1px solid ${C.purpleLight}44`, fontSize: 14 }}>
                      <span style={{ color: C.muted, fontWeight: 500 }}>{k}</span>
                      <span style={{ color: C.dark, fontWeight: 600, textAlign: "right", maxWidth: "55%" }}>{v || "—"}</span>
                    </div>
                  ))}
                </div>

                <div style={{ background: C.pinkPale, borderRadius: 12, padding: "14px 16px", fontSize: 13, color: C.mid, lineHeight: 1.6, border: `1px solid ${C.pinkLight}88` }}>
                  <strong style={{ color: C.pink }}>⚠️ Note:</strong> You agree to accept food only once per day. The system automatically skips you if already served today — ensuring fair distribution.
                </div>

                <div style={{ display: "flex", gap: 12 }}>
                  <Btn onClick={() => setStep(2)} style={{ flex: 1, background: C.purplePale, color: C.purple, padding: "14px", borderRadius: 12 }}>← Back</Btn>
                  <Btn onClick={handleSubmit} style={{ flex: 2, background: gradAccent, color: C.white, padding: "14px", borderRadius: 12, boxShadow: `0 6px 24px ${C.pink}44` }}>
                    ✅ Submit & go live on homepage
                  </Btn>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </>
  );
}
