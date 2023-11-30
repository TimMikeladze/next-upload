/* eslint-disable */
export class FileReader {
  result: any = null;

  error: any = null;

  onload: ((event: Event) => void) | null = null;

  onerror: ((event: Event) => void) | null = null;

  onloadstart: ((event: Event) => void) | null = null;

  onloadend: ((event: Event) => void) | null = null;

  onprogress: ((event: Event) => void) | null = null;

  readyState: number = 0;

  abort(): void {}

  readAsDataURL(file: File): void {
    this.readyState = 2;
    const readerEvent = new Event('load');
    this.onloadend && this.onloadend(readerEvent);
  }
}
