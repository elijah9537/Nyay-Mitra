<div align="center">
  <img src="logo.svg" alt="Nyay-mitra Logo" width="200" height="200">
  
  # Nyay-mitra (न्याय-मित्र)
  ### 🏛️ Your Legal Companion - Making Indian Law Accessible to Everyone ⚖️
  
  [![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
  [![Express.js](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
  [![AI Powered](https://img.shields.io/badge/AI-Powered-blueviolet?style=for-the-badge)](https://groq.com/)
  [![License](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](LICENSE)
  
  [![GitHub Stars](https://img.shields.io/github/stars/elijah9537/Nyay-Mitra?style=social)](https://github.com/elijah9537/Nyay-Mitra)
  [![GitHub Forks](https://img.shields.io/github/forks/elijah9537/Nyay-Mitra?style=social)](https://github.com/elijah9537/Nyay-Mitra/fork)
  
</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Installation](#-installation)
- [Usage](#-usage)
- [API Documentation](#-api-documentation)
- [Project Structure](#-project-structure)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🌟 Overview

**Nyay-mitra** is an AI-powered legal assistance platform designed to democratize access to legal information and services in India. The platform provides:

- 🤖 **AI Legal Chatbot** - Get instant answers to legal queries
- 📄 **Document Generator** - Create properly formatted legal documents
- 📚 **Learning Space** - Interactive modules to learn about Indian law
- 📍 **Legal Resources Finder** - Locate nearby police stations and legal aid centers

---

## ✨ Features

### 1. AI-Powered Legal Chat
- Instant answers to legal queries
- Context-aware responses using RAG (Retrieval-Augmented Generation)
- Specializes in Indian law (IPC, Constitution, Consumer Rights, etc.)

### 2. Intelligent Document Generator
Generate court-ready legal documents in seconds:
- ✅ RTI Applications (Right to Information Act, 2005)
- ✅ Consumer Complaints (Consumer Protection Act, 2019)
- ✅ FIR Complaints
- ✅ Legal Notices
- ✅ Affidavits
- ✅ Rental/Lease Agreements

**Key Features:**
- Smart field mapping (accepts variations in input names)
- Automatic defaults for optional fields
- Strict adherence to Indian legal formatting
- DD/MM/YYYY date formatting
- Professional PDF generation

### 3. Interactive Learning Space
- Gamified legal education modules
- Progressive difficulty levels
- Badge system with achievements
- Topics: Constitution, Justice System, Common Offenses, Landmark Cases

### 4. Location-Based Services
- Google Maps integration
- Find nearby police stations
- Legal aid centers locator

---

## 🛠️ Tech Stack

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **Groq AI** - AI model integration (Llama 3.1 8B Instant)
- **PDFKit** - PDF document generation

### Frontend
- **Vanilla JavaScript** - Client-side logic
- **Tailwind CSS** - Styling
- **Lucide Icons** - Icon library
- **Google Maps API** - Location services

### AI/ML
- **Groq SDK** - Fast AI inference
- **RAG System** - Retrieval-Augmented Generation
- **Llama 3.1 8B Instant** - Language model

---

## 📦 Installation

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- Groq API key ([Get it here](https://console.groq.com))
- Google Maps API key (optional, for location services)

### Step 1: Clone the Repository
```bash
git clone https://github.com/YOUR_USERNAME/nyay-mitra.git
cd nyay-mitra
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Environment Configuration
Create a `.env` file in the root directory:
```env
PORT=3001
GROQ_API_KEY=your_groq_api_key_here
GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
HF_TOKEN=your_huggingface_token_here
```

### Step 4: Start the Server
```bash
npm start
```

The server will start at `http://localhost:3001`

---

## 🚀 Usage

### Starting the Application
```bash
# Development mode
npm start

# With nodemon (auto-restart)
npm run dev
```

### Testing Document Generation
```bash
# Run the test suite
node test-document-generation.js
```

### Accessing the Application
- **Homepage:** http://localhost:3001
- **Chat Interface:** Click the chat widget on any page
- **Document Generator:** Navigate to "Documents" section
- **Learning Space:** Access through main navigation

---

## 📚 API Documentation

### Chat API
```http
POST /api/chat
Content-Type: application/json

{
  "message": "What is Section 420 IPC?",
  "conversationHistory": []
}
```

### Document Generation
```http
POST /api/generate-doc
Content-Type: application/json

{
  "type": "RTI_APPLICATION",
  "applicantName": "John Doe",
  "department": "PHED",
  "information": "Budget allocation details"
}
```

### Get Document Types
```http
GET /api/document-types
```

### Get Template Structure
```http
GET /api/document-template/:type
```

### Maps API Key
```http
GET /api/maps-key
```

---

## 📁 Project Structure

```
Nyay-mitra_2/
├── server.js                          # Main Express server
├── app.js                             # Frontend application logic
├── index.html                         # Main HTML file
├── style.css                          # Global styles
├── package.json                       # Dependencies
├── .env                               # Environment variables (not in git)
├── .gitignore                         # Git ignore rules
│
├── services/
│   ├── documentGenerator.js          # AI document generation service
│   └── aiService.js                  # AI chat service
│
├── public/                           # Static files served by Express
│   ├── index.html
│   ├── app.js
│   ├── style.css
│   └── quiz_data.js
│
├── generated_docs/                   # Generated PDF documents
├── uploads/                          # Uploaded user files
├── legal_data.txt                    # Legal knowledge base
├── rag.js                            # RAG retrieval system
├── quiz_data.js                      # Learning module data
│
└── test-document-generation.js       # Test suite
```

---

## 🎯 Key Components

### 1. Document Generator (`services/documentGenerator.js`)
- AI-powered document generation using Groq
- Template-based document creation
- Smart field mapping and validation
- Supports 6 types of legal documents

### 2. RAG System (`rag.js`)
- Retrieval-Augmented Generation
- Searches legal knowledge base
- Provides context for AI responses

### 3. Learning Space (`quiz_data.js`)
- Interactive legal education modules
- Progressive difficulty levels
- Badge system with achievements

---

## 🔒 Security Features

- ✅ API keys stored in environment variables
- ✅ CORS configuration
- ✅ Input validation and sanitization
- ✅ Error handling with proper status codes
- ✅ Sensitive files excluded from git (.gitignore)

---

## 🤝 Contributing

Contributions are welcome! Here's how you can help:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Development Guidelines
- Follow existing code style
- Add comments for complex logic
- Test thoroughly before submitting PR
- Update documentation as needed

---

## 🐛 Known Issues & Limitations

- Document generation requires internet connection (AI API calls)
- Some legal documents may require manual review before filing
- Currently supports English language only (Hindi/regional languages planned)
- Location services require Google Maps API key

---

## 🗺️ Roadmap

- [ ] Add more document types (divorce petitions, bail applications)
- [ ] Multi-language support (Hindi, regional languages)
- [ ] Document preview before PDF generation
- [ ] E-signature integration
- [ ] Mobile app (React Native)
- [ ] Database integration (PostgreSQL)
- [ ] User authentication and saved documents
- [ ] Legal professional directory

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Author

**Sudhanshu Sharma**

- LinkedIn: https://www.linkedin.com/in/sudhanshu-sharma-55298a327/
- GitHub: [@elijah9537](https://github.com/elijah9537)

---

## 🙏 Acknowledgments

- **Groq** - For providing fast AI inference
- **Indian Legal System** - For inspiration to make law accessible
- **Open Source Community** - For amazing tools and libraries

---

## 📞 Support

open an issue on GitHub.

---

## ⚠️ Disclaimer

This platform provides general legal information and is not a substitute for professional legal advice. Always consult with a qualified legal professional for specific legal matters.

---

Made with ❤️ for making Indian law accessible to everyone

**#LegalTech #AI #Access2Justice #IndianLaw**
