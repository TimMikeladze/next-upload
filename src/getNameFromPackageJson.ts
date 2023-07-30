import { readFileSync } from 'fs';
import { resolve } from 'path';

export const getNameFromPackageJson = () => {
  const packageJson = JSON.parse(
    readFileSync(resolve(process.cwd(), 'package.json'), 'utf-8')
  );
  return packageJson.name;
};
