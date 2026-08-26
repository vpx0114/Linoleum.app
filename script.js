if ('serviceWorker' in navigator) {
  const swCode = `
    const CACHE_NAME = 'ai-model-cache-v1';
    self.addEventListener('fetch', (event) => {
      if (event.request.url.includes('cdn.jsdelivr.net') || event.request.url.includes('tfhub.dev')) {
        event.respondWith(
          caches.open(CACHE_NAME).then((cache) => {
            return cache.match(event.request).then((response) => {
              return response || fetch(event.request).then((networkResponse) => {
                cache.put(event.request, networkResponse.clone());
                return networkResponse;
              });
            });
          })
        );
      }
    });
  `;
  const blob = new Blob([swCode], { type: 'application/javascript' });
  const swUrl = URL.createObjectURL(blob);
  navigator.serviceWorker.register(swUrl).catch(err => console.log('SW error:', err));
}

const fmt = n => new Intl.NumberFormat('uz-UZ').format(Math.round(n));

const localStore = {
  async get(key){
    try{
      const val = localStorage.getItem(key);
      return val !== null ? { key, value: val } : null;
    }catch(e){ return null; }
  },
  async set(key, value){
    try{
      localStorage.setItem(key, value);
      return { key, value };
    }catch(e){ return null; }
  }
};

let products = [];
let sales = [];
let expenses = [];
let cart = [];
let cameraStream = null;

