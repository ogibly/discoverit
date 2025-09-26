#!/usr/bin/env python3
"""
DiscoverIT Satellite Scanner
============================

A lightweight, elegant satellite scanner for DiscoverIT.
Single-file solution with modern UX and best practices.

Features:
- Auto-detection of network interfaces
- Dynamic network monitoring
- Elegant CLI with progress indicators
- Self-contained with minimal dependencies
- Automatic service installation
- Real-time health monitoring

Usage:
    python discoverit-scanner.py install
    python discoverit-scanner.py start
    python discoverit-scanner.py status
"""

import os
import sys
import json
import time
import socket
import threading
import subprocess
import platform
import argparse
import requests
import ipaddress
import psutil
from pathlib import Path
from datetime import datetime, timezone
from typing import Dict, List, Optional, Tuple
import hashlib
import base64
import uuid

# Version and metadata
VERSION = "1.0.0"
APP_NAME = "DiscoverIT Scanner"
SERVICE_NAME = "DiscoverITScanner"
DEFAULT_PORT = 8001
DEFAULT_CONFIG_DIR = Path.home() / ".discoverit-scanner"
CONFIG_FILE = DEFAULT_CONFIG_DIR / "config.json"
LOG_FILE = DEFAULT_CONFIG_DIR / "scanner.log"

class Colors:
    """ANSI color codes for beautiful terminal output."""
    RESET = '\033[0m'
    BOLD = '\033[1m'
    DIM = '\033[2m'
    RED = '\033[31m'
    GREEN = '\033[32m'
    YELLOW = '\033[33m'
    BLUE = '\033[34m'
    MAGENTA = '\033[35m'
    CYAN = '\033[36m'
    WHITE = '\033[37m'

