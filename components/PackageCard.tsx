// components/PackageCard.tsx
import { Calendar, User, Copy, Pencil, Trash2 } from "lucide-react"; // Import Trash2

interface PackageCardProps {
  id: number;
  name: string;
  price: string;
  category: string;
  createdDate: string;
  status: string;
  image: string;
  onClick?: () => void;        // For navigating to detail page
  onDuplicate?: () => void;    // For duplicate action
  onEdit?: () => void;         // For edit action
  onDelete?: () => void;       // For delete action
}

export default function PackageCard({
  name,
  price,
  category,
  createdDate,
  status,
  image,
  onClick,
  onDuplicate,
  onEdit,
  onDelete,
}: PackageCardProps) {
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return "bg-green-100 text-green-700 dark:bg-green-800 dark:text-green-300";
      case "expired":
        return "bg-red-100 text-red-700 dark:bg-red-800 dark:text-red-300";
      case "pending":
        return "bg-yellow-100 text-yellow-700 dark:bg-yellow-800 dark:text-yellow-300";
      case "rejected":
        return "bg-gray-100 text-gray-700 dark:bg-gray-600 dark:text-gray-300";
      case "draft":
        return "bg-blue-100 text-blue-700 dark:bg-blue-800 dark:text-blue-300";
      default:
        return "bg-blue-100 text-blue-700 dark:bg-blue-800 dark:text-blue-300";
    }
  };

  const statusLower = status.toLowerCase();
  
  // Logic for action visibility based on the user's rules:
  const canEdit = statusLower === "draft";
  const canDuplicate = ["pending", "draft", "rejected"].includes(statusLower);
  const canDelete = statusLower === "draft";

  return (
    <div
      onClick={onClick}
      className="group relative bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-700 cursor-pointer rounded-xl overflow-hidden transform transition-all duration-300 hover:scale-[1.03] hover:shadow-lg"
    >
      {/* Image */}
      <div className="relative h-32">
        <img src={image} alt={name} className="w-full h-full object-cover" />
        <span className="absolute top-2 left-2 bg-blue-600 text-white text-xs px-2 py-1 rounded font-medium">
          Bundle
        </span>

        {/* Hover Action Icons - CONDITIONALLY DISPLAYED */}
        <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          
          {/* Edit Button - Only available for Draft */}
          {canEdit && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit?.();
              }}
              className="bg-white/80 dark:bg-gray-800 p-1 rounded-full hover:bg-yellow-100 dark:hover:bg-gray-700"
              title="Edit"
            >
              <Pencil size={14} className="text-yellow-600 dark:text-yellow-300" />
            </button>
          )}

          {/* Duplicate Button - Available for Pending, Draft, Rejected */}
          {canDuplicate && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDuplicate?.();
              }}
              className="bg-white/80 dark:bg-gray-800 p-1 rounded-full hover:bg-blue-100 dark:hover:bg-gray-700"
              title="Duplicate"
            >
              <Copy size={14} className="text-blue-600 dark:text-blue-300" />
            </button>
          )}

          {/* Trash Button - Only available for Draft */}
          {canDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete?.();
              }}
              className="bg-white/80 dark:bg-gray-800 p-1 rounded-full hover:bg-red-100 dark:hover:bg-gray-700"
              title="Delete Draft"
            >
              <Trash2 size={14} className="text-red-600 dark:text-red-300" />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-3">
        <h3 className="font-semibold text-sm text-gray-900 dark:text-white mb-1 line-clamp-2">
          {name}
        </h3>
        <p className="text-sm text-blue-600 font-bold mb-2 dark:text-blue-400">
          RM {price}
        </p>

        {/* Category */}
        <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-300 mb-2">
          <User size={12} className="text-gray-400 dark:text-gray-300" />
          <span>{category}</span>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1 text-gray-500 dark:text-gray-300">
            <Calendar size={12} className="text-gray-400 dark:text-gray-300" />
            <span>{createdDate}</span>
          </div>
          <span
            className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(
              status
            )}`}
          >
            {status}
          </span>
        </div>
      </div>
    </div>
  );
}