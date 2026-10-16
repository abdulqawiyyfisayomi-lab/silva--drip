# Silva Drip store upgrade

This package contains code updates only. Keep all existing product image folders and the logo. Upload the CONTENTS alongside index.html, not the ZIP and not an extra parent folder. This continues the existing Vercel/Supabase/Paystack project; it does not publish a new site.

## What is included
- Responsive checkout with photo summaries, real variant selection, delivery zones and fees, quantity controls and verified payment receipts.
- Customer order history with payment, processing, shipped and delivered stages and courier tracking links.
- Admin-only product creation/editing, price changes, stock by size and colour, image upload/gallery, order management, payment verification and email retries.
- Verified-purchase reviews; no fabricated testimonials or ratings.
- Product descriptions and owner-supplied measurement guides.
- Delivery, returns, privacy and contact pages editable from the dashboard.
- Payment verification by Paystack before an order is marked paid; stock is reserved atomically at checkout.

## 1. Run the database upgrade first
In your EXISTING Supabase project, open SQL Editor, paste upgrade-store.sql and run it. The original orders table from supabase-setup.sql must already exist. Existing orders and users remain. Existing products are seeded at their original prices, with ZERO available stock until you enter real quantities. No made-up shipping charges or stock counts are added.

## 2. Give ONLY the store owner admin access
Replace OWNER_EMAIL_HERE with the email of the owner's already registered Supabase account, then run this in Supabase SQL Editor:

    update auth.users
    set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"store_admin":true}'::jsonb
    where lower(email) = lower('OWNER_EMAIL_HERE');

Check that exactly the intended account was updated. Log out and back in after granting this role. Do not put admin permissions in user_metadata, frontend code, or a public signup form.

## 3. Upload the update
Upload ALL files and folders in this ZIP to the existing GitHub repository root, replacing matching files. Keep api, server and tests as folders. Keep package.json, vercel.json, responsive.css, store.css, store.js and supabase-client.js at the root alongside index.html. Vercel should deploy the new commit.

Existing Vercel Production environment variables:
- SITE_URL = https://silva-drip-f5hd.vercel.app (or your chosen canonical domain)
- SUPABASE_SERVICE_ROLE_KEY = your legacy Supabase service_role JWT
- PAYSTACK_SECRET_KEY = your Paystack TEST secret key until acceptance testing passes

Use the SAME domain for your test browser, Supabase Site URL and redirects, Paystack webhook, and Vercel SITE_URL. The two Vercel projects from the earlier setup have separate environment variables; updating one does not configure the other.

## 4. Enter the store's actual information
After deployment, visit /admin.html and sign in as the owner.
- Products & stock: set actual quantities for every size/colour you sell, descriptions, prices and real measurements. 'As pictured' is the initial colour label. Add actual colour variants as needed. Original catalogue prices are preserved (e.g. NGN 128,000); confirm all prices before launch.
- Upload actual photographs using the product editor. Existing supplied images remain; no photographs of real garments have been invented. Gallery photos can be uploaded or supplied as HTTPS URLs.
- Delivery & policies: add delivery zones and fees. Format: lagos | Lagos | 2500. Use only your agreed rates. Checkout stays disabled until a zone exists. Publish your own approved delivery/returns/privacy wording and contact details; initial text is a transparent placeholder, not a legal policy tailored to your business.
- Orders: update delivery status and courier tracking. This is manual tracking, not a courier API integration. The dashboard shows the latest 200 orders; customer pages show the latest 100.

## 5. Configure order confirmation emails
Create a Resend account, verify a sending domain, then add these SECRET Production environment variables in Vercel:
- RESEND_API_KEY
- ORDER_EMAIL_FROM (e.g. Silva Drip <orders@your-verified-domain.com>)
Redeploy after saving. These are separate from Supabase authentication emails. Without these settings, payments and order history work, but the site does not claim that a confirmation email was sent. The admin can retry unsent confirmations. Provider idempotency keys reduce duplicate email delivery on repeated verification.

## 6. Payment webhook and final acceptance test
Paystack TEST webhook URL: https://silva-drip-f5hd.vercel.app/api/paystack-webhook
- Add a real-stock variant, choose delivery, and complete a Paystack test payment.
- Confirm the amount includes the configured delivery fee and matches the paid order.
- Confirm stock decreases once, repeated verification does not deduct it again, and stock never becomes negative under simultaneous checkout.
- Verify receipt email delivery after Resend setup.
- Update an order to shipped/delivered as admin; check the customer tracking page.
- Submit a review as a buyer; ensure an unpaid account cannot review or enter the admin dashboard.
- Test signup, confirmation, login/logout, new password and expired reset links again.
- Check phone portrait/landscape, tablet and desktop layouts on real devices before launch.
Only switch to live Paystack keys after these checks pass and your Paystack business is activated. Live and test webhooks must both be configured for their respective modes. No refund or courier integrations are implied by this upgrade.

## Stock reservations
Pending payments hold stock. The admin can verify an order or release stock ONLY after Paystack reports failed, abandoned or reversed. Paid or uncertain/in-progress payments cannot be released from the dashboard. No automatic timeout release is implemented because payments may arrive late. A transaction that fails initialization before Paystack creates a reference may require manual reconciliation by the owner before releasing its reservation; do not blindly restore stock.

## Verification limits
Nine automated server tests pass, covering access control, customer scoping, payment amount checks, invalid carts, review eligibility and input validation. JavaScript syntax and local HTML file links are checked. Database functions, emails and live payments require configuration and live acceptance tests. Browser rendering was not available in this environment; responsive layouts use flexible grids at phone/tablet/desktop widths, but compatibility with every physical device is not claimed.

Official implementation references:
https://supabase.com/docs/guides/database/postgres/row-level-security
https://paystack.com/docs/api/transaction/
https://resend.com/changelog/idempotency-keys
