// Stample data that is not in stamps_filled.xml: one pen pal per country, stamp motifs and postcard texts.
// The stamps and the list of countries come from stamps_filled.xml; rows here are matched by country name.

// name | ISO code (flag and stamp id prefix: never change it) | city | pen pal | hello | bye | denomination unit
const PEOPLE_ROWS = `
Afghanistan|AF|Kabul|Ahmad Karimi|Salaam|Khuda hafiz|pul
Albania|AL|Tirana|Arben Hoxha|Përshëndetje|Tung|lek
Algeria|DZ|Algiers|Karim Benali|Salam|Bslama|DA
Andorra|AD|Andorra la Vella|Jordi Puig|Hola|Adéu|c
Angola|AO|Luanda|Manuel Kiala|Olá|Abraço|kz
Antigua and Barbuda|AG|St. John's|Shawn Joseph|Wa gwan|Lata|c
Argentina|AR|Buenos Aires|Santiago González|Hola|Un abrazo|$
Armenia|AM|Yerevan|Aram Petrosyan|Barev|Hajogh|dram
Australia|AU|Canberra|Jack Wilson|G'day|Cheers|c
Austria|AT|Vienna|Florian Huber|Servus|Baba|Kr
Azerbaijan|AZ|Baku|Elvin Mammadov|Salam|Sağ ol|q
Bahamas|BS|Nassau|Kendrick Rolle|Hey|Later|c
Bahrain|BH|Manama|Yusuf Al-Mahmood|Marhaba|Ma'a salama|fils
Bangladesh|BD|Dhaka|Rahim Hossain|Salam|Khoda hafez|poisha
Barbados|BB|Bridgetown|Kemar Clarke|Wuh gine on|Lata|c
Belarus|BY|Minsk|Aliaksandr Kavalenka|Pryvitannie|Byvai|kap
Belgium|BE|Brussels|Lucas Peeters|Hallo|Groetjes|c
Belize|BZ|Belmopan|Andre Gentle|Weh di go aan|Lata|c
Benin|BJ|Porto-Novo|Koffi Houngbo|Bonjour|À bientôt|F
Bhutan|BT|Thimphu|Karma Dorji|Kuzuzangpo|Log jay gay|ch
Bolivia|BO|La Paz|Juan Mamani|Hola|Chau|Bs
Bosnia and Herzegovina|BA|Sarajevo|Emir Hodžić|Zdravo|Pozdrav|KM
Botswana|BW|Gaborone|Kagiso Molefe|Dumela|Sala sentle|t
Brazil|BR|Brasília|João Silva|Olá|Beijos|R$
Brunei|BN|Bandar Seri Begawan|Rahman Yusof|Apa khabar|Jumpa lagi|c
Bulgaria|BG|Sofia|Georgi Ivanov|Zdravei|Chao|st
Burkina Faso|BF|Ouagadougou|Issouf Ouédraogo|Ne y windiga|À plus|F
Burundi|BI|Gitega|Claude Niyonzima|Amahoro|Urabeho|F
Cabo Verde|CV|Praia|Nuno Tavares|Olá|Txau|esc
Cambodia|KH|Phnom Penh|Sokha Chan|Suosdei|Lea sen hoey|riel
Cameroon|CM|Yaoundé|Jean Mbarga|Bonjour|À plus|F
Canada|CA|Ottawa|Liam Tremblay|Hey|Take care, eh|¢
Central African Republic|CF|Bangui|Didier Ngbanda|Balao|À bientôt|F
Chad|TD|N'Djamena|Mahamat Abakar|Salam|À bientôt|F
Chile|CL|Santiago|Matías Muñoz|Hola|Chao po|$
China|CN|Beijing|Wang Wei|Nǐ hǎo|Zàijiàn|fen
Colombia|CO|Bogotá|Andrés Rodríguez|Hola|Un abrazo|$
Comoros|KM|Moroni|Said Ahmed|Bariza|Kwaheri|F
Congo (Republic)|CG|Brazzaville|Christ Mabiala|Mbote|À plus|F
Congo (Democratic Republic)|CD|Kinshasa|Patrick Kabongo|Mbote|Tokomonana|F
Costa Rica|CR|San José|Diego Vargas|Pura vida|Pura vida|₡
Croatia|HR|Zagreb|Ivan Horvat|Bok|Pozdrav|lp
Cuba|CU|Havana|Yoel Pérez|Hola|Un beso|c
Cyprus|CY|Nicosia|Andreas Georgiou|Geia sou|Filia|c
Czech Republic|CZ|Prague|Jan Novák|Ahoj|Čau|Kč
Denmark|DK|Copenhagen|Mads Jensen|Hej|Kærlig hilsen|øre
Djibouti|DJ|Djibouti|Abdi Farah|Nabad|Nabadeey|F
Dominica|DM|Roseau|Marvin Joseph|Bonjou|Lata|c
Dominican Republic|DO|Santo Domingo|Luis Peña|Klk|Un abrazo|c
Ecuador|EC|Quito|Carlos Andrade|Hola|Chao|c
Egypt|EG|Cairo|Mohamed Hassan|Ahlan|Ma'a salama|m
El Salvador|SV|San Salvador|Óscar Martínez|Qué onda|Saludos|c
Equatorial Guinea|GQ|Malabo|Santiago Nsue|Hola|Adiós|F
Eritrea|ER|Asmara|Yonas Tesfay|Selam|Ciao|c
Estonia|EE|Tallinn|Rasmus Tamm|Tere|Head aega|s
Eswatini|SZ|Mbabane|Sibusiso Dlamini|Sawubona|Sala kahle|c
Ethiopia|ET|Addis Ababa|Abebe Bekele|Selam|Ciao|birr
Fiji|FJ|Suva|Josefa Ratu|Bula|Moce|c
Finland|FI|Helsinki|Mikko Virtanen|Moi|Moikka|p
France|FR|Paris|Camille Martin|Bonjour|Bisous|c
Gabon|GA|Libreville|Ulrich Nzé|Mbolo|À plus|F
Gambia|GM|Banjul|Lamin Jallow|Nanga def|Ba beneen|b
Georgia|GE|Tbilisi|Giorgi Beridze|Gamarjoba|Nakhvamdis|t
Germany|DE|Berlin|Lukas Müller|Hallo|Liebe Grüße|Pf
Ghana|GH|Accra|Kwame Mensah|Akwaaba|Nantie yie|p
Greece|GR|Athens|Nikos Papadopoulos|Geia sou|Filakia|l
Grenada|GD|St. George's|Kerry Mitchell|Wha happenin|Lata|c
Guatemala|GT|Guatemala City|José López|Hola|Saludos|Q
Guinea|GN|Conakry|Mamadou Camara|I ni ce|À plus|F
Guinea-Bissau|GW|Bissau|Braima Djaló|Olá|Txau|F
Guyana|GY|Georgetown|Ravi Persaud|Wah gwaan|Lata|c
Haiti|HT|Port-au-Prince|Jean-Baptiste Pierre|Bonjou|Orevwa|c
Honduras|HN|Tegucigalpa|Juan Funes|Hola|Saludos|L
Hungary|HU|Budapest|Bence Nagy|Szia|Puszi|Ft
Iceland|IS|Reykjavík|Sigurður Jónsson|Halló|Bless|kr
India|IN|New Delhi|Rahul Sharma|Namaste|Phir milenge|p
Indonesia|ID|Jakarta|Budi Santoso|Halo|Sampai jumpa|Rp
Iran|IR|Tehran|Reza Ahmadi|Salam|Khodahafez|rial
Iraq|IQ|Baghdad|Ali Al-Jubouri|Shlonak|Ma'a salama|fils
Ireland|IE|Dublin|Seán Murphy|Dia duit|Sláinte|p
Israel|IL|Jerusalem|Noa Cohen|Shalom|Lehitra'ot|ag
Italy|IT|Rome|Giuseppe Rossi|Ciao|Baci|c
Ivory Coast|CI|Yamoussoukro|Konan Kouassi|Bonjour|On se dit quoi|F
Jamaica|JM|Kingston|Andre Brown|Wah gwaan|Likkle more|c
Japan|JP|Tokyo|Haruto Sato|Konnichiwa|Mata ne|円
Jordan|JO|Amman|Omar Haddad|Marhaba|Ma'a salama|fils
Kazakhstan|KZ|Astana|Nurlan Akhmetov|Sälem|Sau bol|₸
Kenya|KE|Nairobi|Wanjiru Kamau|Jambo|Kwaheri|c
Kiribati|KI|Tarawa|Tekena Teiwaki|Mauri|Ti a bo|c
Kosovo|XK|Pristina|Driton Berisha|Tung|Mirupafshim|c
Kuwait|KW|Kuwait City|Fahad Al-Mutairi|Marhaba|Ma'a salama|fils
Kyrgyzstan|KG|Bishkek|Aibek Osmonov|Salam|Kosh|t
Laos|LA|Vientiane|Somphone Vongsa|Sabaidee|Laa kon|kip
Latvia|LV|Riga|Jānis Bērziņš|Sveiki|Uz redzēšanos|s
Lebanon|LB|Beirut|Rami Khoury|Marhaba|Yalla bye|p
Lesotho|LS|Maseru|Thabo Mokoena|Lumela|Sala hantle|s
Liberia|LR|Monrovia|Emmanuel Kollie|Hello-o|Peace|c
Libya|LY|Tripoli|Mustafa Ben Ali|Salam|Ma'a salama|dh
Liechtenstein|LI|Vaduz|Marco Büchel|Hoi|Tschau|Rp
Lithuania|LT|Vilnius|Mantas Kazlauskas|Labas|Iki|ct
Luxembourg|LU|Luxembourg|Luc Schmit|Moien|Äddi|c
Madagascar|MG|Antananarivo|Hery Rakoto|Salama|Veloma|Ar
Malawi|MW|Lilongwe|Chikondi Phiri|Moni|Tsalani bwino|t
Malaysia|MY|Kuala Lumpur|Ahmad Ismail|Apa khabar|Jumpa lagi|sen
Maldives|MV|Malé|Ibrahim Rasheed|Kihineh|Dhanee|l
Mali|ML|Bamako|Moussa Traoré|I ni ce|K'an ben|F
Malta|MT|Valletta|Joseph Borg|Bongu|Saħħa|c
Marshall Islands|MH|Majuro|Jerry Kabua|Iokwe|Iokwe|c
Mauritania|MR|Nouakchott|Sidi Ould Ahmed|Salam|Ma'a salama|UM
Mauritius|MU|Port Louis|Kevin Appadoo|Bonzour|Salam|c
Mexico|MX|Mexico City|José Hernández|Qué onda|Un abrazo|$
Micronesia|FM|Palikir|Kasio Mida|Kaselehlie|Kaselehlie|c
Moldova|MD|Chișinău|Ion Rusu|Salut|Pa|b
Monaco|MC|Monaco|Marc Gastaud|Bonjour|À bientôt|c
Mongolia|MN|Ulaanbaatar|Bat-Erdene Batbayar|Sain uu|Bayartai|₮
Montenegro|ME|Podgorica|Marko Vuković|Zdravo|Ćao|c
Morocco|MA|Rabat|Youssef El Amrani|Salam|Bslama|DH
Mozambique|MZ|Maputo|Armando Cossa|Olá|Abraço|MT
Myanmar|MM|Naypyidaw|Aung Kyaw|Mingalaba|Thwa dau me|p
Namibia|NA|Windhoek|Johannes Shikongo|Wa lalapo|Kalapo nawa|c
Nauru|NR|Yaren|Lionel Detenamo|Ekamowir omo|Tubwa|c
Nepal|NP|Kathmandu|Bikash Shrestha|Namaste|Pheri bhetaula|p
Netherlands|NL|Amsterdam|Daan de Jong|Hoi|Doei|ct
New Zealand|NZ|Wellington|Nikau Thompson|Kia ora|Ka kite|c
Nicaragua|NI|Managua|Byron Rivas|Qué onda|Saludos|C$
Niger|NE|Niamey|Abdou Moussa|Fofo|À plus|F
Nigeria|NG|Abuja|Chinedu Okafor|Bawo|O dabo|k
North Korea|KP|Pyongyang|Ri Chol-ho|Annyeong|Annyeong|ch
North Macedonia|MK|Skopje|Stefan Trajkovski|Zdravo|Čao|den
Norway|NO|Oslo|Ole Hansen|Hei|Hilsen|øre
Oman|OM|Muscat|Salim Al-Balushi|Marhaba|Ma'a salama|bz
Pakistan|PK|Islamabad|Muhammad Khan|Salam|Khuda hafiz|p
Palau|PW|Ngerulmud|Kalei Ngirmang|Alii|Mesulang|c
Palestine|PS|Ramallah|Khaled Nasser|Marhaba|Ma'a salama|m
Panama|PA|Panama City|Ricardo Batista|Hola|Chao|c
Papua New Guinea|PG|Port Moresby|Michael Kila|Gude|Lukim yu|t
Paraguay|PY|Asunción|Rodrigo Benítez|Mba'éichapa|Jajotopata|₲
Peru|PE|Lima|Luis Quispe|Hola|Chau|c
Philippines|PH|Manila|Juan dela Cruz|Kumusta|Ingat|s
Poland|PL|Warsaw|Jakub Kowalski|Cześć|Buziaki|gr
Portugal|PT|Lisbon|Tiago Santos|Olá|Beijinhos|r
Qatar|QA|Doha|Khalid Al-Kuwari|Marhaba|Ma'a salama|dh
Romania|RO|Bucharest|Andrei Popescu|Salut|Pa pa|b
Russia|RU|Moscow|Ivan Ivanov|Privet|Poka|k
Rwanda|RW|Kigali|Eric Habimana|Muraho|Murabeho|F
Saint Kitts and Nevis|KN|Basseterre|Dwayne Liburd|Wha di scene|Lata|c
Saint Lucia|LC|Castries|Jerome Joseph|Bonjou|Lata|c
Saint Vincent and the Grenadines|VC|Kingstown|Kenroy Browne|Wha happen|Lata|c
Samoa|WS|Apia|Sione Faleolo|Talofa|Tofa|s
San Marino|SM|San Marino|Marco Gasperoni|Ciao|Ciao ciao|c
Sao Tome and Principe|ST|São Tomé|Edson Neto|Olá|Txau|db
Saudi Arabia|SA|Riyadh|Faisal Al-Harbi|Ahlan|Ma'a salama|h
Senegal|SN|Dakar|Mamadou Diop|Nanga def|Ba beneen|F
Serbia|RS|Belgrade|Nikola Jovanović|Zdravo|Ćao|p
Seychelles|SC|Victoria|Jean-Paul Hoareau|Bonzour|Orevwar|c
Sierra Leone|SL|Freetown|Mohamed Kamara|Kushe|Wi go si back|c
Singapore|SG|Singapore|Tan Wei Ming|Hello lah|Bye bye lah|c
Slovakia|SK|Bratislava|Peter Horváth|Ahoj|Čau|h
Slovenia|SI|Ljubljana|Luka Novak|Živjo|Adijo|v
Solomon Islands|SB|Honiara|Peter Tome|Halo|Lukim iu|c
Somalia|SO|Mogadishu|Abdirahman Warsame|Nabad|Nabadeey|sh
South Africa|ZA|Pretoria|Sipho Ndlovu|Sawubona|Sharp sharp|c
South Korea|KR|Seoul|Kim Min-jun|Annyeong|Annyeong|₩
South Sudan|SS|Juba|Deng Garang|Salam|Ma'a salama|p
Spain|ES|Madrid|Javier García|Hola|Besos|c
Sri Lanka|LK|Colombo|Nimal Perera|Ayubowan|Gihin ennam|c
Sudan|SD|Khartoum|Ahmed Osman|Salam|Ma'a salama|m
Suriname|SR|Paramaribo|Rishi Ramdin|Fa waka|Ada|c
Sweden|SE|Stockholm|Erik Andersson|Hej|Kram|öre
Switzerland|CH|Bern|Reto Meier|Grüezi|Tschüss|Rp
Syria|SY|Damascus|Samer Haddad|Marhaba|Ma'a salama|p
Taiwan|TW|Taipei|Chen Jia-hao|Nǐ hǎo|Bàibài|$
Tajikistan|TJ|Dushanbe|Firuz Rahimov|Salom|Khayr|d
Tanzania|TZ|Dodoma|Baraka Mwakyusa|Mambo|Kwaheri|c
Thailand|TH|Bangkok|Somchai Srisuk|Sawasdee|La gon|฿
Timor-Leste|TL|Dili|Nelson Soares|Bondia|Adeus|c
Togo|TG|Lomé|Kossi Agbeko|Woezon|À plus|F
Tonga|TO|Nuku'alofa|Sione Tupou|Mālō e lelei|'Alu ā|s
Trinidad and Tobago|TT|Port of Spain|Marlon Ramdass|Wha happenin|Laters|c
Tunisia|TN|Tunis|Mehdi Trabelsi|Aslema|Bslama|m
Turkey|TR|Ankara|Mehmet Yılmaz|Merhaba|Görüşürüz|kr
Turkmenistan|TM|Ashgabat|Merdan Annayev|Salam|Sag bol|t
Tuvalu|TV|Funafuti|Telito Taafaki|Talofa|Tofa|c
Uganda|UG|Kampala|Joseph Okello|Oli otya|Weeraba|c
Ukraine|UA|Kyiv|Oleksandr Shevchenko|Pryvit|Buvai|k
United Arab Emirates|AE|Abu Dhabi|Rashid Al Mansoori|Marhaba|Ma'a salama|f
United Kingdom|GB|London|Oliver Smith|Hiya|Cheers|p
United States|US|Washington|Mike Johnson|Howdy|Later|¢
Uruguay|UY|Montevideo|Martín Fernández|Hola|Chau|c
Uzbekistan|UZ|Tashkent|Rustam Yusupov|Salom|Xayr|t
Vanuatu|VU|Port Vila|Jean Kalsakau|Halo|Lukim yu|vt
Vatican City|VA|Vatican City|Fra Matteo|Salve|Pax|c
Venezuela|VE|Caracas|Carlos Pérez|Epa|Chao|c
Vietnam|VN|Hanoi|Nguyễn Văn An|Xin chào|Tạm biệt|đ
Yemen|YE|Sana'a|Nabil Qasim|Marhaba|Ma'a salama|f
Zambia|ZM|Lusaka|Mwila Banda|Muli shani|Shalapo|n
Zimbabwe|ZW|Harare|Tendai Moyo|Mhoro|Sarai zvakanaka|c
`;

