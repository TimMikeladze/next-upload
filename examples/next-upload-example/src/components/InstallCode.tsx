'use client';

/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */

import toast from 'react-hot-toast';
import styles from '../app/page.module.css';

export interface InstallCodeProps {
  textToCopy: string;
}

const InstallCode = (props: InstallCodeProps) => {
  const handleCopy = async () => {
    if (!navigator?.clipboard) {
      console.warn('Clipboard not supported');
      return false;
    }

    try {
      await navigator.clipboard.writeText(props.textToCopy);
      toast.success('Copied to clipboard');
    } catch (error) {
      console.warn('Copy failed', error);
    }

    return true;
  };
  return (
    <p>
      <code
        className={[styles.code, styles.copyable].join(' ')}
        onClick={handleCopy}
      >
        {props.textToCopy}
      </code>
    </p>
  );
};

export default InstallCode;
