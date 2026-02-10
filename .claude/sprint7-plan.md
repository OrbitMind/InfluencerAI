# Sprint 7 — Agendamento e Publicação em Redes Sociais
## Implementation Plan

---

## OVERVIEW

Sprint 7 adds social media publishing and scheduling capabilities. Users can:
- Connect Instagram, TikTok, and YouTube accounts via OAuth
- Publish content immediately or schedule for later
- View calendar of scheduled posts
- Track publication history

**Key Challenge:** Social media APIs (Instagram Graph, TikTok, YouTube) require rigorous approval processes. We'll implement full infrastructure with Instagram as primary focus, TikTok/YouTube as stubs with "Coming Soon" messaging.

---

## ARCHITECTURE DECISIONS

### 1. Token Storage Strategy

**Decision:** Create dedicated `SocialAccount` model (not reuse NextAuth `Account`)

**Rationale:**
- NextAuth `Account` is for authentication only (login providers)
- Social publishing needs different scope: posting permissions, not login
- Different lifecycle: users may disconnect/reconnect social accounts independently
- Clearer separation of concerns

**Pattern:** Follow existing `ApiKey` model with AES-256-GCM encryption
- Store encrypted access tokens (encrypted, iv, authTag columns)
- Store refresh tokens encrypted (single combined field)
- Use `AESEncryptionService.getInstance()`

### 2. OAuth Flow Architecture

**Decision:** Implement OAuth via dedicated API routes (not NextAuth providers)

**Flow:**
```
1. User clicks "Connect Instagram"
   → GET /api/social/auth/instagram?userId={id}
   → Generates state token (CSRF protection)
   → Redirects to Instagram OAuth

2. Instagram redirects back
   → GET /api/social/callback/instagram?code={code}&state={state}
   → Exchanges code for tokens
   → Fetches profile info
   → Encrypts & stores in SocialAccount
   → Redirects to /dashboard/social with success toast

3. Token refresh (automatic)
   → Before each publish, check `tokenExpiresAt`
   → If expired, use refresh_token to get new access_token
   → Update SocialAccount with new tokens
```

**State Management:** Store OAuth state in Redis or database with 10-minute TTL (prevents CSRF attacks)

### 3. Publishing Architecture

**Decision:** Synchronous publish for "Publish Now", background jobs for scheduled posts

**Synchronous Flow (Publish Now):**
```typescript
POST /api/social/publish
→ withAuth + validate
→ SocialPublishService.publishNow()
  → Get SocialAccount + decrypt tokens
  → Refresh token if needed
  → Call platform API (Instagram/TikTok/YouTube)
  → Return { platformPostId, platformPostUrl }
→ Create ScheduledPost record with status="published"
→ Return success
```

**Async Flow (Scheduled Posts):**
```typescript
POST /api/social/schedule
→ withAuth + validate scheduledFor > now
→ Create ScheduledPost with status="scheduled"
→ Return success immediately

[Cron Job - Every 5 minutes]
POST /api/cron/process-scheduled (authenticated via CRON_SECRET header)
→ SchedulerService.processScheduledPosts()
  → Find posts where scheduledFor <= now AND status="scheduled"
  → For each post:
    → Update status to "publishing"
    → Try publish via SocialPublishService
    → If success: status="published", set platformPostId/Url
    → If error: status="failed", set errorMessage
  → Return summary: { processed, published, failed }
```

### 4. Cron Implementation

**Decision:** Vercel Cron (primary) + fallback to external cron service

**vercel.json:**
```json
{
  "crons": [{
    "path": "/api/cron/process-scheduled",
    "schedule": "*/5 * * * *"
  }]
}
```

**Authentication:** Custom middleware checking `CRON_SECRET` header (not withAuth, since no user session)

**Idempotency:** Use database transaction with status checks to prevent double-publishing

### 5. Platform API Integration Strategy

#### Instagram (Full Implementation)
- **API:** Facebook Graph API v21.0
- **Endpoint:** `https://graph.facebook.com/v21.0/me/media`
- **Auth:** OAuth 2.0 with `instagram_content_publish` permission
- **Media Types:**
  - Reels: `POST /me/media` with `media_type=REELS`, `video_url`, `caption`
  - Feed Photo: `POST /me/media` with `image_url`, `caption`
  - Stories: `POST /me/media` with `media_type=STORIES`