// The picture on a stamp, chosen from the first pattern its description matches
const MOTIFS = [
  [/olympic|athletic|sport|cycling|football|fifa|chess/i, "🏅"],
  [/railway|locomotive|train/i, "🚂"],
  [/airmail|aeroplane|aircraft|airline|zeppelin|flying boat|balloon/i, "✈️"],
  [/moon|space|satellite/i, "🚀"],
  [/ship|sailing|harbour|boat|navigation|fishing/i, "⛵"],
  [/bird/i, "🐦"],
  [/butterfl|insect/i, "🦋"],
  [/flower|orchid|plant/i, "🌸"],
  [/fish|marine|coral|reef/i, "🐠"],
  [/mammal|animal|endangered|horse|dogs|wildlife/i, "🦊"],
  [/reptile|dinosaur|prehistoric/i, "🦕"],
  [/mushroom/i, "🍄"],
  [/tree|forest|park|environment|climate|ozone|renewable/i, "🌳"],
  [/mountain|cave|volcan/i, "🏔️"],
  [/lake|river|waterfall|dam|island|beach/i, "🌊"],
  [/lighthouse/i, "🗼"],
  [/bridge/i, "🌉"],
  [/fortress|castle|architecture|old town|capital|houses|building|heritage/i, "🏰"],
  [/coat of arms|flag/i, "🛡️"],
  [/coronation|jubilee|reign|accession|royal|queen|king/i, "👑"],
  [/portrait|head of state|head in profile|statesm|heroes/i, "👤"],
  [/liberty|allegor/i, "🗽"],
  [/numeral|postage due|surcharge|overprint|reprint|perforated|colour change|currency/i, "🔢"],
  [/red cross|health|tuberculosis|who |covid|medic/i, "⚕️"],
  [/child|youth|scout|unicef|school|literacy|university/i, "🎒"],
  [/music|composer|instrument|dance|festival|folk/i, "🎻"],
  [/writer|poet|tale|nobel|scientist/i, "📜"],
  [/painting|art|drawing|craft|costume/i, "🎨"],
  [/christmas|new year|greeting/i, "🎄"],
  [/harvest|agricultur|fruit|vegetable|wine|produce|food|market/i, "🌾"],
  [/telegraph|telephone|radio|computer|internet|digital/i, "📡"],
  [/mining|industry|mineral|gemstone/i, "⛏️"],
  [/automobile|car/i, "🚗"],
  [/united nations|upu|universal postal|diplomatic|peace|joint issue|europa|victory|solidarity/i, "🕊️"],
  [/post|stamp|philatel|parcel|newspaper|registration|telegraph|fiscal|local/i, "📯"],
];
const MOTIF_FALLBACK = ["⭐", "🌍", "🏛️", "🌞", "🕰️", "🎐", "🪶", "🗝️"];

