import {
  esImagenPermitida,
  extensionDeMime,
  puedeBorrarEvidencia,
  rutaEvidencia,
} from './evidencia';

describe('rutaEvidencia', () => {
  it('arma grupo/gasto/archivo.extensión', () => {
    expect(rutaEvidencia('g1', 'gasto1', 'abc', 'image/png')).toBe('g1/gasto1/abc.png');
  });

  it('usa jpg si no conoce el tipo', () => {
    expect(rutaEvidencia('g1', 'gasto1', 'abc', undefined)).toBe('g1/gasto1/abc.jpg');
    expect(extensionDeMime('image/JPEG')).toBe('jpg');
  });
});

describe('esImagenPermitida', () => {
  it('acepta las imágenes del bucket y rechaza otros archivos', () => {
    expect(esImagenPermitida('image/heic')).toBe(true);
    expect(esImagenPermitida('application/pdf')).toBe(false);
    expect(esImagenPermitida(null)).toBe(false);
  });
});

describe('puedeBorrarEvidencia', () => {
  it('quien la subió puede borrarla', () => {
    expect(puedeBorrarEvidencia('yo', 'yo', false)).toBe(true);
  });

  it('otro rumi no puede, pero un admin sí', () => {
    expect(puedeBorrarEvidencia('diego', 'yo', false)).toBe(false);
    expect(puedeBorrarEvidencia('diego', 'yo', true)).toBe(true);
  });

  it('sin saber quién soy, solo un admin', () => {
    expect(puedeBorrarEvidencia('diego', undefined, false)).toBe(false);
  });
});
