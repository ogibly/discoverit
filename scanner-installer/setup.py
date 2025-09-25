"""
Setup script for DiscoverIT Scanner Installer
"""
from setuptools import setup, find_packages

setup(
    name="discoverit-scanner-installer",
    version="1.0.0",
    description="Windows installer for DiscoverIT Scanner satellite service",
    author="DiscoverIT Team",
    packages=find_packages(),
    install_requires=[
        "fastapi>=0.104.1",
        "uvicorn>=0.24.0",
        "requests>=2.31.0",
        "python-nmap>=0.7.1",
        "pywin32>=306",
        "pyinstaller>=6.1.0"
    ],
    entry_points={
        "console_scripts": [
            "discoverit-installer=installer:main",
        ],
    },
    classifiers=[
        "Development Status :: 4 - Beta",
        "Intended Audience :: System Administrators",
        "License :: OSI Approved :: MIT License",
        "Operating System :: Microsoft :: Windows",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.9",
        "Programming Language :: Python :: 3.10",
        "Programming Language :: Python :: 3.11",
    ],
    python_requires=">=3.9",
)
