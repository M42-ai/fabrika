# Marinasyon tek tür partisi, soslu/sossuz stok, Mal & İşçi stok açıklaması (sürüm 3.12)

## Neden
Fabrika sahibinin 23.11.2026 geri bildirimi:
1. Gelen malın işlenmeyen kısmı yarına stok olarak kalsın. (Zaten var: stok = gelen − partiye yazılan.
   Ama ekran bunu anlatmıyor; "İşlendi / Kalan" hücrelerine yazmaya çalışmış.)
2. Göğüs ve but ayrı marine edilir; tek partide ikisi birden olmasın.
3. Sossuz göğüs, soslu göğüs, soslu but ayrı görünsün.
4. Malzeme listesindeki "500 küsür kilo su" yanlış. (Kod hatası değil: Oranlar'daki tarif hâlâ Excel örneği.)
5. "Yazı yazan bölüm doğru çalışmıyor" — anlaşılmadı, kapsam dışı.

## Hedefler
- Marinasyon partisi tek tür (göğüs ya da but). Karışım tarifi her iki tür için aynı oran (kg et başına).
- Marinasyon ekranında dört stok: sossuz göğüs, sossuz but, soslu göğüs, soslu but.
- Tarifin nereden geldiği formda görünsün, Oranlar'a kısayol olsun.
- Mal & İşçi'de "İşlendi / Kalan"ın nasıl oluştuğu ve kalanın yarına geçtiği yazsın; stoktan fazla parti kırmızı uyarı alsın.

## Hedef olmayanlar
- Veri yapısı değişmez (`marine` kaydı yine `{gogus, but, deri, tartilan, artis}`; tek tür partide diğeri 0).
- Terazi, maliyet, Oranlar hesapları değişmez.
- Stoktan fazla parti engellenmez (eski günlerde mal girişi eksik olabilir).
- Kalan için ayrı giriş alanı eklenmez; model "işleneni partiye yaz, kalan kendiliğinden kalır" olarak kalır.

## Yaklaşımlar
- **A (seçilen):** formda tür seçimi + tek kilo alanı; kayıt yapısı aynı; eski iki türlü kayıtlar ayrıntıda aynen gösterilir.
- B: eski kayıtları ikiye bölen taşıma ile zorunlu ayrım. Riskli, gereksiz.

## Kararlar
1. **Marinasyon formu:** "Göğüs / But" seçimi (varsayılan: stokta olan; ikisi de varsa göğüs). Tek alan "Giren sossuz et",
   stoktaki kalan önerilir. "Ayrılan deri" ve "Tartılan marine (isteğe bağlı)" kalır. Çıkan marine, karışım ve malzemeler
   `marineCalc` ile (et = seçilen türün kilosu). Düzeltmede eski iki türlü kayıt açılırsa her iki alan da gösterilir (eski biçim).
   Liste satırı: "Göğüs · 2.775,0 kg sossuz → 3.205,1 kg soslu".
2. **Sol üst kartlar:** Sossuz göğüs, Sossuz but (cigStokOn), Soslu göğüs, Soslu but (teraziOn(day).kalan). Metinlerde "çiğ" → "sossuz".
3. **Tarif uyarısı:** formdaki malzeme kutusunda "Malzemeler Oranlar & Fiyatlar'daki tarife göre (et × karışım oranı)."
   ve "Tarifi düzelt" düğmesi → `go('oranlar')`.
4. **Mal & İşçi:** stok tablosu altına açıklama satırı; mal ayrıntısında "Gelen X − işlenen Y = kalan Z kg, yarına geçer";
   parti kaydında stoktan fazla ise toast uyarısı ve listede kırmızı "stoktan fazla" pill'i.
5. Sürüm etiketi 3.12; sw.js önbellek adı güncellenir.

## Uygulayıcıya bırakılan
- Düğme yerleşimi, metin kısaltmaları, dar ekran kırılmaları.