- **Flow:** 2-step (create container → publish container)

#### TikTok (Stub Implementation)
- **API:** TikTok Content Posting API v2
- **Status:** "Coming Soon" message in UI
- **Reason:** Requires TikTok Developer Portal approval + business verification
- **Stub:** Show "Download" option only, message: "Direct publishing coming soon"

#### YouTube (Stub Implementation)
- **API:** YouTube Data API v3
- **Status:** "Coming Soon" for Shorts, full implementation possible later
- **Reason:** Quota limits (10,000 units/day), requires OAuth verification
- **Stub:** Show "Download" option, leverage existing Google OAuth with youtube.upload scope

### 6. Error Handling & Retry Strategy

**Decision:** Exponential backoff for transient errors, immediate failure for permanent errors

```typescript
// Transient errors (retry with backoff):
- 429 Rate Limit → Retry after rate limit window
- 500 Server Error → Retry 3x with 2^n backoff
- Network timeout → Retry 2x

// Permanent errors (fail immediately):
- 401 Unauthorized → Token invalid, mark account disconnected
- 403 Forbidden → Insufficient permissions
- 400 Bad Request → Invalid media/caption format
```

**Implementation:** Simple retry loop in `SocialPublishService`, store attempt count in ScheduledPost metadata

### 7. Media URL Accessibility

**Critical Requirement:** Social APIs require publicly accessible URLs

**Current State:** Campaign outputs stored in Cloudinary (public URLs ✓)

**Validation:**
- Before scheduling: verify `mediaUrl` is accessible (HEAD request)
- If Cloudinary URL: ensure not expired
- If user uploads custom media: validate format/size

---

## IMPLEMENTATION PHASES

### Phase 1: Database Schema + Migration
1. Add `SocialAccount` model to schema.prisma
2. Add `ScheduledPost` model to schema.prisma
3. Add relations to `User` and `Campaign`
4. Run migration: `npx prisma migrate dev --name add_social_publishing`
5. Generate Prisma client

### Phase 2: Types + Validations
1. Create `lib/types/social.ts` with all interfaces
2. Create `lib/validations/social.ts` with Zod schemas
3. Add `SUPPORTED_PLATFORMS` constant

### Phase 3: Core Services
1. **SocialAuthService** (`lib/services/social/social-auth-service.ts`)
   - Instagram OAuth URL generation
   - Token exchange
   - Account connection/disconnection
   - Token refresh logic
   - Use existing AESEncryptionService

2. **SocialPublishService** (`lib/services/social/social-publish-service.ts`)
   - `publishNow()` orchestrator
   - `publishToInstagram()` implementation
   - `publishToTikTok()` stub
   - `publishToYouTube()` stub
   - Error handling + retry

3. **SchedulerService** (`lib/services/social/scheduler-service.ts`)
   - Schedule/cancel/reschedule operations
   - `processScheduledPosts()` for cron
   - `getSuggestedTimes()` helper

### Phase 4: API Routes

**Social Accounts:**
- `app/api/social/accounts/route.ts` — GET list accounts
- `app/api/social/accounts/[id]/route.ts` — DELETE disconnect
- `app/api/social/auth/[platform]/route.ts` — GET start OAuth
- `app/api/social/callback/[platform]/route.ts` — GET OAuth callback

**Publishing:**
- `app/api/social/publish/route.ts` — POST publish now
- `app/api/social/schedule/route.ts` — POST schedule post
- `app/api/social/scheduled/route.ts` — GET list scheduled
- `app/api/social/scheduled/[id]/route.ts` — PATCH reschedule, DELETE cancel

**Cron:**
- `app/api/cron/process-scheduled/route.ts` — POST process scheduled (CRON_SECRET auth)

### Phase 5: Frontend Components

1. **Social Accounts Page** (`app/dashboard/social/page.tsx`)
   - Connected accounts grid
   - Connect buttons for each platform
   - Scheduled posts timeline
   - Published posts history

2. **PublishModal** (`components/social/publish-modal.tsx`)
   - Account selector
   - Media preview
   - Caption editor with hashtag suggester
   - Publish now vs Schedule toggle
   - Date/time picker for scheduled posts
   - Platform-specific preview mockup

