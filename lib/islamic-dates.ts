// Important Islamic dates for 2026 based on JAKIM Malaysia
export interface IslamicDate {
  hijriDate: string
  hijriDateMs: string
  gregorianDate: Date
  gregorianDateEn: string
  gregorianDateMs: string
  celebrationEn: string
  celebrationMs: string
}

export const islamicDates2026: IslamicDate[] = [
  {
    hijriDate: "27 Rajab 1447H",
    hijriDateMs: "27 Rejab 1447H",
    gregorianDate: new Date("2026-01-17T00:00:00"),
    gregorianDateEn: "17 January 2026",
    gregorianDateMs: "17 Januari 2026",
    celebrationEn: "Isra and Mi'raj",
    celebrationMs: "Israk dan Mikraj",
  },
  {
    hijriDate: "1 Ramadan 1447H",
    hijriDateMs: "1 Ramadan 1447H",
    gregorianDate: new Date("2026-02-19T00:00:00"),
    gregorianDateEn: "19 February 2026",
    gregorianDateMs: "19 Februari 2026",
    celebrationEn: "Beginning of Ramadan / Fasting",
    celebrationMs: "Awal Ramadan / Berpuasa",
  },
  {
    hijriDate: "17 Ramadan 1447H",
    hijriDateMs: "17 Ramadan 1447H",
    gregorianDate: new Date("2026-03-07T00:00:00"),
    gregorianDateEn: "7 March 2026",
    gregorianDateMs: "7 Mac 2026",
    celebrationEn: "Nuzul al-Quran",
    celebrationMs: "Nuzul al-Quran",
  },
  {
    hijriDate: "1 Syawal 1447H",
    hijriDateMs: "1 Syawal 1447H",
    gregorianDate: new Date("2026-03-21T00:00:00"),
    gregorianDateEn: "21 March 2026",
    gregorianDateMs: "21 Mac 2026",
    celebrationEn: "Hari Raya Puasa / Eid al-Fitr",
    celebrationMs: "Hari Raya Puasa / Aidilfitri",
  },
  {
    hijriDate: "1 Zulhijjah 1447H",
    hijriDateMs: "1 Zulhijjah 1447H",
    gregorianDate: new Date("2026-05-18T00:00:00"),
    gregorianDateEn: "18 May 2026",
    gregorianDateMs: "18 Mei 2026",
    celebrationEn: "Beginning of Zulhijjah",
    celebrationMs: "Awal Zulhijjah",
  },
  {
    hijriDate: "10 Zulhijjah 1447H",
    hijriDateMs: "10 Zulhijjah 1447H",
    gregorianDate: new Date("2026-05-27T00:00:00"),
    gregorianDateEn: "27 May 2026",
    gregorianDateMs: "27 Mei 2026",
    celebrationEn: "Hari Raya Korban / Eid al-Adha",
    celebrationMs: "Hari Raya Korban / Aidiladha",
  },
  {
    hijriDate: "1 Muharam 1448H",
    hijriDateMs: "1 Muharam 1448H",
    gregorianDate: new Date("2026-06-17T00:00:00"),
    gregorianDateEn: "17 June 2026",
    gregorianDateMs: "17 Jun 2026",
    celebrationEn: "Beginning of Muharram / Islamic New Year",
    celebrationMs: "Awal Muharam / Maal Hijrah",
  },
  {
    hijriDate: "12 Rabiulawal 1448H",
    hijriDateMs: "12 Rabiulawal 1448H",
    gregorianDate: new Date("2026-08-25T00:00:00"),
    gregorianDateEn: "25 August 2026",
    gregorianDateMs: "25 Ogos 2026",
    celebrationEn: "Maulidur Rasul",
    celebrationMs: "Maulidur Rasul",
  },
]

export function getNextIslamicEvent(): IslamicDate | null {
  const now = new Date()
  for (const date of islamicDates2026) {
    if (date.gregorianDate.getTime() > now.getTime()) {
      return date
    }
  }
  return islamicDates2026[0] // Return first event if all passed
}
