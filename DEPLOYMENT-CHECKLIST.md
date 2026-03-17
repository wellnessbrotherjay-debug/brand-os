# 🚀 Production Deployment Checklist for iPad Video Streaming

## ✅ Critical Requirements for iPad Video Streaming

### 1. **HTTPS is REQUIRED** 🔒
iOS **blocks** video autoplay on HTTP. You MUST use HTTPS in production.

**Checklist:**
- [ ] SSL certificate installed on your domain
- [ ] HTTPS redirects working (HTTP → HTTPS)
- [ ] No mixed content warnings (all resources loaded via HTTPS)

**Test:** Open your site on iPad with `https://` - videos should autoplay

---

### 2. **Video Format Compatibility** 🎥
iOS prefers specific formats for smooth streaming.

**Supported formats:**
- ✅ **MP4 with H.264 codec** (best compatibility)
- ✅ **Cloudflare Stream** (automatic transcoding)
- ❌ WebM (not supported on Safari/iOS)
- ❌ AVI, MOV (unless H.264 encoded)

**Checklist:**
- [ ] Videos are MP4 format with H.264 codec
- [ ] Audio is AAC codec
- [ ] Videos are hosted on Cloudflare Stream or similar CDN
- [ ] Video files are accessible from your server

**Test:** Videos should load and play on Safari desktop

---

### 3. **CORS Configuration** 🌐
If using Cloudflare Stream or external video hosting:

**Add to your Cloudflare Stream dashboard:**
```
Allowed Origins: https://your-domain.com
Allowed Methods: GET, HEAD
Allowed Headers: *
Max Age: 3600
```

**Checklist:**
- [ ] CORS configured for video domain
- [ ] No CORS errors in browser console
- [ ] Videos load from external domains

---

### 4. **iOS Video Attributes** 📱
We've added iOS-specific attributes to ensure compatibility:

**Already implemented:**
- ✅ `playsInline` - Prevents fullscreen on iOS
- ✅ `webkit-playsinline="true"` - Safari-specific
- ✅ `muted` - Required for autoplay
- ✅ `loop` - Continuous playback
- ✅ `preload="auto"` - Faster startup

**Checklist:**
- [ ] Video element has all iOS attributes
- [ ] Videos autoplay on page load
- [ ] Videos loop continuously

---

### 5. **Network & Bandwidth** 📡
iPad requires stable internet connection for streaming.

**Checklist:**
- [ ] Reliable WiFi at deployment location
- [ ] Sufficient bandwidth (5+ Mbps for HD video)
- [ ] Video CDN is geographically close

---

### 6. **Testing on iPad** 🧪
Before production deployment:

**Pre-deployment testing:**
```bash
# Test on local network first
# 1. Start dev server with HTTPS
npm run dev

# 2. Get your local IP
# On Mac: System Preferences → Network
# Example: 192.168.1.100

# 3. On iPad Safari, open:
https://192.168.1.100:3000/display-tablet/1

# 4. Accept security warning (self-signed cert)
# 5. Test video playback
```

**Production testing:**
- [ ] Deploy to staging environment with HTTPS
- [ ] Test on actual iPad device
- [ ] Test in Safari (not Chrome)
- [ ] Test autoplay on page load
- [ ] Test video loop
- [ ] Test phase switching with video

---

## 🚨 Common Issues & Fixes

### Issue: "Video autoplay blocked"
**Cause:** iOS autoplay policy
**Fix:** Ensure video is `muted` and on HTTPS
```typescript
<video autoPlay muted playsInline />
```

### Issue: "Video not loading"
**Cause:** Wrong format or missing HTTPS
**Fix:** Use MP4 with H.264, ensure HTTPS

### Issue: "Video loads but doesn't play"
**Cause:** Video codec not supported
**Fix:** Transcode to H.264 using Cloudflare Stream

### Issue: "Mixed content warnings"
**Cause:** Loading video via HTTP on HTTPS page
**Fix:** Host videos on HTTPS CDN

---

## 🎯 Pre-Deployment Checklist

### Week Before Deployment:
- [ ] Test all videos on Safari desktop
- [ ] Test on local iPad over local network
- [ ] Verify video formats are compatible
- [ ] Set up SSL certificate
- [ ] Configure DNS for production domain

### Day Before Deployment:
- [ ] Deploy to staging with HTTPS
- [ ] Test full workout flow on iPad
- [ ] Test video autoplay and loop
- [ ] Test phase switching with video
- [ ] Test multiple iPad devices simultaneously

### Deployment Day:
- [ ] Deploy to production
- [ ] Test on production iPad
- [ ] Verify HTTPS is working
- [ ] Monitor for video loading errors
- [ ] Have backup plan ready

---

## 📞 Troubleshooting Commands

**Check if HTTPS is working:**
```bash
curl -I https://your-domain.com
# Should return: HTTP/2 200
# With: strict-transport-security header
```

**Check video accessibility:**
```bash
curl -I https://your-video-cdn.com/video.mp4
# Should return: HTTP/2 200
# With CORS headers
```

**Test video on iPad Safari:**
1. Open Safari
2. Navigate to your site
3. Open Safari Developer Tools (Settings → Advanced → Show Web Inspector)
4. Connect to Mac Safari
5. Check console for video errors

---

## ✅ Success Criteria

Your deployment is successful when:
- ✅ Videos autoplay on page load (no user interaction)
- ✅ Videos loop continuously
- ✅ Videos pause during rest phase
- ✅ Videos resume during work phase
- ✅ Works on multiple iPads simultaneously
- ✅ No console errors
- ✅ Smooth playback with no buffering

---

## 🚀 Quick Start (Recommended Approach)

**Use Cloudflare Stream** (already implemented):
1. Upload videos to Cloudflare Stream
2. Use video IDs in your workout plan
3. Cloudflare automatically transcodes to iOS-compatible formats
4. Videos are delivered via their global CDN
5. Works perfectly on iPad with HTTPS

**Alternative: Self-hosted videos**
1. Convert videos to MP4 (H.264/AAC)
2. Host on your server with HTTPS
3. Add proper CORS headers
4. Ensure videos are accessible

---

## 📱 iOS-Specific Notes

**Safari vs Chrome on iPad:**
- ✅ Safari: Best support, use this for testing
- ⚠️ Chrome: May have autoplay issues
- ❌ Third-party browsers: Not recommended

**iPad Model Differences:**
- iPad Pro (2020+): Best video performance
- iPad Air (2019+): Good performance
- iPad Mini (2019+): Good performance
- Older iPads: May have buffering issues

---

## 🎓 Final Tips

1. **Always test on real iPad**, not simulator
2. **Use Safari**, not Chrome
3. **Ensure HTTPS** in production
4. **Use Cloudflare Stream** for best results
5. **Test before you deploy** to production

Good luck with your deployment! 🚀
