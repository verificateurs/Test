// No SMTP provider configured in .env — logs the message instead.
// Callers depend only on `sendMail`, so swapping in a real provider later
// (e.g. Resend, Nodemailer) only requires editing this file.

type SendMailInput = {
  to: string;
  subject: string;
  text: string;
};

export async function sendMail({ to, subject, text }: SendMailInput): Promise<void> {
  console.log(`[mail] to=${to} subject="${subject}"\n${text}`);
}
