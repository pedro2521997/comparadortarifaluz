// Importaciones de Vite con sufijo ?url (devuelven la URL del recurso ya empaquetado).
declare module "*?url" {
  const url: string;
  export default url;
}
