# 🛡️ HostHunter

**HostHunter** is a Unified Cyber Intelligence Platform that performs domain reconnaissance by collecting and analyzing information from multiple sources. It aims to provide investigators, cybersecurity professionals, and researchers with a centralized platform for domain analysis.

---

## ✨ Current Features

- 🌐 DNS Lookup
  - A Records
  - AAAA Records
  - MX Records
  - NS Records
  - TXT Records

- 📄 WHOIS Lookup
  - Domain Information
  - Registrar Details
  - Registration Dates
  - Name Servers
  - Domain Status
  - DNSSEC

- 🔒 SSL Certificate Analysis
  - Certificate Subject
  - Certificate Issuer
  - Validity Period
  - Days Until Expiry
  - Certificate Expiry Status

---

## 🛠️ Tech Stack

### Current

- Python 3
- dnspython
- python-whois

### Planned

- FastAPI
- MongoDB
- React
- Threat Intelligence APIs

---

## 📂 Project Structure

```text
HostHunter/
│
├── backend/
│   ├── main.py
│   ├── requirements.txt
│   │
│   └── modules/
│       ├── dns_module.py
│       ├── whois_module.py
│       └── ssl_module.py
│
├── README.md
└── .gitignore
```

---

## 🚀 Project Roadmap

### ✅ Phase 0 – Core Reconnaissance Modules

- [x] DNS Lookup
- [x] WHOIS Lookup
- [x] SSL Certificate Analysis

### 🔄 Phase 1 – Backend API

- [ ] FastAPI Integration
- [ ] Interactive API Documentation
- [ ] Request Validation

### 📡 Phase 2 – Investigation Modules

- [ ] IP Intelligence
- [ ] Website Intelligence
- [ ] Port Scanner

### 💾 Phase 3 – Persistence

- [ ] Database Integration
- [ ] Scan History
- [ ] Report Storage

### 🛡️ Phase 4 – Threat Intelligence

- [ ] External Threat Intelligence APIs
- [ ] Risk Scoring Engine

### 🎨 Phase 5 – Frontend

- [ ] React Dashboard
- [ ] Scan Visualization
- [ ] Investigation Reports

---

## 📌 Current Status

🟢 **Phase 0 Completed**

The project currently performs live domain reconnaissance through independent DNS, WHOIS, and SSL modules. The next milestone is exposing these modules through a FastAPI backend.

---

## 👨‍💻 Author
Biren Kumar