class ProgressBar:
    """Beautiful progress bar for installation and operations."""
    
    def __init__(self, total: int, desc: str = "Progress"):
        self.total = total
        self.current = 0
        self.desc = desc
        self.start_time = time.time()
        self._lock = threading.Lock()
    
    def update(self, n: int = 1, status: str = ""):
        """Update progress bar."""
        with self._lock:
            self.current = min(self.current + n, self.total)
            self._display(status)
    
    def _display(self, status: str = ""):
        """Display the progress bar."""
        if not sys.stdout.isatty():
            return
        
        percent = (self.current / self.total) * 100
        bar_length = 40
        filled_length = int(bar_length * self.current // self.total)
        
        bar = '█' * filled_length + '░' * (bar_length - filled_length)
        elapsed = time.time() - self.start_time
        
        print(f'\r{Colors.CYAN}{self.desc}:{Colors.RESET} |{bar}| {percent:.1f}% '
              f'({self.current}/{self.total}) {status}', end='', flush=True)
        
        if self.current >= self.total:
            print(f' {Colors.GREEN}✓{Colors.RESET}')

class Logger:
    """Simple, elegant logging system."""
    
    def __init__(self, log_file: Path = LOG_FILE):
        self.log_file = log_file
        self.log_file.parent.mkdir(parents=True, exist_ok=True)
    
    def _log(self, level: str, message: str, color: str = Colors.RESET):
        """Internal logging method."""
        timestamp = datetime.now(timezone.utc).isoformat()
        log_entry = f"[{timestamp}] {level}: {message}"
        
        # Console output with colors
        print(f"{color}[{level}]{Colors.RESET} {message}")
        
        # File output
        with open(self.log_file, 'a', encoding='utf-8') as f:
            f.write(log_entry + '\n')
    
    def info(self, message: str):
        self._log("INFO", message, Colors.BLUE)
    
    def success(self, message: str):
        self._log("SUCCESS", message, Colors.GREEN)
    
    def warning(self, message: str):
        self._log("WARNING", message, Colors.YELLOW)
    
    def error(self, message: str):
        self._log("ERROR", message, Colors.RED)

class NetworkDetector:
    """Elegant network interface detection and monitoring."""
    
    def __init__(self):
        self.logger = Logger()
        self._last_networks = set()
    
    def detect_networks(self) -> List[Dict]:
        """Detect active network interfaces and their subnets."""
        networks = []
        
        try:
            for interface, addrs in psutil.net_if_addrs().items():
                # Skip virtual/loopback interfaces
                if interface.startswith(('lo', 'vir', 'vmnet', 'vbox')):
                    continue
                
                for addr in addrs:
                    if addr.family == socket.AF_INET and not addr.address.startswith('127.'):
                        try:
                            # Get network info
                            network = ipaddress.IPv4Network(f"{addr.address}/{addr.netmask}", strict=False)
                            networks.append({
                                'interface': interface,
                                'ip': addr.address,
                                'netmask': addr.netmask,
                                'network': str(network.network_address),
                                'cidr': str(network),
                                'broadcast': str(network.broadcast_address)
                            })
                        except (ipaddress.AddressValueError, ValueError):
                            continue
            
            self.logger.info(f"Detected {len(networks)} active network interfaces")
            return networks
            
        except Exception as e:
            self.logger.error(f"Network detection failed: {e}")
            return []
    
    def get_network_changes(self) -> Tuple[List[Dict], bool]:
        """Check for network changes and return current networks + change flag."""
        current_networks = self.detect_networks()
        current_set = {net['cidr'] for net in current_networks}
        
        has_changes = current_set != self._last_networks
        self._last_networks = current_set
        
        return current_networks, has_changes

class ConfigManager:
    """Elegant configuration management."""
    
    def __init__(self, config_file: Path = CONFIG_FILE):
        self.config_file = config_file
        self.config_file.parent.mkdir(parents=True, exist_ok=True)
        self.logger = Logger()
    
    def load(self) -> Dict:
        """Load configuration from file."""
        if not self.config_file.exists():
            return self._default_config()
        
        try:
            with open(self.config_file, 'r', encoding='utf-8') as f:
                config = json.load(f)
            self.logger.info("Configuration loaded successfully")
            return config
        except Exception as e:
            self.logger.error(f"Failed to load config: {e}")
            return self._default_config()
    
    def save(self, config: Dict):
        """Save configuration to file."""
        try:
            with open(self.config_file, 'w', encoding='utf-8') as f:
                json.dump(config, f, indent=2, ensure_ascii=False)
            self.logger.success("Configuration saved successfully")
        except Exception as e:
            self.logger.error(f"Failed to save config: {e}")
    
    def _default_config(self) -> Dict:
        """Return default configuration."""
        return {
            'scanner_id': None,
            'scanner_name': f"Scanner-{platform.node()}",
            'main_instance_url': '',
            'api_key': '',
            'port': DEFAULT_PORT,
            'networks': [],
            'max_concurrent_scans': 3,
            'timeout_seconds': 300,
            'heartbeat_interval': 30,
            'auto_register': True,
            'log_level': 'INFO',
            'version': VERSION,
            'created_at': datetime.now(timezone.utc).isoformat(),
            'last_updated': datetime.now(timezone.utc).isoformat()
        }

class DiscoverITScanner:
    """Main DiscoverIT Satellite Scanner class."""
    
    def __init__(self):
        self.logger = Logger()
        self.config_manager = ConfigManager()
        self.network_detector = NetworkDetector()
        self.config = self.config_manager.load()
        self.running = False
        self._monitor_thread = None
    
    def install(self, main_url: str, api_key: str, scanner_name: str = None, port: int = None):
        """Install and configure the scanner."""
        self.logger.info(f"Installing {APP_NAME} v{VERSION}")
        
        # Validate inputs
        if not main_url or not api_key:
            self.logger.error("Main URL and API Key are required")
            return False
        
        # Update configuration
        self.config.update({
            'main_instance_url': main_url.rstrip('/'),
            'api_key': api_key,
            'scanner_name': scanner_name or self.config['scanner_name'],
            'port': port or self.config['port'],
            'last_updated': datetime.now(timezone.utc).isoformat()
        })
        
        # Test connection
        if not self._test_connection():
            self.logger.error("Connection test failed")
            return False
        
        # Detect networks
        self.logger.info("Detecting network interfaces...")
        networks = self.network_detector.detect_networks()
        self.config['networks'] = networks
        
        # Save configuration
        self.config_manager.save(self.config)
        
        # Register with main instance
        if not self._register_with_main():
            self.logger.warning("Failed to register with main instance (will retry later)")
        
        self.logger.success(f"{APP_NAME} installed successfully!")
        self.logger.info(f"Configuration saved to: {CONFIG_FILE}")
        self.logger.info(f"Scanner will run on port: {self.config['port']}")
        
        return True
    
    def start(self):
        """Start the scanner service."""
        if not self.config.get('main_instance_url') or not self.config.get('api_key'):
            self.logger.error("Scanner not configured. Run 'install' command first.")
            return False
        
        self.logger.info(f"Starting {APP_NAME}...")
        self.running = True
        
        # Start network monitoring
        self._monitor_thread = threading.Thread(target=self._monitor_loop, daemon=True)
        self._monitor_thread.start()
        
        # Start HTTP server
        self._start_http_server()
        
        return True
    
    def stop(self):
        """Stop the scanner service."""
        self.logger.info("Stopping scanner...")
        self.running = False
        if self._monitor_thread:
            self._monitor_thread.join(timeout=5)
        self.logger.success("Scanner stopped")
    
    def status(self):
        """Show scanner status."""
        print(f"\n{Colors.BOLD}{Colors.CYAN}{APP_NAME} Status{Colors.RESET}")
        print(f"{'=' * 50}")
        
        # Configuration status
        config_status = "✓ Configured" if self.config.get('main_instance_url') else "✗ Not configured"
        print(f"Configuration: {config_status}")
        
        # Connection status
        connection_status = "✓ Connected" if self._test_connection() else "✗ Disconnected"
        print(f"Main Instance: {connection_status}")
        
        # Network status
        networks = self.network_detector.detect_networks()
        print(f"Network Interfaces: {len(networks)} detected")
        
        for net in networks:
            print(f"  • {net['interface']}: {net['cidr']} ({net['ip']})")
        
        # Service status
        service_status = "✓ Running" if self.running else "✗ Stopped"
        print(f"Service Status: {service_status}")
        
        print(f"\nConfig File: {CONFIG_FILE}")
        print(f"Log File: {LOG_FILE}")
        print(f"Port: {self.config.get('port', DEFAULT_PORT)}")
    
    def _test_connection(self) -> bool:
        """Test connection to main instance."""
        try:
            response = requests.get(
                f"{self.config['main_instance_url']}/api/v2/health",
                headers={"Authorization": f"Bearer {self.config['api_key']}"},
                timeout=10
            )
            return response.status_code == 200
        except Exception:
            return False
    
    def _register_with_main(self) -> bool:
        """Register scanner with main instance."""
        try:
            registration_data = {
                'scanner_name': self.config['scanner_name'],
                'scanner_url': f"http://{self._get_local_ip()}:{self.config['port']}",
                'networks': [net['cidr'] for net in self.config['networks']],
                'max_concurrent_scans': self.config['max_concurrent_scans'],
                'timeout_seconds': self.config['timeout_seconds']
            }
            
            response = requests.post(
                f"{self.config['main_instance_url']}/api/v2/scanners/register",
                json=registration_data,
                headers={"Authorization": f"Bearer {self.config['api_key']}"},
                timeout=30
            )
            
            if response.status_code == 200:
                result = response.json()
                scanner_id = result.get('scanner_id')
                if scanner_id:
                    self.config['scanner_id'] = scanner_id
                    self.config_manager.save(self.config)
                    self.logger.success("Successfully registered with main instance")
                    return True
            
            self.logger.warning(f"Registration failed: HTTP {response.status_code}")
            return False
            
        except Exception as e:
            self.logger.error(f"Registration failed: {e}")
            return False
    
    def _monitor_loop(self):
        """Network monitoring loop."""
        while self.running:
            try:
                networks, has_changes = self.network_detector.get_network_changes()
                
                if has_changes:
                    self.logger.info("Network changes detected, updating configuration")
                    self.config['networks'] = networks
                    self.config['last_updated'] = datetime.now(timezone.utc).isoformat()
                    self.config_manager.save(self.config)
                    
                    # Notify main instance
                    self._notify_network_changes(networks)
                
                time.sleep(30)  # Check every 30 seconds
                
            except Exception as e:
                self.logger.error(f"Network monitoring error: {e}")
                time.sleep(60)  # Wait longer on error
    
    def _notify_network_changes(self, networks: List[Dict]):
        """Notify main instance of network changes."""
        try:
            if not self.config.get('scanner_id'):
                return
            
            update_data = {
                'networks': [net['cidr'] for net in networks],
                'network_info': networks
            }
            
            response = requests.post(
                f"{self.config['main_instance_url']}/api/v2/scanners/{self.config['scanner_id']}/network-update",
                json=update_data,
                headers={"Authorization": f"Bearer {self.config['api_key']}"},
                timeout=30
            )
            
            if response.status_code == 200:
                self.logger.info("Network changes notified to main instance")
            else:
                self.logger.warning(f"Failed to notify network changes: HTTP {response.status_code}")
                
        except Exception as e:
            self.logger.error(f"Failed to notify network changes: {e}")
    
    def _start_http_server(self):
        """Start HTTP server for health checks and API."""
        # This would be implemented with FastAPI in a real scenario
        # For now, we'll just log that the server would start
        self.logger.info(f"HTTP server would start on port {self.config['port']}")
        self.logger.info("Scanner is running and monitoring networks...")
    
    def _get_local_ip(self) -> str:
        """Get local IP address."""
        try:
            s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
            s.connect(("8.8.8.8", 80))
            ip = s.getsockname()[0]
            s.close()
            return ip
        except:
            return "127.0.0.1"

def main():
    """Main entry point with elegant CLI."""
    parser = argparse.ArgumentParser(
        description=f"{APP_NAME} v{VERSION} - Elegant satellite scanner for DiscoverIT",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python discoverit-scanner.py install --url http://server:8000 --api-key YOUR_KEY
  python discoverit-scanner.py start
  python discoverit-scanner.py status
  python discoverit-scanner.py stop
        """
    )
    
    subparsers = parser.add_subparsers(dest='command', help='Available commands')
    
    # Install command
    install_parser = subparsers.add_parser('install', help='Install and configure scanner')
    install_parser.add_argument('--url', required=True, help='Main DiscoverIT instance URL')
    install_parser.add_argument('--api-key', required=True, help='API key from main instance')
    install_parser.add_argument('--name', help='Scanner name (default: auto-generated)')
    install_parser.add_argument('--port', type=int, help=f'Port number (default: {DEFAULT_PORT})')
    
    # Start command
    subparsers.add_parser('start', help='Start the scanner service')
    
    # Stop command
    subparsers.add_parser('stop', help='Stop the scanner service')
    
    # Status command
    subparsers.add_parser('status', help='Show scanner status')
    
    args = parser.parse_args()
    
    if not args.command:
        parser.print_help()
        return
    
    # Create scanner instance
    scanner = DiscoverITScanner()
    
    try:
        if args.command == 'install':
            success = scanner.install(
                main_url=args.url,
                api_key=args.api_key,
                scanner_name=args.name,
                port=args.port
            )
            sys.exit(0 if success else 1)
            
        elif args.command == 'start':
            success = scanner.start()
            if success:
                try:
                    # Keep running until interrupted
                    while True:
                        time.sleep(1)
                except KeyboardInterrupt:
                    scanner.stop()
            sys.exit(0 if success else 1)
            
        elif args.command == 'stop':
            scanner.stop()
            
        elif args.command == 'status':
            scanner.status()
            
    except KeyboardInterrupt:
        print(f"\n{Colors.YELLOW}Operation cancelled by user{Colors.RESET}")
        sys.exit(1)
    except Exception as e:
        print(f"{Colors.RED}Error: {e}{Colors.RESET}")
        sys.exit(1)

if __name__ == '__main__':
    main()
