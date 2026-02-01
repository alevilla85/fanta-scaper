import requests
import json

def get_fanta_data():
    # URL dell'API pubblica
    url = "https://www.fantacalcio.it/api/v1/Statistiche/GetStatistiche?stagione=2025-26&tipo=1"
    
    # Headers molto più dettagliati per sembrare un vero Chrome
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
        "Accept": "application/json, text/plain, */*",
        "Accept-Language": "it-IT,it;q=0.9,en-US;q=0.8,en;q=0.7",
        "Referer": "https://www.fantacalcio.it/statistiche-serie-a/2025-26/tutte/fanta-media",
        "Origin": "https://www.fantacalcio.it",
        "Sec-Fetch-Dest": "empty",
        "Sec-Fetch-Mode": "cors",
        "Sec-Fetch-Site": "same-origin",
        "Pragma": "no-cache",
        "Cache-Control": "no-cache"
    }
    
    try:
        print(f"Richiedo dati a: {url}")
        response = requests.get(url, headers=headers, timeout=30)
        
        # Stampiamo il codice di stato per debug
        print(f"Status Code: {response.status_code}")
        
        # Se non è 200, solleva un errore senza provare a leggere il JSON
        response.raise_for_status()
        
        # Proviamo a decodificare il JSON
        json_data = response.json()
        
        if 'data' in json_data:
            with open('dati_fantacalcio.json', 'w', encoding='utf-8') as f:
                json.dump(json_data['data'], f, ensure_ascii=False, indent=4)
            print(f"Successo! Estratti {len(json_data['data'])} giocatori.")
        else:
            print("Errore: la chiave 'data' non è presente nel JSON ricevuto.")
            print(f"Contenuto ricevuto: {response.text[:200]}...") # Stampa i primi 200 caratteri per capire cosa è arrivato

    except requests.exceptions.JSONDecodeError:
        print("Errore: Il server non ha risposto con un JSON valido.")
        print("Probabilmente Fantacalcio ha mostrato una pagina di blocco (Captcha/Cloudflare).")
    except Exception as e:
        print(f"Errore imprevisto: {e}")

if __name__ == "__main__":
    get_fanta_data()
