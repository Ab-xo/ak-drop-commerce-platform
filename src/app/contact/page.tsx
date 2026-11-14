"use client";

import { useActionState } from "react";
import { CheckCircle2, LoaderCircle, Mail, Send } from "lucide-react";
import { submitContactMessage, type ContactFormState } from "@/app/contact/actions";

const supportEmail = process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim() || "venoox20@gmail.com";
const initialState: ContactFormState = { status: "idle", message: "" };

export default function ContactPage() {
  const [state, formAction, isPending] = useActionState(submitContactMessage, initialState);

  return (
    <main className="min-h-screen py-20 md:py-28">
      <div className="container mx-auto max-w-6xl px-4 md:px-8">
        <header className="mb-10 max-w-2xl md:mb-14">
          <p className="mb-4 text-xs font-black uppercase tracking-[.25em] text-primary">
            Contact
          </p>
          <h1 className="mb-5 text-5xl font-black uppercase italic tracking-tighter sm:text-6xl">
            Get in <span className="text-primary">touch</span>
          </h1>
          <p className="max-w-xl text-base leading-relaxed text-foreground/60 md:text-lg">
            Have a question about AK Drop? Send us a note and we&apos;ll be happy
            to help.
          </p>
        </header>

        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-14">
          <section className="space-y-6 lg:pt-3">
            <div className="rounded-2xl border border-border bg-card p-5 md:p-6">
              <span className="mb-5 flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Mail size={20} />
              </span>
              <h2 className="text-lg font-bold">Email our team</h2>
              <a href={`mailto:${supportEmail}`} className="mt-2 inline-block break-all text-sm text-foreground/65 transition-colors hover:text-primary">
                {supportEmail}
              </a>
            </div>
            <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
              Send your message directly to our support team. We&apos;ll reply to
              the email address you provide.
            </p>
          </section>

          <form action={formAction} className="glass-card space-y-5 p-5 md:p-8">
            <div className="mb-1">
              <h2 className="text-2xl font-black tracking-tight">Send us a message</h2>
              <p className="mt-2 text-sm text-muted-foreground">Tell us what you need and we&apos;ll get back to you.</p>
            </div>
            <div aria-hidden="true" className="absolute -left-[10000px] top-auto size-px overflow-hidden">
              <label htmlFor="contact-company">Leave this field empty</label>
              <input id="contact-company" name="company" tabIndex={-1} autoComplete="off" />
            </div>
            <label htmlFor="contact-name" className="block text-sm font-semibold">
              Name
              <input id="contact-name" name="name" required minLength={2} maxLength={100} autoComplete="name" placeholder="Your name" className="mt-2 w-full rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none transition placeholder:text-muted-foreground/60 focus:border-primary focus:ring-2 focus:ring-primary/20" />
            </label>
            <label htmlFor="contact-email" className="block text-sm font-semibold">
              Email
              <input id="contact-email" type="email" name="email" required maxLength={254} autoComplete="email" placeholder="you@example.com" className="mt-2 w-full rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none transition placeholder:text-muted-foreground/60 focus:border-primary focus:ring-2 focus:ring-primary/20" />
            </label>
            <label htmlFor="contact-subject" className="block text-sm font-semibold">
              What can we help with?
              <input id="contact-subject" name="subject" required minLength={3} maxLength={120} placeholder="Order, product, delivery..." className="mt-2 w-full rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none transition placeholder:text-muted-foreground/60 focus:border-primary focus:ring-2 focus:ring-primary/20" />
            </label>
            <label htmlFor="contact-message" className="block text-sm font-semibold">
              Message
              <textarea id="contact-message" name="message" required minLength={10} maxLength={5000} rows={5} placeholder="How can we help?" className="mt-2 w-full resize-y rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none transition placeholder:text-muted-foreground/60 focus:border-primary focus:ring-2 focus:ring-primary/20" />
            </label>
            <button className="btn-primary inline-flex w-full items-center justify-center gap-2 sm:w-auto disabled:cursor-not-allowed disabled:opacity-60" type="submit" disabled={isPending}>
              {isPending ? <LoaderCircle size={17} className="animate-spin" /> : <Send size={17} />}
              {isPending ? "Sending message..." : "Send message"}
            </button>
            {state.message && (
              <p
                role={state.status === "error" ? "alert" : "status"}
                className={`flex items-start gap-2 text-sm font-medium ${state.status === "error" ? "text-destructive" : "text-primary"}`}
              >
                {state.status === "success" && <CheckCircle2 size={17} className="mt-0.5 shrink-0" />}
                {state.message}
              </p>
            )}
          </form>
        </div>
      </div>
    </main>
  );
}
