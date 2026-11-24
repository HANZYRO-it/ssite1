const T = {
 de:{inqKicker:'ANFRAGE',inqTitle:'Produkt anfragen',inqDesc:'Deine Merkliste wird mitgesendet. Geplant: Barzahlung nach Lieferung (derzeit nicht aktiv). Keine Bestellung oder Zahlung möglich.',fName:'Name',fContact:'E-Mail oder Telefon/Messenger',fMsg:'Nachricht',fConsent:'Ich bin einverstanden, dass meine Angaben zur Bearbeitung der Anfrage gespeichert werden (siehe Datenschutz).',send:'Anfrage senden',ok:'Danke! Deine Anfrage-ID:',okNote:'Das ist keine Bestellung und keine Vertragsbestätigung.',missing:'Bitte alle Pflichtfelder ausfüllen und der Speicherung zustimmen.',err:'Senden nicht möglich. Bitte nutze einen Kontaktweg unten.',sending:'Wird gesendet…'},
 en:{inqKicker:'ENQUIRY',inqTitle:'Product enquiry',inqDesc:'Your saved list is included. Planned: cash after delivery (not active yet). No order or payment is possible.',fName:'Name',fContact:'Email or phone/messenger',fMsg:'Message',fConsent:'I agree that my details are stored to process this enquiry (see Privacy).',send:'Send enquiry',ok:'Thank you! Your enquiry ID:',okNote:'This is not an order or contract confirmation.',missing:'Please fill in all required fields and agree to storage.',err:'Could not send. Please use a contact channel below.',sending:'Sending…'},
 ru:{inqKicker:'ЗАПРОС',inqTitle:'Запрос о товаре',inqDesc:'Ваш список отправляется вместе с запросом. Планируется оплата наличными после доставки (пока не активна). Заказ или оплата невозможны.',fName:'Имя',fContact:'E-mail или телефон/мессенджер',fMsg:'Сообщение',fConsent:'Я согласен(на) на хранение моих данных для обработки запроса (см. Конфиденциальность).',send:'Отправить запрос',ok:'Спасибо! Номер вашего запроса:',okNote:'Это не заказ и не подтверждение договора.',missing:'Заполните обязательные поля и дайте согласие на хранение.',err:'Отправка невозможна. Используйте контакты ниже.',sending:'Отправка…'},
 uk:{inqKicker:'ЗАПИТ',inqTitle:'Запит про товар',inqDesc:'Ваш список буде надіслано разом із запитом. Планується оплата готівкою після доставки (поки не активна). Замовлення чи оплата неможливі.',fName:'Ім’я',fContact:'E-mail або телефон/месенджер',fMsg:'Повідомлення',fConsent:'Я погоджуюсь на зберігання моїх даних для обробки запиту (див. Конфіденційність).',send:'Надіслати запит',tiTitle:'Запит Trade-in',tiDesc:'Необов’язковий запит. Оцінка проводиться вручну, автоматичної ціни немає.',tiDevice:'Пристрій / компонент',tiModel:'Виробник і модель',tiAge:'Вік',tiSpecs:'Характеристики',tiCond:'Стан',tiDefects:'Відомі дефекти',tiAcc:'Аксесуари',tiType:'Тип запиту',tiTrade:'Залік (Trade-in)',tiSell:'Продаж Z1PC',ok:'Дякуємо! Номер вашого запиту:',okNote:'Це не замовлення і не підтвердження договору.',missing:'Заповніть обов’язкові поля та дайте згоду на зберігання.',err:'Надсилання неможливе. Скористайтесь контактами нижче.',sending:'Надсилання…'}};
for (const l in T) Object.assign(dict[l], T[l]);
setLang(langSelect.value);
const L = () => dict[langSelect.value];



