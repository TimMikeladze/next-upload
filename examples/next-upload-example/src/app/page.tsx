import styles from './page.module.css';
import ExampleInstallCommand from '@/components/ExampleInstallCommand';
import FileUpload from '@/components/FileUpload';

const textToCopy = 'npm install next-upload';

export default async function Home() {
  return (
    <main className={styles.main}>
      <div className={styles.description}>
        <ExampleInstallCommand textToCopy={textToCopy} />
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
      <div className={styles.example}>
        <FileUpload />
      </div>
      <div className={styles.divider} />
    </main>
  );
}
