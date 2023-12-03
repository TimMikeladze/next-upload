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
            Read the docs on
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
        <FileUpload
          api="/upload/basic"
          title="Basic upload (without database )"
        />
        <FileUpload api="/upload/keyv" title="Upload with Keyv store" />
        <FileUpload
          api="/upload/drizzle-postgres-js"
          title="Upload with Drizzle Postgres.js store"
        />
        <FileUpload
          api="/upload/drizzle-node-postgres"
          title="Upload with Drizzle Node-Postgres store"
        />
        <FileUpload
          api="/upload/edge"
          title="Edge upload (without database ) "
        />
        <FileUpload
          api="/upload/edge-with-drizzle-neon"
          title="Edge upload with Drizzle Neon Serverless Postgres store "
        />
      </div>
    </main>
  );
}
