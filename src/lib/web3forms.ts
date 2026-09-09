const ACCESS_KEY = import.meta.env.VITE_WEB3FORMS_ACCESS_KEY;

export const isContactFormConfigured = Boolean(ACCESS_KEY);

export async function sendContactMessage(input: {
  name: string;
  email: string;
  company?: string;
  message: string;
  subject?: string;
}): Promise<void> {
  if (!ACCESS_KEY) {
    throw new Error(
      "Contact form isn't configured for this deployment. Email us directly and we'll get back to you.",
    );
  }
  const res = await fetch("https://api.web3forms.com/submit", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      access_key: ACCESS_KEY,
      from_name: "CorvusDP contact form",
      subject: input.subject ?? `New CorvusDP message from ${input.name}`,
      name: input.name,
      email: input.email,
      company: input.company ?? "",
      message: input.message,
    }),
  });
  const data = (await res.json()) as { success?: boolean; message?: string };
  if (!data.success) throw new Error(data.message || "Message failed to send.");
}
