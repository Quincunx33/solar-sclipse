export type HistoricalEclipse = {
  id: string;
  year: number;
  date: string;
  title: string;
  type: 'Total';
  duration: string;
  region: string;
  significance: string;
  source: string;
  sourceLabel: string;
};

export const HISTORICAL_ECLIPSES: HistoricalEclipse[] = [
  {
    id: '2134-bce', year: -2134, date: '22 Oct 2134 BCE', title: 'Ho and Hi Eclipse', type: 'Total', duration: '—', region: 'Ancient China',
    significance: 'Often associated with the earliest recorded eclipse story. NASA notes that the historical connection may be apocryphal.', source: 'https://eclipse.gsfc.nasa.gov/SEhistory/SEhistory.html', sourceLabel: 'NASA historical catalog'
  },
  {
    id: '585-bce', year: -585, date: '28 May 585 BCE', title: 'Thales / Halys Eclipse', type: 'Total', duration: '—', region: 'Anatolia',
    significance: 'Herodotus described the eclipse during the Lydian–Median war; the event became a landmark in the history of eclipse prediction.', source: 'https://eclipse.gsfc.nasa.gov/SEhistory/SEhistory.html', sourceLabel: 'NASA historical catalog'
  },
  {
    id: '1715', year: 1715, date: '3 May 1715', title: "Halley’s Eclipse", type: 'Total', duration: '6m 25s', region: 'England and Europe',
    significance: 'Edmund Halley predicted its timing and path with remarkable accuracy, helping establish modern eclipse science.', source: 'https://www.timeanddate.com/eclipse/solar-eclipse-history.html', sourceLabel: 'timeanddate history'
  },
  {
    id: '1851', year: 1851, date: '28 Jul 1851', title: 'The First Corona Photograph', type: 'Total', duration: '3m 41s', region: 'Northern Europe',
    significance: 'A photograph by Berkowski is widely regarded as the first successful photograph of the solar corona.', source: 'https://www.timeanddate.com/eclipse/solar-eclipse-history.html', sourceLabel: 'timeanddate history'
  },
  {
    id: '1868', year: 1868, date: '18 Aug 1868', title: 'Helium Eclipse', type: 'Total', duration: '6m 47s', region: 'India and Southeast Asia',
    significance: 'Spectroscopy during totality revealed evidence of helium, later named after Helios, the Greek Sun god.', source: 'https://www.timeanddate.com/eclipse/solar-eclipse-history.html', sourceLabel: 'timeanddate history'
  },
  {
    id: '1919', year: 1919, date: '29 May 1919', title: 'Eddington Eclipse', type: 'Total', duration: '6m 51s', region: 'South America and West Africa',
    significance: 'Observations of stars near the eclipsed Sun tested Einstein’s prediction that gravity bends light.', source: 'https://www.timeanddate.com/eclipse/solar-eclipse-history.html', sourceLabel: 'timeanddate history'
  },
  {
    id: '1991', year: 1991, date: '11 Jul 1991', title: 'The Great Pacific Eclipse', type: 'Total', duration: '6m 53s', region: 'Hawaii, Mexico, Central America',
    significance: 'One of the longest total eclipses of the twentieth century, crossing a densely populated Pacific corridor.', source: 'https://eclipse.gsfc.nasa.gov/SEhistory/SEhistory.html', sourceLabel: 'NASA historical catalog'
  },
  {
    id: '1999', year: 1999, date: '11 Aug 1999', title: 'European Totality', type: 'Total', duration: '2m 23s', region: 'United Kingdom to Turkey',
    significance: 'A widely observed total eclipse that made the path of totality accessible to millions across Europe and western Asia.', source: 'https://eclipse.gsfc.nasa.gov/solar.html', sourceLabel: 'NASA solar eclipse archive'
  },
  {
    id: '2009', year: 2009, date: '22 Jul 2009', title: 'Longest of the 21st Century', type: 'Total', duration: '6m 39s', region: 'India, China and the Pacific',
    significance: 'The longest total solar eclipse of the 21st century, according to timeanddate’s historical summary.', source: 'https://www.timeanddate.com/eclipse/solar-eclipse-history.html', sourceLabel: 'timeanddate history'
  },
  {
    id: '2017', year: 2017, date: '21 Aug 2017', title: 'Great American Eclipse', type: 'Total', duration: '2m 40s', region: 'United States',
    significance: 'The first total solar eclipse to cross the contiguous United States from coast to coast in 99 years.', source: 'https://eclipse.gsfc.nasa.gov/SEhistory/SEhistory.html', sourceLabel: 'NASA historical catalog'
  },
  {
    id: '2024', year: 2024, date: '8 Apr 2024', title: 'North American Totality', type: 'Total', duration: '4m 28s', region: 'Mexico, United States, Canada',
    significance: 'A major modern eclipse observed across North America with a central duration of 4 minutes 28 seconds in NASA’s table.', source: 'https://eclipse.gsfc.nasa.gov/solar.html', sourceLabel: 'NASA 2021–2030 table'
  }
];
