# Cloudflare CDN Configuration

**Document Version:** 1.0  
**Date:** February 2026  
**Author:** DevOps Team  
**Status:** Final

---

## Executive Summary

This document provides comprehensive setup instructions for configuring Cloudflare CDN for the Kids Petite e-commerce platform. Cloudflare provides global content delivery, DDoS protection, DNS management, SSL/TLS termination, and image optimization.

---

## 1. Overview

### 1.1 Why Cloudflare?

| Feature | Benefit |
|---------|---------|
| **Global CDN** | 300+ edge locations worldwide for fast content delivery |
| **DDoS Protection** | Automatic protection against distributed denial-of-service attacks |
| **WAF** | Web Application Firewall with OWASP rules |
| **SSL/TLS** | Free SSL certificates with automatic renewal |
| **Image Optimization** | Polish and Mirage for image optimization |
| **DNS** | Fast DNS resolution with DNSSEC support |

### 1.2 Architecture Integration

```
User Request → Cloudflare DNS → Cloudflare CDN/WAF → Vercel Edge → Next.js App
                                    ↓
                            Static Assets (Cached)
                            Images (Optimized)
                            API Requests (Proxied)
```

---

## 2. Initial Setup

### 2.1 Add Site to Cloudflare

1. **Log in to Cloudflare Dashboard**
   - Go to https://dash.cloudflare.com
   - Click "Add a site"

2. **Enter your domain**
   - Enter: `kidspetite.com`
   - Select plan: **Pro Plan** (recommended for e-commerce)

3. **Update Nameservers**
   - Cloudflare will provide two nameservers:
     ```
     ns1.cloudflare.com
     ns2.cloudflare.com
     ```
   - Update nameservers at your domain registrar

4. **Wait for propagation**
   - DNS propagation can take 24-48 hours
   - Verify in Cloudflare dashboard when complete

### 2.2 DNS Configuration

#### Required DNS Records

| Type | Name | Content | Proxy Status | TTL |
|------|------|---------|--------------|-----|
| A | @ | 76.76.21.21 | Proxied | Auto |
| A | www | 76.76.21.21 | Proxied | Auto |
| CNAME | api | kidspetite.vercel.app | Proxied | Auto |
| CNAME | sanity | cdn.sanity.io | DNS Only | Auto |
| TXT | @ | (SPF record) | DNS Only | Auto |
| TXT | _dmarc | (DMARC record) | DNS Only | Auto |

#### Vercel IP Addresses

The A record should point to Vercel's IP addresses:
```
76.76.21.21 (Primary)
```

#### DNS API Configuration (Optional)

```bash
# Using Cloudflare API to create records
curl -X POST "https://api.cloudflare.com/client/v4/zones/{zone_id}/dns_records" \
  -H "Authorization: Bearer {api_token}" \
  -H "Content-Type: application/json" \
  --data '{
    "type": "A",
    "name": "@",
    "content": "76.76.21.21",
    "proxied": true,
    "ttl": 1
  }'
```

---

## 3. SSL/TLS Configuration

### 3.1 SSL/TLS Settings

1. **Navigate to SSL/TLS → Overview**
2. **Set encryption mode to: Full (Strict)**
   - This ensures end-to-end encryption
   - Vercel provides valid SSL certificates

### 3.2 SSL/TLS Recommendations

| Setting | Value | Reason |
|---------|-------|--------|
| Encryption Mode | Full (Strict) | End-to-end encryption with valid certs |
| Always Use HTTPS | On | Redirect HTTP to HTTPS |
| Automatic HTTPS Rewrites | On | Fix mixed content |
| Minimum TLS Version | 1.2 | Modern security standard |
| Opportunistic Encryption | On | Encrypt where possible |
| TLS 1.3 | On | Latest TLS version |

### 3.3 Certificate Settings

1. **Edge Certificates**
   - Enable: Always Use HTTPS
   - Enable: Automatic HTTPS Rewrites
   - Enable: TLS 1.3

2. **Origin Certificates** (Not needed with Vercel)
   - Vercel handles origin certificates automatically

---

## 4. Caching Configuration

### 4.1 Page Rules

Navigate to **Rules → Page Rules** and create the following:

#### Rule 1: Static Assets - Aggressive Caching

```
URL Pattern: kidspetite.com/_next/static/*
Settings:
  - Cache Level: Cache Everything
  - Edge Cache TTL: 1 year
  - Browser Cache TTL: 1 year
```

#### Rule 2: Images - Long Cache with Optimization

