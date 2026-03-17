# Social Kit Testing Guide

## ✅ Test Data Added

I've added comprehensive seed data to test all Social Kit features:

### Instagram Profile Data
- **Bio**: Multi-line bio with emojis
  - 🏋️ Elite fitness & wellness
  - 📍 Bali, Indonesia
  - 👇 Book your transformation

- **Highlights**: 4 story highlights with cover images
  1. Classes (2 stories)
  2. Results (1 story)
  3. Facility (1 story)
  4. Nutrition (1 story)

- **Feed Posts**: 12 posts with real images from Unsplash
  - 11 image posts
  - 1 carousel post (3 images)
  - All with captions, hashtags, likes, and comment counts

- **Moodboard**: 6 high-quality fitness images in brand book

---

## 🧪 Testing Checklist

### 1. **Profiles & Editor Tab**
- [ ] Click "Social Kit" in the sidebar
- [ ] Verify phone mockup displays:
  - Profile picture (default circular image)
  - Stats: 1,204 Posts, 18.5k Followers, 402 Following
  - Bio with emojis and line breaks
  - 4 highlight bubbles with cover images
  - 12 grid posts loading properly
  
- [ ] **Test Image Editing**:
  - Click any grid post → Should open Post Editor
  - Change caption and hashtags
  - Save and verify changes persist
  
- [ ] **Test Highlights**:
  - Click a highlight bubble → Should show story viewer
  - Should display the story image full-screen
  - Click "New" highlight → Should allow creating new highlight

### 2. **Branding Assets Tab**
- [ ] Click "Branding Assets" tab
- [ ] Should see asset upload UI for:
  - Avatar/Profile Picture
  - Cover Photos
  - Platform-specific banners
  
- [ ] **Test Upload** (mock):
  - Click upload button
  - Should trigger file picker
  - After selection, should show preview

### 3. **Comparison Tab**
- [ ] Click "Comparison" tab
- [ ] Should see two views:
  - LEFT: Current brand profile
  - RIGHT: Proposed update / Competitor
  
- [ ] **Test Internal Comparison**:
  - Select "Internal" mode
  - Edit bio in "Proposed" side
  - Click "Apply Draft to Live Profile"
  - Should see success toast
  
- [ ] **Test Competitive Comparison**:
  - Select "Competitive" mode
  - Search for Instagram account (e.g., "nike")
  - Should show competitor profile on right side **(requires Meta connection)**
  
### 4. **Account Manager Tab**
- [ ] Click "Account Manager" tab
- [ ] Should see list of platforms:
  - Instagram (@glvt_bali) - Connected ✅
  - Facebook - Not connected
  - YouTube - Not connected
  - TikTok - Not connected
  - LinkedIn - Not connected
  
- [ ] **Test Connection**:
  - Click "Connect" on Facebook
  - Should trigger Facebook OAuth flow
  - After auth, should update status to Connected
  
- [ ] **Test Disconnection**:
  - Click "Disconnect" on Instagram
  - Should confirm disconnection
  - Status should update to "Not Connected"

### 5. **Creative Studio Tab**
- [ ] Click "Creative Studio" tab
- [ ] Should see prompt input field
- [ ] Enter: "Create 5 caption ideas for a gym transformation post"
- [ ] Click "Generate"
- [ ] Should display AI-generated caption suggestions **(requires backend integration)**

### 6. **Post Editor (Detailed)**
When you click any grid post in Profiles tab:

- [ ] Left panel shows:
  - Caption text area with existing caption
  - Hashtags field with existing hashtags
  - Media preview (small thumbnails)
  - Upload button for new media
  
- [ ] Right panel shows:
  - Live phone preview of how post will look
  - Shows: profile pic, username, image, caption, hashtags
  
- [ ] **Test Actions**:
  - Edit caption → Preview updates live
  - Edit hashtags → Preview updates live
  - Click "Save Design" → Saves as asset
  - Click "Publish" → Prompts confirmation **(requires Meta connection)**
  - Click "Done" → Closes editor and saves changes

---

## 🐛 Known Limitations (Expected Behavior)

1. **Live Data Requires Connection**: 
   - Competitor search needs Facebook/Instagram OAuth
   - Publishing needs active Meta connection
   
2. **Image Upload**: 
   - Currently triggers file picker but doesn't persist to database
   - This is expected - requires backend integration
   
3. **AI Caption Generation**: 
   - Needs Gemini API integration
   - Currently placeholder functionality

---

## 🔥 Key Features Working

✅ **Seed Data**: 12 posts with real images, highlights, bio
✅ **Phone Preview**: Realistic Instagram mockup with all data
✅ **Post Editor**: Full caption/hashtag editing with live preview
✅ **Carousel Support**: Post #10 has 3 images (swipe indicator)
✅ **Highlights**: 4 story highlights with click-to-view
✅ **Comparison View**: Side-by-side profile comparison
✅ **Account Manager**: Connection status display
✅ **Type Safety**: All TypeScript errors resolved

---

## 📸 What You Should See

### Main Grid View
![Instagram Grid](Expected: 12 posts in 3x4 grid, all fitness images)

### Highlights
![Highlights](Expected: 4 circular highlight bubbles: Classes, Results, Facility, Nutrition)

### Post Editor
![Editor](Expected: Split view - left side form, right side phone preview)

### Comparison
![Comparison](Expected: Two phone mockups side-by-side)

---

## 🚀 Next Steps After Testing

If everything works:
1. ✅ Verify all images load
2. ✅ Test editing and saving
3. ✅ Test comparison feature
4. ✅ Connect real Instagram account for live testing
5. ✅ Test publishing to Instagram

If issues found:
- Take screenshot
- Note which tab/feature
- Describe expected vs actual behavior
- I'll debug and fix immediately

---

## 💡 Pro Tips

- **Refresh Page**: If data doesn't load, refresh the page
- **Check Console**: Open browser DevTools (F12) for any errors
- **Test Order**: Test in the order listed above for best results
- **Local vs Vercel**: Test locally first (http://localhost:3000), then Vercel deployment

---

## Deploy Status

🚀 **Deploying to Vercel now...**
- Inspect: https://vercel.com/wellnessbrotherjay-debugs-projects/avlr-gym-interface/BZpvx7r3FWWCbCsaaEmxjQeupSLP
- Production URL: https://avlr-gym-interface-wellnessbrotherjay-debugs-projects.vercel.app

Build should complete in ~2-3 minutes.
