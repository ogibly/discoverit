"""
DiscoverIT Scanner - Windows Installer
"""
import os
import sys
import json
import shutil
import subprocess
import winreg
import ctypes
from pathlib import Path
import tkinter as tk
from tkinter import ttk, messagebox, filedialog
import threading
import requests
import zipfile
import tempfile

class DiscoverITInstaller:
    """Main installer class for DiscoverIT Scanner."""
    
    def __init__(self):
        self.root = tk.Tk()
        self.root.title("DiscoverIT Scanner Installer")
        self.root.geometry("600x500")
        self.root.resizable(False, False)
        
        # Installation paths
        self.install_dir = Path("C:/Program Files/DiscoverIT Scanner")
        self.config_file = self.install_dir / "config.json"
        self.service_name = "DiscoverITScanner"
        
        # Configuration
        self.config = {
            "scanner_id": None,
            "scanner_name": f"Scanner-{os.environ.get('COMPUTERNAME', 'Unknown')}",
            "main_instance_url": "",
            "api_key": "",
            "port": 8001,
            "subnets": [],
            "max_concurrent_scans": 3,
            "timeout_seconds": 300,
            "heartbeat_interval": 30,
            "auto_register": True,
            "log_level": "INFO"
        }
        
        self.setup_ui()
    
    def setup_ui(self):
        """Setup the installer UI."""
        # Main frame
        main_frame = ttk.Frame(self.root, padding="20")
        main_frame.grid(row=0, column=0, sticky=(tk.W, tk.E, tk.N, tk.S))
        
        # Title
        title_label = ttk.Label(main_frame, text="DiscoverIT Scanner Installer", 
                               font=("Arial", 16, "bold"))
        title_label.grid(row=0, column=0, columnspan=2, pady=(0, 20))
        
        # Configuration frame
        config_frame = ttk.LabelFrame(main_frame, text="Configuration", padding="10")
        config_frame.grid(row=1, column=0, columnspan=2, sticky=(tk.W, tk.E), pady=(0, 20))
        
        # Main instance URL
        ttk.Label(config_frame, text="Main Instance URL:").grid(row=0, column=0, sticky=tk.W, pady=2)
        self.url_var = tk.StringVar(value="http://localhost:8000")
        url_entry = ttk.Entry(config_frame, textvariable=self.url_var, width=40)
        url_entry.grid(row=0, column=1, sticky=(tk.W, tk.E), pady=2, padx=(10, 0))
        
        # API Key
        ttk.Label(config_frame, text="API Key:").grid(row=1, column=0, sticky=tk.W, pady=2)
        self.api_key_var = tk.StringVar()
        api_key_entry = ttk.Entry(config_frame, textvariable=self.api_key_var, width=40, show="*")
        api_key_entry.grid(row=1, column=1, sticky=(tk.W, tk.E), pady=2, padx=(10, 0))
        
        # Scanner Name
        ttk.Label(config_frame, text="Scanner Name:").grid(row=2, column=0, sticky=tk.W, pady=2)
        self.name_var = tk.StringVar(value=self.config["scanner_name"])
        name_entry = ttk.Entry(config_frame, textvariable=self.name_var, width=40)
        name_entry.grid(row=2, column=1, sticky=(tk.W, tk.E), pady=2, padx=(10, 0))
        
        # Port
        ttk.Label(config_frame, text="Port:").grid(row=3, column=0, sticky=tk.W, pady=2)
        self.port_var = tk.StringVar(value=str(self.config["port"]))
        port_entry = ttk.Entry(config_frame, textvariable=self.port_var, width=40)
        port_entry.grid(row=3, column=1, sticky=(tk.W, tk.E), pady=2, padx=(10, 0))
        
        # Network detection info
        ttk.Label(config_frame, text="Network Detection:").grid(row=4, column=0, sticky=tk.W, pady=2)
        network_info = ttk.Label(config_frame, text="Auto-detected from network adapters", 
                               foreground="green", font=("Arial", 9))
        network_info.grid(row=4, column=1, sticky=tk.W, pady=2, padx=(10, 0))
        
        # Test connection button
        test_button = ttk.Button(config_frame, text="Test Connection", 
                                command=self.test_connection)
        test_button.grid(row=5, column=0, columnspan=2, pady=10)
        
        # Progress frame
        progress_frame = ttk.LabelFrame(main_frame, text="Installation Progress", padding="10")
        progress_frame.grid(row=2, column=0, columnspan=2, sticky=(tk.W, tk.E), pady=(0, 20))
        
        self.progress_var = tk.StringVar(value="Ready to install")
        ttk.Label(progress_frame, textvariable=self.progress_var).grid(row=0, column=0, sticky=tk.W)
        
        self.progress_bar = ttk.Progressbar(progress_frame, mode='indeterminate')
        self.progress_bar.grid(row=1, column=0, sticky=(tk.W, tk.E), pady=(5, 0))
        
        # Buttons frame
        buttons_frame = ttk.Frame(main_frame)
        buttons_frame.grid(row=3, column=0, columnspan=2, sticky=(tk.W, tk.E))
        
        self.install_button = ttk.Button(buttons_frame, text="Install", 
                                        command=self.start_installation)
        self.install_button.pack(side=tk.LEFT, padx=(0, 10))
        
        self.cancel_button = ttk.Button(buttons_frame, text="Cancel", 
                                       command=self.root.quit)
        self.cancel_button.pack(side=tk.LEFT)
        
        # Configure grid weights
        self.root.columnconfigure(0, weight=1)
        self.root.rowconfigure(0, weight=1)
        main_frame.columnconfigure(1, weight=1)
        config_frame.columnconfigure(1, weight=1)
        progress_frame.columnconfigure(0, weight=1)
    
    def test_connection(self):
        """Test connection to main instance."""
        url = self.url_var.get().strip()
        api_key = self.api_key_var.get().strip()
        
        if not url or not api_key:
            messagebox.showerror("Error", "Please enter both URL and API Key")
            return
        
        try:
            response = requests.get(f"{url}/api/v2/health", 
                                  headers={"Authorization": f"Bearer {api_key}"},
                                  timeout=10)
            if response.status_code == 200:
                messagebox.showinfo("Success", "Connection test successful!")
            else:
                messagebox.showerror("Error", f"Connection failed: {response.status_code}")
        except Exception as e:
            messagebox.showerror("Error", f"Connection test failed: {str(e)}")
    
    def start_installation(self):
        """Start the installation process."""
        # Validate inputs
        if not self.url_var.get().strip():
            messagebox.showerror("Error", "Please enter the main instance URL")
            return
        
        if not self.api_key_var.get().strip():
            messagebox.showerror("Error", "Please enter the API Key")
            return
        
        try:
            port = int(self.port_var.get())
            if port < 1 or port > 65535:
                raise ValueError("Invalid port")
        except ValueError:
            messagebox.showerror("Error", "Please enter a valid port number (1-65535)")
            return
        
        # Update config
        self.config.update({
            "main_instance_url": self.url_var.get().strip(),
            "api_key": self.api_key_var.get().strip(),
            "scanner_name": self.name_var.get().strip(),
            "port": port,
            "auto_detect_networks": True  # Enable auto-detection
        })
        
        # Disable install button
        self.install_button.config(state="disabled")
        self.cancel_button.config(state="disabled")
        
        # Start installation in separate thread
        install_thread = threading.Thread(target=self.install)
        install_thread.daemon = True
        install_thread.start()
    
    def install(self):
        """Perform the installation."""
        try:
            self.update_progress("Starting installation...")
            self.progress_bar.start()
            
            # Check if running as administrator
            if not self.is_admin():
                self.update_progress("Error: Administrator privileges required")
                messagebox.showerror("Error", "This installer requires administrator privileges.\nPlease run as administrator.")
                return
            
            # Create installation directory
            self.update_progress("Creating installation directory...")
            self.install_dir.mkdir(parents=True, exist_ok=True)
            
            # Install Python dependencies
            self.update_progress("Installing Python dependencies...")
            self.install_python_dependencies()
            
            # Copy service files
            self.update_progress("Installing service files...")
            self.install_service_files()
            
            # Create configuration file
            self.update_progress("Creating configuration...")
            self.create_config_file()
            
            # Install Windows service
            self.update_progress("Installing Windows service...")
            self.install_windows_service()
            
            # Register with main instance
            self.update_progress("Registering with main instance...")
            self.register_with_main_instance()
            
            # Start service
            self.update_progress("Starting service...")
            self.start_service()
            
            self.progress_bar.stop()
            self.update_progress("Installation completed successfully!")
            
            messagebox.showinfo("Success", 
                              "DiscoverIT Scanner has been installed successfully!\n\n"
                              f"Installation directory: {self.install_dir}\n"
                              "The service is now running and will start automatically with Windows.")
            
            self.root.quit()
            
        except Exception as e:
            self.progress_bar.stop()
            self.update_progress(f"Installation failed: {str(e)}")
            messagebox.showerror("Installation Error", f"Installation failed:\n{str(e)}")
            self.install_button.config(state="normal")
            self.cancel_button.config(state="normal")
    
    def is_admin(self):
        """Check if running as administrator."""
        try:
            return ctypes.windll.shell32.IsUserAnAdmin()
        except:
            return False
    
    def install_python_dependencies(self):
        """Install required Python packages."""
        requirements = [
            "fastapi",
            "uvicorn",
            "requests",
            "python-nmap",
            "pywin32"
        ]
        
        for package in requirements:
            subprocess.run([sys.executable, "-m", "pip", "install", package], 
                         check=True, capture_output=True)
    
    def install_service_files(self):
        """Copy service files to installation directory."""
        # Copy scanner service
        service_file = Path(__file__).parent / "scanner_service.py"
        if service_file.exists():
            shutil.copy2(service_file, self.install_dir / "scanner_service.py")
        
        # Create batch files for service management
        self.create_batch_files()
    
    def create_batch_files(self):
        """Create batch files for service management."""
        # Install service batch file
        install_bat = self.install_dir / "install_service.bat"
        with open(install_bat, 'w') as f:
            f.write(f'@echo off\n')
            f.write(f'cd /d "{self.install_dir}"\n')
            f.write(f'python scanner_service.py install\n')
            f.write(f'python scanner_service.py start\n')
        
        # Uninstall service batch file
        uninstall_bat = self.install_dir / "uninstall_service.bat"
        with open(uninstall_bat, 'w') as f:
            f.write(f'@echo off\n')
            f.write(f'cd /d "{self.install_dir}"\n')
            f.write(f'python scanner_service.py stop\n')
            f.write(f'python scanner_service.py remove\n')
    
    def create_config_file(self):
        """Create configuration file."""
        with open(self.config_file, 'w') as f:
            json.dump(self.config, f, indent=2)
    
    def install_windows_service(self):
        """Install the Windows service."""
        # Change to installation directory
        os.chdir(self.install_dir)
        
        # Install service
        subprocess.run([sys.executable, "scanner_service.py", "install"], 
                      check=True, capture_output=True)
    
    def register_with_main_instance(self):
        """Register scanner with main instance."""
        try:
            registration_data = {
                "scanner_name": self.config["scanner_name"],
                "scanner_url": f"http://{self.get_local_ip()}:{self.config['port']}",
                "subnets": self.config["subnets"],
                "max_concurrent_scans": self.config["max_concurrent_scans"],
                "timeout_seconds": self.config["timeout_seconds"]
            }
            
            response = requests.post(
                f"{self.config['main_instance_url']}/api/v2/scanners/register",
                json=registration_data,
                headers={"Authorization": f"Bearer {self.config['api_key']}"},
                timeout=30
            )
            
            if response.status_code == 200:
                result = response.json()
                scanner_id = result.get("scanner_id")
                if scanner_id:
                    self.config["scanner_id"] = scanner_id
                    with open(self.config_file, 'w') as f:
                        json.dump(self.config, f, indent=2)
            else:
                raise Exception(f"Registration failed: {response.status_code}")
                
        except Exception as e:
            # Registration failure is not critical
            print(f"Warning: Failed to register with main instance: {e}")
    
    def start_service(self):
        """Start the Windows service."""
        subprocess.run([sys.executable, "scanner_service.py", "start"], 
                      check=True, capture_output=True)
    
    def get_local_ip(self):
        """Get local IP address."""
        import socket
        try:
            s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
            s.connect(("8.8.8.8", 80))
            ip = s.getsockname()[0]
            s.close()
            return ip
        except:
            return "127.0.0.1"
    
    def update_progress(self, message):
        """Update progress message."""
        self.progress_var.set(message)
        self.root.update_idletasks()
    
    def run(self):
        """Run the installer."""
        self.root.mainloop()