function resizeImageFile(file, maxSize){
  return new Promise((resolve, reject)=>{
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Faylni o'qib bo'lmadi"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Rasmni ochib bo'lmadi"));
      img.onload = () => {
        let w = img.width, h = img.height;
        if(w > h && w > maxSize){ h = Math.round(h * maxSize / w); w = maxSize; }
        else if(h > maxSize){ w = Math.round(w * maxSize / h); h = maxSize; }
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', 0.72));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

function showToast(msg){
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(()=>t.classList.remove('show'), 1800);
}

function setStatus(text){
  document.getElementById('statusTag').textContent = text;
}

function formatDateTime(iso){
  const d = new Date(iso);
  const pad = n => String(n).padStart(2,'0');
  return `${pad(d.getDate())}.${pad(d.getMonth()+1)}.${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

async function loadData(){
  setStatus('yuklanmoqda...');
  try{
    const p = await localStore.get('mahsulotlar');
    products = p ? JSON.parse(p.value) : [];
  }catch(e){ products = []; }
  try{
    const s = await localStore.get('sotuvlar');
    sales = s ? JSON.parse(s.value) : [];
  }catch(e){ sales = []; }
  try{
    const ex = await localStore.get('chiqimlar');
    expenses = ex ? JSON.parse(ex.value) : [];
  }catch(e){ expenses = []; }

  // Telegram sozlamalarini yuklash
  try{
    const tToken = await localStore.get('tg_token');
    const tChat = await localStore.get('tg_chat');
    if(tToken) document.getElementById('tgBotToken').value = tToken.value;
    if(tChat) document.getElementById('tgChatId').value = tChat.value;
  }catch(e){}

  setStatus('saqlangan');
  renderAll();

  // DASTUR KİRİSHİ BİLAN AI MODELİNİ ORQA FONDA YUKLASH
  loadMobilenetModel().catch(e=>console.log("AI pre-load err:", e));
}

async function saveProducts(){
  try{
    const r = await localStore.set('mahsulotlar', JSON.stringify(products));
    if(!r) showToast('Saqlashda xatolik');
  }catch(e){ showToast('Saqlashda xatolik: ' + e.message); }
}

async function saveSales(){
  try{
    const r = await localStore.set('sotuvlar', JSON.stringify(sales));
    if(!r) showToast('Saqlashda xatolik');
  }catch(e){ showToast('Saqlashda xatolik: ' + e.message); }
}

async function saveExpenses(){
  try{
    const r = await localStore.set('chiqimlar', JSON.stringify(expenses));
    if(!r) showToast('Saqlashda xatolik');
  }catch(e){ showToast('Saqlashda xatolik: ' + e.message); }
}

// TELEGRAM SOZLAMALARINI ACHISH / YOPISH
function toggleTgSettings(){
  const box = document.getElementById('tgSettingsBox');
  if(box.style.display === 'none' || !box.style.display){
    box.style.display = 'block';
  } else {
    box.style.display = 'none';
  }
}

async function saveTgSettings(){
  const token = document.getElementById('tgBotToken').value.trim();
  const chatId = document.getElementById('tgChatId').value.trim();
  await localStore.set('tg_token', token);
  await localStore.set('tg_chat', chatId);
  showToast("Bot sozlamalari saqlandi");
}

// 3 METRDAN KAM QOLGANDA TEZKOR TELEGRAM XABARI
async function checkAndSendLowStockAlert(product){
  if(!product || product.qty >= 3) return;

  const token = document.getElementById('tgBotToken')?.value.trim();
  const chatId = document.getElementById('tgChatId')?.value.trim();
  if(!token || !chatId) return;

  const nowStr = formatDateTime(new Date().toISOString());
  const docNum = product.doc || product.name;

  const alertMsg = `‼️💢💢💢💢‼️\n` +
                   `sanasi: ${nowStr}\n` +
                   `Hujjat raqami: ${docNum}\n` +
                   `Bizda ${product.qty} m qoldi.`;

  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: alertMsg })
    });
  } catch(e) {
    console.error("Kam qolganlik xabari yuborilmadi:", e);
  }
}

function renderAll(){
  renderKassaList();
  renderReceipt();
  renderOmborTable();
  renderHisobot();
}

// ---------- KASSA ----------
function renderKassaList(){
  const el = document.getElementById('kassaProductList');
  el.innerHTML = '';
  if(products.length === 0){
    el.innerHTML = '<div class="empty-note">Avval "Ombor" bo\'limida mahsulot qo\'shing</div>';
    return;
  }
  products.forEach(p=>{
    const row = document.createElement('div');
    row.className = 'product-row';
    const low = p.qty < 3;
    const thumb = p.image
      ? `<img class="pthumb" src="${p.image}">`
      : `<div class="pthumb-placeholder">—</div>`;
    row.innerHTML = `
      <div class="pleft">
        ${thumb}
        <div>
          <div class="pname">${escapeHtml(p.name)}</div>
          <div class="pmeta">${escapeHtml(p.doc || '—')}</div>
        </div>
      </div>
      <div>
        <div class="pprice">${fmt(p.price)}</div>
        <div class="pstock ${low ? 'low' : ''}">${p.qty} m qoldi</div>
      </div>
    `;
    row.onclick = () => addToCart(p);
    el.appendChild(row);
  });
}

function addToCart(product){
  if(product.qty <= 0){ showToast(`${product.name} — qoldiq yo'q`); return; }
  const existing = cart.find(c => c.productId === product.id);
  if(existing){
    if(existing.qty + 1 > product.qty){ showToast('Omborda yetarli emas'); return; }
    existing.qty += 1;
  } else {
    cart.push({productId: product.id, name: product.name, price: product.price, qty: 1});
  }
  renderReceipt();
}

function changeCartPrice(productId, newPriceStr){
  const price = parseFloat(newPriceStr);
  const item = cart.find(c => c.productId === productId);
  if(!item || isNaN(price) || price < 0){ renderReceipt(); return; }
  item.price = price;
  renderReceipt();
}

function changeCartQty(productId, delta){
  const item = cart.find(c => c.productId === productId);
  const product = products.find(p => p.id === productId);
  if(!item) return;
  const newQty = Math.round((item.qty + delta) * 100) / 100;
  if(newQty <= 0){
    cart = cart.filter(c => c.productId !== productId);
  } else if(product && newQty > product.qty){
    showToast('Omborda yetarli emas');
    return;
  } else {
    item.qty = newQty;
  }
  renderReceipt();
}

function setCartQty(productId, newQtyStr){
  const newQty = parseFloat(newQtyStr);
  const item = cart.find(c => c.productId === productId);
  const product = products.find(p => p.id === productId);
  if(!item) return;
  if(isNaN(newQty) || newQty <= 0){
    cart = cart.filter(c => c.productId !== productId);
    renderReceipt();
    return;
  }
  if(product && newQty > product.qty){
    showToast('Omborda yetarli emas: ' + product.qty + ' m bor');
    item.qty = product.qty;
    renderReceipt();
    return;
  }
  item.qty = newQty;
  renderReceipt();
}

function renderReceipt(){
  const el = document.getElementById('receiptItems');
  const totalEl = document.getElementById('receiptTotal');
  const sellBtn = document.getElementById('sellBtn');
  el.innerHTML = '';
  if(cart.length === 0){
    el.innerHTML = '<div class="receipt-empty">Savat bo\'sh</div>';
    totalEl.textContent = '0';
    sellBtn.disabled = true;
    return;
  }
  let total = 0;
  cart.forEach(item=>{
    total += item.price * item.qty;
    const row = document.createElement('div');
    row.className = 'receipt-item';
    row.innerHTML = `
      <span class="rname">${escapeHtml(item.name)}</span>
      <span class="rqty">
        <button onclick="changeCartQty('${item.productId}', -1)">−</button>
        <input type="number" class="qty-edit" step="0.01" value="${item.qty}" onchange="setCartQty('${item.productId}', this.value)">
        <button onclick="changeCartQty('${item.productId}', 1)">+</button>
      </span>
      <input type="number" class="price-edit" value="${item.price}" onchange="changeCartPrice('${item.productId}', this.value)">
      <span class="rline">${fmt(item.price * item.qty)}</span>
    `;
    el.appendChild(row);
  });
  totalEl.textContent = fmt(total);
  sellBtn.disabled = false;
}

async function finalizeSale(){
  if(cart.length === 0) return;
  const sellBtn = document.getElementById('sellBtn');
  sellBtn.disabled = true;
  sellBtn.textContent = 'Saqlanmoqda...';

  const total = cart.reduce((s,i)=> s + i.price*i.qty, 0);
  const sale = {
    id: 'sale_' + Date.now(),
    timestamp: new Date().toISOString(),
    items: cart.map(c => {
      const prod = products.find(p=>p.id === c.productId);
      return {
        productId: c.productId,
        name: c.name,
        doc: prod ? prod.doc : '',
        qty: c.qty,
        price: c.price
      };
    }),
    total
  };
  sales.push(sale);

  cart.forEach(item=>{
    const product = products.find(p => p.id === item.productId);
    if(product) {
      product.qty = Math.max(0, product.qty - item.qty);
      // Sotuvdan so'ng 3 metrdan kam qolgan bo'lsa darhol telegram xabar yuboriladi
      checkAndSendLowStockAlert(product);
    }
  });

  await Promise.all([saveSales(), saveProducts()]);
  cart = [];
  sellBtn.textContent = 'Sotish';
  showToast('Sotuv saqlandi: ' + fmt(total) + " so'm");
  renderAll();
}

// ---------- OMBOR ----------
let newImageData = null;
let editingId = null;
let editImageData = undefined;

async function handleNewImageFile(input){
  const file = input.files && input.files[0];
  if(!file) return;
  try{
    newImageData = await resizeImageFile(file, 300);
    document.getElementById('newImagePreviewWrap').innerHTML = `<img class="img-preview" src="${newImageData}">`;
  }catch(e){
    showToast('Rasmni yuklashda xatolik');
  }
}

async function addProduct(){
  const name = document.getElementById('newName').value.trim();
  const doc = document.getElementById('newDoc').value.trim();
  const price = parseFloat(document.getElementById('newPrice').value);
  const qty = parseFloat(document.getElementById('newQty').value);

  if(!name){ showToast('Nomini kiriting'); return; }
  if(isNaN(price) || price < 0){ showToast("Narxni to'g'ri kiriting"); return; }
  if(isNaN(qty) || qty < 0){ showToast("Qoldiqni to'g'ri kiriting"); return; }

  const newProd = {id: 'prod_' + Date.now(), name, doc, price, qty, image: newImageData || null};
  products.push(newProd);
  await saveProducts();

  // Agar yangi mahsulot 3 metrdan kam bo'lib qo'shilgan bo'lsa xabar beradi
  checkAndSendLowStockAlert(newProd);

  document.getElementById('newName').value = '';
  document.getElementById('newDoc').value = '';
  document.getElementById('newPrice').value = '';
  document.getElementById('newQty').value = '';
  document.getElementById('newImageInput').value = '';
  newImageData = null;
  document.getElementById('newImagePreviewWrap').innerHTML = '<div class="img-preview-placeholder">Rasm yo\'q</div>';
  showToast("Mahsulot qo'shildi");
  renderAll();
}

async function addStockQty(id){
  const product = products.find(p=>p.id === id);
  if(!product) return;
  const val = prompt(`${product.name}\nQancha metr qo'shmoqchisiz?`, "0");
  if(val === null) return;
  const addedQty = parseFloat(val);
  if(isNaN(addedQty) || addedQty <= 0){
    showToast("Noto'g'ri miqdor kiritildi");
    return;
  }
  product.qty = Math.round((product.qty + addedQty) * 100) / 100;
  await saveProducts();
  showToast(`${addedQty}m qo'shildi. Yangi qoldiq: ${product.qty}m`);
  renderAll();
}

let pendingDeleteId = null;

function requestDeleteProduct(id){
  pendingDeleteId = id;
  renderOmborTable();
}

function cancelDeleteProduct(){
  pendingDeleteId = null;
  renderOmborTable();
}

async function confirmDeleteProduct(id){
  products = products.filter(p => p.id !== id);
  pendingDeleteId = null;
  await saveProducts();
  showToast("Mahsulot o'chirildi");
  renderAll();
}

function startEditProduct(id){
  editingId = id;
  editImageData = undefined;
  pendingDeleteId = null;
  renderOmborTable();
}

function cancelEditProduct(){
  editingId = null;
  editImageData = undefined;
  renderOmborTable();
}

async function handleEditImageFile(input){
  const file = input.files && input.files[0];
  if(!file) return;
  try{
    editImageData = await resizeImageFile(file, 300);
    const wrap = document.getElementById('editImagePreviewWrap');
    if(wrap) wrap.innerHTML = `<img class="img-preview" src="${editImageData}">`;
  }catch(e){
    showToast('Rasmni yuklashda xatolik');
  }
}

async function saveEditProduct(id){
  const name = document.getElementById('edit-name').value.trim();
  const doc = document.getElementById('edit-doc').value.trim();
  const price = parseFloat(document.getElementById('edit-price').value);
  const qty = parseFloat(document.getElementById('edit-qty').value);

  if(!name){ showToast('Nomini kiriting'); return; }
  if(isNaN(price) || price < 0){ showToast("Narxni to'g'ri kiriting"); return; }
  if(isNaN(qty) || qty < 0){ showToast("Qoldiqni to'g'ri kiriting"); return; }

  const product = products.find(p => p.id === id);
  if(!product) return;
  product.name = name;
  product.doc = doc;
  product.price = price;
  product.qty = qty;
  if(editImageData !== undefined) product.image = editImageData;

  editingId = null;
  editImageData = undefined;
  await saveProducts();

  // Tahrirlash davomida qoldiq 3m dan kamaysa xabar berish
  checkAndSendLowStockAlert(product);

  showToast('Mahsulot yangilandi');
  renderAll();
}

function renderOmborTable(){
  const body = document.getElementById('omborTableBody');
  const emptyNote = document.getElementById('omborEmpty');
  const searchQuery = (document.getElementById('omborSearchInput')?.value || '').toLowerCase().trim();

  body.innerHTML = '';

  const filteredProducts = products.filter(p => {
    const docStr = (p.doc || '').toLowerCase();
    const nameStr = (p.name || '').toLowerCase();
    return docStr.includes(searchQuery) || nameStr.includes(searchQuery);
  });

  emptyNote.style.display = filteredProducts.length === 0 ? 'block' : 'none';

  filteredProducts.forEach(p=>{
    const tr = document.createElement('tr');
    const isPending = pendingDeleteId === p.id;
    const isEditing = editingId === p.id;

    if(isEditing){
      const currentImg = editImageData !== undefined ? editImageData : p.image;
      const previewHtml = currentImg
        ? `<img class="img-preview" src="${currentImg}">`
        : `<div class="img-preview-placeholder">Rasm yo'q</div>`;
      tr.className = 'editing';
      tr.innerHTML = `
        <td class="edit-cell" colspan="6">
          <div class="img-upload-row">
            <div id="editImagePreviewWrap">${previewHtml}</div>
            <div style="flex:1;">
              <label>Mahsulot rasmi</label>
              <input type="file" accept="image/*" onchange="handleEditImageFile(this)">
            </div>
          </div>
          <div class="row2">
            <div class="field"><label>Nomi</label><input type="text" id="edit-name" value="${escapeHtml(p.name)}"></div>
            <div class="field"><label>Hujjat raqami</label><input type="text" id="edit-doc" value="${escapeHtml(p.doc || '')}"></div>
          </div>
          <div class="row2">
            <div class="field"><label>Narxi (so'm/m)</label><input type="number" id="edit-price" value="${p.price}"></div>
            <div class="field"><label>Qoldiq (m)</label><input type="number" id="edit-qty" value="${p.qty}"></div>
          </div>
          <div class="edit-actions">
            <button class="secondary" onclick="saveEditProduct('${p.id}')">Saqlash</button>
            <button class="secondary" onclick="cancelEditProduct()">Bekor qilish</button>
          </div>
        </td>
      `;
      body.appendChild(tr);
      return;
    }

    const thumb = p.image
      ? `<img class="table-thumb" src="${p.image}">`
      : `<div class="table-thumb-placeholder">—</div>`;

    tr.innerHTML = `
      <td>${thumb}</td>
      <td>${escapeHtml(p.name)}</td>
      <td>${escapeHtml(p.doc || '—')}</td>
      <td class="num">${fmt(p.price)}</td>
      <td class="num ${p.qty < 3 ? 'low' : ''}">${p.qty}</td>
      <td>
        ${isPending
          ? `<button class="icon-btn del" onclick="confirmDeleteProduct('${p.id}')">Ha, o'chir</button>
             <button class="icon-btn" onclick="cancelDeleteProduct()">Bekor</button>`
          : `<button class="icon-btn add" title="Qoldiq qo'shish" onclick="addStockQty('${p.id}')">+ Metr</button>
             <button class="icon-btn" onclick="startEditProduct('${p.id}')">Tahrirlash</button>
             <button class="icon-btn del" onclick="requestDeleteProduct('${p.id}')">O'chirish</button>`
        }
      </td>
    `;
    body.appendChild(tr);
  });
}

// ---------- LOCAL AI (MobileNet) ----------
let mobilenetModel = null;
let mobilenetLoadPromise = null;

async function loadMobilenetModel(){
  if(mobilenetModel) return mobilenetModel;
  if(mobilenetLoadPromise) return mobilenetLoadPromise;

  mobilenetLoadPromise = (async () => {
    try {
      mobilenetModel = await tf.loadLayersModel('indexeddb://mobilenet-model');
    } catch (e) {
      const loadedModel = await mobilenet.load({ version: 2, alpha: 1.0 });
      try {
        await loadedModel.model.save('indexeddb://mobilenet-model');
      } catch (err) {}
      mobilenetModel = loadedModel;
    }
    return mobilenetModel;
  })();

  return mobilenetLoadPromise;
}

function loadImageEl(dataUrl){
  return new Promise((resolve, reject)=>{
    const img = new Image();
    img.onload = ()=> resolve(img);
    img.onerror = ()=> reject(new Error("Rasmni o'qib bo'lmadi"));
    img.src = dataUrl;
  });
}

async function extractEmbedding(dataUrl){
  const model = await loadMobilenetModel();
  const img = await loadImageEl(dataUrl);
  const embeddingTensor = tf.tidy(()=> model.infer(img, true));
  const values = await embeddingTensor.data();
  embeddingTensor.dispose();
  return Array.from(values);
}

function cosineSimilarity(a, b){
  let dot = 0, normA = 0, normB = 0;
  for(let i = 0; i < a.length; i++){
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB) + 1e-8);
}

const productEmbeddingCache = {};

async function getProductEmbedding(product){
  const cached = productEmbeddingCache[product.id];
  if(cached && cached.image === product.image){
    return cached.embedding;
  }
  const embedding = await extractEmbedding(product.image);
  productEmbeddingCache[product.id] = { image: product.image, embedding };
  return embedding;
}

// ---------- KAMERA VA REJIM BTN ----------
const SCAN_CTX = {
  skaner: { preview: 'scanPreviewWrap', status: 'scanStatus', resultsPanel: 'scanResultsPanel', results: 'scanResults' },
  kassa:  { preview: 'kassaScanPreviewWrap', status: 'kassaScanStatus', resultsPanel: 'kassaScanResultsPanel', results: 'kassaScanResults' }
};

function setCameraMode(mode, context = 'skaner'){
  const isKassa = context === 'kassa';
  const btnFile = document.getElementById(isKassa ? 'kassaBtnModeFile' : 'btnModeFile');
  const btnLive = document.getElementById(isKassa ? 'kassaBtnModeLive' : 'btnModeLive');
  const cameraWrap = document.getElementById(isKassa ? 'kassaCameraWrap' : 'cameraWrap');
  const snapBtn = document.getElementById(isKassa ? 'kassaSnapAndScanBtn' : 'snapAndScanBtn');
  const fileContainer = document.getElementById(isKassa ? 'kassaFileScanContainer' : 'fileScanContainer');
  const videoId = isKassa ? 'kassaWebcamVideo' : 'webcamVideo';

  if(mode === 'live'){
    btnFile.classList.remove('active');
    btnLive.classList.add('active');
    fileContainer.style.display = 'none';
    cameraWrap.style.display = 'block';
    snapBtn.style.display = 'block';
    startLiveCamera(videoId);
  } else {
    btnLive.classList.remove('active');
    btnFile.classList.add('active');
    stopLiveCamera();
    cameraWrap.style.display = 'none';
    snapBtn.style.display = 'none';
    fileContainer.style.display = 'block';
  }
}

async function startLiveCamera(videoId = 'webcamVideo'){
  stopLiveCamera();
  try{
    cameraStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 640 } }
    });
    const video = document.getElementById(videoId);
    if(video) video.srcObject = cameraStream;
  }catch(e){
    showToast("Kamerani ochish imkoni bo'lmadi: " + e.message);
  }
}

function stopLiveCamera(){
  if(cameraStream){
    cameraStream.getTracks().forEach(track => track.stop());
    cameraStream = null;
  }
}

async function snapAndScan(context = 'skaner'){
  const isKassa = context === 'kassa';
  const video = document.getElementById(isKassa ? 'kassaWebcamVideo' : 'webcamVideo');
  if(!video || !video.videoWidth) return;

  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  const dataUrl = canvas.toDataURL('image/jpeg', 0.8);

  const previewId = isKassa ? 'kassaScanPreviewWrap' : 'scanPreviewWrap';
  document.getElementById(previewId).innerHTML = `<img src="${dataUrl}">`;
  await performScan(dataUrl, context);
}

async function handleScanFile(input, context){
  const file = input.files && input.files[0];
  if(!file) return;
  const c = SCAN_CTX[context];
  document.getElementById(c.resultsPanel).style.display = 'none';
  document.getElementById(c.status).textContent = '';
  let imageData;
  try{
    imageData = await resizeImageFile(file, 500);
  }catch(e){
    document.getElementById(c.status).textContent = "Rasmni o'qib bo'lmadi";
    return;
  }
  document.getElementById(c.preview).innerHTML = `<img src="${imageData}">`;
  await performScan(imageData, context);
}

async function performScan(scannedImageData, context){
  const c = SCAN_CTX[context];
  const statusEl = document.getElementById(c.status);

  const withImages = products.filter(p => p.image);
  if(withImages.length === 0){
    statusEl.textContent = "Hech qaysi mahsulotda rasm yo'q — avval Ombor bo'limida mahsulotlarga rasm qo'shing.";
    return;
  }

  statusEl.textContent = mobilenetModel ? 'Solishtirilmoqda...' : "AI modeli yuklanmoqda...";

  try{
    await loadMobilenetModel();
  }catch(e){
    console.error('Mobilenet load error:', e);
    statusEl.textContent = "AI modelni yuklab bo'lmadi.";
    return;
  }

  statusEl.textContent = `Solishtirilmoqda... (${withImages.length} ta mahsulot bilan)`;

  try{
    const scanEmbedding = await extractEmbedding(scannedImageData);

    const scored = [];
    for(const p of withImages){
      const embedding = await getProductEmbedding(p);
      const sim = cosineSimilarity(scanEmbedding, embedding);
      scored.push({ id: p.id, score: Math.max(0, Math.min(100, Math.round(sim * 100))) });
    }
    scored.sort((a, b)=> b.score - a.score);
    renderScanResults(scored.slice(0, 5), context);
    statusEl.textContent = '';
  }catch(e){
    statusEl.textContent = 'Xatolik: ' + e.message;
  }
}

function renderScanResults(matches, context){
  const c = SCAN_CTX[context];
  const panel = document.getElementById(c.resultsPanel);
  const el = document.getElementById(c.results);
  el.innerHTML = '';

  const valid = (matches || []).filter(m => products.find(p => p.id === m.id)).slice(0, 5);
  if(valid.length === 0){
    panel.style.display = 'block';
    el.innerHTML = '<div class="empty-note">Mos mahsulot topilmadi</div>';
    return;
  }

  valid.forEach(m=>{
    const product = products.find(p => p.id === m.id);
    const score = Math.max(0, Math.min(100, Math.round(m.score || 0)));
    const row = document.createElement('div');
    row.className = 'scan-result-row';
    row.innerHTML = `
      <img class="scan-result-thumb" src="${product.image}">
      <div class="scan-result-info">
        <div class="scan-result-name">${escapeHtml(product.name)}</div>
        <div class="scan-score-track"><div class="scan-score-fill" style="width:${score}%"></div></div>
      </div>
      <div class="scan-score-pct">${score}%</div>
      <button class="scan-select-btn" onclick="selectScanResult('${product.id}','${context}')">+ Savatga</button>
    `;
    el.appendChild(row);
  });
  panel.style.display = 'block';
}

function selectScanResult(productId, context){
  const product = products.find(p => p.id === productId);
  if(!product) return;
  addToCart(product);
  showToast(`${product.name} savatga qo'shildi`);
  if(context === 'skaner'){
    document.querySelector('.tab-btn[data-view="kassa"]').click();
  }
}

// ---------- ZAXIRA NUSXA ----------
function exportBackup(){
  const data = { products, sales, expenses, exportedAt: new Date().toISOString() };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'linoleum-zaxira-' + new Date().toISOString().slice(0,10) + '.json';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  showToast('Zaxira nusxa yuklab olindi');
}

let pendingRestoreData = null;

function handleRestoreFile(input){
  const file = input.files && input.files[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    const statusEl = document.getElementById('restoreStatus');
    try{
      const data = JSON.parse(reader.result);
      pendingRestoreData = data;
      statusEl.innerHTML = `Faylda: ${(data.products||[]).length} mahsulot, ${(data.sales||[]).length} sotuv, ${(data.expenses||[]).length} chiqim topildi. Joriy ma'lumotlar shular bilan almashtiriladi.
        <div class="settings-row">
          <button class="secondary" onclick="applyRestore()">Ha, tiklash</button>
          <button class="secondary" onclick="cancelRestore()">Bekor qilish</button>
        </div>`;
    }catch(e){
      statusEl.textContent = "Fayl noto'g'ri formatda";
    }
  };
  reader.readAsText(file);
}

async function applyRestore(){
  if(!pendingRestoreData) return;
  products = pendingRestoreData.products || [];
  sales = pendingRestoreData.sales || [];
  expenses = pendingRestoreData.expenses || [];
  await Promise.all([saveProducts(), saveSales(), saveExpenses()]);
  pendingRestoreData = null;
  document.getElementById('restoreStatus').textContent = 'Tiklandi ✓';
  document.getElementById('restoreInput').value = '';
  showToast("Ma'lumotlar tiklandi");
  renderAll();
}

function cancelRestore(){
  pendingRestoreData = null;
  document.getElementById('restoreStatus').textContent = '';
  document.getElementById('restoreInput').value = '';
}

// ---------- CHIQIM ----------
async function addExpense(){
  const amount = parseFloat(document.getElementById('newExpenseAmount').value);
  const note = document.getElementById('newExpenseNote').value.trim();

  if(isNaN(amount) || amount <= 0){ showToast("Summani to'g'ri kiriting"); return; }

  expenses.push({
    id: 'exp_' + Date.now(),
    timestamp: new Date().toISOString(),
    amount,
    note
  });
  await saveExpenses();
  document.getElementById('newExpenseAmount').value = '';
  document.getElementById('newExpenseNote').value = '';
  showToast("Chiqim qo'shildi");
  renderAll();
}

let pendingDeleteExpenseId = null;

function requestDeleteExpense(id){
  pendingDeleteExpenseId = id;
  renderExpenseList();
}

function cancelDeleteExpense(){
  pendingDeleteExpenseId = null;
  renderExpenseList();
}

async function confirmDeleteExpense(id){
  expenses = expenses.filter(e => e.id !== id);
  pendingDeleteExpenseId = null;
  await saveExpenses();
  renderAll();
}

function renderExpenseList(){
  const el = document.getElementById('expenseList');
  const emptyNote = document.getElementById('expenseEmpty');
  el.innerHTML = '';
  emptyNote.style.display = expenses.length === 0 ? 'block' : 'none';

  const sorted = [...expenses].sort((a,b)=> new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 30);
  sorted.forEach(e=>{
    const row = document.createElement('div');
    row.className = 'expense-row';
    const dateStr = e.timestamp.slice(5,10).split('-').reverse().join('.');
    const isPending = pendingDeleteExpenseId === e.id;
    row.innerHTML = `
      <span class="expense-date">${dateStr}</span>
      <span class="expense-note">${escapeHtml(e.note || '—')}</span>
      <span class="expense-amount">−${fmt(e.amount)}</span>
      ${isPending
        ? `<button class="icon-btn del" onclick="confirmDeleteExpense('${e.id}')">Ha</button>
           <button class="icon-btn" onclick="cancelDeleteExpense()">Bekor</button>`
        : `<button class="icon-btn del" onclick="requestDeleteExpense('${e.id}')">✕</button>`
      }
    `;
    el.appendChild(row);
  });
}

// ---------- SOTUV TARIXI ----------
function renderSalesHistory(){
  const el = document.getElementById('salesHistoryList');
  const emptyNote = document.getElementById('salesHistoryEmpty');
  el.innerHTML = '';
  emptyNote.style.display = sales.length === 0 ? 'block' : 'none';

  const sorted = [...sales].sort((a,b)=> new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 50);
  sorted.forEach(s=>{
    const row = document.createElement('div');
    row.className = 'sale-row';
    const itemsSummary = s.items.map(i => `${escapeHtml(i.name)} (${i.qty} m)`).join(', ');
    row.innerHTML = `
      <div class="sale-row-top">
        <span class="sale-date">${formatDateTime(s.timestamp)}</span>
        <span class="sale-total">${fmt(s.total)}</span>
      </div>
      <div class="sale-items">${itemsSummary}</div>
    `;
    el.appendChild(row);
  });
}

// ---------- HISOBOT VA TELEGRAM BOT ----------
function renderHisobot(){
  const now = new Date();
  const todayStr = now.toISOString().slice(0,10);
  const monthStr = now.toISOString().slice(0,7);

  const todayTotal = sales.filter(s => s.timestamp.slice(0,10) === todayStr)
    .reduce((sum,s)=> sum + s.total, 0);
  const monthSales = sales.filter(s => s.timestamp.slice(0,7) === monthStr);
  const monthTotal = monthSales.reduce((sum,s)=> sum + s.total, 0);
  const stockValue = products.reduce((sum,p)=> sum + p.price * p.qty, 0);

  const expenseToday = expenses.filter(e => e.timestamp.slice(0,10) === todayStr)
    .reduce((sum,e)=> sum + e.amount, 0);
  const expenseMonth = expenses.filter(e => e.timestamp.slice(0,7) === monthStr)
    .reduce((sum,e)=> sum + e.amount, 0);
  const profitToday = todayTotal - expenseToday;

  document.getElementById('statToday').textContent = fmt(todayTotal);
  document.getElementById('statMonth').textContent = fmt(monthTotal);
  document.getElementById('statStockValue').textContent = fmt(stockValue);
  document.getElementById('statExpenseToday').textContent = fmt(expenseToday);
  document.getElementById('statExpenseMonth').textContent = fmt(expenseMonth);
  document.getElementById('statProfitToday').textContent = fmt(profitToday);

  renderExpenseList();
  renderSalesHistory();

  const productTotals = {};
  monthSales.forEach(s=>{
    s.items.forEach(item=>{
      productTotals[item.name] = (productTotals[item.name] || 0) + item.qty;
    });
  });
  const sorted = Object.entries(productTotals).sort((a,b)=> b[1]-a[1]).slice(0,5);
  const topEl = document.getElementById('topProducts');
  const topEmpty = document.getElementById('topEmpty');
  topEl.innerHTML = '';
  topEmpty.style.display = sorted.length === 0 ? 'block' : 'none';
  const max = sorted.length ? sorted[0][1] : 1;
  sorted.forEach(([name, qty])=>{
    const row = document.createElement('div');
    row.className = 'bar-row';
    row.innerHTML = `
      <div class="bar-name">${escapeHtml(name)}</div>
      <div class="bar-track"><div class="bar-fill" style="width:${(qty/max*100).toFixed(0)}%"></div></div>
      <div class="bar-val">${qty} m</div>
    `;
    topEl.appendChild(row);
  });
}

// TELEGRAM BOTGA KUNLIK HISOBOT YUBORISH
async function sendTelegramReport(){
  const token = document.getElementById('tgBotToken').value.trim();
  const chatId = document.getElementById('tgChatId').value.trim();

  if(!token || !chatId){
    showToast("Bot Token yoki Chat ID kiritilmagan");
    return;
  }

  const now = new Date();
  const todayStr = now.toISOString().slice(0,10);
  const dateFormatted = `${String(now.getDate()).padStart(2,'0')}.${String(now.getMonth()+1).padStart(2,'0')}.${now.getFullYear()}`;

  const todaySales = sales.filter(s => s.timestamp.slice(0,10) === todayStr);

  if(todaySales.length === 0){
    showToast("Bugun sotuv bo'lmagan");
    return;
  }

  // Mahsulotlarni Hujjat raqami bo'yicha guruhlash
  const grouped = {};
  todaySales.forEach(s => {
    s.items.forEach(item => {
      const docKey = item.doc || item.name;
      if(!grouped[docKey]){
        grouped[docKey] = { doc: item.doc || '—', qty: 0, totalSum: 0 };
      }
      grouped[docKey].qty += item.qty;
      grouped[docKey].totalSum += (item.price * item.qty);
    });
  });

  let msg = `Sana: ${dateFormatted}\n\n`;
  let idx = 1;
  for(const key in grouped){
    const item = grouped[key];
    msg += `${idx}. Hujjat raqami: ${item.doc}\nSotildi: ${item.qty} m\nSummasi: ${fmt(item.totalSum)} so'm\n\n`;
    idx++;
  }

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: msg })
    });
    const data = await res.json();
    if(data.ok){
      showToast("Hisobot Telegramga yuborildi!");
    } else {
      showToast("Telegram xatosi: " + data.description);
    }
  } catch(e) {
    showToast("Yuborishda xatolik yuz berdi");
  }
}

// HAR KUNI 19:00 DA AVTOMATIK TEKSHIRISH
let reportSentToday = false;
setInterval(() => {
  const now = new Date();
  const todayStr = now.toISOString().slice(0,10);

  if(now.getHours() === 19 && now.getMinutes() === 0 && !reportSentToday){
    reportSentToday = true;
    sendTelegramReport();
  }

  if(now.getHours() === 0 && now.getMinutes() === 0){
    reportSentToday = false;
  }
}, 30000);

function escapeHtml(str){
  const div = document.createElement('div');
  div.textContent = str ?? '';
  return div.innerHTML;
}

// ---------- NAV ----------
document.querySelectorAll('.tab-btn').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    document.querySelectorAll('.tab-btn').forEach(b=>b.classList.remove('active'));
    document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('view-' + btn.dataset.view).classList.add('active');
    stopLiveCamera();
  });
});

document.getElementById('sellBtn').addEventListener('click', finalizeSale);
document.getElementById('addProductBtn').addEventListener('click', addProduct);
document.getElementById('addExpenseBtn').addEventListener('click', addExpense);
document.getElementById('exportBtn').addEventListener('click', exportBackup);

loadData();
