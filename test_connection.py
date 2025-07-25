#!/usr/bin/env python3
import requests
import socket

def test_local_connection():
    """Test if the server is running locally"""
    try:
        response = requests.get('http://localhost:5001/api/health', timeout=5)
        print(f"✅ Local connection: {response.status_code}")
        print(f"Response: {response.json()}")
        return True
    except Exception as e:
        print(f"❌ Local connection failed: {e}")
        return False

def test_network_connection():
    """Test if the server is accessible on the network"""
    try:
        response = requests.get('http://192.168.1.18:5001/api/health', timeout=5)
        print(f"✅ Network connection: {response.status_code}")
        print(f"Response: {response.json()}")
        return True
    except Exception as e:
        print(f"❌ Network connection failed: {e}")
        return False

def get_local_ip():
    """Get the local IP address"""
    hostname = socket.gethostname()
    local_ip = socket.gethostbyname(hostname)
    print(f"Local IP: {local_ip}")
    return local_ip

if __name__ == "__main__":
    print("Testing ECG Scanner Backend Connections...")
    print("=" * 50)
    
    get_local_ip()
    print()
    
    # Test local connection
    local_works = test_local_connection()
    
    # Test network connection
    network_works = test_network_connection()
    
    print("\n" + "=" * 50)
    if local_works and network_works:
        print("🎉 All connections working! URL http://192.168.1.18:5001 is ready!")
    elif local_works:
        print("⚠️  Local working, but network access may need firewall configuration")
    else:
        print("❌ Server may not be running. Start with: start_server.bat")
