"use client"

export function trackEvent(eventName: string, properties?: Record<string, any>) {
  // This is a placeholder for your actual analytics implementation
  // You would replace this with your actual analytics provider (Google Analytics, Mixpanel, etc.)
  console.log(`[Analytics] ${eventName}`, properties)

  // Example implementation for Google Analytics
  if (typeof window !== "undefined" && (window as any).gtag) {
    ;(window as any).gtag("event", eventName, properties)
  }
}

export function trackPageView(url: string) {
  trackEvent("page_view", { url })
}

export function trackWaitlistSignup(email: string) {
  // Don't log the actual email in production for privacy reasons
  // This is just for demonstration
  trackEvent("waitlist_signup", { email_domain: email.split("@")[1] })
}
