# Marinasyon tek tür + soslu/sossuz stok + Mal & İşçi stok açıklaması — Uygulama Planı

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Marinasyon partisi tek tür (göğüs ya da but) girilir; Marinasyon ekranı dört stoğu (sossuz/soslu × göğüs/but) gösterir; Mal & İşçi "İşlendi / Kalan"ın nasıl oluştuğunu anlatır ve stoktan fazla partiyi kırmızı uyarır.

**Architecture:** Tek dosya uygulama (`index.html`, Preact + htm, module script). Veri yapısı değişmez: `marine` kaydı `{date, gogus, but, deri, tartilan?, artis, ts}`; tek tür partide diğer alan 0. Değişiklikler yalnız `Marine` ve `Mal` bileşenlerinin form/görünüm kısmında; hesap fonksiyonlarına (`marineCalc`, `marineCikan`, `cigStokOn`, `teraziSeries`, `partiCalc`) dokunulmaz.

**Tech Stack:** Preact/htm (CDN), vanilla JS. Doğrulama: scratchpad'deki Playwright düzeneği (`/tmp/claude-0/-home-user-fabrika/62a595f9-098a-5c2a-99e4-45c7842aebc5/scratchpad/harness`): `node serve.js /home/user/fabrika` 8765'te sunar; `open.js`'teki `openApp(view)` uygulamayı `?deneme` modunda açar, CDN'i yerel pakete yönlendirir, PIN 1234'ü girer.

**Spec:** `docs/superpowers/specs/2026-11-23-marinasyon-tek-tur-ve-stok-aciklama-design.md`

## Global Constraints

