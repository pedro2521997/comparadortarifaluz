// www.powerpricenow.com → powerpricenow.com, conservando la ruta y la cadena de consulta.
export default {
  fetch(request) {
    const url = new URL(request.url);
    url.protocol = "https:";
    url.hostname = "powerpricenow.com";
    return Response.redirect(url.toString(), 301);
  },
};
