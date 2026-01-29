
import { PassThrough, Readable } from 'stream';


export function normalizeFileName(name: string) {
  return name
    .normalize('NFD')                 // separa acentos
    .replace(/[\u0300-\u036f]/g, '')  // remove acentos
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '_')             // espaços -> _
    .replace(/[^a-z0-9._-]/g, '')     // remove caracteres inválidos
    .replace(/_+/g, '_');             // evita ____
}

export function streamWithSize(stream: Readable) {
  let size = 0;
  const pass = new PassThrough();

  stream.on('data', (chunk) => {
    size += chunk.length;
  });

  stream.on('error', (err) => {
    pass.destroy(err);
  });

  stream.pipe(pass);

  return {
    stream: pass,
    getSize: () => size,
  };
}