- Proje tek `index.html`; yeni dosya yok, test altyapısı repoya girmez (scratchpad'de kalır).
- Metinler Türkçe, "çiğ" yerine "sossuz"; soslu et için "soslu" (Terazi'de "marine" kalabilir).
- Veri yapısı ve hesap fonksiyonları değişmez; eski iki türlü marine kayıtları okunmaya devam eder.
- Sürüm etiketi `Sürüm 3.12 · 23.11.2026`.
- Commit mesajları Türkçe, mevcut tarza uygun ("3.12: ...").

## Review Focus

1. Eski iki türlü marine kaydı (göğüs>0 ve but>0) Düzelt ile açılınca iki alan da görünmeli, kayıt bozulmamalı → Task 1 testi `eski kayıt`.
2. Stokta yalnız but varken form varsayılanı "But" olmalı, kilo but stoğuyla dolmalı → Task 1 testi `varsayılan tür`.
3. Tür değiştirince kilo alanı yeni türün stoğuyla dolmalı; "stoktan fazla" ipucu yeni türe göre olmalı → Task 1 testi.
4. Soslu stok kartları Terazi'nin `kalan`ı ile birebir aynı olmalı (sayım varsa sayım) → Task 2 testi.
5. Stoktan fazla parti kaydı engellenmemeli, ama toast ve pill uyarmalı → Task 3 testi.

---

### Task 1: Marinasyon formu tek tür

**Files:**
- Modify: `index.html` — `Marine` bileşeni (satır ~2381–2476): `open`, `form` yapısı, `save`, form JSX, liste satırı, ayrıntı.
- Test: `<harness>/t1.js`

**Interfaces:**
- Produces: `form = { id, av, tur: 'gogus'|'but', kg: string, deri, tartilan, eski: boolean, gogus?: string, but?: string }`. `eski` yalnız düzeltilen kayıtta `gogus>0 && but>0` ise true; o zaman eski iki alanlı form gösterilir.
- Yardımcı: `const turAd = x => (x.gogus > 0 && x.but > 0 ? 'Göğüs + but' : x.but > 0 ? 'But' : 'Göğüs');` (Marine içinde; liste, ayrıntı ve Task 2'de kullanılır).

- [ ] **Step 1: Testi yaz** — `<harness>/t1.js`:

```js
const { openApp } = require('./open');
(async () => {
  const { browser, page } = await openApp('marine');
  await page.click('text=+ Marinasyon partisi');
  // tür düğmeleri ve tek alan
  if (!(await page.locator('button:has-text("Göğüs")').count())) throw new Error('Göğüs düğmesi yok');
  if (!(await page.locator('button:has-text("But")').count())) throw new Error('But düğmesi yok');
  if (!(await page.locator('label:has-text("Giren sossuz et")').count())) throw new Error('tek alan yok');
  if (await page.locator('label:has-text("Giren çiğ göğüs")').count()) throw new Error('eski iki alan hâlâ var');
  // kilo gir, kaydet → liste satırında tür adı ve "sossuz → ... soslu"
  await page.fill('label:has-text("Giren sossuz et") input', '100');
  await page.click('button:has-text("But")');
  await page.fill('label:has-text("Giren sossuz et") input', '100');
  await page.click('text=KAYDET');
  await page.waitForTimeout(300);
  const rows = await page.locator('.side .row').allInnerTexts();
  const r = rows.find(t => /But · 100,0 kg sossuz → 115,5 kg soslu/.test(t));
  if (!r) throw new Error('liste satırı beklenen biçimde değil: ' + JSON.stringify(rows));
  // ayrıntı
  const main = await page.locator('.main').innerText();
  if (!/Giren sossuz but/.test(main)) throw new Error('ayrıntı satırı yok: ' + main);
  // eski kayıt (örnek veri r2: göğüs 268 + but 217) Düzelt ile açılınca iki alan görünmeli
  const eski = page.locator('.side .row', { hasText: 'Göğüs + but' }).first();
  if (!(await eski.count())) throw new Error('eski iki türlü satır yok');
  await eski.click(); await page.click('text=Düzelt');
  if (!(await page.locator('label:has-text("Giren sossuz göğüs")').count()) || !(await page.locator('label:has-text("Giren sossuz but")').count())) throw new Error('eski kayıtta iki alan yok');
  console.log('T1 OK'); await browser.close();
})().catch(e => { console.error('T1 FAIL', e.message); process.exit(1); });
```

- [ ] **Step 2: Çalıştır, FAIL gör** — `cd <harness> && node t1.js` → `T1 FAIL Göğüs düğmesi yok` (ya da "tek alan yok").

- [ ] **Step 3: `Marine` bileşenini değiştir**
  - `open(x)`: yeni kayıtta `tur = av.gogus > 0.05 ? 'gogus' : av.but > 0.05 ? 'but' : 'gogus'`, `kg = str(av[tur])`, `eski = false`. Düzeltmede `eski = x.gogus > 0 && x.but > 0`; eski ise `gogus/but` string alanları dolar, değilse `tur = x.but > 0 ? 'but' : 'gogus'`, `kg = str(x.gogus || x.but)`.
  - `setTur(t)`: `tur = t`, `kg = str(av[t])`.
  - `recOf(form)` → `{ gogus, but }`: eski ise iki alandan, değilse `tur` olana `num(kg)`, diğeri 0. `prev` ve `save` bunu kullanır.
  - Form JSX: eski değilse üstte `g2` içinde iki `btn small` (Göğüs / But, `aria-pressed`), sonra `Fld label="Giren sossuz et"` (hint `stokHint(tur, av[tur])`), `Ayrılan deri`, `Tartılan soslu (isteğe bağlı)`. Eski ise alan etiketleri `Giren sossuz göğüs` / `Giren sossuz but`.
  - Özet kutusu: `'Çıkan soslu, standart (artış …%)'`.
  - Liste satırı: 1. satır `${turAd(x)} · ${kg(giren)} kg sossuz → ${kg(mc.gogus + mc.but)} kg soslu`; 2. satır `deri X kg` (+ varsa tartılan farkı).
  - Ayrıntı: ilk kvRow etiketi `'Giren sossuz ' + turAd(cur).toLowerCase()`, değeri eski ise `g + b kg`, değilse tek kilo. `'Çıkan marine'` → `'Çıkan soslu'`.
  - `Top sub`: `' kg soslu'`.

- [ ] **Step 4: Çalıştır, PASS gör** — `node t1.js` → `T1 OK`.

- [ ] **Step 5: Commit** — `git add index.html && git commit -m "3.12a: marinasyon partisi tek tür (göğüs ya da but), sossuz/soslu terimleri"`

### Task 2: Dört stok kartı ve tarif uyarısı

**Files:**
- Modify: `index.html` — `Marine`: `stats` bloğu, altındaki `lbl`, form özet kutusu, ayrıntı `lbl`.
- Test: `<harness>/t2.js`

**Interfaces:**
- Consumes: `teraziOn(day).kalan` → `{gogus, but, deri}` (sayım varsa sayım, yoksa hesap). `cigStokOn(data, day)` → `{gogus, but}`. `go('oranlar')`.

- [ ] **Step 1: Testi yaz** — `<harness>/t2.js`: `openApp('marine')`; `.stat small` metinleri sırasıyla `['Sossuz göğüs','Sossuz but','Soslu göğüs','Soslu but']` olmalı; soslu değerler `page.evaluate` ile DOM'dan okunan sayıların, aynı günde `sayim` görünümüne (`openApp('sayim')`) geçip "Olması gereken" (ya da "Sayım") satırındaki göğüs/but ile eşit olduğu doğrulanır (metin karşılaştırması, `kg()` biçimi). Formu açınca `.main` metninde `Oranlar & Fiyatlar'daki tarife göre` geçmeli ve `button:has-text("Tarifi düzelt")` tıklanınca `h1` metni `Oranlar & Fiyatlar` olmalı.

- [ ] **Step 2: Çalıştır, FAIL gör** — `node t2.js` → kart adları eşleşmiyor.

- [ ] **Step 3: Uygula**
  - `const tz = teraziOn(day).kalan;` `stats` grid 2×2: `Sossuz göğüs ${kg(stok.gogus)}`, `Sossuz but ${kg(stok.but)}`, `Soslu göğüs ${kg(tz.gogus)}`, `Soslu but ${kg(tz.but)}`.
  - Alttaki lbl: `Sossuz: iş partilerinden çıkan ve kemiksiz gelen et, marinasyona girenler düşülmüş. Soslu: Terazi'deki olması gereken (sayım girildiyse sayım), gün sonu.`
  - Form özet kutusunda "Malzemeler" başlığının altına: `<div class="lbl">Malzemeler Oranlar & Fiyatlar'daki tarife göre: et × karışım oranı ${pct(m.karisimOran)}%. Tarif yanlışsa oradan düzelt.</div>` ve `<button type="button" class="btn ghost small" onClick=${() => go('oranlar')}>Tarifi düzelt</button>`.
  - Ayrıntıdaki malzeme lbl'sine aynı cümle kısa biçimde: `Tarif: Oranlar & Fiyatlar.`

- [ ] **Step 4: Çalıştır, PASS gör** — `node t2.js` → `T2 OK`.

- [ ] **Step 5: Commit** — `"3.12b: marinasyonda sossuz/soslu dört stok kartı, tarif uyarısı ve Oranlar kısayolu"`

### Task 3: Mal & İşçi stok açıklaması ve stoktan fazla uyarısı

**Files:**
- Modify: `index.html` — `Mal`: stok tablosu altı, `selMal` ayrıntısı, `saveParti`, parti liste satırı pill'i.
- Test: `<harness>/t3.js`

**Interfaces:**
- Consumes: `malStokOn(data, day, exceptId)`, `geldi`, `islendi`, `stok` (Mal içinde zaten var).
- Produces: `const fazlaOf = p => p.calc.gir.filter(g => g.kg - (malStokOn(data, day, p.id)[g.tur] || 0) > 0.05).map(g => malAd(g.tur));`

- [ ] **Step 1: Testi yaz** — `<harness>/t3.js`: `openApp('mal')`;
  - `.side` metninde `İşlendi: iş partilerine yazılan kilo` ve `yarına stok olarak geçer` geçmeli.
  - Sol "Gelen mal" listesinde `Bütün tavuk` satırına tıkla; `.main` metninde `Bu gün gelen` ve `yarına geçer` geçmeli.
  - `+ İş partisi` → `Bütün tavuk` alanına stoğun 10 katı (`'99999'`) yaz, Kemiksiz göğüs `'100'`, bir işçi seç, KAYDET → `.toast` metninde `stoktan fazla` geçmeli; sol parti listesinde `.pill:has-text("stoktan fazla")` olmalı; kayıt yine listede (satır sayısı +1).

- [ ] **Step 2: Çalıştır, FAIL gör** — `node t3.js`.

- [ ] **Step 3: Uygula**
  - Stok tablosunun altına: `<div class="lbl" style="font-size:calc(15px * var(--s))">Geldi: "Mal geldi" ile yazılan. İşlendi: iş partilerine yazılan kilo. Kalan: geldi − işlendi, yarına stok olarak geçer. İşlemediğin kiloyu partiye yazma, kendiliğinden kalır.</div>` (tablo yokken de göster).
  - `selMal` ayrıntısında `stoğu, gün sonu` satırı yerine: `kvRow('Bu gün gelen − işlenen', kg(geldi[tur]) + ' − ' + kg(islendi[tur]||0) + ' kg')` ve `kvRow(malAd + ' gün sonu stoğu', kg(stok[tur]) + ' kg → yarına geçer', true)`; altına lbl: `Stok önceki günlerden kalanı da içerir. İşlenen kilo iş partilerinden gelir; kalanı ayrıca yazmana gerek yok.`
  - `saveParti`: `const fazla = r.girdiler.filter(g => g.kg - (pf.av[g.tur] || 0) > 0.05).map(g => malAd(g.tur));` kayıt mesajı: `fazla.length ? 'Kaydedildi. Dikkat: ' + fazla.join(', ') + ' stoktan fazla işlendi; mal girişi eksik olabilir.' : <mevcut mesaj>`. Kayıt engellenmez.
  - Parti liste satırı: `fazlaOf(p).length` ise durum pill'inin yanına `<span class="pill red">stoktan fazla</span>`.

- [ ] **Step 4: Çalıştır, PASS gör** — `node t3.js` → `T3 OK`.

- [ ] **Step 5: Commit** — `"3.12c: Mal & İşçi: işlendi/kalan açıklaması, stoktan fazla parti uyarısı"`

### Task 4: Sürüm, ekran kontrolü, push

**Files:**
- Modify: `index.html:1070` sürüm etiketi.

- [ ] **Step 1:** `Sürüm 3.11 · 21.11.2026` → `Sürüm 3.12 · 23.11.2026`.
- [ ] **Step 2:** `node t1.js && node t2.js && node t3.js` hepsi OK.
- [ ] **Step 3:** Fold iç ekran (752×749) ve telefon (412×915) için `marine` (form açık) ve `mal` ekran görüntüleri al (`<harness>/shots.js`), taşma/kesilme var mı göz ile kontrol et; `pageerror`/`console error` sıfır.
- [ ] **Step 4: Commit** — `"Sürüm 3.12: marinasyon tek tür, soslu/sossuz stok, stok açıklaması"` ve `git push -u origin claude/busy-gauss-poh9xo`.