// Vintage printing inks for stamp frames
const INKS = ["#9b2335", "#1f4e8c", "#3d6b35", "#6b3d7a", "#b5651d", "#1d6b6b", "#7a4a2a", "#3b4a5a", "#a8324a", "#2f5d50", "#8a6d1f", "#5b2a6e"];
// Postmark inks: black, navy, red, violet, green
const MARK_INKS = ["#1b1b1f", "#1d2d6b", "#a3202b", "#4b2a6b", "#1f4d33"];

// Postcard texts. {to} recipient's first name, {from} sender's first name, {city} {country} where it was sent,
// {dest} where it goes, {prev} {prevName} who wrote to the sender before, {hello} the sender's greeting,
// {other} {otherName} {otherCity} a random pen pal somewhere else, {smell} {smell2} {food} {animal} {thing} random words.
const TEXT_OPENERS = [
  "{hello}, {to}!",
  "{hello} {hello}, {to}!!",
  "Dearest {to},",
  "{to}! {hello}!",
  "{hello} from {city}, {to}!",
  "Oi {to}! I mean… {hello}!",
  "To the one and only {to}:",
  "{hello}, {to}, my favourite stranger!",
  "{to}, it's me again. {hello}!",
  "Breaking news, {to}:",
];
const TEXT_PREV = [
  "{prevName} just sent me a card from {prev}, so now it's my turn to pass it on.",
  "Got a lovely card from {prevName} in {prev}! Someone had already peeled the stamp off. Who DOES that?!",
  "A postcard from {prev} arrived. I danced in the hallway. The neighbours saw. It's fine.",
  "{prevName} wrote me from {prev}. The chain continues! Do not break the chain. (Or do, I'm not your boss.)",
  "My card from {prev} smelled faintly of {smell}. I hope this one smells of {smell2}.",
  "{prevName} in {prev} says hi. Well, {prevName} said hi to me, but I'm forwarding it.",
  "The postman brought a card from {prev} and looked very proud of it.",
  "{prevName}'s card from {prev} had a doodle of a {animal} on it. I've framed it.",
  "The card from {prev} took three weeks. I think it went on holiday first.",
  "{prevName} wrote 'greetings from {prev}' in such big letters there was no room for anything else. Iconic.",
  "I read {prevName}'s card from {prev} out loud to my plants. They grew a little.",
  "Someone in {prev} mailed me a postcard with a stamp that was half missing. Sound familiar?",
];
const TEXT_PLACE = [
  "Greetings from {city}! The weather is doing that thing again.",
  "It rained for three days in {city}. I've started talking to my umbrella.",
  "{city} is lovely this time of year. Every time of year, actually. We're very consistent.",
  "Today I ate something I can't pronounce. Ten out of ten, would point at the menu again.",
  "A pigeon in {city} stole my sandwich. We locked eyes. It showed no remorse.",
  "Bought a vegetable I've never seen before at the market. It's watching me from the kitchen.",
  "The sunset here was so pretty I forgot to take a photo. You'll have to trust me.",
  "I climbed the tallest hill in {country}. Okay, the tallest one near the bus stop.",
  "Learned a new word today. I'm using it wrong, apparently, but with confidence.",
  "The museum in {city} has a whole room of spoons. I spent two hours in it. No regrets.",
  "My neighbour's cat has decided it lives with me now. Nobody asked me.",
  "The tram driver waved at me. We're basically best friends now.",
  "Life in {city}: slow mornings, strong coffee, stronger gossip.",
  "Took a wrong turn and found the best bakery in {country}. Never turning right again.",
  "It's so hot here the postbox is warm. Sorry if this card arrives slightly toasted.",
  "It's so cold here my pen froze halfway through this sentenc",
  "Saw a dog wearing tiny boots today. Best day of the month.",
  "The library fined me for a book I returned in 2009. History is complicated.",
  "{city} has a new roundabout. Everyone is furious. It's the best thing that's happened all year.",
  "I joined a choir. They asked me to sing quieter. I'm the loudest in {country} now.",
  "The goats on the hill have started a band. Mostly percussion.",
  "Someone in {city} sells umbrellas AND sunglasses from one cart. A genius. A visionary.",
  "I tried {food} for the first time. My life is now divided into before and after.",
  "There's a {animal} outside my window that sings every morning at 5. I hate it. I love it. I hate it.",
  "I got lost in {city} and asked for directions. Three people gave me three different answers and a {food}.",
  "Our town festival had a {thing} contest. I came second. There were two people.",
  "I started jogging. Well, I bought the shoes. That's the first step, right?",
  "The bus was so late today that it arrived early for tomorrow.",
  "Grandma taught me to cook {food}. She says I'm 'getting there'. She said that in 1998 too.",
  "The wind here blew my hat into {country}'s neighbouring country. Probably.",
  "I found a {thing} on the beach. I've named it Kevin. Kevin lives on my shelf now.",
  "I'm learning to knit. So far I have made one very long, very confused scarf.",
  "A street musician in {city} played my favourite song. I tipped them in {food}. Long story.",
  "The power went out yesterday, so I wrote this postcard by candlelight. Very romantic. Very dark.",
  "There's a new café in {city} that only serves cereal. I've been there four times. Today.",
  "My upstairs neighbour is learning the trumpet. I am learning patience.",
  "{country} won something today and everyone is honking. I don't know what we won. I'm honking anyway.",
  "I painted my kitchen yellow. Now it feels like breakfast all day.",
  "I saw a cloud shaped exactly like a {animal}. Then it became a {thing}. Clouds are wild.",
  "The fish market in {city} is so loud I could hear it from my bed. Good morning, fish.",
  "Fun fact about {country}: we have more {animal}s than postboxes. I counted. Twice.",
  "I tried to take a selfie with a {animal}. The {animal} took a selfie with me.",
  "Everyone in {city} is obsessed with a TV show I've never seen. I nod a lot.",
  "My bicycle has a flat tyre, a squeaky bell and a lot of character.",
  "I went swimming in the sea and a fish looked at me like I owed it money.",
];
const TEXT_DEST = [
  "Is it true that in {dest} you eat dessert first? Asking for me.",
  "I've never been to {dest}. Please describe it to me through interpretive dance.",
  "Say hi to everyone in {dest}. Even the grumpy ones.",
  "One day I'll visit {dest} and you'll have to show me the best snack.",
  "I put a little pin on {dest} on my fridge map. It looks very proud.",
  "{to}, I hope this card finds you well. If it finds you unwell, it brings soup vibes.",
  "Write me about {dest}! Lie a little if it's boring.",
  "What's the weather like in {dest}? Here it's 'yes'.",
  "I googled {dest} and now I want to move there. Is there room on your sofa?",
  "Does {dest} have good {food}? Be honest. This is important.",
  "My cousin says {dest} is beautiful. My cousin also says {thing}s can talk, so I need a second opinion.",
  "Send me a photo of a {animal} from {dest}. Any {animal}. I'm not picky.",
  "If you see the postman in {dest}, thank them for me. They're doing great.",
  "I've heard {dest} has the best sunsets. Prove it.",
];
const TEXT_GOSSIP = [
  "Did you know {otherName} in {otherCity} collects spoons? Absolute legend.",
  "{otherName} from {other} sent me a card once with just a drawing of a {animal}. Still thinking about it.",
  "Rumour has it {otherName} in {other} has a stamp from 1840. Rumour also has it {otherName} sleeps with it under the pillow.",
  "If you ever get a card from {otherName} in {other}, check for glitter. There's ALWAYS glitter.",
  "{otherName} from {otherCity} owes me a postcard. Tell everyone.",
  "I heard {otherName} in {other} peels stamps with their teeth. Barbaric.",
  "{otherName} from {other} says hello! (I made that up, but they probably would.)",
  "Apparently {otherName} in {otherCity} once tried to fake a seal. Mr. Hinge still talks about it.",
];
const TEXT_FUNNY = [
  "I licked the stamp. It tasted like history and mild regret.",
  "Please don't steam the stamp off. ...You're going to steam the stamp off, aren't you.",
  "The post office lady said this stamp is 'very collectible'. Then she winked. I'm scared.",
  "I picked the prettiest stamp for you. The others were mostly numbers.",
  "If this card arrives without a stamp, someone in the sorting office has a hobby.",
  "I wrote this in my best handwriting. This IS my best handwriting.",
  "Tried to mail a hug. They said it needs more postage.",
  "Fun fact: this card has travelled further than my houseplants ever will.",
  "The postmark machine ate my first card. This is card number two. Be nice to it.",
  "I asked for a stamp with a cat on it. They gave me this. Close enough.",
  "The clerk stamped this so hard the counter shook. Respect.",
  "I tried to put the stamp on straight. The stamp had other plans.",
  "This postcard cost more than my lunch. Worth it. Lunch was sad.",
  "If you read this upside down it's a different message. (It isn't. But you tried, didn't you?)",
  "I accidentally put two stamps on. Now it's a first-class-first-class card.",
  "The post office was closed so I gave this to a seagull. If it arrives, that's amazing.",
  "Warning: this postcard may contain traces of sand.",
  "I sealed this with a kiss. Then I remembered postcards don't have envelopes. Awkward.",
  "Do NOT show this stamp to Mr. Hinge. He'll want it. He wants ALL of them.",
  "I've drawn a tiny map on the back so the postman doesn't get lost. It's mostly arrows.",
  "Somebody at the post office asked if I wanted 'the ugly stamp or the nice stamp'. Guess which one this is.",
  "This card is 100% recyclable, 0% boring.",
  "I wrote this on the bus. Any bumps in the letters are potholes. Blame the city.",
];
const TEXT_PS = [
  "P.S. Write back! Or don't. But do.",
  "P.S. That stamp is my favourite. Look after it.",
  "P.S. Ignore the coffee stain. It's a design choice.",
  "P.S. Sorry about the handwriting, the bus was bumpy.",
  "P.S. Did I spell your name right this time?",
  "P.S. Peel slowly. Trust me.",
  "P.S. The {animal} says hi.",
  "P.S. If you find sand in this card, it's a free souvenir.",
  "P.S. I owe you {food}. Don't let me forget.",
  "P.S. This is the third P.S. I've written. The other two were worse.",
  "P.S. Tell nobody about the {thing}.",
  "P.S. Don't tell the postman I drew a moustache on the stamp.",
  "P.P.S. I mean it about the {food}.",
  "P.S. The seagull is watching. Act natural.",
];
const SMELLS = ["cinnamon", "the sea", "old books", "rain", "fresh bread", "a slightly damp dog", "oranges", "pine trees", "adventure", "sunscreen", "grandma's kitchen", "fresh paint", "a bonfire", "mystery cheese", "popcorn", "wet sand"];
const FOODS = ["dumplings", "pancakes", "pickled herring", "mango", "spicy soup", "fried plantain", "a giant pretzel", "sticky rice", "cheese on toast", "falafel", "ice cream", "flatbread", "fish tacos", "chocolate cake", "noodles", "a suspicious jelly"];
const ANIMALS = ["goat", "pelican", "llama", "hedgehog", "parrot", "crab", "donkey", "flamingo", "capybara", "seal", "duck", "camel", "turtle", "squirrel", "moose", "hamster"];
const THINGS = ["rubber duck", "lighthouse", "sock", "garden gnome", "shell", "umbrella", "accordion", "teapot", "kite", "sandcastle", "trombone", "lamp", "potato", "boot", "hat"];

