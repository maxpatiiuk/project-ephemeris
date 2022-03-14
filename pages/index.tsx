import Layout from '../components/Layout';
import type { LanguageStringsStructure } from '../lib/languages';

const languageStrings: LanguageStringsStructure<{
  title: string;
  myProjects: string;
}> = {
  'en-US': {
    title: 'Full Stack Web Developer',
    myProjects: 'My projects',
  },
};

export default function index(): JSX.Element {
  return (
    <Layout>
      {(language): JSX.Element => (
        <div
          className={`min-h-screen flex flex-col lg:flex-row justify-center
            bg-black text-white`}
        >
          <header>
            <div
              className={`lg:min-h-screen gap-y-10 flex flex-col
                justify-between sticky top-0 p-20`}
            >
            </div>
          </header>
          <main className="gap-y-10 lg:pt-20 flex flex-col p-20 pt-0">
            <h2 className="text-3xl">{languageStrings[language].myProjects}</h2>
          </main>
        </div>
      )}
    </Layout>
  );
}
