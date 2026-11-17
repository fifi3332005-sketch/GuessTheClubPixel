
/* =========================================================
   GUESS THE FOOTBALL CLUB
   Główna logika gry
   ========================================================= */


/* 1. USTAWIENIA I STAN GRY ================================ */

const MAKS_PROB = 7;

let kluby = [];
let zagadka = null;
let proba = 1;
let koniecGry = false;


/* 2. LICZNIK PRÓB ======================================== */

function aktualizujLicznik(wykonaneProby = proba - 1) {
    const wartosc = document.querySelector(
        "#licznik .licznik-wartosc"
    );

    if (wartosc) {
        wartosc.textContent = `${wykonaneProby}/${MAKS_PROB}`;
    }
}


/* 3. WCZYTYWANIE BAZY KLUBÓW ============================= */

async function wczytajKluby() {
    try {
        const odpowiedz = await fetch("./kluby.json");

        if (!odpowiedz.ok) {
            throw new Error("Could not load clubs database.");
        }

        kluby = await odpowiedz.json();

        if (!Array.isArray(kluby) || kluby.length === 0) {
            throw new Error("Clubs database is empty or invalid.");
        }

        // Losowanie klubu do odgadnięcia
        zagadka = kluby[
            Math.floor(Math.random() * kluby.length)
        ];

    } catch (blad) {
        console.error("Database error:", blad);

        const wartosc = document.querySelector(
            "#licznik .licznik-wartosc"
        );

        if (wartosc) {
            wartosc.textContent = "ERROR";
        }
    }
}


/* 4. FUNKCJE POMOCNICZE ================================== */

// Ignorowanie wielkości liter i znaków diakrytycznych
function normalizuj(tekst) {
    return tekst
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim();
}


// Wyszukiwanie klubu po dokładnej nazwie
function przystosowanie(nazwa) {
    const klub = kluby.find(k => k.nazwa === nazwa);

    if (!klub) {
        alert("Please select a club from the list.");
    }

    return klub;
}


// Formatowanie pojemności stadionu
function formatujPojemnosc(liczba) {
    return (liczba / 1000).toFixed(1) + " k";
}


// Formatowanie wartości kadry
function formatujWartosc(liczba) {
    return liczba.toFixed(1) + " mln";
}


// Kierunek strzałki dla wartości liczbowych
function kierunekWartosci(wybrana, szukana) {
    if (wybrana < szukana) return "gora";
    if (wybrana > szukana) return "dol";

    return "rowne";
}


// Strzałka w górę, w dół lub poprawna odpowiedź
function rysujStrzalke(kierunek) {
    if (kierunek === "rowne") {
        return "✓";
    }

    return `
        <svg
            class="strzalka ${kierunek}"
            viewBox="0 0 48 48"
            aria-hidden="true"
        >
            <path
                d="M24 5 L42 23 H32 V43 H16 V23 H6 Z"
                fill="white"
            />
        </svg>
    `;
}


/* 5. FLAGI PAŃSTW ======================================== */

function pokazFlage(kraj) {
    const flagi = {
        "Poland": "pl",
        "England": "gb-eng",
        "Spain": "es",
        "Germany": "de",
        "Italy": "it",
        "France": "fr",
        "Monaco": "mc",
        "Norway": "no",
        "Sweden": "se",
        "Scotland": "gb-sct",
        "Ukraine": "ua",
        "Denmark": "dk",
        "Netherlands": "nl",
        "Belgium": "be",
        "Portugal": "pt",
        "Switzerland": "ch",
        "Austria": "at",
        "Czech Republic": "cz",
        "Slovakia": "sk",
        "Hungary": "hu",
        "Croatia": "hr",
        "Romania": "ro",
        "Serbia": "rs",
        "Greece": "gr",
        "Bulgaria": "bg",
        "Turkey": "tr"
    };

    const kod = flagi[kraj];

    if (!kod) {
        return "🏳️";
    }

    return `
        <img
            src="https://flagcdn.com/${kod}.svg"
            alt="${kraj}"
            loading="lazy"
        >
    `;
}


/* 6. ODLEGŁOŚĆ I KIERUNEK STADIONÓW ====================== */

