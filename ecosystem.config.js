module.exports = {
  apps : [{
    name   : "gestion-commerciale",
    script : ".next/standalone/server.js", // <-- CHANGEMENT ICI
    args : "",                             // <-- CHANGEMENT ICI
    cwd: "/home/ghost/gestion-commerciale",
    env: {
      NODE_ENV: "production",
      PORT: "4000",
      // VEUILLEZ VERIFIER CES VALEURS
      DATABASE_URL: "mysql://ghostuser:password123!@localhost:3306/gestion_commerciale",
      NEXTAUTH_SECRET: "FrziolYfWSVRH501kkojbHszR/Cts7KA3wMzIMZklyY=",
      // REMPLACER PAR VOTRE VRAIE URL PUBLIQUE
      NEXTAUTH_URL: "http://72.61.109.17:4000" // Utilisez l'IP et le port 3002
    }
  }]
};
