// ── Design tokens ─────────────────────────────────────────────
export const C = {
  pink:        "#E91E8C",
  pinkDark:    "#C2185B",
  pinkLight:   "#F8BBD9",
  pinkPale:    "#FDF0F7",
  purple:      "#7B2FBE",
  purpleDark:  "#4A148C",
  purpleLight: "#CE93D8",
  purplePale:  "#F3E8FF",
  dark:        "#1A0A2E",
  mid:         "#4A3560",
  muted:       "#9B8BAB",
  white:       "#FFFFFF",
  offWhite:    "#FAF7FF",
  bg:          "#FDF8FF",
  success:     "#2E7D32",
  successPale: "#E8F5E9",
};

export const gradAccent  = `linear-gradient(135deg, ${C.pink}, ${C.purple})`;
export const gradBanner  = `linear-gradient(135deg, ${C.purple}, ${C.pink})`;
export const gradHero    = `linear-gradient(135deg, ${C.purpleDark}F0 0%, ${C.pink}CC 60%, ${C.pinkDark}99 100%)`;

// ── Reusable Button ────────────────────────────────────────────
export function Btn({ children, style = {}, onClick, type = "button", disabled = false }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        cursor: disabled ? "not-allowed" : "pointer",
        fontFamily: "'DM Sans', sans-serif",
        fontWeight: 600, fontSize: 15,
        border: "none", outline: "none",
        opacity: disabled ? 0.6 : 1,
        transition: "transform 0.18s, box-shadow 0.18s, opacity 0.18s",
        ...style,
      }}
      onMouseEnter={e => { if (!disabled) e.currentTarget.style.transform = "scale(1.03)"; }}
      onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; }}
    >
      {children}
    </button>
  );
}

// ── Shared Input ───────────────────────────────────────────────
export function Input({ label, type = "text", name, value, onChange, placeholder, required, accept, hint }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={{ fontSize: 13, fontWeight: 600, color: C.mid, letterSpacing: 0.3 }}>
        {label} {required && <span style={{ color: C.pink }}>*</span>}
      </label>
      {type === "file" ? (
        <div style={{
          border: `2px dashed ${C.purpleLight}`,
          borderRadius: 12, padding: "20px 16px",
          textAlign: "center", cursor: "pointer",
          background: C.purplePale,
          transition: "border-color 0.2s",
        }}
          onMouseEnter={e => e.currentTarget.style.borderColor = C.purple}
          onMouseLeave={e => e.currentTarget.style.borderColor = C.purpleLight}
        >
          <div style={{ fontSize: 28, marginBottom: 8 }}>📎</div>
          <div style={{ fontSize: 13, color: C.muted, marginBottom: 8 }}>
            {value ? `✅ ${value}` : "Click to upload or drag & drop"}
          </div>
          <input
            type="file" name={name} accept={accept}
            onChange={onChange} required={required}
            style={{ display: "none" }}
            id={`file-${name}`}
          />
          <label htmlFor={`file-${name}`} style={{
            background: gradAccent, color: C.white,
            padding: "8px 20px", borderRadius: 50,
            fontSize: 13, fontWeight: 600, cursor: "pointer",
          }}>Choose file</label>
        </div>
      ) : type === "textarea" ? (
        <textarea
          name={name} value={value} onChange={onChange}
          placeholder={placeholder} required={required}
          rows={3}
          style={{
            padding: "12px 16px", borderRadius: 12,
            border: `1.5px solid ${C.purpleLight}88`,
            fontSize: 15, fontFamily: "'DM Sans', sans-serif",
            color: C.dark, background: C.white,
            outline: "none", resize: "vertical",
            transition: "border-color 0.2s",
          }}
          onFocus={e => e.target.style.borderColor = C.purple}
          onBlur={e => e.target.style.borderColor = `${C.purpleLight}88`}
        />
      ) : (
        <input
          type={type} name={name} value={value}
          onChange={onChange} placeholder={placeholder} required={required}
          style={{
            padding: "12px 16px", borderRadius: 12,
            border: `1.5px solid ${C.purpleLight}88`,
            fontSize: 15, fontFamily: "'DM Sans', sans-serif",
            color: C.dark, background: C.white, outline: "none",
            transition: "border-color 0.2s",
          }}
          onFocus={e => e.target.style.borderColor = C.purple}
          onBlur={e => e.target.style.borderColor = `${C.purpleLight}88`}
        />
      )}
      {hint && <span style={{ fontSize: 12, color: C.muted }}>{hint}</span>}
    </div>
  );
}

// ── Navbar used across pages ───────────────────────────────────
export function Navbar({ navigate, scrolled = true }) {
  return (
    <nav style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
      display: "flex", justifyContent: "space-between", alignItems: "center",
      padding: "14px 40px",
      background: "rgba(255,255,255,0.97)",
      boxShadow: `0 2px 24px ${C.purple}18`,
      backdropFilter: "blur(12px)",
    }}>
      <div
        onClick={() => navigate("home")}
        style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}
      >
        <div style={{
          width: 36, height: 36, borderRadius: "50%",
          background: gradAccent,
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18,
        }}>🍱</div>
        <span style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: 20, fontWeight: 700, color: C.dark,
        }}>FoodShare</span>
      </div>
      <div style={{ display: "flex", gap: 12 }}>
        <Btn
          onClick={() => navigate("home")}
          style={{
            background: C.purplePale, color: C.purple,
            padding: "9px 22px", borderRadius: 50,
            border: `1.5px solid ${C.purpleLight}`,
          }}
        >Home</Btn>
        <Btn
          onClick={() => navigate("ngo")}
          style={{
            background: gradAccent, color: C.white,
            padding: "9px 22px", borderRadius: 50,
            boxShadow: `0 4px 18px ${C.pink}44`,
          }}
        >Register NGO</Btn>
      </div>
    </nav>
  );
}

// ── Step progress bar ──────────────────────────────────────────
export function StepBar({ steps, current }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 0, marginBottom: 40 }}>
      {steps.map((s, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", flex: i < steps.length - 1 ? 1 : 0 }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
            <div style={{
              width: 36, height: 36, borderRadius: "50%",
              background: i <= current ? gradAccent : `${C.purpleLight}44`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 14, fontWeight: 700,
              color: i <= current ? C.white : C.muted,
              transition: "all 0.3s",
            }}>{i < current ? "✓" : i + 1}</div>
            <span style={{ fontSize: 11, color: i <= current ? C.purple : C.muted, fontWeight: 600, whiteSpace: "nowrap" }}>{s}</span>
          </div>
          {i < steps.length - 1 && (
            <div style={{
              flex: 1, height: 2, margin: "0 8px", marginBottom: 18,
              background: i < current ? gradAccent : `${C.purpleLight}44`,
              transition: "background 0.3s",
            }} />
          )}
        </div>
      ))}
    </div>
  );
}