```
URL Pattern: kidspetite.com/_next/image*
Settings:
  - Cache Level: Cache Everything
  - Edge Cache TTL: 1 month
  - Browser Cache TTL: 1 month
  - Polish: On
```

#### Rule 3: Sanity Images - CDN Caching

```
URL Pattern: cdn.sanity.io/*
Settings:
  - Cache Level: Cache Everything
  - Edge Cache TTL: 1 month
  - Browser Cache TTL: 1 week
```

#### Rule 4: API Routes - No Caching

```
URL Pattern: kidspetite.com/api/*
Settings:
  - Cache Level: Bypass
  - Disable Performance
```

#### Rule 5: Checkout - Security Focus

```
URL Pattern: kidspetite.com/checkout/*
Settings:
  - Cache Level: Bypass
  - Security Level: High
  - Browser Integrity Check: On
```

#### Rule 6: Admin - Maximum Security

```
URL Pattern: kidspetite.com/admin/*
Settings:
  - Cache Level: Bypass
  - Security Level: I'm Under Attack
  - Browser Integrity Check: On
```

### 4.2 Configuration Rules (Modern Approach)

Navigate to **Rules → Configuration Rules**:

#### Rule: Static Asset Caching

```yaml
Name: Static Asset Caching
Expression: (http.request.uri.path contains "/_next/static/") or 
            (http.request.uri.path contains "/images/") or
            (http.request.uri.path contains "/fonts/")
Settings:
  - Cache Level: Cache Everything
  - Edge Cache TTL: 31536000 (1 year)
  - Browser Cache TTL: 31536000 (1 year)
```

#### Rule: Product Pages - Moderate Caching

```yaml
Name: Product Page Caching
Expression: (http.request.uri.path contains "/products/") and 
            not (http.request.method eq "POST")
Settings:
  - Cache Level: Cache Everything
  - Edge Cache TTL: 3600 (1 hour)
  - Browser Cache TTL: 1800 (30 minutes)
  - Stale While Revalidate: 86400 (1 day)
```

### 4.3 Cache Rules Summary

| Content Type | Edge TTL | Browser TTL | Strategy |
|--------------|----------|-------------|----------|
| Static Assets (_next/static) | 1 year | 1 year | Cache Everything |
| Images | 1 month | 1 week | Cache Everything |
| Product Pages | 1 hour | 30 min | Stale-While-Revalidate |
| Category Pages | 5 min | 2 min | Stale-While-Revalidate |
| API Routes | 0 | 0 | Bypass |
| Checkout | 0 | 0 | Bypass |
| Admin | 0 | 0 | Bypass |

---

## 5. Security Configuration

### 5.1 WAF (Web Application Firewall)

Navigate to **Security → WAF**:

#### Managed Rules

1. **Cloudflare Specials** - Enable
2. **Cloudflare Managed Ruleset** - Enable
   - Action: Block
   - Anomaly Score: Low

3. **OWASP Core Ruleset** - Enable
   - Paranoia Level: 2
   - Action: Block

#### Custom Rules

##### Rule 1: Block Bad Bots

```yaml
Name: Block Bad Bots
Expression: (cf.client.bot) eq false and 
            (http.user_agent contains "bot" or 
             http.user_agent contains "crawler" or
             http.user_agent contains "scraper")
Action: Block
```

##### Rule 2: Rate Limiting API

```yaml
Name: Rate Limit API
Expression: (http.request.uri.path contains "/api/") and
            (http.request.method eq "POST")
Action: Rate Limit
Rate: 100 requests per minute
```

##### Rule 3: Protect Admin Routes

```yaml
Name: Protect Admin Routes
Expression: (http.request.uri.path contains "/admin")
Action: JS Challenge
```

##### Rule 4: Geographic Blocking (Optional)

```yaml
Name: Block High-Risk Countries
Expression: (ip.geoip.country in {"XX" "YY"})
Action: Block
```

### 5.2 Bot Management

Navigate to **Security → Bots**:

| Setting | Value |
|---------|-------|
| Bot Fight Mode | On |
| Super Bot Fight Mode | On (Pro Plan) |
| Bot Management | Enabled |

### 5.3 Security Level

Navigate to **Security → Settings**:

| Setting | Value |
|---------|-------|
| Security Level | Medium |
| Challenge Passage | 30 minutes |
| Browser Integrity Check | On |

---

## 6. Performance Optimization

### 6.1 Speed Settings

Navigate to **Speed → Optimization**:

| Setting | Value | Description |
|---------|-------|-------------|
| Auto Minify | CSS, JS, HTML | Minify all assets |
| Brotli | On | Better compression |
| Early Hints | On | Preload resources |
| Rocket Loader | Off | Can cause issues with Next.js |