// Funny lines when you tear a stamp, a few for each tear, getting more desperate (the stamp falls apart at the 8th)
const TEAR_JOKES = [
  ["oops. tiny rip.", "a little nick. nobody saw.", "rip. just a small one.", "that's… a feature."],
  ["that's… fine. totally fine.", "two tears. still a stamp. probably.", "the stamp is breathing heavily", "this is fine 🔥"],
  ["the stamp would like to speak to your manager", "the stamp is filing a complaint", "three tears! it's not a contest!", "the perforations are unionising"],
  ["quality just went negative. impressive!", "you are now in minus territory", "the stamp has entered the danger zone", "four tears. the stamp is writing its will."],
  ["somewhere, a philatelist faints 😵", "Mr. Hinge felt that from across the beach", "the stamp is mostly vibes now", "five tears. this is art now."],
  ["the Universal Postal Union has been notified", "a stamp lawyer is on the way", "six tears. even the glue is giving up.", "the stamp is seeing its whole life flash by. it was short."],
  ["this is technically confetti now", "seven tears. the stamp has made peace with it.", "one more and it's a jigsaw puzzle", "the stamp just whispered 'tell my mother'"],
  ["💥 KAPUTT", "💥 the stamp has left the building", "💥 it is no more. it has ceased to stamp.", "💥 congratulations, you made confetti"],
];
const TEAR_QUIPS = ["RRRIP!", "the perforation wins", "slower, slower…", "it felt that", "a moment of silence, please", "ouch!", "the stamp screams in Latin", "that's going in the diary"];

