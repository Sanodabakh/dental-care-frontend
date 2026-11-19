import { HttpResponse } from '@angular/common/http';

/** Enregistre un fichier binaire renvoyé par l'API et déduit son nom du Content-Disposition. */
export function saveBlob(response: HttpResponse<Blob>, fallbackName: string): void {
  const blob = response.body;
  if (!blob) {
    return;
  }

  const disposition = response.headers.get('Content-Disposition') ?? '';
  let filename = fallbackName;

  const utf8 = /filename\*=UTF-8''([^;]+)/i.exec(disposition);
  const simple = /filename="?([^";]+)"?/i.exec(disposition);
  if (utf8) {
    filename = decodeURIComponent(utf8[1]);
  } else if (simple) {
    filename = simple[1];
  }

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
