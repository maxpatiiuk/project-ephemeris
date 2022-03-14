import type { LanguageStringsStructure } from '../lib/languages';
import { strip } from '../lib/localizationHelper';

const siteInfo: LanguageStringsStructure<{
  title: string;
  description: string;
  keywords: string;
  author: string;
  yes: string;
  no: string;
}> = {
  'en-US': {
    title: 'Max Patiiuk',
    description: strip(`Full Stack Web Developer`),
    keywords: strip(`Max Patiiuk, Maksym Patiiuk,
      Maksym Patiiuk CV, Maksym Patiiuk portfolio,
      mambo shop, mambo, В гостях у MAMBO, мамбо,
      mambo experimental, Максим Патіюк`),
    author: 'Max Patiiuk',
    yes: 'Yes',
    no: 'No',
  },
};

export default siteInfo;
