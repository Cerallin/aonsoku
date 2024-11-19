import en from './locales/en.json'
import es from './locales/es.json'
import ptBr from './locales/pt-BR.json'

export const resources = {
  'en-US': { translation: en },
  'es-ES': { translation: es },
  'pt-BR': { translation: ptBr },
}

export const languages = [
  {
    nativeName: 'English (US)',
    langCode: 'en-US',
    flag: 'US',
    dayjsLocale: 'en',
  },
  {
    nativeName: 'Español (España)',
    langCode: 'es-ES',
    flag: 'ES',
    dayjsLocale: 'es',
  },
  {
    nativeName: 'Português (Brasil)',
    langCode: 'pt-BR',
    flag: 'BR',
    dayjsLocale: 'pt-br',
  },
]