// The big ☠️ PHILATELIC CATASTROPHE alert, when quality drops below zero
const DOOM_JOKES = [
  "the stamp has been laid to rest in your album",
  "Queen Victoria is turning in her portrait",
  "stamp collectors across 197 countries felt a disturbance",
  "the postman saw this and quietly resigned",
  "it's not a stamp anymore, it's modern art",
  "the glue is the only part that survived",
  "even the seagull won't take it",
  "insurance does not cover 'enthusiasm'",
  "this will be studied in philately school. as a warning.",
  "the stamp's last words were 'please, slower'",
  "a tiny funeral is being held in the sorting office",
  "the stamp's ghost will haunt your album forever",
  "somewhere, a museum curator just woke up screaming",
  "you didn't peel it, you defeated it",
  "the stamp is now legally a crumb",
  "the stamp's family has asked for privacy at this difficult time",
];

// One of these turns up under the grade on every result
const GRADE_QUIPS = {
  "GEM MINT": ["museums will fight over this", "you have the hands of a surgeon", "the stamp is crying tears of joy", "Mr. Hinge just fainted with happiness", "frame it. no, frame the frame.", "perfection has a new address"],
  "SUPERB": ["the album sparkles a little brighter", "a collector just nodded at you approvingly", "chef's kiss", "the stamp is doing a little dance", "smooth as a seal on a slide"],
  "VERY FINE": ["very fine indeed, darling", "your grandma would frame this", "solid work, keep peeling", "a respectable little rectangle", "the stamp approves. mostly."],
  "FINE": ["it's fine. it's FINE.", "respectable. like a beige cardigan.", "nothing a little love can't fix", "it has lived a full life", "medium rare, as they say"],
  "FAIR": ["it's seen things", "has character, as they say", "well, it's a stamp. mostly.", "the stamp equivalent of bed hair", "loved, just a bit too much"],
  "POOR": ["the stamp needs a hug", "it survived, technically", "we don't talk about this one", "it's not ugly, it's vintage", "the stamp has asked to be left alone"],
  "WRECK": ["the stamp is in witness protection now", "this is why we can't have nice things", "please hold the stamp gently next time. it has a family.", "the stamp has filed for emotional damages", "it looks like it lost a fight with a goat"],
  "PHILATELIC CATASTROPHE": ["the album will need therapy", "you owe that stamp an apology", "achievement unlocked: crime", "the stamp went to stamp heaven", "the stamp is now a cautionary tale", "historians will call this 'the incident'"],
};

