
![alt text](image.png)


## Özellikler

*   **On-the-Fly Parola Üretimi:** Parolalar asla saklanmaz, ihtiyaç anında üretilir.
*   **Güçlü Kriptografi:** Anahtar türetme için Argon2d ve siteye özel anahtar üretimi için HMAC-SHA256 algoritmaları kullanılır.
*   **Çeşitli Parola Şablonları:** Farklı güvenlik seviyeleri ve site gereksinimleri için ön tanımlı parola şablonları (Maksimum Güvenlik, Uzun, PIN vb.) sunar.
*   **Dinamik Şablon Seçimi:** Üretilen siteye özel anahtara (siteKey) bağlı olarak, seçilen parola tipi içinden deterministik bir şekilde bir şablon seçilir.
*   **Tarayıcı Eklentisi:** Google Chrome (ve diğer Chromium tabanlı tarayıcılar) için bir eklenti olarak çalışır.
*   **Oturum Yönetimi:** Ana Parola, eklenti oturumu boyunca güvenli bir şekilde saklanır ve oturum kapatıldığında temizlenir.
*   **Kayıtlı Siteler:** Sık kullanılan siteler ve bu siteler için tercih edilen parola tipleri eklenti içinde (tarayıcının yerel depolamasında) saklanabilir.
*   **Otomatik URL Algılama:** Aktif sekmedeki URL'yi otomatik olarak algılayarak kullanıcıya kolaylık sağlar.
*   **Kullanıcı Dostu Arayüz:** Sekmeli yapı ile yeni parola üretme ve kayıtlı sitelerden parola üretme işlemleri kolayca yapılabilir.
*   **Parola Kopyalama:** Üretilen parolayı tek tıkla panoya kopyalama.

## Kullanım

### 1. Eklentinin Kurulumu (Geliştirme Modunda)

Bu proje henüz resmi olarak yayınlanmadığı için geliştirme modunda kurulması gerekmektedir:

1.  Bu GitHub reposunu klonlayın veya ZIP olarak indirin.
2.  Proje dizininde terminali açın ve bağımlılıkları yükleyin:
    ```bash
    npm install
    # veya
    yarn install
    ```
3.  Projeyi build edin:
    ```bash
    npm run build
    # veya
    yarn build
    ```
    Bu komut, eklenti dosyalarını içeren bir `dist` klasörü oluşturacaktır.
4.  Tarayıcınızı açın (örn: Google Chrome):
    *   Adres çubuğuna `chrome://extensions` yazın.
    *   Sağ üst köşedeki "Geliştirici modu" (Developer mode) seçeneğini aktif hale getirin.
    *   "Paketlenmemiş öğe yükle" (Load unpacked) butonuna tıklayın.
    *   Açılan dosya seçici penceresinde, projenizin içindeki `dist` klasörünü seçin.
5.  Eklenti yüklenecek ve tarayıcınızın eklentiler çubuğunda ikonu görünecektir.

### 2. Eklentiyi Kullanma

1.  **Ana Parolayı Ayarlama (Oturum Başlatma):**
    *   Eklenti ikonuna tıkladığınızda, ilk olarak Ana Parolanızı girmeniz istenecektir. Bu parola, tüm site parolalarınızın üretilmesi için temel oluşturur. **Bu parolayı çok güçlü seçin ve asla unutmayın!**
    *   Ana Parolanızı girip "Ana Parolayı Ayarla" butonuna tıklayın. Başarılı olursa oturumunuz aktif hale gelir.

2.  **Yeni Bir Site İçin Parola Üretme:**
    *   "Yeni Parola Üret" sekmesinde olduğunuzdan emin olun.
    *   "URL / Site Adı" alanına parola üretmek istediğiniz web sitesinin adresini (örn: `example.com`) girin. Eklenti, aktif sekmedeki URL'yi otomatik olarak buraya getirmeye çalışacaktır.
    *   "Parola Tipi" dropdown menüsünden istediğiniz parola karmaşıklığını seçin (örn: Maksimum Güvenlik, Uzun, PIN).
    *   "Üret ve Kaydet" butonuna tıklayın.
    *   Üretilen parola aşağıda gösterilecektir. "Kopyala" butonu ile panoya alabilirsiniz.
    *   Bu site ve seçtiğiniz parola tipi, eklentinin "Kayıtlı Siteler" listesine eklenecektir.

3.  **Kayıtlı Bir Siteden Parola Üretme:**
    *   "Kayıtlı Siteler" sekmesine geçin.
    *   Daha önce parola ürettiğiniz sitelerin bir listesini göreceksiniz.
    *   Parola üretmek istediğiniz sitenin üzerine tıklayın veya yanındaki "Üret" butonuna tıklayın.
    *   (Eğer oturumunuz kapanmışsa veya ilk kez bu oturumda bir işlem yapıyorsanız Ana Parolanız tekrar istenebilir.)
    *   Site için daha önce kaydedilmiş parola tipi kullanılarak (veya o an seçili genel parola tipiyle) parola üretilecek ve gösterilecektir.

4.  **Oturumu Kapatma:**
    *   Eklenti arayüzünün üst kısmındaki "Oturumu Kapat" butonuna tıklayarak mevcut Ana Parola oturumunu sonlandırabilirsiniz. Bu durumda, eklentiyi tekrar kullanmak için Ana Parolanızı yeniden girmeniz gerekecektir.