// Öffentliche Kontakt-/Betreiberangaben aus Admin-Daten laden; fehlende Kanäle bleiben verborgen.
(async()=>{try{const r=await fetch('/api/settings');if(!r.ok)return;const s=await r.json();const wa=document.getElementById('ccWa'),tg=document.getElementById('ccTg');window.z1Contact&&z1Contact(s.whatsapp,s.telegram);if(s.whatsapp&&wa){wa.href='https://wa.me/'+s.whatsapp.replace(/\D/g,'');const label=document.getElementById('hWa');if(label)label.textContent='+'+s.whatsapp.replace(/\D/g,'');}else if(wa)wa.style.display='none';if(s.telegram&&tg){tg.href='https://t.me/'+s.telegram.replace(/^@/,'');const label=document.getElementById('hTg');if(label)label.textContent='@'+s.telegram.replace(/^@/,'');}else if(tg)tg.style.display='none';
const reg=document.querySelector('[data-i18n=\"regionalDesc\"]');if(reg&&s.region){const lang=langSelect.value,region=s.region,radius=s.radiusKm||30;reg.textContent=({de:`Regional in ${region}: Umgebung bis ${radius} km – nach Absprache.`,en:`Local service in ${region}, up to ${radius} km radius, by arrangement.`,ru:`Регион ${region}, радиус до ${radius} км — по договорённости.`,uk:`Регіон ${region}, радіус до ${radius} км — за домовленістю.`})[lang]||`Regional in ${region}: Umgebung bis ${radius} km – nach Absprache.`;}
if(s.publicEmail){const grid=document.querySelector('.contact-grid');if(grid&&!document.getElementById('ccEmail')){const card=document.createElement('a');card.id='ccEmail';card.className='contact-card';card.href='mailto:'+s.publicEmail;const ico=document.createElement('div');ico.className='cc-ico';ico.textContent='✉';const body=document.createElement('div');body.className='cc-body';const tag=document.createElement('span');tag.className='cc-tag';tag.textContent='03 · EMAIL';const title=document.createElement('h3');title.textContent='E-Mail';const desc=document.createElement('p');desc.textContent=s.publicEmail;const handle=document.createElement('b');handle.className='cc-handle';handle.textContent=s.publicEmail;body.append(tag,title,desc,handle);const cta=document.createElement('span');cta.className='cc-cta';cta.textContent='E-Mail senden →';card.append(ico,body,cta);grid.append(card);}}
}catch{}})();

