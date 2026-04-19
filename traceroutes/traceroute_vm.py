import os
import re
import json
import argparse
import requests
import subprocess

BACKEND_URL = "http://localhost:3000/api/traceroutes"  #TODO: update with Cloud Run URL
TARGETS_FILE = "targets.json"

def run_traceroute(target):
    print(f"Tracerouting to {target}...")
    try:
        result = subprocess.run(
            ["traceroute", "-4", "-I", "-n", "-q", "1", target],
            capture_output=True,
            text=True,
            timeout=60
        )
        return result.stdout
    except subprocess.TimeoutExpired:
        print(f"Timeout tracerouting to {target}")
        return ""
    except Exception as e:
        print(f"Error running traceroute: {e}")
        return ""

def parse_hops(output):
    lines = output.strip().split('\n')
    if not lines:
        return []

    hops = []

    last_ip = None
    last_ping = None
    
    ip_pattern = r'(?:\((\d{1,3}(?:\.\d{1,3}){3})\)|(\d{1,3}(?:\.\d{1,3}){3}))'
    
    for line in lines[1:]:
        line = line.strip()
        if not line or "*" in line:
            continue
            
        ip_match = re.search(ip_pattern, line)
        if not ip_match:
            continue
            
        current_ip = ip_match.group(1) or ip_match.group(2)
            
        ping_match = re.search(r'(\d+\.?\d*)\s+ms', line)
        if not ping_match:
            continue
            
        cumulative_latency = float(ping_match.group(1))

        if last_ip is not None and last_ping is not None:
            # The edge latency to the next hop is current hop's ping minus the previous hop's ping.
            # Use abs() to avoid negative ping artifacts from route asymmetries.
            delta_latency = abs(cumulative_latency - last_ping)
            hops.append({
                "origin": last_ip,
                "destination": current_ip,
                "ping": round(delta_latency, 2)
            })
        
        last_ip = current_ip
        last_ping = cumulative_latency
            
    return hops

def main():
    parser = argparse.ArgumentParser(description='Run traceroutes and report to backend.')
    parser.add_argument('--region', type=str, help='The region this VM is running in', required=True)
    args = parser.parse_args()

    if not os.path.exists(TARGETS_FILE):
        print(f"Error: {TARGETS_FILE} not found.")
        return

    with open(TARGETS_FILE, 'r') as f:
        targets = json.load(f)

    region = args.region
    print(f"Starting traceroute session for region: {region}")

    for target in targets:
        output = run_traceroute(target)
        if not output:
            continue

        extracted_hops = parse_hops(output)
        if not extracted_hops:
            continue

        payload = {
            "region": region,
            "hops": extracted_hops
        }

        try:
            print(f"Sending {len(extracted_hops)} hops to backend...")
            response = requests.post(BACKEND_URL, json=payload, timeout=5)
            if response.status_code == 200:
                print("Successfully reported hops.")
            else:
                print(f"Backend returned status {response.status_code}: {response.text}")
        except Exception as e:
            print(f"Failed to send data to backend: {e}")

    print("All tasks completed. Shutting down...")
    os.system("sudo shutdown -h now")

if __name__ == "__main__":
    main()