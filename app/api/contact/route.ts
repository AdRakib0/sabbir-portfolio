import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "The contact form is not configured yet. Please email me directly at adrakib0@gmail.com." },
        { status: 503 }
      );
    }

    const body = await request.json();
    const name = typeof body.name === "string" ? body.name.trim().slice(0, 120) : "";
    const email = typeof body.email === "string" ? body.email.trim().slice(0, 254) : "";
    const topic = typeof body.topic === "string" ? body.topic.trim().slice(0, 120) : "General enquiry";
    const message = typeof body.message === "string" ? body.message.trim().slice(0, 5000) : "";

    if (!name || !email || !message || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Please provide a valid name, email address and message." }, { status: 400 });
    }

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Portfolio Contact <onboarding@resend.dev>",
        to: ["adrakib0@gmail.com"],
        reply_to: email,
        subject: `Portfolio enquiry: ${topic}`,
        text: `New message from your portfolio contact form\n\nName: ${name}\nEmail: ${email}\nEnquiry type: ${topic}\n\nMessage:\n${message}`,
      }),
    });

    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      console.error("Resend email error:", result);
      return NextResponse.json(
        { error: "Your message could not be sent right now. Please email adrakib0@gmail.com directly." },
        { status: 502 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Contact form error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again or email adrakib0@gmail.com directly." },
      { status: 500 }
    );
  }
}