### 6.2 Image Optimization

Navigate to **Speed → Optimization → Image Optimization**:

| Setting | Value |
|---------|-------|
| Polish | On (High) |
| WebP | On |
| Mirage | On |

**Note:** Next.js has built-in image optimization. Use Cloudflare Polish for additional optimization of Sanity images.

### 6.3 Caching Levels

Navigate to **Caching → Configuration**:

| Setting | Value |
|---------|-------|
| Caching Level | Standard |
| Browser Cache TTL | Respect Existing Headers |
| Always Online | On |

---

## 7. Transform Rules

### 7.1 URL Redirects

Navigate to **Rules → Redirect Rules**:

#### Redirect www to non-www

```yaml
Name: Redirect www to non-www
Expression: (http.host eq "www.kidspetite.com")
Action: Redirect
Target URL: https://kidspetite.com${http.request.uri}
Status Code: 301
```

#### Redirect HTTP to HTTPS

```yaml
Name: Force HTTPS
Expression: (http.request.scheme eq "http")
Action: Redirect
Target URL: https://${http.host}${http.request.uri}
Status Code: 301
```

### 7.2 Header Modifications

Navigate to **Rules → Transform Rules → Modify Response Header**:

#### Security Headers

```yaml
Name: Security Headers
Expression: (http.request.uri.path ne "/api/*")
Headers:
  - X-Content-Type-Options: nosniff
  - X-Frame-Options: SAMEORIGIN
  - X-XSS-Protection: 1; mode=block
  - Referrer-Policy: strict-origin-when-cross-origin
  - Permissions-Policy: camera=(), microphone=(), geolocation=()
```

**Note:** Next.js middleware handles most security headers. These are backup.

---

## 8. Workers (Optional)

### 8.1 Cache API Worker

For advanced caching control, create a Cloudflare Worker:

```javascript
// worker-cache-api.js
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  const cache = caches.default
  const url = new URL(request.url)
  
  // Check cache first
  let response = await cache.match(request)
  
  if (response) {
    return response
  }
  
  // Fetch from origin
  response = await fetch(request)
  
  // Cache successful responses
  if (response.status === 200) {
    const headers = new Headers(response.headers)
    headers.set('Cache-Control', 'public, max-age=3600')
    
    const cachedResponse = new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: headers
    })
    
    event.waitUntil(cache.put(request, cachedResponse.clone()))
    return cachedResponse
  }
  
  return response
}
```

### 8.2 Deploy Worker

```bash
# Install Wrangler CLI
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Deploy worker
wrangler publish worker-cache-api.js
```

---

## 9. Monitoring & Analytics

### 9.1 Analytics

Navigate to **Analytics & Logs**:

- **Traffic**: Request volume, bandwidth, unique visitors
- **Security**: Threats blocked, bots detected
- **Performance**: Cache hit ratio, response times

### 9.2 Logs

For detailed logs, enable **Logpush**:

1. Navigate to **Analytics & Logs → Logpush**
2. Add a destination (S3, R2, or other)
3. Configure log fields

### 9.3 Key Metrics to Monitor

| Metric | Target | Alert Threshold |
|--------|--------|-----------------|
| Cache Hit Ratio | > 90% | < 80% |
| Response Time (p95) | < 200ms | > 500ms |
| Error Rate | < 0.1% | > 1% |
| Bandwidth | Monitor | Unusual spike |
| Threats Blocked | Monitor | Sudden increase |

---

## 10. Cache Purge

### 10.1 Manual Purge

1. Navigate to **Caching → Configuration**
2. Click "Purge Cache"
3. Choose:
   - **Purge Everything** (use sparingly)
   - **Custom Purge** (by URL or tag)

### 10.2 API Purge

Use the Cloudflare API to purge cache programmatically:

```bash
# Purge everything
curl -X POST "https://api.cloudflare.com/client/v4/zones/{zone_id}/purge_cache" \
  -H "Authorization: Bearer {api_token}" \
  -H "Content-Type: application/json" \
  --data '{"purge_everything": true}'

# Purge by URL
curl -X POST "https://api.cloudflare.com/client/v4/zones/{zone_id}/purge_cache" \
  -H "Authorization: Bearer {api_token}" \
  -H "Content-Type: application/json" \
  --data '{
    "files": [
      "https://kidspetite.com/products/example-product",
      "https://kidspetite.com/category/baby-clothes"
    ]
  }'

# Purge by Cache Tag (Enterprise only)
curl -X POST "https://api.cloudflare.com/client/v4/zones/{zone_id}/purge_cache" \
  -H "Authorization: Bearer {api_token}" \
  -H "Content-Type: application/json" \
  --data '{"tags": ["products", "category-baby"]}'
```

