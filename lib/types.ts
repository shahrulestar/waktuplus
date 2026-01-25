export interface PrayerTime {
  hijri: string
  date: string
  day: string
  imsak: string
  fajr: string
  syuruk: string
  dhuhr: string
  asr: string
  maghrib: string
  isha: string
}

export interface PrayerApiResponse {
  zone: string
  year: string
  month: string
  last_updated: string
  prayers: PrayerTime[]
}

export interface QuranVerse {
  number: number
  text: string
  numberInSurah: number
  juz: number
  manzil: number
  page: number
  ruku: number
  hizbQuarter: number
  sajda: boolean | { id: number; recommended: boolean; obligatory: boolean }
}

export interface QuranSurah {
  number: number
  name: string
  englishName: string
  englishNameTranslation: string
  numberOfAyahs: number
  revelationType: string
  ayahs: QuranVerse[]
}

export interface QuranEdition {
  identifier: string
  language: string
  name: string
  englishName: string
  format: string
  type: string
  direction: string
}

export interface QuranApiResponse {
  code: number
  status: string
  data: {
    surahs: QuranSurah[]
    edition: QuranEdition
  }
}

export interface JuzData {
  number: number
  ayahs: {
    number: number
    text: string
    surah: {
      number: number
      name: string
      englishName: string
      englishNameTranslation: string
      numberOfAyahs: number
      revelationType: string
    }
    numberInSurah: number
    juz: number
    manzil: number
    page: number
    ruku: number
    hizbQuarter: number
    sajda: boolean
  }[]
  surahs: {
    [key: string]: {
      number: number
      name: string
      englishName: string
      englishNameTranslation: string
      numberOfAyahs: number
      revelationType: string
    }
  }
  edition: QuranEdition
}
