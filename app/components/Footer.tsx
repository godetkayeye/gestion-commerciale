export default function Footer() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="mt-auto border-t border-gray-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="text-xs sm:text-sm text-gray-600">
            © {currentYear} Tous droits réservés
          </div>
          <div className="text-xs sm:text-sm text-gray-600">
            Développé par <span className="font-semibold text-gray-900">makabontech</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