// What the stamp yells when things go wrong
const STAMP_SCREAMS = [
  "NOT LIKE THIS!", "I have a family!", "ow ow ow ow", "is this how you treat royalty?!", "I was printed in a better century",
  "call my lawyer!", "mommy?", "I'm just a little guy!", "the glue was my friend!", "tell my perforations I loved them",
  "I'm worth MONEY!", "put me down, peasant!", "I bite!", "this is a hostage situation", "I'm too young to be peeled!",
  "can we talk about this?", "my perforations! my beautiful perforations!", "I'm calling the post office!",
];

// ⏳ When a forgery fails, the seal ends up older than the stamp itself
const PARADOX_JOKES = [
  "this stamp was cancelled before it existed",
  "the postman delivered it with a time machine",
  "historians are furious. physicists are thrilled.",
  "the seal is older than the stamp. the stamp is older than the seal. nobody knows anymore.",
  "somewhere a grandfather paradox just got sealed",
  "the Universal Postal Union has opened a wormhole investigation",
  "you didn't forge a seal, you forged a timeline",
  "the stamp has jet lag. from the future.",
  "according to this seal, the letter arrived before anyone wrote it",
  "a confused dinosaur just received this postcard",
  "the space-time continuum would like a word",
  "this seal has a better time machine than you do",
];