3. **HashtagSuggester** (`components/social/hashtag-suggester.tsx`)
   - Suggests hashtags by persona niche
   - Individual hashtag toggles
   - Counter (max 30 for Instagram)

4. **CalendarView** (`components/social/calendar-view.tsx`)
   - Monthly calendar
   - Posts shown on scheduled dates
   - Click date → see day's posts
   - (Future: drag-drop reschedule)

5. **SocialAccountCard** (`components/social/social-account-card.tsx`)
   - Platform icon + username
   - Connected badge
   - Disconnect button
   - Last sync timestamp

6. **ScheduledPostCard** (`components/social/scheduled-post-card.tsx`)
   - Media thumbnail
   - Platform badge
   - Scheduled date/time
   - Status indicator
   - Actions: reschedule, cancel, publish now

### Phase 6: Integration Points

1. **CampaignOutputs Component** (modify existing)
   - Add "Publish" button to each completed output
   - Opens PublishModal with pre-filled mediaUrl

2. **Sidebar Navigation** (modify existing)
   - Add "Publicar" menu item
   - Icon: Share2
   - Position: after Campanhas

3. **Mobile Navigation** (modify existing)
   - Same addition for mobile

### Phase 7: Vercel Configuration
1. Create `vercel.json` with cron configuration
2. Add CRON_SECRET to environment variables
3. Document cron setup in SETUP.md

### Phase 8: Environment Variables
1. Add Instagram (Facebook) OAuth credentials
2. Add TikTok OAuth credentials (for future)
3. Add YouTube scope to existing Google OAuth
4. Add CRON_SECRET
5. Update `.env.example`

---

## CRITICAL FILES TO CREATE (28 new files)

### Database & Types
1. `prisma/migrations/XXXXXX_add_social_publishing/migration.sql`
2. `lib/types/social.ts`
3. `lib/validations/social.ts`

### Services (3 files)
4. `lib/services/social/social-auth-service.ts`
5. `lib/services/social/social-publish-service.ts`
6. `lib/services/social/scheduler-service.ts`

### API Routes (10 files)
7. `app/api/social/accounts/route.ts`
8. `app/api/social/accounts/[id]/route.ts`
9. `app/api/social/auth/[platform]/route.ts`
10. `app/api/social/callback/[platform]/route.ts`
11. `app/api/social/publish/route.ts`
12. `app/api/social/schedule/route.ts`
13. `app/api/social/scheduled/route.ts`
14. `app/api/social/scheduled/[id]/route.ts`
15. `app/api/cron/process-scheduled/route.ts`

### Frontend Components (9 files)
16. `app/dashboard/social/page.tsx`
17. `components/social/publish-modal.tsx`
18. `components/social/hashtag-suggester.tsx`
19. `components/social/calendar-view.tsx`
20. `components/social/social-account-card.tsx`
21. `components/social/scheduled-post-card.tsx`
22. `components/social/platform-preview.tsx` (bonus: mockup preview)
23. `components/social/suggested-times.tsx` (bonus: time suggestions)
24. `lib/hooks/use-social-publishing.ts` (custom hook)

### Configuration
25. `vercel.json`

### Utilities
26. `lib/utils/social-helpers.ts` (platform-specific helpers)
27. `lib/constants/hashtags.ts` (hashtag suggestions by niche)
28. `lib/constants/social-platforms.ts` (platform configs)

---

## CRITICAL FILES TO MODIFY (6 files)

1. **prisma/schema.prisma**
   - Add `SocialAccount` model
   - Add `ScheduledPost` model
   - Add relations to `User` and `Campaign`

2. **components/campaigns/campaign-outputs.tsx**
   - Add "Publish" button to each output card
   - Import and render PublishModal

3. **components/layout/sidebar.tsx**
   - Add "Publicar" navigation item

4. **components/layout/mobile-nav.tsx**
   - Add "Publicar" navigation item

5. **.env.example**
   - Add Instagram/Facebook OAuth vars
   - Add TikTok OAuth vars
   - Add CRON_SECRET

6. **SETUP.md** (or README.md)
   - Document social media OAuth setup
   - Document cron configuration

---

## DATA FLOW DIAGRAMS

