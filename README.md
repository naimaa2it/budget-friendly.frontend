Root cause: Render (AWS-এর মতো cloud platform) outbound SMTP port 465/587 block করে। তাই order@smartproductbuy.com এর SMTP server-এ connection হচ্ছে না।

সবচেয়ে সহজ fix — Resend use করো। Code change লাগবে না, শুধু SMTP credentials বদলাতে হবে। Free plan-এ 100 emails/day, 3000/month।

Step 1 — Resend account তৈরি করো
resend.com → Sign up → Domains → Add Domain → smartproductbuy.com দাও

Step 2 — DNS records add করো
Resend তোমাকে কয়েকটা DNS record দেবে (DKIM, SPF)। তোমার domain hosting-এর DNS manager-এ গিয়ে সেগুলো add করো, তারপর Verify করো।

Step 3 — API Key নাও
Resend → API Keys → Create API Key → copy করো (re_XXXXXXXXX format)

Step 4 — Render-এ এই env vars দাও
Key Value
SMTP_HOST smtp.resend.com
SMTP_PORT 465
ORDER_SMTP_USER resend
ORDER_SMTP_PASS re_XXXXXXXXX ← তোমার API key
SUPPORT_SMTP_USER resend
SUPPORT_SMTP_PASS re_XXXXXXXXX ← same API key
ADMIN_EMAIL order@smartproductbuy.com
Code-এ কিছু বদলাতে হবে না। শুধু Render-এ SMTP_HOST=smtp.resend.com, ORDER_SMTP_USER=resend দিলেই nodemailer Resend দিয়ে পাঠাবে।

একটু মাথায় রেখো: Resend-এ domain verify হওয়ার পর order@smartproductbuy.com থেকেই email যাবে — sender address বদলাতে হবে না।
