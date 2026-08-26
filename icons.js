/* =========================================================
   icons.js — Linoleum.app uchun estetik chiziqli ikonkalar
   SF Symbols uslubidagi, bir xil qalinlikdagi (stroke) ikonlar.
   Har biri currentColor bilan chiziladi — rangi CSS orqali
   boshqariladi (button/parent elementning "color" xossasi).
   ========================================================= */

const ICONS = {

  // Ilova logotipi — nafis "parket taxtasi" belgisi
  logo: `
    <svg viewBox="0 0 40 40" width="22" height="22" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="3" y="6" width="15" height="12" rx="3.2" fill="currentColor" opacity="0.95"/>
      <rect x="20" y="6" width="17" height="12" rx="3.2" fill="currentColor" opacity="0.55"/>
      <rect x="3" y="21" width="17" height="12" rx="3.2" fill="currentColor" opacity="0.55"/>
      <rect x="22" y="21" width="15" height="12" rx="3.2" fill="currentColor" opacity="0.95"/>
    </svg>`,

  // Kassa — savat
  cart: `
    <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 4h2l2.2 11.2a2 2 0 0 0 2 1.6h7.9a2 2 0 0 0 2-1.6L20.5 8H6"/>
      <circle cx="9.5" cy="20" r="1.4" fill="currentColor" stroke="none"/>
      <circle cx="17" cy="20" r="1.4" fill="currentColor" stroke="none"/>
    </svg>`,

  // Ombor — quti/arxiv
  box: `
    <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg">
      <path d="M3.5 8.2 12 4l8.5 4.2v8.1L12 20.5l-8.5-4.2Z"/>
      <path d="M3.5 8.2 12 12l8.5-4.2M12 12v8.5"/>
    </svg>`,

  // Skaner — ramkali kamera
  scanner: `
    <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 8V6a2 2 0 0 1 2-2h2M4 16v2a2 2 0 0 0 2 2h2M20 8V6a2 2 0 0 0-2-2h-2M20 16v2a2 2 0 0 1-2 2h-2"/>
      <circle cx="12" cy="12" r="3.4"/>
    </svg>`,

  // Hisobot — ustunli diagramma
  chart: `
    <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 20V10M12 20V4M20 20v-7"/>
    </svg>`,

  // Fayl / rasm tanlash rejimi
  fileMode: `
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg">
      <rect x="3.5" y="5" width="17" height="14" rx="2.6"/>
      <circle cx="8.4" cy="10" r="1.5"/>
      <path d="m4.5 17 4.6-4.6a1.8 1.8 0 0 1 2.5 0l1 1 3-3a1.8 1.8 0 0 1 2.5 0l2.5 2.5"/>
    </svg>`,

  // Jonli kamera rejimi
  liveMode: `
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg">
      <rect x="2.5" y="6.5" width="12.5" height="11" rx="2.6"/>
      <path d="M15.5 10.2 21 7v10l-5.5-3.2Z"/>
    </svg>`,

  // Suratga olish tugmasi (obturator)
  shutter: `
    <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="8.5"/>
      <circle cx="12" cy="12" r="3.2" fill="currentColor" stroke="none"/>
    </svg>`,

  // Yuklab olish (backup export)
  download: `
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 3.5v11M8 11l4 4 4-4"/>
      <path d="M4.5 16.5V19a1.7 1.7 0 0 0 1.7 1.7h11.6A1.7 1.7 0 0 0 19.5 19v-2.5"/>
    </svg>`,

  // Fayldan tiklash (restore/import)
  upload: `
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 14.5v-11M8 6.5l4-4 4 4"/>
      <path d="M4.5 16.5V19a1.7 1.7 0 0 0 1.7 1.7h11.6A1.7 1.7 0 0 0 19.5 19v-2.5"/>
    </svg>`,

  // Telegram bot — qog'oz samolyot
  send: `
    <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg">
      <path d="M20.5 3.5 3 10.6l6.2 2.3M20.5 3.5 14.9 20l-5.7-7.1M20.5 3.5 9.2 13.5"/>
    </svg>`,

  // Keldi/Ketdi hisoboti — samolyot
  plane: `
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M21 15.5v-2l-8-5V4a1.5 1.5 0 0 0-3 0v4.5l-8 5v2l8-2.4V18l-2.3 1.6v1.6l3.3-0.9 3.3 0.9v-1.6L13 18v-4.9Z"/>
    </svg>`,

  // Sozlamalar — tishli g'ildirak
  gear: `
    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="3"/>
      <path d="M12 3.5v2M12 18.5v2M20.5 12h-2M5.5 12h-2M17.8 6.2l-1.4 1.4M7.6 16.4l-1.4 1.4M17.8 17.8l-1.4-1.4M7.6 7.6 6.2 6.2"/>
    </svg>`,

  // Tahrirlash — qalam
  pencil: `
    <svg viewBox="0 0 24 24" width="14.5" height="14.5" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg">
      <path d="M15.7 4.3a1.9 1.9 0 0 1 2.7 0l1.3 1.3a1.9 1.9 0 0 1 0 2.7L8.4 19.6l-4.6 1 1-4.6Z"/>
      <path d="M14.2 5.8 18.2 9.8"/>
    </svg>`,

  // O'chirish — savatcha
  trash: `
    <svg viewBox="0 0 24 24" width="14.5" height="14.5" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg">
      <path d="M4.5 7h15M9.5 7V5.2A1.2 1.2 0 0 1 10.7 4h2.6a1.2 1.2 0 0 1 1.2 1.2V7M18 7l-.8 12a2 2 0 0 1-2 1.9H8.8a2 2 0 0 1-2-1.9L6 7"/>
      <path d="M10.2 11v6M13.8 11v6"/>
    </svg>`,

  // Qoldiq qo'shish — doiradagi plyus
  plusCircle: `
    <svg viewBox="0 0 24 24" width="14.5" height="14.5" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="9"/>
      <path d="M12 8v8M8 12h8"/>
    </svg>`,

  // Bekor qilish / olib tashlash — doiradagi X
  xCircle: `
    <svg viewBox="0 0 24 24" width="14.5" height="14.5" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="9"/>
      <path d="m9.2 9.2 5.6 5.6M14.8 9.2l-5.6 5.6"/>
    </svg>`,

  // Tasdiqlash — check
  check: `
    <svg viewBox="0 0 24 24" width="14.5" height="14.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg">
      <path d="M5 12.5 9.5 17 19 6.5"/>
    </svg>`,

  // Qidiruv — lupa
  search: `
    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg">
      <circle cx="10.8" cy="10.8" r="6.3"/>
      <path d="m19.5 19.5-4-4"/>
    </svg>`,

  // Rasm yo'q placeholder
  image: `
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg">
      <rect x="3.5" y="5" width="17" height="14" rx="2.6"/>
      <circle cx="8.4" cy="10" r="1.4"/>
      <path d="m4.5 17 4.6-4.6a1.8 1.8 0 0 1 2.5 0l1 1 3-3a1.8 1.8 0 0 1 2.5 0l2.5 2.5"/>
    </svg>`,

  // Savatga qo'shish (skaner natijasi)
  addToCart: `
    <svg viewBox="0 0 24 24" width="14.5" height="14.5" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 4h2l2.2 11.2a2 2 0 0 0 2 1.6h7.9a2 2 0 0 0 2-1.6L20.5 8H6"/>
      <path d="M15.5 3.5v5M13 6h5"/>
      <circle cx="9.5" cy="20" r="1.2" fill="currentColor" stroke="none"/>
      <circle cx="17" cy="20" r="1.2" fill="currentColor" stroke="none"/>
    </svg>`,

  // Plyus (umumiy, tugma ichida yozuv oldidan)
  plus: `
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 5v14M5 12h14"/>
    </svg>`
};
