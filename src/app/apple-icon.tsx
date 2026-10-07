import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", background: "#15171A", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <svg width="120" height="120" viewBox="0 0 32 32">
          <circle cx="15" cy="17" r="8.6" fill="none" stroke="#fff" strokeWidth="2.6" />
          <path d="M11 17.4l3 3L26 8.5" fill="none" stroke="#E5579E" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    ),
    size,
  );
}
