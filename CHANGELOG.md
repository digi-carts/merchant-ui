# Changelog

## [0.1.119] - 2026-08-18

- Merge pull request #18 from digi-carts/feat/shipping-settings-ui

## [0.1.118] - 2026-08-18

- Support menu always visible in sidebar (removed subscription feature gate)
- Fix Returns page making All Orders highlight as active
- Bill Templates: replace logo URL field with file upload; add live invoice preview
- Notifications: move Send a test card after SMS config section
- Customer Alerts: add bottom padding so Save button is not hidden under AiChat widget
- Payment Settings: show Razorpay form as soon as payment config loads (order charges load async)
- Discounts: fetch store currency once on mount; mutations only refetch offers list

## [0.1.117] - 2026-08-18

- Merge pull request #17 from digi-carts/feat/shipping-settings-ui

## [0.1.116] - 2026-08-18

- Merge pull request #16 from digi-carts/fix/dashboard-load-performance

## [0.1.115] - 2026-08-18

- Merge pull request #15 from digi-carts/fix/dashboard-load-performance

## [0.1.114] - 2026-08-18

- Merge pull request #14 from digi-carts/fix/dashboard-load-performance

## [0.1.113] - 2026-08-18

- Restore customer alerts and save notification channels to the service. (#13)

## [0.1.112] - 2026-08-18

- Restore customer alert settings in the merchant nav and persist channel config to notification-service (including Twilio SID/token fields).
- Add Send test email, Send test WhatsApp, and Send test message buttons.

## [0.1.111] - 2026-08-18

- Add a Templates menu for message and bill layouts. (#12)

## [0.1.110] - 2026-08-18

- fix: prefer store.currency for admin money display (#11)

## [0.1.109] - 2026-08-18

- Replace home item size dropdowns with a scale slider. (#10)

## [0.1.108] - 2026-08-18

- Add AI navigation docs and a file knowledge graph. (#9)

## [0.1.107] - 2026-08-17

- Merge pull request #8 from digi-carts/fix/role-names-lowercase

## [0.1.106] - 2026-08-17

- Merge pull request #7 from digi-carts/fix/store-url-subdomain-display

## [0.1.105] - 2026-08-17

- Merge pull request #6 from digi-carts/fix/store-url-subdomain-display

## [0.1.104] - 2026-08-17

- Merge pull request #5 from digi-carts/fix/store-url-subdomain-display

## [0.1.103] - 2026-08-17

- Merge pull request #4 from digi-carts/fix/store-url-subdomain-display

## [0.1.102] - 2026-08-17

- Merge pull request #3 from digi-carts/fix/remove-platform-managed-payments-page

## [0.1.101] - 2026-08-17

- Merge pull request #2 from digi-carts/fix/ai-chat-markdown-rendering

## [0.1.100] - 2026-08-17

- Merge pull request #1 from digi-carts/feat/color-picker

## [0.1.99] - 2026-08-17

- feat: color picker popover on Theme & Template page using react-colorful
- feat: AI assistant on every page via layout; merchant key with platform fallback on settings pages

## [0.1.98] - 2026-08-17

- feat: AI setup assistant chatbot + footer social dropdown fix

## [0.1.97] - 2026-08-17

- feat: add ColorInput component with clickable color swatch + hex text field

## [0.1.96] - 2026-08-17

- feat: merchant settings info modals now load content dynamically from platform config

## [0.1.95] - 2026-08-17

- feat: add info button with API key guide + YouTube link to all settings pages

## [0.1.94] - 2026-08-13

- feat: one-click Create shipment with courier (AWB + label) in order status modal

## [0.1.93] - 2026-08-13

- feat(merchant-ui): Returns management page (approve/reject/advance, refund status) + Sidebar link

## [0.1.92] - 2026-08-13

- feat: Platform Payments (Razorpay Route) KYC onboarding page under Settings — no gateway account needed

## [0.1.91] - 2026-08-13

- feat: WhatsApp contact button toggle + number in navbar customize (branding.whatsappEnabled/Number)

## [0.1.90] - 2026-08-13

- feat: render Super-Admin help doc per step (multi-line + bullets) in setup wizard

## [0.1.89] - 2026-08-13

- feat: setup wizard reads Super-Admin config — step visibility/order/labels/skippable + shop/notification field toggles

## [0.1.88] - 2026-08-13

- feat(merchant-ui): note custom domain takes up to 1 hour to go live (DNS + SSL)

## [0.1.87] - 2026-08-13

- feat(merchant-ui): footer enable/disable checkbox; Domain page shows both subdomain + custom domain URLs

## [0.1.86] - 2026-08-13

- feat(merchant-ui): Settings→Domain & Publish page — publish/unpublish, store URL, custom domain (uses /store/publish, /store/domain)

## [0.1.85] - 2026-08-13

- feat(merchant-ui): Settings→Discounts page — create/list/toggle/delete coupons (code, %/flat, min order, usage limit, expiry)

## [0.1.84] - 2026-08-13

- feat(merchant-ui): navbar brand display option (logo / store name / both) → branding.navBrandMode

## [0.1.83] - 2026-08-13

- feat(merchant-ui): add PWA icon upload to Logo & Favicon (saves branding.pwaIconUrl — what storefront reads)

## [0.1.82] - 2026-08-13

- fix(merchant-ui): un-break subscription page for custom levels; rename Tab bar→Address bar (icon+title only); remove Bills menu

## [0.1.81] - 2026-08-13

- feat: Stock page 'Add' button — increments existing stock by entered qty (negative reduces)

## [0.1.80] - 2026-08-13

- feat: fetch business levels dynamically in setup wizard step 6

## [0.1.79] - 2026-08-13

- fix: rename endpoint /admin-mgmt → /merchant-mgmt in profile page

## [0.1.78] - 2026-08-13

- fix: set storeId from login response instead of separate GET /store call

## [0.1.77] - 2026-08-13

- fix: image upload and 403 forbidden in shop details form

## [0.1.76] - 2026-08-13

- feat: add signed-out page and update GitHub Actions versions

## [0.1.75] - 2026-08-13

- fix: remove stale JWT refresh and fix notification test storeId

## [0.1.74] - 2026-08-13

- feat: rename role ADMIN → MERCHANT

## [0.1.73] - 2026-08-13

- fix: refresh JWT after store creation in setup wizard; fix finish step

## [0.1.72] - 2026-08-13

- perf: use active-count endpoint and sub cache in dashboard; fix double fetchSub in layout

## [0.1.71] - 2026-08-12

- fix: always show model selector in setup wizard AI step

## [0.1.70] - 2026-08-12

- fix: update Gemini models to 3.x series (3.5-flash-lite default)

## [0.1.69] - 2026-08-12

- fix: remove mail templates from sidebar; update Gemini default to gemini-2.5-pro

## [0.1.68] - 2026-08-12

- feat: restructure sidebar with Products menu; add mail templates under Customize; update Gemini models

## [0.1.67] - 2026-08-12

- feat: show SSL provisioning notice after domain mapping publish

## [0.1.66] - 2026-08-12

- fix: show dns_failed phase instead of 'live' when DNS setup fails on publish

## [0.1.65] - 2026-08-12

- fix: hide View Store link until store is published

## [0.1.64] - 2026-08-12

- feat: Gemini AI integration — settings page, catalog magic fill, setup wizard step

## [0.1.63] - 2026-08-12

- feat: publish DNS progress UX + subscription use limit gating

## [0.1.62] - 2026-08-12

- feat: add GST toggle with GST number and rate fields to order charges

## [0.1.61] - 2026-08-12

- fix: publish store on setup finish and show correct store URL

## [0.1.60] - 2026-08-12

- fix: restore handleFinish function declaration in setup wizard

## [0.1.59] - 2026-08-12

- feat: add Settings sub-pages (Shop, Notifications) and restructure sidebar

## [0.1.58] - 2026-08-12

- feat(setup): subscription plan selection step in wizard

## [0.1.57] - 2026-08-12

- feat(setup): WhatsApp provider/number fields, SMS provider dropdown

## [0.1.56] - 2026-08-12

- fix(setup): URL step sync, phone code dropdown, INR default, dark mode

## [0.1.55] - 2026-08-12

- feat(setup): add navbar with avatar, profile modal, theme switcher, logout

## [0.1.54] - 2026-08-12

- fix(setup): never reduce saved progress when going back

## [0.1.53] - 2026-08-12

- feat(register): pre-fill referral code from URL ?ref= param

## [0.1.52] - 2026-08-12

- fix(api): update localStorage key to auth-store-v3

## [0.1.51] - 2026-08-12

- feat(register): inline per-field validation with blur, strength meter, red borders

## [0.1.50] - 2026-08-12

- refactor(register): single-form — name, email, phone, password, referral code

## [0.1.49] - 2026-08-12

- feat: setup wizard — 5-step onboarding for new admin accounts

## [0.1.48] - 2026-08-12

- refactor(auth): simplify login/register — remove social auth, 2-step register

## [0.1.47] - 2026-08-12

- fix: pass token explicitly on store fetch in afterAuth to avoid localStorage race condition

## [0.1.46] - 2026-08-12

- feat: 3-step merchant register wizard with currency

## [0.1.45] - 2026-08-12

- fix: prevent page reload on login error when stale token exists

## [0.1.44] - 2026-08-11

- fix: bills items cast from Json, status multiselect dropdown, PDF column alignment

## [0.1.43] - 2026-08-11

- fix: phone validation on OTP send + settings save; double-submit guard on store create/subdomain update

## [0.1.42] - 2026-08-11

- fix: remove duplicate orders page content causing build errors

## [0.1.41] - 2026-08-11

- fix: use jspdf-autotable 3.8.4 (3.8.5 does not exist on npm)

## [0.1.40] - 2026-08-11

- fix: keep Orders sidebar group open by default so Bills sub-link is always visible

## [0.1.39] - 2026-08-11

- feat: billing — Bills page with filters/multi-select/PDF, Generate Bill on Orders tab, Orders collapsible in sidebar with Bills sub-link; add jspdf

## [0.1.38] - 2026-08-11

- fix: add missing firebase.ts to admin-ui (required by register + login pages)

## [0.1.37] - 2026-08-11

- feat: dashboard — rename to In Progress Orders, 15d/30d chart toggle, dark mode tooltips

## [0.1.36] - 2026-08-11

- feat: add register and forgot-password pages for admin login

## [0.1.35] - 2026-08-11

- fix: CANCELLED status badge red instead of gray

## [0.1.34] - 2026-08-11

- feat: show complete bill breakdown in order card (unit price, qty, subtotal, shipping, total)

## [0.1.33] - 2026-08-11

- fix: orders page — repair modal JSX, show full order ID, remove userId, FIFO display

## [0.1.32] - 2026-08-11

- fix: show tracking ID and courier only when order status is SHIPPED or DELIVERED

## [0.1.31] - 2026-08-11

- feat: subscription page — pick level first (BASIC/GROW/ADVANCED), then show plans under it

## [0.1.30] - 2026-08-11

- fix: dark mode charts + store card color based on live/draft status

## [0.1.29] - 2026-08-11

- feat: gate sidebar features and catalog limit based on subscription plan

## [0.1.28] - 2026-08-11

- feat: admins can create/toggle/delete their own store product discount codes

## [0.1.27] - 2026-08-11

- feat: Payment collapsible in sidebar + Discounts page showing store-scoped product offers

## [0.1.26] - 2026-08-11

- fix: dark mode — override hardcoded bg-white/neutral utility classes

## [0.1.25] - 2026-08-11

- feat: level filter on subscription page; theme changer under avatar

## [0.1.24] - 2026-08-11

- fix: update offers API path to /offers (offer-service)

## [0.1.23] - 2026-08-11

- feat: add coupon code input to subscription payment modal

## [0.1.22] - 2026-08-11

- fix: show error if reopen-as-regression fails

## [0.1.21] - 2026-08-11

- feat: add info button with domain setup guide on Domain page

## [0.1.20] - 2026-08-11

- feat: rename menu to Domain; merge URL + custom domain into one card

## [0.1.19] - 2026-08-11

- fix: add missing icon imports to admin Sidebar

## [0.1.18] - 2026-08-11

- feat: order status update modal with courier and tracking fields

## [0.1.17] - 2026-08-11

- feat: add support page for admin (create ticket, comment, mark verified)

## [0.1.16] - 2026-08-11

- refactor: reorganise sidebar and settings pages

## [0.1.15] - 2026-08-10

- feat: move Customer Alerts under Notifications; fix Payment/Settings active state

## [0.1.14] - 2026-08-10

- fix: filter footer templates from Storefront Template picker

## [0.1.13] - 2026-08-10

- feat: move Message Templates under Notifications; remove nav Colors card

## [0.1.12] - 2026-08-10

- fix: remove maxLength from URL/href inputs; add live counter to preset name

## [0.1.11] - 2026-08-10

- feat: rename Icons → Tab bar; add editable tab title with 60-char limit

## [0.1.10] - 2026-08-10

- feat: social links platform dropdown + footer SVG icons; rename Theme & Template sidebar label

## [0.1.9] - 2026-08-10

- feat: add char limits to all customize page inputs

## [0.1.8] - 2026-08-10

- feat: replace footer style dropdown with mini visual preview cards

## [0.1.7] - 2026-08-10

- feat: add 120 char limit with live counter to featured section description

## [0.1.6] - 2026-08-10

- feat: add 120 char limit with live counter to new arrivals section description

## [0.1.5] - 2026-08-10

- feat: add 120 char limit with live counter to categories section description

## [0.1.4] - 2026-08-10

- feat: add char limits to hero heading (60) and subtext (120) with live counter

## [0.1.3] - 2026-08-10

- fix: replace base-ui Input with native input — base-ui uses onValueChange not onChange, breaking all controlled text fields

## [0.1.2] - 2026-08-10

- fix: remove Overview link from Customize sidebar

## [0.1.1] - 2026-08-10

- fix: grant contents:write permission so version bump step can push

All notable changes to admin-ui are documented here.

## [Unreleased]