// Mr. Hinge, the philatelist who runs the stamp shop by the beach
const HINGE_HELLO = [
  "Ah, a fellow collector! Mind the perforations.", "Welcome, welcome! Do wipe the sand off your stamps.", "Hello! I smell glue. Wonderful.",
  "Come in, come in! Only honest stamps here, I trust?", "Good day! Have you seen my other monocle?", "Welcome! Tea? Biscuit? Magnifying glass?",
  "Ah, there you are. The vault has been lonely.", "Hello hello! I dreamt about watermarks last night. Again.",
  "Step inside! Don't touch the 1840s, they bruise easily.",
];
const HINGE_HAPPY = [
  "Splendid! Simply splendid.", "Oh, what a beauty. Into the vault it goes!", "A fine specimen. Pleasure doing business!",
  "My monocle fogged up. That's how good it is.", "I shall name it Gerald.", "Ooh, I'm going to show this one to my cat.",
  "Perforations like a dream. Lovely!", "This one's going straight above the fireplace.", "*happy philatelist noises*",
];
const HINGE_PITY = ["I'll… take it. Out of pity.", "Is it a stamp or a crime scene? Here, one coin.", "I'll use it as a coaster. One coin.", "I'll put it in the 'please don't look' drawer.", "One coin. And a hug. Mostly for the stamp."];
const HINGE_FOOLED = [
  "A home seal, how rare! I'm a lucky man today.", "First day of issue! Marvellous! Nothing suspicious at all.", "What crisp ink! Almost… too crisp. No, no, lovely!",
  "Such a rare stamp! I didn't even know they made these.", "Remarkable! Utterly unique! Like nothing I've ever seen. Ever.",
  "Ooh, the glue is still warm! Fresh from… history!",
];
// The heartbreak, step by step: [face, possible lines]
const HINGE_BUSTED = [
  ["🧐", ["Let me just have a closer look with my loupe…", "Hmm, let me hold this up to the light…", "One moment, I need my second monocle…"]],
  ["🤨", ["Hmm. This ink is still… wet?", "Why does this seal smell of felt-tip pen?", "Since when does this country use glitter glue?"]],
  ["😧", ["This seal is… FAKE?!", "THIS IS A FORGERY!", "My loupe… it's seen things it can never unsee!"]],
  ["😞", ["I trusted you. I trusted the beach.", "And I gave you biscuits.", "I thought we had something. A philatelic bond."]],
  ["😭", ["I need to lie down. The shop is CLOSED for today!", "That's it! Shop's closed! I'm going to cry into my stamp albums!", "CLOSED! I need a cup of tea and a long, sad nap!"]],
];
const HINGE_CLOSED = [
  "Mr. Hinge is lying on the sofa with a cold towel on his forehead.", "A sign on the door says: 'Gone to question everything. Back tomorrow.'",
  "Through the window you see Mr. Hinge sadly sorting his stamps by trustworthiness.", "Mr. Hinge is playing sad songs on a tiny accordion.",
  "A note on the door: 'Closed for emotional maintenance.'", "Mr. Hinge is writing a strongly worded letter to himself.",
];
const HINGE_WARY = ["Back again? Let me… polish my loupe first.", "Hello. I'm checking every perforation today.", "Welcome. Please keep your glue where I can see it.", "Oh. It's you. Empty your pockets of scissors, please.", "I've bought a bigger magnifying glass. Just so you know."];
const HINGE_NOTICED = [
  "Hmm. This seal is… creative. I'll buy it for my museum of shame.", "Is this glue still WET? …Fine. Half price.",
  "A Vatican stamp sealed in the Sahara? I'll take it. Sigh.", "I can see the scissor marks, you know. Here, a few coins.",
  "The country is spelled wrong. Bravely wrong. I'll buy it anyway.", "This stamp has two different years on it. Like a stamp with a midlife crisis.",
];
const HINGE_HEARTBROKEN = [
  "Another one. I'll buy it. I just need a minute.", "My monocle is fogging up, and not in a good way.", "I used to believe in people. And perforations.",
  "I'm not crying, there's glue in my eye.", "I'm going to start collecting seashells instead. Seashells don't lie.", "Please. Just one honest stamp. For my heart.",
];
// When something rare turns up, Mr. Hinge pops in to have a look: [face, line]
const HINGE_CAMEO = {
  legendary: [["🤩", "IS THAT…?! Don't move. Don't breathe. Peel it VERY slowly!"], ["🤩", "A legend! I came running the second I smelled it!"], ["😧", "My word… I've only seen that one in books!"]],
  rare: [["🧐", "Ooh, an old one! Careful with those perforations, they're older than me."], ["😊", "Psst! That stamp is rare. I'll buy it if you don't wreck it."], ["🧐", "Pre-1900? My loupe is tingling."]],
  shiny: [["🤩", "Is that card SHINING? Oh, I need sunglasses for my monocle."], ["😊", "Shiny cards bring luck! Mostly to me, if you sell it."]],
  combo: [["🤩", "A COMBO! I'm framing this moment!"], ["😭", "It's so beautiful I'm crying happy tears!"]],
  gem: [["🤩", "GEM MINT?! Name your price! Actually, let me name it."], ["😊", "Perfect. Simply perfect. I need to sit down."]],
  paradox: [["😧", "Wait… this seal is older than the stamp?! I need a historian. And a physicist."], ["🤨", "Time travel is NOT a valid postal service."]],
  catastrophe: [["😭", "What have you DONE to that poor stamp?!"], ["😧", "I heard the tearing from my shop!"]],
};
