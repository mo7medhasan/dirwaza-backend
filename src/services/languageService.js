import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Language Service for handling multilingual content
class LanguageService {
  constructor() {
    this.defaultLanguage = 'ar'; // Arabic as default
    this.supportedLanguages = ['ar', 'en'];
    this.translations = {};
    this.loadTranslations();
  }

  // Load translation files
  loadTranslations() {
    try {
      const localesPath = path.join(__dirname, '../locales');
      
      for (const lang of this.supportedLanguages) {
        const filePath = path.join(localesPath, `${lang}.json`);
        if (fs.existsSync(filePath)) {
          const content = fs.readFileSync(filePath, 'utf8');
          this.translations[lang] = JSON.parse(content);
        }
      }
      
      console.log(`✅ Loaded translations for: ${Object.keys(this.translations).join(', ')}`);
    } catch (error) {
      console.error('❌ Error loading translations:', error.message);
      this.translations = {
        ar: {},
        en: {}
      };
    }
  }

  // Detect language from request
  detectLanguage(req) {
    // Priority: query param > header > cookie > default
    let language = this.defaultLanguage;

    // 1. Check query parameter
    if (req.query && req.query.lang) {
      language = req.query.lang;
    }
    // 2. Check custom header
    else if (req.headers['x-language']) {
      language = req.headers['x-language'];
    }
    // 3. Check Accept-Language header
    else if (req.headers['accept-language']) {
      const acceptLanguage = req.headers['accept-language'];
      if (acceptLanguage.includes('ar')) {
        language = 'ar';
      } else if (acceptLanguage.includes('en')) {
        language = 'en';
      }
    }
    // 4. Check cookies if available
    else if (req.cookies && req.cookies.language) {
      language = req.cookies.language;
    }

    // Validate and return supported language
    return this.supportedLanguages.includes(language) ? language : this.defaultLanguage;
  }

  // Get translated text
  getText(key, language = 'ar', replacements = {}) {
    try {
      // Ensure language is supported
      const lang = this.supportedLanguages.includes(language) ? language : this.defaultLanguage;
      
      // Get translation from nested object (e.g., 'auth.login.success')
      const keys = key.split('.');
      let translation = this.translations[lang];
      
      for (const k of keys) {
        if (translation && typeof translation === 'object') {
          translation = translation[k];
        } else {
          translation = null;
          break;
        }
      }

      // Fallback to key if translation not found
      if (!translation) {
        console.warn(`⚠️  Translation missing: ${key} (${lang})`);
        return key;
      }

      // Replace placeholders like {{name}}, {{count}}
      let result = translation;
      for (const [placeholder, value] of Object.entries(replacements)) {
        const regex = new RegExp(`{{${placeholder}}}`, 'g');
        result = result.replace(regex, value);
      }

      return result;
    } catch (error) {
      console.error(`❌ Translation error for key "${key}":`, error.message);
      return key;
    }
  }

  // Get multiple translations at once
  getTexts(keys, language = 'ar', replacements = {}) {
    const result = {};
    for (const key of keys) {
      result[key] = this.getText(key, language, replacements);
    }
    return result;
  }

  // Helper method to format API responses with proper language
  formatResponse(success, messageKey, data = null, language = 'ar', replacements = {}) {
    return {
      success,
      message: this.getText(messageKey, language, replacements),
      data,
      language,
      timestamp: new Date().toISOString()
    };
  }

  // Helper method for error responses
  formatError(messageKey, language = 'ar', replacements = {}, statusCode = 400) {
    return {
      success: false,
      message: this.getText(messageKey, language, replacements),
      error: true,
      statusCode,
      language,
      timestamp: new Date().toISOString()
    };
  }

  // Get supported languages list
  getSupportedLanguages() {
    return this.supportedLanguages;
  }

  // Check if language is supported
  isLanguageSupported(language) {
    return this.supportedLanguages.includes(language);
  }
}

// Create singleton instance
const languageService = new LanguageService();

export default languageService;
