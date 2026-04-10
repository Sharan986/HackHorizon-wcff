import requests
import json

def get_lat_lon(location: str):
    """
    Uses OpenStreetMap Nominatim API to get lat, lon from string location.
    """
    if not location:
        return None, None
        
    url = f"https://nominatim.openstreetmap.org/search?q={location}&format=json&limit=1"
    headers = {
        'User-Agent': 'HackHorizonApp/1.0'
    }
    try:
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()
        data = response.json()
        if data and len(data) > 0:
            return str(data[0]['lat']), str(data[0]['lon'])
    except Exception as e:
        print(f"Error geocoding location {location}: {e}")
    return None, None

def fetch_nasa_power_data(lat: str, lon: str):
    """
    Fetches climatology data from NASA POWER API.
    Provides long-term averages for temperature, humidity, wind speed, and solar radiation.
    """
    if not lat or not lon:
        return None
        
    # T2M: Temperature at 2 Meters (C)
    # RH2M: Relative Humidity at 2 Meters (%)
    # WS10M: Wind Speed at 10 Meters (m/s)
    # ALLSKY_SFC_SW_DWN: All Sky Surface Shortwave Downward Irradiance (kW-hr/m^2/day)
    url = f"https://power.larc.nasa.gov/api/temporal/climatology/point?parameters=T2M,RH2M,WS10M,ALLSKY_SFC_SW_DWN&community=RE&longitude={lon}&latitude={lat}&format=JSON"
    try:
        response = requests.get(url, timeout=15)
        response.raise_for_status()
        data = response.json()
        
        params = data.get('properties', {}).get('parameter', {})
        
        # 'ANN' represents the annual average in NASA POWER API climatology
        avg_temp = params.get('T2M', {}).get('ANN')
        avg_humidity = params.get('RH2M', {}).get('ANN')
        avg_wind_speed = params.get('WS10M', {}).get('ANN')
        avg_solar_radiation = params.get('ALLSKY_SFC_SW_DWN', {}).get('ANN')
        
        return {
            "avg_temperature": str(avg_temp) if avg_temp is not None else None,
            "avg_humidity": str(avg_humidity) if avg_humidity is not None else None,
            "avg_wind_speed": str(avg_wind_speed) if avg_wind_speed is not None else None,
            "avg_solar_radiation": str(avg_solar_radiation) if avg_solar_radiation is not None else None,
            "raw_data": data
        }
    except Exception as e:
        print(f"Error fetching NASA data for {lat},{lon}: {e}")
    return None