### OAuth Connection Flow
```
User (Browser)
  ↓ Click "Connect Instagram"
  ↓ GET /api/social/auth/instagram
API Route
  ↓ Generate state token
  ↓ Store state in session/db
  ↓ Redirect to Instagram OAuth
Instagram OAuth Screen
  ↓ User approves
  ↓ Redirects to callback URL
  ↓ GET /api/social/callback/instagram?code=xxx&state=yyy
API Route
  ↓ Verify state token
  ↓ Exchange code for tokens
  ↓ Fetch user profile
  ↓ Encrypt tokens (AESEncryptionService)
  ↓ Create SocialAccount record
  ↓ Redirect to /dashboard/social
User sees connected account
```

### Publish Now Flow
```
User (Campaign Detail Page)
  ↓ Click "Publish" on output
PublishModal opens
  ↓ Select account
  ↓ Edit caption/hashtags
  ↓ Click "Publish Now"
  ↓ POST /api/social/publish
API Route (withAuth)
  ↓ Validate payload
  ↓ Call SocialPublishService.publishNow()
Service
  ↓ Get SocialAccount from DB
  ↓ Decrypt tokens
  ↓ Check token expiry → refresh if needed
  ↓ Call Instagram Graph API
  ↓   POST /me/media (create container)
  ↓   POST /{container_id}/publish
Instagram API
  ↓ Return post ID + URL
Service
  ↓ Create ScheduledPost record (status="published")
  ↓ Return success
Modal shows success, closes
User sees toast "Published to Instagram!"
```

### Schedule Flow
```
User schedules post for tomorrow 2pm
  ↓ POST /api/social/schedule
API Route
  ↓ Validate scheduledFor > now
  ↓ Create ScheduledPost (status="scheduled")
  ↓ Return success immediately
User sees "Scheduled successfully"

[5 minutes later - Cron runs]
Vercel Cron
  ↓ POST /api/cron/process-scheduled
  ↓ Headers: { 'x-cron-secret': CRON_SECRET }
API Route
  ↓ Verify CRON_SECRET
  ↓ Call SchedulerService.processScheduledPosts()
Service
  ↓ Query: scheduledFor <= now AND status="scheduled"
  ↓ For each post:
  ↓   Update status="publishing"
  ↓   Call SocialPublishService.publishNow()
  ↓   If success: status="published"
  ↓   If error: status="failed", store error
  ↓ Return { processed: 5, published: 4, failed: 1 }
Cron completes
[Next cron in 5 minutes...]
```

---

## PLATFORM-SPECIFIC IMPLEMENTATION DETAILS

### Instagram Graph API

**OAuth Setup:**
1. Create Facebook App at developers.facebook.com
2. Add Instagram Basic Display + Instagram Graph API products
3. Configure OAuth redirect URI: `https://yourdomain.com/api/social/callback/instagram`
4. Request `instagram_content_publish` permission (requires app review)

**Publishing Flow (Reels):**
```typescript
// Step 1: Create container
POST https://graph.facebook.com/v21.0/me/media
Body: {
  media_type: "REELS",
  video_url: "https://cloudinary.com/.../video.mp4",
  caption: "Check out this awesome content! #fitness #motivation",
  access_token: "{access_token}"
}
Response: { id: "container_id_123" }

// Step 2: Publish container
POST https://graph.facebook.com/v21.0/me/media_publish
Body: {
  creation_id: "container_id_123",
  access_token: "{access_token}"
}
Response: { id: "post_id_456" }

// Post URL: https://www.instagram.com/p/{short_code}/
```

**Token Refresh:**
```typescript
// Access tokens expire in 60 days (long-lived)
// Refresh before expiry:
GET https://graph.facebook.com/v21.0/oauth/access_token
Params: {
  grant_type: "fb_exchange_token",
  client_id: INSTAGRAM_APP_ID,
  client_secret: INSTAGRAM_APP_SECRET,
  fb_exchange_token: "{current_access_token}"
}
Response: { access_token: "new_token", expires_in: 5184000 }
```

### TikTok API (Stub)

**Stub Behavior:**
- UI shows "Connect TikTok" button
- Click → shows dialog: "TikTok integration coming soon! For now, download your video and post manually."
- "Download" button downloads video directly
- Code structure ready for future implementation

