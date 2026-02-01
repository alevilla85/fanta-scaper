import requests
import json
import os

def get_fanta_data():
    # URL dell'API pubblica di Fantacalcio
    url = "https://www.fantacalcio.it/api/v1/Statistiche/GetStatistiche?stagione=2025-26&tipo=1"
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }
    
    response = requests.get(url, headers=headers)
    if response.status_code == 200:
        data = response.json()['data']
        # Salviamo il JSON
        with open('dati_fantacalcio.json', 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=4)
        print("Dati scaricati con successo!")

# Esegui la funzione
get_fanta_data()