// Odległość w kilometrach — wzór Haversine
function obliczOdleglosc(wybor, zagadka) {
    const R = 6371;
    const rad = Math.PI / 180;

    const lat1 = wybor.lat * rad;
    const lat2 = zagadka.lat * rad;

    const dLat = lat2 - lat1;
    const dLon = (zagadka.lon - wybor.lon) * rad;

    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1) *
        Math.cos(lat2) *
        Math.sin(dLon / 2) ** 2;

    const odleglosc =
        2 * R * Math.atan2(
            Math.sqrt(a),
            Math.sqrt(1 - a)
        );

    return Math.round(odleglosc);
}


// Kierunek od wybranego stadionu do szukanego
// 0° = północ, 90° = wschód
function obliczKierunek(wybor, zagadka) {
    const rad = Math.PI / 180;

    const lat1 = wybor.lat * rad;
    const lat2 = zagadka.lat * rad;
    const dLon = (zagadka.lon - wybor.lon) * rad;

    const x = Math.sin(dLon) * Math.cos(lat2);

    const y =
        Math.cos(lat1) * Math.sin(lat2) -
        Math.sin(lat1) *
        Math.cos(lat2) *
        Math.cos(dLon);

    return (
        Math.atan2(x, y) * 180 / Math.PI + 360
    ) % 360;
}


/* 7. PORÓWNYWANIE KLUBÓW ================================= */

function sprawdzenie(wybor, zagadka) {
    const trafienie = wybor.nazwa === zagadka.nazwa;

    const wiersz = document.createElement("div");
    wiersz.className = "wiersz";

    // Trafiony klub — wszystkie kafelki zielone
    if (trafienie) {
        wiersz.innerHTML = `
            <div class="nazwa-klubu">
                ${wybor.nazwa}
            </div>

            <div class="komorka zielony">
                <span class="flaga">
                    ${pokazFlage(wybor.kraj)}
                </span>
            </div>

            <div class="komorka zielony">
                ${wybor.miasto}
            </div>

            <div class="komorka zielony">
                ${formatujPojemnosc(wybor.pojemnosc)}
            </div>

            <div class="komorka zielony wartosc-klubu">
                ${formatujWartosc(wybor.wartosc_klubu)}
            </div>

            <div class="komorka zielony">
                0 km
            </div>
        `;

    } else {
        // Porównanie kraju i miasta
        const kolorKraju =
            wybor.kraj === zagadka.kraj
                ? "zielony"
                : "czerwony";

        const kolorMiasta =
            wybor.miasto === zagadka.miasto
                ? "zielony"
                : "czerwony";

        // Porównanie pojemności i wartości
        const kolorPojemnosci =
            wybor.pojemnosc === zagadka.pojemnosc
                ? "zielony"
                : "czerwony";

        const kolorWartosci =
            wybor.wartosc_klubu === zagadka.wartosc_klubu
                ? "zielony"
                : "czerwony";

        // Strzałki dla pojemności i wartości
        const strzalkaPojemnosc = kierunekWartosci(
            wybor.pojemnosc,
            zagadka.pojemnosc
        );

        const strzalkaWartosc = kierunekWartosci(
            wybor.wartosc_klubu,
            zagadka.wartosc_klubu
        );

        // Odległość oraz kierunek do szukanego stadionu
        const odleglosc = obliczOdleglosc(
            wybor,
            zagadka
        );

        const kierunek = obliczKierunek(
            wybor,
            zagadka
        );

        // Wyświetlenie wyników porównania
        wiersz.innerHTML = `
            <div class="nazwa-klubu">
                ${wybor.nazwa}
            </div>

            <div class="komorka ${kolorKraju}">
                <span class="flaga">
                    ${pokazFlage(wybor.kraj)}
                </span>
            </div>

            <div class="komorka ${kolorMiasta}">
                ${wybor.miasto}
            </div>

            <div class="komorka ${kolorPojemnosci}">
                <span>
                    ${formatujPojemnosc(wybor.pojemnosc)}
                </span>
                ${rysujStrzalke(strzalkaPojemnosc)}
            </div>

            <div class="komorka ${kolorWartosci} wartosc-klubu">
                <span>
                    ${formatujWartosc(wybor.wartosc_klubu)}
                </span>
                ${rysujStrzalke(strzalkaWartosc)}
            </div>

            <div class="komorka odleglosc">
                <span>${odleglosc} km</span>

                <svg
                    class="strzalka"
                    viewBox="0 0 48 48"
                    style="transform: rotate(${kierunek}deg)"
                    aria-hidden="true"
                >
                    <path
                        d="M24 5 L42 23 H32 V43 H16 V23 H6 Z"
                        fill="white"
                    />
                </svg>
            </div>
        `;
    }

    // Najnowsza próba na górze historii
    document.getElementById("historia").prepend(wiersz);

    // Ekran zwycięstwa po krótkiej pauzie
    if (trafienie) {
        setTimeout(pokazWygrana, 1300);
    }

    return trafienie;
}