(function buildConfigurator() {
  const form = document.querySelector('#custom .config-form'); if (!form) return;

  const TIER = {
    de: {e:'Einsteiger', m:'Mittel', h:'High-End', x:'Enthusiast', d4:'DDR4', pick:'Bitte auswählen', none:'Kein zweiter Speicher', labor:'Aufbau / Arbeit', laborLine:'+ 100 €',
      totalLabel:'Geschätzter Richtpreis inkl. 100 € Aufbau', totalHint:'Marktpreise (ca.) + 100 € Aufbau · finaler Endpreis nach Prüfung',
      expert:'Ich kenne mich aus – selbst wählen', guided:'Hilfe gewünscht – kurzes Formular',
      guidedIntro:'Beantworte ein paar Fragen – wir schlagen dir ein passendes System vor.',
      use:'Wofür brauchst du den PC? *', apps:'Wichtige Spiele / Programme', mon:'Monitor / Auflösung',
      wishes:'Weitere Wünsche ', wishesPh:'RGB, leise, weißes Gehäuse, WLAN, Größe, Zeitrahmen …',
      save:'In den Warenkorb', note:'Auswahl in den Warenkorb. Kompatibilität prüfen wir; Endpreis nennen wir persönlich.',
      empty:'Noch nichts ausgewählt', stock:'Stock-/Boxed-Kühler · 0 €', airT:'Luftkühlung (Tower)', airD:'Luftkühlung (Dual-Tower)',
      wat240:'Wasserkühlung AIO 240 mm', wat360:'Wasserkühlung AIO 360 mm', wat360r:'Wasserkühlung AIO 360 mm RGB',
      noGpu:'Keine dedizierte GPU · 0 €'},
    en: {e:'Budget', m:'Mid-range', h:'High-end', x:'Enthusiast', d4:'DDR4', pick:'Please select', none:'No second drive', labor:'Assembly / labor', laborLine:'+ €100',
      totalLabel:'Est. total incl. €100 assembly', totalHint:'Market prices (approx.) + €100 assembly · final price after review',
      expert:'I know hardware – pick parts', guided:'Need help – short form',
      guidedIntro:'Answer a few questions – we will suggest a build.',
      use:'What will you use the PC for? *', apps:'Games / apps', mon:'Monitor / resolution',
      wishes:'Extra wishes ', wishesPh:'RGB, quiet, white case, Wi‑Fi, size, timeline …',
      save:'Add to cart', note:'Goes to cart. We check compatibility and quote the final price.',
      empty:'Nothing selected yet', stock:'Stock cooler · €0', airT:'Air cooler (tower)', airD:'Air cooler (dual tower)',
      wat240:'AIO liquid 240 mm', wat360:'AIO liquid 360 mm', wat360r:'AIO liquid 360 mm RGB',
      noGpu:'No dedicated GPU · €0'},
    ru: {e:'Базовый', m:'Средний', h:'Высокий', x:'Топ', d4:'DDR4', pick:'Выберите', none:'Без второго диска', labor:'Сборка / работа', laborLine:'+ 100 €',
      totalLabel:'Ориентир с учётом 100 € за сборку', totalHint:'Рыночные цены (прибл.) + 100 € сборка · итоговая цена после проверки',
      expert:'Знаю железо – выбираю сам', guided:'Нужна помощь – короткая форма',
      guidedIntro:'Ответьте на несколько вопросов – мы предложим сборку.',
      use:'Для чего нужен ПК? *', apps:'Игры / программы', mon:'Монитор / разрешение',
      wishes:'Доп. пожелания ', wishesPh:'RGB, тихий, белый корпус, Wi‑Fi, размер, сроки …',
      save:'В корзину', note:'В корзину. Совместимость проверим; итоговую цену назовём лично.',
      empty:'Пока ничего не выбрано', stock:'Боксовый кулер · 0 €', airT:'Воздух (башня)', airD:'Воздух (две башни)',
      wat240:'СВО AIO 240 мм', wat360:'СВО AIO 360 мм', wat360r:'СВО AIO 360 мм RGB',
      noGpu:'Без дискретной видеокарты · 0 €'},
    uk: {e:'Базовий', m:'Середній', h:'Високий', x:'Топ', d4:'DDR4', pick:'Оберіть', none:'Без другого диска', labor:'Збірка / робота', laborLine:'+ 100 €',
      totalLabel:'Орієнтир з 100 € за збірку', totalHint:'Ринкові ціни (прибл.) + 100 € збірка · фінальна ціна після перевірки',
      expert:'Знаю залізо – обираю сам', guided:'Потрібна допомога – коротка форма',
      guidedIntro:'Відповіді на кілька питань – ми запропонуємо збірку.',
      use:'Для чого потрібен ПК? *', apps:'Ігри / програми', mon:'Монітор / роздільність',
      wishes:'Додаткові побажання ', wishesPh:'RGB, тихий, білий корпус, Wi‑Fi, розмір, терміни …',
      save:'До кошика', note:'У кошик. Сумісність перевіримо; фінальну ціну назвемо особисто.',
      empty:'Ще нічого не вибрано', stock:'Боксовий кулер · 0 €', airT:'Повітря (вежа)', airD:'Повітря (дві вежі)',
      wat240:'СВО AIO 240 мм', wat360:'СВО AIO 360 мм', wat360r:'СВО AIO 360 мм RGB',
      noGpu:'Без дискретної відеокарти · 0 €'}
  };

  const LABELS = {
    de: {cpu:'Prozessor',gpu:'Grafikkarte',ram:'Arbeitsspeicher',ssd:'Speicher (primär)',ssd2:'Zweiter Speicher',case:'Gehäuse',cool:'Kühlung',psu:'Netzteil'},
    en: {cpu:'CPU',gpu:'Graphics card',ram:'Memory',ssd:'Storage (primary)',ssd2:'Second drive',case:'Case',cool:'Cooling',psu:'PSU'},
    ru: {cpu:'Процессор',gpu:'Видеокарта',ram:'Память',ssd:'Накопитель (осн.)',ssd2:'Второй диск',case:'Корпус',cool:'Охлаждение',psu:'Блок питания'},
    uk: {cpu:'Процесор',gpu:'Відеокарта',ram:'Пам’ять',ssd:'Накопичувач (осн.)',ssd2:'Другий диск',case:'Корпус',cool:'Охолодження',psu:'Блок живлення'}
  };

  // Real market approx. EUR (DE, Geizhals/Amazon range Nov 2026). Prices are numbers only; labels translated.
  // Preise: ca.-Richtwerte, Stand 23.11.2026 (Händlerpreise DE, Speicherkrise). Endpreis nennen wir nach der Prüfung.
  const PARTS = {
    cpu: [
      {v:'', p:0},
      {v:'AMD Ryzen 5 3600', p:75, tier:'e', d4:1},
      {v:'AMD Ryzen 5 5600', p:115, tier:'e', d4:1},
      {v:'AMD Ryzen 5 5600X', p:130, tier:'e', d4:1},
      {v:'AMD Ryzen 7 5700X', p:155, tier:'m', d4:1},
      {v:'AMD Ryzen 7 5700X3D', p:185, tier:'m', d4:1},
      {v:'AMD Ryzen 7 5800X3D', p:230, tier:'m', d4:1},
      {v:'AMD Ryzen 9 5900X', p:260, tier:'h', d4:1},
      {v:'AMD Ryzen 5 7600', p:175, tier:'e'},
      {v:'AMD Ryzen 5 9600X', p:235, tier:'e'},
      {v:'AMD Ryzen 7 7700', p:285, tier:'m'},
      {v:'AMD Ryzen 7 7800X3D', p:370, tier:'m'},
      {v:'AMD Ryzen 7 9800X3D', p:420, tier:'h'},
      {v:'AMD Ryzen 9 9900X', p:440, tier:'h'},
      {v:'AMD Ryzen 9 9950X3D', p:580, tier:'x'},
      {v:'Intel Core i5-10400F', p:80, tier:'e', d4:1},
      {v:'Intel Core i5-12400F', p:125, tier:'e', d4:1},
      {v:'Intel Core i5-14600KF', p:240, tier:'m'},
      {v:'Intel Core i7-14700KF', p:360, tier:'m'},
      {v:'Intel Core Ultra 7 265K', p:410, tier:'h'},
      {v:'Intel Core Ultra 9 285K', p:600, tier:'x'}
    ],
    gpu: [
      {v:'', p:0},
      {v:'none', p:0, special:'noGpu'},
      {v:'RTX 5060', p:520, tier:'e', name:'NVIDIA RTX 5060'},
      {v:'RTX 5060 Ti 16GB', p:800, tier:'m', name:'NVIDIA RTX 5060 Ti 16GB'},
      {v:'RX 9060 XT 16GB', p:720, tier:'m', name:'AMD RX 9060 XT 16GB'},
      {v:'RTX 5070', p:860, tier:'m', name:'NVIDIA RTX 5070'},
      {v:'RX 9070', p:805, tier:'m', name:'AMD RX 9070'},
      {v:'RX 9070 XT', p:960, tier:'m', name:'AMD RX 9070 XT'},
      {v:'RTX 5070 Ti', p:1300, tier:'h', name:'NVIDIA RTX 5070 Ti'},
      {v:'RTX 5080', p:1850, tier:'h', name:'NVIDIA RTX 5080'},
      {v:'RTX 5090', p:7000, tier:'x', name:'NVIDIA RTX 5090'}
    ],
    ram: [
      {v:'', p:0},
      {v:'16 GB DDR4-3200', p:70, tier:'e', d4:1},
      {v:'32 GB DDR4-3200', p:130, tier:'e', d4:1},
      {v:'32 GB DDR4-3600', p:150, tier:'m', d4:1},
      {v:'64 GB DDR4-3200', p:260, tier:'m', d4:1},
      {v:'16 GB DDR5-6000', p:260, tier:'e'},
      {v:'32 GB DDR5-6000', p:500, tier:'m'},
      {v:'32 GB DDR5-6000 CL30', p:540, tier:'m'},
      {v:'32 GB DDR5-6400', p:560, tier:'m'},
      {v:'64 GB DDR5-6000', p:1000, tier:'h'},
      {v:'64 GB DDR5-6400', p:1100, tier:'h'},
      {v:'96 GB DDR5-6000', p:1500, tier:'x'}
    ],
    ssd: [
      {v:'', p:0},
      {v:'500 GB NVMe', p:70, tier:'e'},
      {v:'1 TB NVMe Gen4', p:140, tier:'e'},
      {v:'2 TB NVMe Gen4', p:230, tier:'m'},
      {v:'2 TB NVMe Gen5', p:290, tier:'m'},
      {v:'4 TB NVMe Gen4', p:400, tier:'h'},
      {v:'4 TB NVMe Gen5', p:480, tier:'h'}
    ],
    ssd2: [
      {v:'', p:0, special:'none'},
      {v:'500 GB NVMe extra', p:70},
      {v:'1 TB NVMe extra', p:135},
      {v:'2 TB NVMe extra', p:230},
      {v:'4 TB HDD', p:85},
      {v:'8 TB HDD', p:150}
    ],
    case: [
      {v:'', p:0},
      {v:'Montech Air 100 ARGB', p:75, tier:'e'},
      {v:'Fractal Meshify 2 Compact', p:115, tier:'e'},
      {v:'Lian Li Lancool 216', p:105, tier:'e'},
      {v:'NZXT H7 Flow', p:145, tier:'m'},
      {v:'Corsair 4000D Airflow', p:115, tier:'m'},
      {v:'Corsair 5000D Airflow', p:175, tier:'m'},
      {v:'Lian Li O11 Dynamic EVO', p:185, tier:'h'},
      {v:'be quiet! Silent Base 802', p:165, tier:'h'},
      {v:'Fractal North', p:155, tier:'h'}
    ],
    cool: [
      {v:'', p:0},
      {v:'Stock', p:0, special:'stock'},
      {v:'Luft Tower', p:45, special:'airT'},
      {v:'Luft Dual-Tower', p:55, special:'airD'},
      {v:'Wasser AIO 240', p:95, special:'wat240'},
      {v:'Wasser AIO 360', p:150, special:'wat360'},
      {v:'Wasser AIO 360 RGB', p:190, special:'wat360r'}
    ],
    psu: [
      {v:'', p:0},
      {v:'550W Bronze', p:60, tier:'e'},
      {v:'650W Gold', p:90, tier:'e'},
      {v:'750W Gold', p:110, tier:'m'},
      {v:'850W Gold', p:130, tier:'m'},
      {v:'1000W Gold', p:170, tier:'h'},
      {v:'1000W Platinum', p:200, tier:'h'},
      {v:'1200W Platinum', p:260, tier:'x'}
    ]
  };

  function lang() {
    return (document.getElementById('lang') && document.getElementById('lang').value) || localStorage.getItem('z1pc-lang') || 'de';
  }
  function t() { return TIER[lang()] || TIER.de; }
  function labels() { return LABELS[lang()] || LABELS.de; }

  function optText(o) {
    const tr = t();
    if (!o.v) return tr.pick;
    if (o.special === 'none') return tr.none;
    if (o.special === 'noGpu') return '[' + tr.e + '] ' + tr.noGpu;
    if (o.special && tr[o.special]) {
      const price = o.p ? (' · ca. ' + o.p + ' €') : '';
      return tr[o.special] + price;
    }
    const name = o.name || o.v;
    let prefix = '';
    if (o.tier) prefix = '[' + (tr[o.tier] || o.tier) + (o.d4 ? '/' + tr.d4 : '') + '] ';
    else if (o.d4) prefix = '[' + tr.d4 + '] ';
    const price = o.p ? (' · ca. ' + o.p + ' €') : '';
    if (o.v.includes('extra') || o.v.includes('HDD')) return '+ ' + name.replace(' extra','') + price;
    return prefix + name + price;
  }

  const mk = (tag, attrs={}, ...kids) => {
    const e = document.createElement(tag);
    for (const [k,v] of Object.entries(attrs)) {
      if (k==='className') e.className=v;
      else if (k==='style' && typeof v==='object') Object.assign(e.style,v);
      else if (k.startsWith('on')) e[k]=v;
      else if (v!=null) e.setAttribute(k, v);
    }
    kids.forEach(c => { if (c!=null) e.append(typeof c==='string'?document.createTextNode(c):c); });
    return e;
  };

  /* ---------- Zusatztexte v11 ---------- */
  const X = {
    de: { expertTab: 'Ich wähle selbst', guidedTab: 'Ich brauche Beratung', req: 'Pflichtfeld', opt: 'optional', errPick: 'Bitte wähle eine Option aus.', errWish: 'Bitte beschreibe deinen PC in mindestens 20 Zeichen, damit wir ihn uns konkret vorstellen können.', errUse: 'Bitte wähle den Einsatzzweck.', wishes: 'Wünsche zum PC', wishesPh: 'Beschreibe deinen Wunsch-PC: Wofür brauchst du ihn? Welche Spiele oder Programme? Monitor und Auflösung? Optik (RGB, Farbe), Lautstärke, Zeitrahmen …', chars: 'Zeichen', progress: 'Pflichtangaben', guidedHint: 'Richtwert für diesen Einsatzzweck. Deinen genauen Vorschlag mit Preis bekommst du persönlich.', fixed: 'Pflichtfelder fehlen' },
    en: { expertTab: 'I choose myself', guidedTab: 'I need advice', req: 'Required', opt: 'optional', errPick: 'Please choose an option.', errWish: 'Please describe your PC in at least 20 characters so we can picture it.', errUse: 'Please choose the intended use.', wishes: 'Your wishes for the PC', wishesPh: 'Describe your dream PC: what is it for? Which games or software? Monitor and resolution? Looks (RGB, colour), noise, timeframe …', chars: 'characters', progress: 'Required fields', guidedHint: 'Guide value for this use. You get your exact proposal with price personally.', fixed: 'Required fields missing' },
    ru: { expertTab: 'Выберу сам', guidedTab: 'Нужен совет', req: 'Обязательно', opt: 'необязательно', errPick: 'Выберите вариант.', errWish: 'Опишите ПК минимум в 20 символов, чтобы мы могли его представить.', errUse: 'Выберите назначение.', wishes: 'Пожелания к ПК', wishesPh: 'Опишите ваш ПК: для чего он? Какие игры или программы? Монитор и разрешение? Внешний вид (RGB, цвет), шум, сроки …', chars: 'символов', progress: 'Обязательные поля', guidedHint: 'Ориентир для этого назначения. Точное предложение с ценой пришлём лично.', fixed: 'Не заполнены обязательные поля' },
    uk: { expertTab: 'Оберу сам', guidedTab: 'Потрібна порада', req: 'Обов’язково', opt: 'необов’язково', errPick: 'Оберіть варіант.', errWish: 'Опишіть ПК щонайменше у 20 символів, щоб ми могли його уявити.', errUse: 'Оберіть призначення.', wishes: 'Побажання до ПК', wishesPh: 'Опишіть ваш ПК: для чого він? Які ігри чи програми? Монітор і роздільність? Вигляд (RGB, колір), шум, терміни …', chars: 'символів', progress: 'Обов’язкові поля', guidedHint: 'Орієнтир для цього призначення. Точну пропозицію з ціною надішлемо особисто.', fixed: 'Не заповнені обов’язкові поля' }
  };
  const tx = () => ({ ...t(), ...(X[lang()] || X.de) });
  const REQ = ['cpu', 'gpu', 'ram', 'ssd', 'case', 'cool', 'psu'];
  const USE_EST = { 'gaming-1080': 1300, 'gaming-4k': 3300, office: 900, creator: 3000, workstation: 4100 };  // Richtwerte inkl. Mainboard und Aufbau, Stand 23.11.2026
  const USE_TXT = { 'gaming-1080': 'Gaming 1080p / 1440p', 'gaming-4k': 'Gaming 1440p / 4K', office: 'Office / School', creator: 'Video / Photo / Stream', workstation: '3D / CAD' };
  const LABOR = 100, MINW = 20;
  const S = { mode: 'expert', parts: {}, use: '', apps: '', monitor: '', wishes: '' };
  const $ = id => document.getElementById(id);
  const eur = n => new Intl.NumberFormat('de-DE', { maximumFractionDigits: 0 }).format(n) + ' €';
  const priceOf = (key, v) => Number((PARTS[key].find(o => o.v === v) || {}).p || 0);
  // Mainboard-Richtwert passend zur CPU (kein eigener Auswahlpunkt)
  const BOARD_L = { de: 'Mainboard (passend)', en: 'Motherboard (matching)', ru: 'Материнская плата (подходящая)', uk: 'Материнська плата (відповідна)' };
  function boardPrice(cpu) {
    if (!cpu) return 0;
    if (/Ryzen \d (3600|5\d{3}X?(3D)?)$/.test(cpu)) return 110;      // AM4
    if (/Ryzen/.test(cpu)) return 150;                                  // AM5
    if (/10400F|12400F/.test(cpu)) return 130;
    return 190;                                                         // Intel 14. Gen / Ultra
  }
  // Kompatibilitätshinweise (nicht blockierend)
  const WARN = {
    de:{ram4:'⚠ Dieser Prozessor braucht DDR4-RAM.',ram5:'⚠ Dieser Prozessor braucht DDR5-RAM.',psu:'⚠ Netzteil evtl. zu schwach (empfohlen ab {w} W).',noGpu:'⚠ Dieser Prozessor hat keine integrierte Grafik, bitte eine Grafikkarte wählen.'},
    en:{ram4:'⚠ This CPU needs DDR4 memory.',ram5:'⚠ This CPU needs DDR5 memory.',psu:'⚠ PSU may be too weak (recommended from {w} W).',noGpu:'⚠ This CPU has no integrated graphics, please pick a graphics card.'},
    ru:{ram4:'⚠ Этому процессору нужна память DDR4.',ram5:'⚠ Этому процессору нужна память DDR5.',psu:'⚠ Блок питания может быть слабоват (рекомендуется от {w} Вт).',noGpu:'⚠ У этого процессора нет встроенной графики, выберите видеокарту.'},
    uk:{ram4:'⚠ Цьому процесору потрібна пам’ять DDR4.',ram5:'⚠ Цьому процесору потрібна пам’ять DDR5.',psu:'⚠ Блок живлення може бути слабким (рекомендовано від {w} Вт).',noGpu:'⚠ Цей процесор не має вбудованої графіки, оберіть відеокарту.'}
  };
  const GPU_W = [[/5090/,1000],[/5080/,850],[/5070 Ti/,750],[/5070/,750],[/9070 XT/,750],[/9070/,700],[/9060 XT/,650],[/5060 Ti/,650],[/5060/,550]];
  function warnings(parts, lg) {
    const L = WARN[lg] || WARN.de, out = [], cpu = parts.cpu || '', ram = parts.ram || '', gpu = parts.gpu || '', psu = parts.psu || '';
    const am4 = /Ryzen \d (3600|5\d{3}X?(3D)?)$/.test(cpu), am5 = /Ryzen \d (7|9)\d{3}/.test(cpu);
    const d4only = am4 || /10400F/.test(cpu), d5only = am5 || /Ultra/.test(cpu), noIgpu = am4 || /F$/.test(cpu), big = /9950X3D|285K|14700KF|9900X|9800X3D/.test(cpu);
    if (d4only && /DDR5/.test(ram)) out.push(L.ram4);
    if (d5only && /DDR4/.test(ram)) out.push(L.ram5);
    if (cpu && noIgpu && gpu === 'none') out.push(L.noGpu);
    if (psu) { const w = parseInt(psu); let need = 0; for (const [re, wt] of GPU_W) if (re.test(gpu)) { need = wt; break; } if (need && big) need += 100; if (need && w < need) out.push(L.psu.replace('{w}', need)); }
    return out;
  }
  const fieldWrap = (k, label, req, ctrl, errText) => {
    const w = mk('label', { className: 'field', 'data-k': k });
    const sp = mk('span', {}, label); if (req) sp.append(mk('i', { className: 'req', title: tx().req }, '*')); else sp.append(mk('span', { className: 'opt' }, tx().opt));
    w.append(sp, ctrl, mk('span', { className: 'err', role: 'alert' }, errText)); return w;
  };

  function expertTotal() {
    let sum = 0; for (const [k, v] of Object.entries(S.parts)) if (v) sum += priceOf(k, v);
    return sum ? sum + LABOR + boardPrice(S.parts.cpu) : 0;
  }
  const valid = k => k === 'wishes' ? S.wishes.trim().length >= MINW : k === 'use' ? !!S.use : !!S.parts[k];
  const reqKeys = () => S.mode === 'expert' ? [...REQ, 'wishes'] : ['use', 'wishes'];

  function render() {
    const tr = tx(), lab = labels(), form = $('configForm'); form.replaceChildren();
    const seg = mk('div', { className: 'seg', role: 'tablist' });
    for (const [m, label] of [['expert', tr.expertTab], ['guided', tr.guidedTab]]) {
      const b = mk('button', { type: 'button', className: m === S.mode ? 'on' : '', role: 'tab', 'aria-selected': m === S.mode }, label);
      b.onclick = () => { S.mode = m; render(); }; seg.append(b);
    }
    form.append(seg);

    if (S.mode === 'expert') {
      for (const [key, opts] of Object.entries(PARTS)) {
        const sel = mk('select', { id: 'cfg-' + key, name: key });
        opts.forEach(o => { const op = document.createElement('option'); op.value = o.v; op.textContent = optText(o); sel.append(op); });
        sel.value = S.parts[key] || '';
        sel.onchange = () => { S.parts[key] = sel.value; touch(key); };
        const req = REQ.includes(key);
        form.append(fieldWrap(key, lab[key] || key, req, sel, tr.errPick));
      }
    } else {
      form.append(mk('p', { className: 'guided-intro' }, tr.guidedIntro));
      const use = mk('select', { id: 'g-use' }, mk('option', { value: '' }, tr.pick), ...Object.entries(USE_TXT).map(([v, l]) => mk('option', { value: v }, l)));
      use.value = S.use; use.onchange = () => { S.use = use.value; touch('use'); };
      const w = fieldWrap('use', tr.use.replace(/\s*\*$/, ''), true, use, tr.errUse); w.classList.add('full'); form.append(w);
      const apps = mk('input', { id: 'g-apps', maxlength: '200' }); apps.value = S.apps; apps.oninput = () => { S.apps = apps.value; };
      const mon = mk('input', { id: 'g-monitor', maxlength: '100' }); mon.value = S.monitor; mon.oninput = () => { S.monitor = mon.value; };
      form.append(fieldWrap('apps', tr.apps, false, apps, ''), fieldWrap('monitor', tr.mon, false, mon, ''));
    }

    const ta = mk('textarea', { id: 'cfg-wishes', name: 'wishes', rows: '5', maxlength: '1500', placeholder: tr.wishesPh }); ta.value = S.wishes;
    const counter = mk('div', { className: 'counter' });
    const upd = () => { const n = S.wishes.trim().length; counter.textContent = n + ' / min. ' + MINW + ' ' + tr.chars; counter.classList.toggle('ok', n >= MINW); };
    ta.oninput = () => { S.wishes = ta.value; upd(); touch('wishes'); }; upd();
    const ww = fieldWrap('wishes', tr.wishes, true, ta, tr.errWish); ww.classList.add('full'); ww.insertBefore(counter, ww.querySelector('.err')); form.append(ww);
    form.append(mk('p', { className: 'tiny cfg-note' }, tr.note));

    const act = $('cfgAction'); act.replaceChildren();
    const btn = mk('button', { type: 'button', className: 'btn red', id: 'configSave' }, tr.save); btn.onclick = submit; act.append(btn);
    refresh();
  }

  function touch(k) { const w = document.querySelector('.field[data-k="' + k + '"]'); w && w.classList.remove('bad'); refresh(); }

  function refresh() {
    const tr = tx(), lab = labels(), keys = reqKeys(), done = keys.filter(valid).length;
    let total = 0, hint = tr.totalHint; const lines = [];
    if (S.mode === 'expert') {
      total = expertTotal();
      for (const [k, v] of Object.entries(S.parts)) if (v) lines.push([lab[k] || k, v === 'none' ? tr.noGpu.replace(' · 0 €', '') : v]);
      if (total) { const bd = boardPrice(S.parts.cpu); if (bd) lines.push([BOARD_L[lang()] || BOARD_L.de, 'ca. ' + bd + ' €']); lines.push([tr.labor, tr.laborLine]); }
    } else {
      total = USE_EST[S.use] || 0; hint = tr.guidedHint;
      if (S.use) lines.push([tr.use.replace(/\s*\*$/, ''), USE_TXT[S.use]]);
    }
    $('cfgPrice').replaceChildren(mk('small', {}, 'ca.'), document.createTextNode(' ' + (total ? eur(total) : '– €')));
    $('cfgHint').textContent = hint;
    $('cfgMeter').style.width = (done / keys.length * 100) + '%';
    $('cfgMeterL').textContent = tr.progress + ': ' + done + ' / ' + keys.length;
    $('cfgSummary').innerHTML = '';
    if (!lines.length) $('cfgSummary').append(mk('li', { className: 'none' }, tr.empty));
    lines.forEach(([k, v]) => $('cfgSummary').append(mk('li', {}, mk('span', {}, k), mk('b', {}, v))));
    let wb = $('cfgWarn'); if (!wb) { wb = mk('div', { id: 'cfgWarn', style: 'color:#ffb347;font-size:13px;display:grid;gap:4px;margin-top:10px' }); $('cfgSummary').after(wb); }
    wb.replaceChildren(...(S.mode === 'expert' ? warnings(S.parts, lang()) : []).map(x => mk('div', {}, x)));
  }

  function submit() {
    const keys = reqKeys(), bad = keys.filter(k => !valid(k));
    document.querySelectorAll('#configForm .field').forEach(w => w.classList.toggle('bad', bad.includes(w.dataset.k)));
    if (bad.length) {
      const w = document.querySelector('.field[data-k="' + bad[0] + '"]'); w.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => { const f = w.querySelector('select,textarea,input'); f && f.focus({ preventScroll: true }); }, 350); return;
    }
    const lab = labels(), wish = S.wishes.trim().replace(/\s+/g, ' ');
    if (S.mode === 'guided') {
      const detail = ['Beratung', 'Einsatz: ' + USE_TXT[S.use], S.apps.trim() && 'Programme: ' + S.apps.trim(), S.monitor.trim() && 'Monitor: ' + S.monitor.trim()].filter(Boolean).join(' | ');
      Cart.add({ id: 'guided-' + Date.now(), name: 'PC-Beratung / Vorschlag', est: true, price: USE_EST[S.use], sub: USE_TXT[S.use] + ' · Richtwert', detail, note: 'Wünsche: ' + wish });
    } else {
      const parts = Object.entries(S.parts).filter(([, v]) => v), de = LABELS.de;
      const wn = warnings(S.parts, 'de');
      const detail = parts.map(([k, v]) => (de[k] || k) + ': ' + (v === 'none' ? 'Keine dedizierte GPU' : v)).join(' | ') + (wn.length ? ' | ' + wn.join(' ') : '') + ' | Mainboard (passend) ca. ' + boardPrice(S.parts.cpu) + ' € + Aufbau 100 € inklusive';
      Cart.add({ id: 'custom-' + Date.now(), name: 'Individueller PC', est: true, price: expertTotal(), sub: parts.slice(0, 3).map(([, v]) => v).join(' · '), detail, note: 'Wünsche: ' + wish });
    }
  }

  render();
  document.getElementById('lang').addEventListener('change', () => setTimeout(render, 0));
})();

setLang(langSelect.value);
