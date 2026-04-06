"use client"

import { useState, useRef, useEffect } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { CheckCircle2, MailCheck, ShieldCheck, TimerReset } from "lucide-react"
import "@fontsource/poppins/400.css"
import "@fontsource/poppins/600.css"
import "@fontsource/poppins/700.css"
import { useAuth } from "../context/AuthContext"
import { useLanguage } from "../context/LanguageContext"

const RESEND_COOLDOWN_SECONDS = 60

const EmailVerification = () => {
  const [code, setCode] = useState(["", "", "", "", "", ""])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [resendLoading, setResendLoading] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)

  const inputRefs = useRef([])
  const navigate = useNavigate()
  const location = useLocation()
  const { verifyEmail, resendVerification } = useAuth()
  const { getLocalizedPath } = useLanguage()

  const queryEmail = new URLSearchParams(location.search).get("email")
  const storedEmail = sessionStorage.getItem("pendingVerificationEmail")
  const email = (location.state?.email || queryEmail || storedEmail || "").trim().toLowerCase()

  useEffect(() => {
    if (email) {
      sessionStorage.setItem("pendingVerificationEmail", email)
    }
  }, [email])

  // Countdown timer for resend button
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [resendCooldown])

  // Auto-focus first input on mount
  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus()
    }
  }, [])

  const handleInputChange = (index, value) => {
    // Only allow numbers
    if (!/^\d*$/.test(value)) return

    const newCode = [...code]
    newCode[index] = value

    setCode(newCode)
    setError("")

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }

    // Auto-submit when all fields are filled
    if (newCode.every((digit) => digit !== "") && newCode.join("").length === 6) {
      handleVerification(newCode.join(""))
    }
  }

  const handleKeyDown = (index, e) => {
    // Handle backspace
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }

    // Handle arrow keys
    if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
    if (e.key === "ArrowRight" && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handlePaste = (e) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6)

    if (pastedData.length === 6) {
      const newCode = pastedData.split("")
      setCode(newCode)
      setError("")

      // Focus last input
      inputRefs.current[5]?.focus()

      // Auto-submit
      handleVerification(pastedData)
    }
  }

  const handleVerification = async (verificationCode) => {
    if (!email) {
      setError("Email not found. Please register again.")
      return
    }

    if (verificationCode.length !== 6) {
      setError("Please enter all 6 digits")
      return
    }

    setLoading(true)
    setError("")

    try {
      await verifyEmail({
        email,
        code: verificationCode,
      })

      setSuccess("Email verified successfully! Redirecting...")
      sessionStorage.removeItem("pendingVerificationEmail")
      setTimeout(() => {
        navigate(getLocalizedPath("/"), { replace: true })
      }, 2000)
    } catch (error) {
      setError(error.message || "Verification failed. Please try again.")
      setCode(["", "", "", "", "", ""]) // Clear code on error
      inputRefs.current[0]?.focus()
    } finally {
      setLoading(false)
    }
  }

  const handleResendCode = async () => {
    if (!email) {
      setError("Email not found. Please register again.")
      return
    }

    setResendLoading(true)
    setError("")

    try {
      await resendVerification(email)
      setSuccess("Verification code sent successfully!")
      setResendCooldown(RESEND_COOLDOWN_SECONDS)
      setTimeout(() => setSuccess(""), 3000)
    } catch (error) {
      setError(error.message || "Failed to resend code. Please try again.")
    } finally {
      setResendLoading(false)
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const verificationCode = code.join("")
    handleVerification(verificationCode)
  }

  const maskedEmail = email
    ? email.replace(/(^.).*(@.*$)/, (_, first, domain) => `${first}***${domain}`)
    : ""
  const resendProgress = resendCooldown > 0 ? (resendCooldown / RESEND_COOLDOWN_SECONDS) * 100 : 0

  if (!email) {
    return (
      <div className="min-h-screen bg-white px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto flex min-h-[70vh] max-w-xl items-center justify-center">
          <div className="w-full rounded-3xl border border-[#505e4d]/25 bg-white p-8 sm:p-10">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#505e4d]/15 text-[#505e4d]">
              <MailCheck className="h-7 w-7" />
            </div>
            <h2 className="text-center font-['Poppins'] text-3xl font-extrabold tracking-tight text-[#505e4d]">Email Not Found</h2>
            <p className="mt-3 text-center font-['Poppins'] text-sm text-[#505e4d]/75">Please register first to verify your email.</p>
            <button
              onClick={() => navigate(getLocalizedPath("/register"))}
              className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-[#505e4d] px-4 py-3 font-['Poppins'] text-sm font-semibold text-white transition hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[#505e4d] focus:ring-offset-2"
            >
              Go to Register
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto grid min-h-[70vh] w-full max-w-4xl items-center gap-6 lg:grid-cols-[1.1fr_1fr]">
        <aside className="hidden rounded-3xl border border-[#505e4d]/25 bg-[#505e4d] p-8 text-white lg:block">
          <div className="mb-8 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 text-white">
            <ShieldCheck className="h-7 w-7" />
          </div>
          <h2 className="font-['Poppins'] text-3xl font-extrabold leading-tight">Secure Email Confirmation</h2>
          <p className="mt-3 font-['Poppins'] text-sm leading-relaxed text-white/85">
            One final security step. Enter the 6-digit code we sent to confirm your account and continue shopping safely.
          </p>

          <div className="mt-8 space-y-4 rounded-2xl border border-white/20 bg-white/10 p-5">
            <p className="text-xs uppercase tracking-[0.2em] text-white/70">Code Sent To</p>
            <p className="font-['Poppins'] text-sm font-semibold text-white">{maskedEmail}</p>
            <div className="flex items-center gap-2 text-xs text-white/80">
              <CheckCircle2 className="h-4 w-4 text-white" />
              Expire hone se pehle code verify kar dein.
            </div>
          </div>
        </aside>

        <section className="w-full rounded-3xl border border-[#505e4d]/25 bg-white p-6 sm:p-8">
          <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#505e4d]/15 text-[#505e4d]">
            <MailCheck className="h-7 w-7" />
          </div>
          <h1 className="text-center font-['Poppins'] text-3xl font-extrabold tracking-tight text-[#505e4d]">Verify Your Email</h1>
          <p className="mt-3 text-center font-['Poppins'] text-sm leading-relaxed text-[#505e4d]/75">
            We sent a 6-digit code to{" "}
            <span className="font-semibold text-[#505e4d] break-words">{email}</span>
          </p>

          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            {error && (
              <div className="rounded-2xl border border-[#505e4d]/25 bg-[#505e4d]/10 p-4">
                <div className="flex items-start gap-3">
                  <div className="h-5 w-5 rounded-full bg-white text-center text-sm font-bold leading-5 text-[#505e4d]">!</div>
                  <p className="font-['Poppins'] text-sm font-medium text-[#505e4d]">{error}</p>
                </div>
              </div>
            )}

            {success && (
              <div className="rounded-2xl border border-[#505e4d]/25 bg-[#505e4d]/10 p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-[#505e4d]" />
                  <p className="font-['Poppins'] text-sm font-medium text-[#505e4d]">{success}</p>
                </div>
              </div>
            )}

            <div>
              <label className="sr-only">Verification Code</label>
              <div className="flex justify-center gap-2 sm:gap-3">
                {code.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => (inputRefs.current[index] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleInputChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onPaste={handlePaste}
                    className="h-12 w-11 rounded-xl border border-[#505e4d]/35 bg-white text-center font-['Poppins'] text-xl font-bold text-[#505e4d] outline-none transition-all focus:border-[#505e4d] focus:ring-2 focus:ring-[#505e4d]/20 sm:h-14 sm:w-12"
                    disabled={loading}
                  />
                ))}
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading || !Array.isArray(code) || code.some((digit) => digit === "")}
                className="group relative inline-flex w-full items-center justify-center rounded-xl bg-[#505e4d] px-4 py-3 font-['Poppins'] text-sm font-semibold text-white transition hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[#505e4d] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? (
                  <div className="flex items-center">
                    <svg className="-ml-1 mr-3 h-5 w-5 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Verifying...
                  </div>
                ) : (
                  "Verify Email"
                )}
              </button>
            </div>

            <div className="rounded-2xl border border-[#505e4d]/20 bg-white p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="font-['Poppins'] text-sm text-[#505e4d]/75">Didn't receive the code?</p>
                <button
                  type="button"
                  onClick={handleResendCode}
                  disabled={resendLoading || resendCooldown > 0}
                  className="inline-flex items-center gap-1 font-['Poppins'] text-sm font-semibold text-[#505e4d] transition hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <TimerReset className="h-4 w-4" />
                  {resendLoading ? "Sending..." : resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend Code"}
                </button>
              </div>
              {resendCooldown > 0 && (
                <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-[#505e4d]/15">
                  <div
                    className="h-full rounded-full bg-[#505e4d] transition-[width] duration-1000 ease-linear"
                    style={{ width: `${resendProgress}%` }}
                  />
                </div>
              )}
            </div>
          </form>
        </section>
      </div>
    </div>
  )
}

export default EmailVerification