**Future Implementation Notes:**
- API: TikTok Content Posting API v2
- OAuth: TikTok Login Kit
- Requires: Business account verification
- Upload: 2-step process (init upload → upload chunk → publish)

### YouTube API (Stub)

**Stub Behavior:**
- UI shows "Connect YouTube" button
- Click → shows dialog: "YouTube Shorts publishing coming soon! Download and upload manually for now."
- Can leverage existing Google OAuth by adding `youtube.upload` scope

**Future Implementation Notes:**
- API: YouTube Data API v3
- Endpoint: `POST /youtube/v3/videos`
- Quota: 10,000 units/day (uploads cost 1600 units each = ~6 uploads/day)
- Shorts detection: video < 60s + vertical (9:16) + #Shorts in title/description

---

## SECURITY CONSIDERATIONS

### 1. Token Encryption
- **All access tokens encrypted** with AES-256-GCM
- Unique IV per encryption
- Authentication tags prevent tampering
- Encryption key from `ENCRYPTION_KEY` env var (64-char hex)

### 2. OAuth Security
- **State parameter** prevents CSRF attacks
- State stored server-side with 10-minute TTL
- Verified on callback
- Redirect URI whitelisted in OAuth app config

### 3. Cron Authentication
- **CRON_SECRET** required in header
- Random 32-byte hex string
- Only Vercel cron or authorized services have secret
- Route not protected by NextAuth (different auth mechanism)

### 4. Rate Limiting
- Implement rate limiting on publish endpoints
- Respect platform rate limits:
  - Instagram: 25 API calls per user per day
  - TikTok: 100 requests per user per day
  - YouTube: 10,000 quota units per day
- Store rate limit state in database or Redis

### 5. Input Validation
- Validate `mediaUrl` is accessible before scheduling
- Validate caption length (Instagram: 2,200 chars)
- Validate hashtag count (Instagram: 30 max)
- Sanitize user input in captions
- Prevent XSS in hashtag suggestions

---

## ERROR HANDLING STRATEGY

### User-Facing Errors

**Connection Errors:**
- "Failed to connect Instagram. Please try again."
- "Your Instagram session expired. Please reconnect."

**Publishing Errors:**
- "Failed to publish. Instagram may be experiencing issues."
- "This video format is not supported by Instagram Reels."
- "Your caption is too long. Maximum 2,200 characters."

**Scheduling Errors:**
- "Cannot schedule in the past. Please select a future date."
- "This account is disconnected. Please reconnect."

### Developer Errors (logged, not shown to user)
```typescript
// Log structure:
{
  error: "instagram_api_error",
  platform: "instagram",
  statusCode: 400,
  message: "Invalid media URL",
  userId: "user_123",
  accountId: "account_456",
  postId: "post_789",
  timestamp: "2026-02-09T12:00:00Z",
  stack: "..."
}
```

### Retry Logic
```typescript
async function publishWithRetry(
  publishFn: () => Promise<PublishResult>,
  maxRetries = 3
): Promise<PublishResult> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await publishFn()
    } catch (error) {
      const isRetryable = [429, 500, 502, 503].includes(error.statusCode)
      const isLastAttempt = attempt === maxRetries

      if (!isRetryable || isLastAttempt) {
        throw error
      }

      const delayMs = Math.pow(2, attempt) * 1000 // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, delayMs))
    }
  }
}
```

---

## TESTING STRATEGY

### Manual Testing Checklist

**OAuth Flow:**
- [ ] Click "Connect Instagram" → redirects to Instagram
- [ ] Approve permissions → redirects back with success
- [ ] Account appears in connected accounts list
- [ ] Disconnect account → removed from list

**Publish Now:**
- [ ] Select completed campaign output
- [ ] Click "Publish" → modal opens
- [ ] Select Instagram account
- [ ] Edit caption, add hashtags
- [ ] Click "Publish Now" → success toast
- [ ] Post appears on Instagram
- [ ] Post recorded in history

**Scheduling:**
- [ ] Schedule post for 5 minutes from now
- [ ] Post appears in scheduled list
- [ ] Wait 5+ minutes → cron runs
- [ ] Post published automatically
- [ ] Status updates to "published"

**Error Cases:**
- [ ] Try scheduling without connected account → error
- [ ] Try publishing with disconnected account → error
- [ ] Try scheduling in past → validation error
- [ ] Disconnect account while post scheduled → handle gracefully

