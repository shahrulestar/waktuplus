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

