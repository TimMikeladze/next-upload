import path from 'path';
import fs from 'fs';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkHtml from 'remark-html';
import styles from './page.module.css';
import InstallCode from '@/InstallCode';

const textToCopy = 'npm install next-upload';

export default async function Home() {
  const fullPath = path.resolve(process.cwd(), '../../README.md');
  const fileContents = fs.readFileSync(fullPath, 'utf8');
  const contentHtml = String(
    await unified().use(remarkParse).use(remarkHtml).process(fileContents)
  );
  return (
    <main className={styles.main}>
      <div className={styles.description}>
        <InstallCode textToCopy={textToCopy} />
        <div className={styles.builtBy}>
          <div className={styles.row}>
            Leave a star on
            <a
              href="https://github.com/TimMikeladze/next-upload"
              target="_blank"
            >
              GitHub.com
            </a>
          </div>
          <div className={styles.row}>
            Follow me at
            <a href="https://linesofcode.dev" target="_blank">
              linesofcode.dev
            </a>
          </div>
        </div>
      </div>

      <div className={styles.divider} />
      <div
        className={styles.markdown}
        dangerouslySetInnerHTML={{
          __html: contentHtml,
        }}
      />
    </main>
  );
}
