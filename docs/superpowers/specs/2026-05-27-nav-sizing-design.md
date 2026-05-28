# Nav/Header Sizing — Design Spec

**Date:** 2026-05-27  
**Status:** Approved

## Goal
Increase mobile navbar and top header size slightly for better touch comfort and readability. Desktop must be completely unchanged.

## Files
- Modify: `components/navigation/BottomNav.tsx`
- Modify: `components/navigation/TopBrandBar.tsx`

## BottomNav Changes (mobile only)

| Element | Before | After |
|---------|--------|-------|
| DockButton circles | `size-11` (44px) | `size-12` (48px) |
| Icons inside buttons | `size-6` (24px) | `size-[26px]` |
| Nav gap | `gap-1.5` | `gap-2` |
| Month pill height | `h-11` (44px) | `h-12` (48px) |
| Month pill padding | `px-2` | `px-3` |
| Month text size | `text-[13px]` | `text-[14px]` |
| Month year text | existing | stays |

All desktop (`sm:`, `md:`) classes untouched.

## TopBrandBar Changes (mobile only)

| Element | Before | After |
|---------|--------|-------|
| Settings/Search circles | `size-11` | `size-12` |
| Brand pill height | `h-11` | `h-12` |
| Logo image | `size-[18px]` | `size-5` (20px) |
| Brand text | `text-[14px]` | `text-[15px]` |

All `md:` classes untouched.

## Acceptance Criteria
- [ ] BottomNav is 48px tall on mobile, unchanged on desktop
- [ ] TopBrandBar icon circles are 48px on mobile, unchanged on desktop
- [ ] All touch targets ≥ 44px
- [ ] Floating pill aesthetic preserved
- [ ] No layout shifts or overflow