### API Testing (Postman/curl)

```bash
# Get accounts
curl -X GET http://localhost:3000/api/social/accounts \
  -H "Cookie: next-auth.session-token=xxx"

# Publish now
curl -X POST http://localhost:3000/api/social/publish \
  -H "Cookie: next-auth.session-token=xxx" \
  -H "Content-Type: application/json" \
  -d '{
    "socialAccountId": "account_123",
    "mediaUrl": "https://res.cloudinary.com/.../video.mp4",
    "mediaType": "video",
    "caption": "Test post",
    "hashtags": "#test #demo"
  }'

# Schedule post
curl -X POST http://localhost:3000/api/social/schedule \
  -H "Cookie: next-auth.session-token=xxx" \
  -H "Content-Type: application/json" \
  -d '{
    "socialAccountId": "account_123",
    "mediaUrl": "https://res.cloudinary.com/.../video.mp4",
    "mediaType": "video",
    "caption": "Scheduled post",
    "scheduledFor": "2026-02-10T15:00:00Z"
  }'

# Process scheduled (simulate cron)
curl -X POST http://localhost:3000/api/cron/process-scheduled \
  -H "x-cron-secret: your_cron_secret_here"
```

---

## ROLLOUT PLAN

### Phase 1: Infrastructure (Week 1)
- Deploy database schema
- Implement core services (auth, publish, scheduler)
- Implement API routes
- Test with Postman/curl

### Phase 2: Instagram Integration (Week 1-2)
- Set up Facebook App
- Implement Instagram OAuth
- Implement Instagram publishing
- Test with real Instagram account
- Request app review for `instagram_content_publish`

### Phase 3: Frontend (Week 2)
- Build social accounts page
- Build publish modal
- Integrate with campaign outputs
- Build calendar view

### Phase 4: Cron & Scheduling (Week 2-3)
- Set up Vercel cron
- Test cron execution
- Monitor scheduled posts
- Handle failures gracefully

### Phase 5: Polish & Launch (Week 3)
- Add TikTok/YouTube stubs
- Add hashtag suggestions
- Add suggested posting times
- Documentation
- Beta test with real users

---

## SUCCESS METRICS

### Technical Metrics
- OAuth success rate > 95%
- Publish success rate > 90%
- Cron execution success rate > 99%
- Average publish latency < 5 seconds
- Token refresh success rate > 99%

### User Metrics
- % of campaigns that get published
- Average time from campaign completion to publish
- % of users who connect at least one account
- % of posts scheduled vs immediate
- User retention after publishing feature launch

---

## FUTURE ENHANCEMENTS (Post-Sprint 7)

1. **Multi-platform publishing** — Publish to multiple platforms at once
2. **Content variations** — Different captions per platform
3. **Best time suggestions** — ML-based optimal posting times per user
4. **Analytics integration** — Track post performance (likes, views, engagement)
5. **Calendar drag-drop** — Reschedule by dragging posts in calendar
6. **Bulk scheduling** — Schedule entire campaign sequences
7. **Hashtag performance** — Track which hashtags drive engagement
8. **Twitter/X integration** — Add Twitter as publishing platform
9. **LinkedIn integration** — For business/professional content
10. **Approval workflow** — Team review before publishing

---

## DEPENDENCIES & PREREQUISITES

### External Services
- **Facebook App** (for Instagram Graph API)
- **TikTok Developer Account** (future)
- **Google Cloud Project** (already exists for YouTube)
- **Vercel Account** (for cron jobs)

### Environment Variables Required
```bash
# Instagram (Facebook Graph API)
INSTAGRAM_APP_ID=
INSTAGRAM_APP_SECRET=
INSTAGRAM_REDIRECT_URI=

# TikTok (future)
TIKTOK_CLIENT_KEY=
TIKTOK_CLIENT_SECRET=

# YouTube (extend existing Google OAuth)
# GOOGLE_CLIENT_ID (already exists)
# GOOGLE_CLIENT_SECRET (already exists)

# Cron
CRON_SECRET=

# Encryption (already exists)
# ENCRYPTION_KEY (already exists)
```

