"use client";

interface PageHeaderProps {
  title: string;
  subtitle: string;
  version?: string;
  isDarkMode?: boolean;
  toggleDarkMode?: () => void;
}

export default function PageHeader({
  title,
  subtitle,
  version = "v1.0.0",
  isDarkMode = false,
  toggleDarkMode,
}: PageHeaderProps) {
  return (
    <div
      className={`px-8 py-4 flex items-center justify-between border-b transition-colors duration-300
        ${isDarkMode ? "bg-gray-800 border-gray-700 text-gray-100" : "bg-white border-gray-200 text-gray-900"}
      `}
    >
      <div>
        <h1 className="text-xl font-bold">{title}</h1>
        <p className={`${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>{subtitle}</p>
      </div>

      <div className="flex items-center gap-4">
        <span className={`text-sm ${isDarkMode ? "text-gray-300" : "text-gray-500"}`}>{version}</span>

        {/* Dark Mode Toggle Button */}
        {toggleDarkMode && (
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-lg hover:bg-gray-700 transition-colors"
          >
            {isDarkMode ? "🌞" : "🌙"}
          </button>
        )}
      </div>
    </div>
  );
}