/* 8. OBSŁUGA PRÓB ======================================== */

function sprawdzKlub() {
    if (koniecGry || !zagadka || proba > MAKS_PROB) {
        return;
    }

    const pole = document.getElementById("nazwaKlubu");
    const wybor = przystosowanie(pole.value);

    if (!wybor) {
        return;
    }

    // Zamknięcie listy podpowiedzi
    document.getElementById("podpowiedzi").replaceChildren();

    // Poprawna odpowiedź
    if (sprawdzenie(wybor, zagadka)) {
        aktualizujLicznik(proba);
        koniecGry = true;
        return;
    }

    // Nieudana próba
    proba++;
    pole.value = "";

    aktualizujLicznik();

    // Wyczerpanie wszystkich siedmiu prób
    if (proba > MAKS_PROB) {
        koniecGry = true;
        setTimeout(pokazPrzegrana, 1300);
    }
}


/* 9. EKRAN ZWYCIĘSTWA ==================================== */

function pokazWygrana() {
    const ekran = document.createElement("div");
    ekran.className = "ekran-wygranej";

    ekran.innerHTML = `
        <div class="okno-wygranej">

            <h1 class="tytul-wygranej">
                <span class="napis-victory">VICTORY!</span>
            </h1>

            <div class="centrum-wygranej">

                <h2 class="wygrany-klub">
                    ${zagadka.nazwa}
                </h2>

                <p class="liczba-prob-wygranej">
                    You got it in ${proba}
                    ${proba === 1 ? "guess" : "guesses"}!
                </p>

            </div>

            <button onclick="location.reload()">
                PLAY AGAIN
            </button>

        </div>
    `;

    document.body.appendChild(ekran);
}


/* 10. EKRAN PORAŻKI ====================================== */

function pokazPrzegrana() {
    const ekran = document.createElement("div");
    ekran.className = "ekran-przegranej";

    ekran.innerHTML = `
        <div class="okno-przegranej">

            <h1 class="tytul-porazki">
                <span class="napis-game-over">GAME OVER!</span>
            </h1>

            <div class="centrum-porazki">

                <p class="tekst-porazki">
                    The correct club was:
                </p>

                <h2 class="przegrany-klub">
                    ${zagadka.nazwa}
                </h2>

            </div>

            <button onclick="location.reload()">
                TRY AGAIN
            </button>

        </div>
    `;

    document.body.appendChild(ekran);
}


/* 11. AUTOMATYCZNE PODPOWIEDZI =========================== */

function pokazPodpowiedzi() {
    const pole = document.getElementById("nazwaKlubu");
    const lista = document.getElementById("podpowiedzi");

    lista.innerHTML = "";

    if (koniecGry) {
        return;
    }

    const tekst = normalizuj(pole.value);

    // Podpowiedzi od trzech wpisanych znaków
    if (tekst.length < 3) {
        return;
    }

    const pasujace = kluby.filter(klub =>
        normalizuj(klub.nazwa).includes(tekst)
    );

    pasujace.forEach(klub => {
        const opcja = document.createElement("div");
        opcja.className = "podpowiedz";

        opcja.innerHTML = `
            <span class="flaga-podpowiedzi">
                ${pokazFlage(klub.kraj)}
            </span>

            <span>${klub.nazwa}</span>
        `;

        // Wybranie klubu zatwierdza próbę
        opcja.addEventListener("click", function () {
            pole.value = klub.nazwa;
            lista.innerHTML = "";
            sprawdzKlub();
        });

        lista.appendChild(opcja);
    });
}


/* 12. URUCHOMIENIE GRY =================================== */

// Reakcja na wpisywanie nazwy klubu
document.getElementById("nazwaKlubu")
    .addEventListener("input", pokazPodpowiedzi);

// Początkowy stan licznika: 0/7
aktualizujLicznik();

// Wczytanie bazy i rozpoczęcie gry
wczytajKluby();