### Package Dependencies (likely already installed)
- `next-auth` ✓ (already in project)
- `@prisma/client` ✓
- `zod` ✓
- `stripe` ✓ (not needed, just showing existing deps)
- No new packages needed

---

## QUESTIONS FOR USER

1. **Instagram OAuth:** Do you already have a Facebook App, or should we create one during implementation?

2. **Cron Service:** Prefer Vercel Cron (included in Vercel Pro) or external service like cron-job.org (free)?

3. **TikTok/YouTube Priority:** Should we implement TikTok/YouTube as full stubs (UI ready, "Coming Soon" message) or minimal stubs (just show download option)?

4. **Multi-platform:** Should initial version support publishing to multiple platforms simultaneously, or one platform per publish action?

5. **Calendar View:** Essential for MVP or can be added in a follow-up iteration?

6. **OAuth Redirect:** What's your deployment domain for OAuth redirect URIs? (e.g., `https://influencerai.com/api/social/callback/instagram`)

---

## RISK MITIGATION

### Risk 1: Instagram App Review Rejection
**Mitigation:**
- Implement full UI/backend with mock mode
- Use test accounts for development
- Prepare detailed app review submission with video demo
- Have fallback: download + manual upload instructions

### Risk 2: Token Refresh Failures
**Mitigation:**
- Implement robust retry logic
- Send email notification when account disconnected
- UI shows "Reconnect" button prominently
- Grace period before auto-disabling account

### Risk 3: Cron Reliability
**Mitigation:**
- Idempotent processing (check status before publishing)
- Implement cron monitoring/alerting
- Fallback: manual "Retry Failed" button in UI
- Dead letter queue for failed posts

### Risk 4: Media URL Expiration
**Mitigation:**
- Cloudinary URLs don't expire by default
- Pre-validate URL before scheduling
- Re-check URL before publishing
- If URL fails, mark post as failed with clear error

### Risk 5: Rate Limits
**Mitigation:**
- Track API calls per platform per day
- Implement queue with rate limiting
- Show user their daily quota usage
- Graceful degradation: "Limit reached, try tomorrow"

---

## IMPLEMENTATION ORDER (Optimal Path)

1. **Database first** (foundation)
2. **Types & validations** (contracts)
3. **Core services** (business logic)
4. **API routes** (external interface)
5. **Basic UI** (accounts page, connect flow)
6. **Publish modal** (main user interaction)
7. **Integration** (campaign outputs)
8. **Scheduling UI** (calendar, scheduled posts)
9. **Cron** (background processing)
10. **Polish** (hashtags, suggestions, error states)

This order minimizes rework and allows for iterative testing at each stage.

---

## ESTIMATED EFFORT

### Time Breakdown (for single developer)
- Database & schema: 1 hour
- Types & validations: 1 hour
- Core services: 6 hours (complex OAuth + API integration)
- API routes: 4 hours
- Frontend components: 8 hours
- Integration: 2 hours
- Cron setup: 2 hours
- Testing: 4 hours
- Documentation: 2 hours

**Total: ~30 hours** (3-4 full work days)

### Complexity Rating
- Database: ⭐ Low
- Services: ⭐⭐⭐⭐ High (OAuth, encryption, API integration)
- API Routes: ⭐⭐ Medium
- Frontend: ⭐⭐⭐ Medium-High (complex modal, calendar)
- Cron: ⭐⭐ Medium
- Overall: ⭐⭐⭐⭐ High

---

## PLAN APPROVAL REQUEST

This plan covers:
✅ Complete database schema (SocialAccount, ScheduledPost)
✅ OAuth integration (Instagram primary, TikTok/YouTube stubs)
✅ Publishing service (immediate + scheduled)
✅ Cron job for scheduled posts
✅ Full UI (social page, publish modal, calendar)
✅ Integration with existing campaign system
✅ Security (encryption, OAuth, CRON_SECRET)
✅ Error handling & retry logic

**Differences from original spec:**
1. **Dedicated SocialAccount model** instead of reusing NextAuth Account (cleaner separation)
2. **Instagram focus** with TikTok/YouTube as stubs (pragmatic given API approval requirements)
3. **Simplified retry logic** without complex job queue (can add later if needed)
4. **OAuth state stored server-side** (more secure than client-side)

**Ready to proceed with implementation?**
