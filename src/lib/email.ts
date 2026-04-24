import { Message, SMTPClient } from "emailjs";

export async function sendVerificationEmail(input: {
  to: string;
  token: string;
}) {
  const appUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  const verificationUrl = `${appUrl}/api/auth/verify-email?token=${input.token}`;

  if (!process.env.SMTP_HOST) {
    console.log("[email verification]", verificationUrl);
    return;
  }

  const port = Number(process.env.SMTP_PORT ?? 587);
  const client = new SMTPClient({
    host: process.env.SMTP_HOST,
    port,
    ssl: port === 465,
    tls: port !== 465,
    user: process.env.SMTP_USER || undefined,
    password: process.env.SMTP_PASS || undefined,
  });

  try {
    await client.sendAsync(
      new Message({
        from: process.env.SMTP_FROM ?? "AI Diet <no-reply@example.com>",
        to: input.to,
        subject: "AI 식단 분석 이메일 인증",
        text: `아래 링크를 열어 이메일 인증을 완료하세요.\n\n${verificationUrl}`,
        attachment: [
          {
            data: `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111">
        <h2>AI 식단 분석 이메일 인증</h2>
        <p>아래 버튼을 눌러 이메일 인증을 완료하세요.</p>
        <p>
          <a href="${verificationUrl}" style="display:inline-block;background:#111827;color:#fff;padding:12px 18px;border-radius:8px;text-decoration:none">
            이메일 인증하기
          </a>
        </p>
        <p>버튼이 열리지 않으면 이 주소를 복사해 브라우저에 붙여넣으세요.</p>
        <p>${verificationUrl}</p>
      </div>
    `,
            alternative: true,
            contentType: "text/html",
          },
        ],
      }),
    );
  } finally {
    client.smtp.close();
  }
}
