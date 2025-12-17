module.exports = {
  apps: [
    {
      name: "gestion-commerciale",
      script: "npx",               // Utiliser npx pour lancer next
      args: "next start -p 4000",  // Port de l'application
      cwd: "/var/www/gestion-commerciale",
      env: {
        NODE_ENV: "production",
        PORT: "4000",
        DATABASE_URL: "mysql://ghostuser:Passw0rdG%40st%21on@localhost:3306/gestion_commerciale",
        NEXTAUTH_SECRET: "f9554aed97a0e2bf80f16a2efcac086b99a2591a2df052b76d78447f4ad37863",
        NEXTAUTH_URL: "http://72.61.109.17:4000"
      }
    }
  ]
};