### 10.3 Automated Purge on Deploy

Add to your CI/CD pipeline:

```yaml
# .github/workflows/deploy.yml
- name: Purge Cloudflare Cache
  run: |
    curl -X POST "https://api.cloudflare.com/client/v4/zones/${{ secrets.CLOUDFLARE_ZONE_ID }}/purge_cache" \
      -H "Authorization: Bearer ${{ secrets.CLOUDFLARE_API_TOKEN }}" \
      -H "Content-Type: application/json" \
      --data '{"purge_everything": true}'
```

---

## 11. Environment Variables

Add these to your `.env.local` and Vercel environment:

```bash
# Cloudflare Configuration (Optional - for API access)
CLOUDFLARE_ZONE_ID=your_zone_id
CLOUDFLARE_API_TOKEN=your_api_token
```

### 11.1 Getting Zone ID

1. Go to Cloudflare Dashboard
2. Select your domain
3. Find "Zone ID" in the right sidebar

### 11.2 Creating API Token

1. Go to **My Profile → API Tokens**
2. Click "Create Token"
3. Use template: **Cache Purge** or create custom
4. Required permissions:
   - Zone → Cache Purge → Purge
   - Zone → Zone → Read

---

## 12. Troubleshooting

### 12.1 Common Issues

#### Issue: 522 Connection Timed Out

**Cause:** Cloudflare cannot connect to origin  
**Solution:**
- Verify Vercel deployment is running
- Check if Vercel is blocking Cloudflare IPs
- Ensure SSL mode is "Full (Strict)"

#### Issue: Mixed Content Warnings

**Cause:** HTTP resources on HTTPS page  
**Solution:**
- Enable "Always Use HTTPS"
- Enable "Automatic HTTPS Rewrites"
- Check for hardcoded HTTP URLs

#### Issue: Cache Not Working

**Cause:** Incorrect cache headers or rules  
**Solution:**
- Check Page Rules are applied
- Verify origin cache headers
- Check for "no-store" or "no-cache" headers

#### Issue: Admin Panel Not Loading

**Cause:** WAF blocking legitimate requests  
**Solution:**
- Add admin IP to allowlist
- Create WAF exception for admin routes
- Temporarily lower security level

### 12.2 Debug Mode

Enable "Development Mode" temporarily to bypass cache:

1. Navigate to **Caching → Configuration**
2. Toggle "Development Mode" to On
3. Cache is bypassed for 3 hours

---

## 13. Best Practices

### 13.1 Do's

- ✅ Use "Full (Strict)" SSL mode
- ✅ Enable WAF with OWASP rules
- ✅ Cache static assets aggressively
- ✅ Use Page Rules for fine-grained control
- ✅ Monitor cache hit ratio
- ✅ Purge cache selectively when possible
- ✅ Keep security level at "Medium" or higher

### 13.2 Don'ts

- ❌ Don't cache API routes that handle mutations
- ❌ Don't use "Flexible" SSL mode
- ❌ Don't enable Rocket Loader (conflicts with Next.js)
- ❌ Don't purge entire cache frequently
- ❌ Don't disable WAF for any route
- ❌ Don't use "I'm Under Attack" mode for normal traffic

---

## 14. Checklist

### Initial Setup

- [ ] Add site to Cloudflare
- [ ] Update nameservers at registrar
- [ ] Configure DNS records
- [ ] Set SSL mode to Full (Strict)
- [ ] Enable Always Use HTTPS

### Security

- [ ] Enable WAF
- [ ] Configure OWASP rules
- [ ] Set up custom security rules
- [ ] Enable Bot Fight Mode
- [ ] Configure rate limiting

### Performance

- [ ] Create Page Rules for caching
- [ ] Enable Auto Minify
- [ ] Enable Brotli compression
- [ ] Configure Polish for images
- [ ] Set up Early Hints

### Monitoring

- [ ] Review analytics dashboard
- [ ] Set up alerts
- [ ] Configure Logpush (optional)
- [ ] Document cache purge procedures

---

## 15. References

- [Cloudflare Documentation](https://developers.cloudflare.com/)
- [Cloudflare Page Rules](https://developers.cloudflare.com/rules/page-rules/)
- [Cloudflare WAF](https://developers.cloudflare.com/waf/)
- [Cloudflare API](https://developers.cloudflare.com/api/)
- [Vercel + Cloudflare Integration](https://vercel.com/docs/projects/domains/add-a-domain#using-cloudflare-for-dns)