def main():
    """Main entry point."""
    if len(sys.argv) > 1 and sys.argv[1] == "--console":
        # Console mode installation
        print("DiscoverIT Scanner - Console Installer")
        print("=====================================")
        
        # Get configuration from user
        main_url = input("Main Instance URL [http://localhost:8000]: ").strip() or "http://localhost:8000"
        api_key = input("API Key: ").strip()
        scanner_name = input(f"Scanner Name [Scanner-{os.environ.get('COMPUTERNAME', 'Unknown')}]: ").strip() or f"Scanner-{os.environ.get('COMPUTERNAME', 'Unknown')}"
        port = input("Port [8001]: ").strip() or "8001"
        print("Network subnets will be auto-detected from network adapters")
        
        if not api_key:
            print("Error: API Key is required")
            return
        
        try:
            port = int(port)
        except ValueError:
            print("Error: Invalid port number")
            return
        
        # Create installer and run
        installer = DiscoverITInstaller()
        installer.config.update({
            "main_instance_url": main_url,
            "api_key": api_key,
            "scanner_name": scanner_name,
            "port": port,
            "auto_detect_networks": True
        })
        
        print("Starting installation...")
        installer.install()
        
    else:
        # GUI mode installation
        installer = DiscoverITInstaller()
        installer.run()

if __name__ == "__main__":
    main()
