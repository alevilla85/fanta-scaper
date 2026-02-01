import requests
import json
import sys

def get_fanta_data():
    url = "https://www.fantacalcio.it/api/v1/Statistiche/GetStatistiche?stagione=2025-26&tipo=1"
    
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
        "Accept": "application/json, text/plain, */*",
        "Referer": "https://www.fantacalcio.it/"
    }
    
    try:
        response = requests.get(url, headers=headers, timeout=30)
        
        # Se Fantacalcio ci blocca (403 o 404), stampiamo l'errore ed esciamo
        if response.status_code != 200:
            print(f"Errore Server: {response.status_code}")
            sys.exit(1) 
            
        json_data = response.json()
        
        # Salvataggio dati
        with open('dati_fantacalcio.json', 'w', encoding='utf-8') as f:
            json.dump(json_data.get('data', []), f, ensure_ascii=False, indent=4)
        
        print("File creato con successo.")

    except Exception as e:
        print(f"Errore critico: {e}")
        sys.exit(1)

if __name__ == "__main__":
    get_fanta_data()
